import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Avalanche Arena — Full Integration", function () {
  async function deployArenaFixture() {
    const [owner, signer, player1, player2] = await ethers.getSigners();

    // Deploy all contracts
    const QuestRegistry = await ethers.getContractFactory("QuestRegistry");
    const questRegistry = await QuestRegistry.deploy();

    const PlayerProgress = await ethers.getContractFactory("PlayerProgress");
    const playerProgress = await PlayerProgress.deploy();

    const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
    const identityNFT = await IdentityNFT.deploy();

    const RewardEngine = await ethers.getContractFactory("RewardEngine");
    const rewardEngine = await RewardEngine.deploy();

    const ProofValidator = await ethers.getContractFactory("ProofValidator");
    const proofValidator = await ProofValidator.deploy(signer.address);

    const MockGame = await ethers.getContractFactory("MockGame");
    const mockGame = await MockGame.deploy();

    // Wire contracts
    await rewardEngine.setQuestRegistry(await questRegistry.getAddress());
    await rewardEngine.setPlayerProgress(await playerProgress.getAddress());
    await rewardEngine.setIdentityNFT(await identityNFT.getAddress());
    await rewardEngine.setProofValidator(await proofValidator.getAddress());
    await proofValidator.setRewardEngine(await rewardEngine.getAddress());
    await playerProgress.setRewardEngine(await rewardEngine.getAddress());
    await identityNFT.setRewardEngine(await rewardEngine.getAddress());

    // Create quest
    const matchWonSig = ethers.id("MatchWon(address)");
    await questRegistry.createQuest(
      await mockGame.getAddress(),
      matchWonSig,
      120,  // XP
      2,    // difficulty
      3600  // cooldown
    );

    return {
      questRegistry,
      playerProgress,
      identityNFT,
      rewardEngine,
      proofValidator,
      mockGame,
      owner,
      signer,
      player1,
      player2,
    };
  }

  // Helper to sign proof
  async function signProof(
    signerWallet: any,
    player: string,
    questId: number,
    txHash: string,
    timestamp: number
  ) {
    const messageHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes32", "uint256"],
        [player, questId, txHash, timestamp]
      )
    );
    return await signerWallet.signMessage(ethers.getBytes(messageHash));
  }

  // ──────────────────────────────────────────
  //  QuestRegistry Tests
  // ──────────────────────────────────────────

  describe("QuestRegistry", function () {
    it("Should create a quest", async function () {
      const { questRegistry } = await loadFixture(deployArenaFixture);

      const quest = await questRegistry.getQuest(1);
      expect(quest.xpReward).to.equal(120);
      expect(quest.difficulty).to.equal(2);
      expect(quest.active).to.be.true;
    });

    it("Should increment quest count", async function () {
      const { questRegistry } = await loadFixture(deployArenaFixture);
      expect(await questRegistry.questCount()).to.equal(1);
    });

    it("Should deactivate a quest", async function () {
      const { questRegistry } = await loadFixture(deployArenaFixture);

      await questRegistry.deactivateQuest(1);
      const quest = await questRegistry.getQuest(1);
      expect(quest.active).to.be.false;
    });

    it("Should reject unauthorized quest creation", async function () {
      const { questRegistry, player1, mockGame } = await loadFixture(deployArenaFixture);

      await expect(
        questRegistry.connect(player1).createQuest(
          await mockGame.getAddress(),
          ethers.id("Foo()"),
          100, 1, 0
        )
      ).to.be.revertedWith("QuestRegistry: not authorized publisher");
    });

    it("Should allow whitelisted publisher", async function () {
      const { questRegistry, player1, mockGame } = await loadFixture(deployArenaFixture);

      await questRegistry.addPublisher(player1.address);
      await questRegistry.connect(player1).createQuest(
        await mockGame.getAddress(),
        ethers.id("Foo()"),
        100, 1, 0
      );
      expect(await questRegistry.questCount()).to.equal(2);
    });
  });

  // ──────────────────────────────────────────
  //  ProofValidator Tests
  // ──────────────────────────────────────────

  describe("ProofValidator", function () {
    it("Should accept valid proof", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployArenaFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("tx1"));
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = await signProof(signer, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp },
          signature
        )
      ).to.emit(proofValidator, "ProofAccepted");
    });

    it("Should reject invalid signer", async function () {
      const { proofValidator, player1, player2 } = await loadFixture(deployArenaFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("tx2"));
      const timestamp = Math.floor(Date.now() / 1000);

      // Sign with wrong signer
      const signature = await signProof(player2, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp },
          signature
        )
      ).to.be.revertedWith("ProofValidator: invalid signer");
    });

    it("Should reject replay proof", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployArenaFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("tx3"));
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = await signProof(signer, player1.address, 1, txHash, timestamp);

      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp },
        signature
      );

      // Try same proof again
      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp },
          signature
        )
      ).to.be.revertedWith("ProofValidator: proof already used");
    });
  });

  // ──────────────────────────────────────────
  //  PlayerProgress Tests
  // ──────────────────────────────────────────

  describe("PlayerProgress", function () {
    it("Should track XP after proof", async function () {
      const { playerProgress, proofValidator, signer, player1 } =
        await loadFixture(deployArenaFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("tx4"));
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp },
        signature
      );

      expect(await playerProgress.totalXP(player1.address)).to.equal(120);
    });

    it("Should calculate level correctly", async function () {
      const { playerProgress } = await loadFixture(deployArenaFixture);

      // Level = sqrt(xp / 100)
      expect(await playerProgress.calculateLevel(0)).to.equal(0);
      expect(await playerProgress.calculateLevel(100)).to.equal(1);
      expect(await playerProgress.calculateLevel(400)).to.equal(2);
      expect(await playerProgress.calculateLevel(900)).to.equal(3);
      expect(await playerProgress.calculateLevel(10000)).to.equal(10);
    });

    it("Should mark quest as completed", async function () {
      const { playerProgress, proofValidator, signer, player1 } =
        await loadFixture(deployArenaFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("tx5"));
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp },
        signature
      );

      expect(await playerProgress.hasCompletedQuest(player1.address, 1)).to.be.true;
    });
  });

  // ──────────────────────────────────────────
  //  IdentityNFT Tests
  // ──────────────────────────────────────────

  describe("IdentityNFT", function () {
    it("Should mint identity NFT", async function () {
      const { identityNFT, player1 } = await loadFixture(deployArenaFixture);

      await identityNFT.connect(player1).mintIdentity();
      expect(await identityNFT.hasMinted(player1.address)).to.be.true;
      expect(await identityNFT.balanceOf(player1.address)).to.equal(1);
    });

    it("Should prevent double mint", async function () {
      const { identityNFT, player1 } = await loadFixture(deployArenaFixture);

      await identityNFT.connect(player1).mintIdentity();
      await expect(
        identityNFT.connect(player1).mintIdentity()
      ).to.be.revertedWith("IdentityNFT: already minted");
    });

    it("Should be soulbound by default", async function () {
      const { identityNFT, player1, player2 } = await loadFixture(deployArenaFixture);

      await identityNFT.connect(player1).mintIdentity();
      const tokenId = await identityNFT.playerTokenId(player1.address);

      await expect(
        identityNFT.connect(player1).transferFrom(player1.address, player2.address, tokenId)
      ).to.be.revertedWith("IdentityNFT: soulbound - transfers disabled");
    });

    it("Should return on-chain tokenURI", async function () {
      const { identityNFT, player1 } = await loadFixture(deployArenaFixture);

      await identityNFT.connect(player1).mintIdentity();
      const tokenId = await identityNFT.playerTokenId(player1.address);

      const uri = await identityNFT.tokenURI(tokenId);
      expect(uri).to.include("data:application/json;base64,");
    });

    it("Should set faction", async function () {
      const { identityNFT, player1 } = await loadFixture(deployArenaFixture);

      await identityNFT.connect(player1).mintIdentity();
      await identityNFT.connect(player1).setFaction("Frostborn");

      const tokenId = await identityNFT.playerTokenId(player1.address);
      const identity = await identityNFT.identities(tokenId);
      expect(identity.faction).to.equal("Frostborn");
    });
  });

  // ──────────────────────────────────────────
  //  Full E2E Flow
  // ──────────────────────────────────────────

  describe("End-to-End Flow", function () {
    it("Should complete full quest lifecycle", async function () {
      const {
        questRegistry, playerProgress, identityNFT,
        proofValidator, mockGame, signer, player1,
      } = await loadFixture(deployArenaFixture);

      // 1. Player mints identity
      await identityNFT.connect(player1).mintIdentity();

      // 2. Player plays game (emits event on-chain)
      await mockGame.connect(player1).winMatch();

      // 3. Indexer detects event and signs proof
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("game-tx-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await signProof(signer, player1.address, 1, txHash, timestamp);

      // 4. Proof submitted and verified
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp },
        signature
      );

      // 5. Verify results
      expect(await playerProgress.totalXP(player1.address)).to.equal(120);
      expect(await playerProgress.hasCompletedQuest(player1.address, 1)).to.be.true;

      // 6. Check identity evolution
      const tokenId = await identityNFT.playerTokenId(player1.address);
      const identity = await identityNFT.identities(tokenId);
      expect(identity.questsCompleted).to.equal(1);
    });
  });
});
