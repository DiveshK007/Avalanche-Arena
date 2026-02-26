import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

/**
 * Extended test suite covering edge cases, access control, and advanced flows.
 */
describe("Avalanche Arena — Extended Coverage", function () {

  async function deployFullFixture() {
    const [owner, signer, player1, player2, player3, publisher] = await ethers.getSigners();

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

    // Create quests
    const matchWonSig = ethers.id("MatchWon(address)");
    const nftMintedSig = ethers.id("NFTMinted(address,uint256)");
    const bossDefeatedSig = ethers.id("BossDefeated(address,uint256)");

    await questRegistry.createQuest(await mockGame.getAddress(), matchWonSig, 120, 2, 3600);
    await questRegistry.createQuest(await mockGame.getAddress(), nftMintedSig, 50, 1, 0);
    await questRegistry.createQuest(await mockGame.getAddress(), bossDefeatedSig, 500, 5, 86400);

    return {
      questRegistry, playerProgress, identityNFT, rewardEngine, proofValidator, mockGame,
      owner, signer, player1, player2, player3, publisher,
    };
  }

  async function signProof(
    signerWallet: any, player: string, questId: number, txHash: string, timestamp: number
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
  //  QuestRegistry — Extended
  // ──────────────────────────────────────────

  describe("QuestRegistry Extended", function () {
    it("Should reject zero address target contract", async function () {
      const { questRegistry } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.createQuest(ethers.ZeroAddress, ethers.id("Foo()"), 100, 1, 0)
      ).to.be.revertedWith("QuestRegistry: zero address");
    });

    it("Should reject zero XP reward", async function () {
      const { questRegistry, mockGame } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.createQuest(await mockGame.getAddress(), ethers.id("Foo()"), 0, 1, 0)
      ).to.be.revertedWith("QuestRegistry: zero xp");
    });

    it("Should reject invalid difficulty (0)", async function () {
      const { questRegistry, mockGame } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.createQuest(await mockGame.getAddress(), ethers.id("Foo()"), 100, 0, 0)
      ).to.be.revertedWith("QuestRegistry: invalid difficulty");
    });

    it("Should reject invalid difficulty (6)", async function () {
      const { questRegistry, mockGame } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.createQuest(await mockGame.getAddress(), ethers.id("Foo()"), 100, 6, 0)
      ).to.be.revertedWith("QuestRegistry: invalid difficulty");
    });

    it("Should update quest parameters", async function () {
      const { questRegistry } = await loadFixture(deployFullFixture);
      await questRegistry.updateQuest(1, 200, 7200, true);
      const quest = await questRegistry.getQuest(1);
      expect(quest.xpReward).to.equal(200);
      expect(quest.cooldown).to.equal(7200);
    });

    it("Should reject update on invalid quest id", async function () {
      const { questRegistry } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.updateQuest(999, 100, 0, true)
      ).to.be.revertedWith("QuestRegistry: invalid quest");
    });

    it("Should manage publisher whitelist", async function () {
      const { questRegistry, publisher, mockGame } = await loadFixture(deployFullFixture);

      // Not whitelisted
      await expect(
        questRegistry.connect(publisher).createQuest(
          await mockGame.getAddress(), ethers.id("X()"), 100, 1, 0
        )
      ).to.be.revertedWith("QuestRegistry: not authorized publisher");

      // Whitelist
      await questRegistry.addPublisher(publisher.address);
      await questRegistry.connect(publisher).createQuest(
        await mockGame.getAddress(), ethers.id("X()"), 100, 1, 0
      );
      expect(await questRegistry.questCount()).to.equal(4);

      // Remove from whitelist
      await questRegistry.removePublisher(publisher.address);
      await expect(
        questRegistry.connect(publisher).createQuest(
          await mockGame.getAddress(), ethers.id("Y()"), 100, 1, 0
        )
      ).to.be.revertedWith("QuestRegistry: not authorized publisher");
    });

    it("Should return quest active status", async function () {
      const { questRegistry } = await loadFixture(deployFullFixture);
      expect(await questRegistry.isQuestActive(1)).to.be.true;
      await questRegistry.deactivateQuest(1);
      expect(await questRegistry.isQuestActive(1)).to.be.false;
    });

    it("Should emit QuestCreated event", async function () {
      const { questRegistry, mockGame } = await loadFixture(deployFullFixture);
      await expect(
        questRegistry.createQuest(await mockGame.getAddress(), ethers.id("Z()"), 100, 1, 0)
      ).to.emit(questRegistry, "QuestCreated");
    });

    it("Should emit QuestDeactivated event", async function () {
      const { questRegistry } = await loadFixture(deployFullFixture);
      await expect(questRegistry.deactivateQuest(1)).to.emit(questRegistry, "QuestDeactivated");
    });
  });

  // ──────────────────────────────────────────
  //  PlayerProgress — Extended
  // ──────────────────────────────────────────

  describe("PlayerProgress Extended", function () {
    it("Should reject addXP from non-engine", async function () {
      const { playerProgress, player1 } = await loadFixture(deployFullFixture);
      await expect(
        playerProgress.connect(player1).addXP(player1.address, 100)
      ).to.be.revertedWith("PlayerProgress: not reward engine");
    });

    it("Should reject markQuestCompleted from non-engine", async function () {
      const { playerProgress, player1 } = await loadFixture(deployFullFixture);
      await expect(
        playerProgress.connect(player1).markQuestCompleted(player1.address, 1)
      ).to.be.revertedWith("PlayerProgress: not reward engine");
    });

    it("Should level up correctly through multiple quests", async function () {
      const { playerProgress, proofValidator, signer, player1 } =
        await loadFixture(deployFullFixture);

      // Complete quest 1 (120 XP) → level = sqrt(120/100) = 1
      let txHash = ethers.keccak256(ethers.toUtf8Bytes("multi-1"));
      let timestamp = Math.floor(Date.now() / 1000);
      let sig = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp }, sig
      );
      expect(await playerProgress.level(player1.address)).to.equal(1);

      // Complete quest 3 (500 XP → total 620) → level = sqrt(620/100) = 2
      txHash = ethers.keccak256(ethers.toUtf8Bytes("multi-2"));
      timestamp = Math.floor(Date.now() / 1000);
      sig = await signProof(signer, player1.address, 3, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 3, txHash, timestamp }, sig
      );
      expect(await playerProgress.level(player1.address)).to.equal(2);
      expect(await playerProgress.totalXP(player1.address)).to.equal(620);
    });

    it("Should track streak for consecutive completions", async function () {
      const { playerProgress, proofValidator, signer, player1 } =
        await loadFixture(deployFullFixture);

      // First completion
      let txHash = ethers.keccak256(ethers.toUtf8Bytes("streak-1"));
      let timestamp = Math.floor(Date.now() / 1000);
      let sig = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp }, sig
      );
      expect(await playerProgress.streak(player1.address)).to.equal(1);

      // Second completion (same window → streak goes to 2)
      txHash = ethers.keccak256(ethers.toUtf8Bytes("streak-2"));
      timestamp = Math.floor(Date.now() / 1000);
      sig = await signProof(signer, player1.address, 2, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 2, txHash, timestamp }, sig
      );
      expect(await playerProgress.streak(player1.address)).to.equal(2);
    });

    it("Should return correct getPlayerStats", async function () {
      const { playerProgress, proofValidator, signer, player1 } =
        await loadFixture(deployFullFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("stats-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp }, sig
      );

      const stats = await playerProgress.getPlayerStats(player1.address);
      expect(stats.xp).to.equal(120);
      expect(stats.playerLevel).to.equal(1);
      expect(stats.completed).to.equal(1);
      expect(stats.playerStreak).to.equal(1);
    });

    it("Should calculate level for large XP values", async function () {
      const { playerProgress } = await loadFixture(deployFullFixture);
      expect(await playerProgress.calculateLevel(2500)).to.equal(5);
      expect(await playerProgress.calculateLevel(6250000)).to.equal(250);
    });
  });

  // ──────────────────────────────────────────
  //  ProofValidator — Extended
  // ──────────────────────────────────────────

  describe("ProofValidator Extended", function () {
    it("Should reject expired proof", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployFullFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("expired-1"));
      const timestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago

      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp }, sig
        )
      ).to.be.revertedWith("ProofValidator: proof expired");
    });

    it("Should allow trusted signer update by owner", async function () {
      const { proofValidator, owner, player2 } = await loadFixture(deployFullFixture);
      await proofValidator.setTrustedSigner(player2.address);
      expect(await proofValidator.trustedSigner()).to.equal(player2.address);
    });

    it("Should reject signer update from non-owner", async function () {
      const { proofValidator, player1, player2 } = await loadFixture(deployFullFixture);
      await expect(
        proofValidator.connect(player1).setTrustedSigner(player2.address)
      ).to.be.reverted;
    });

    it("Should reject zero address signer", async function () {
      const { proofValidator } = await loadFixture(deployFullFixture);
      await expect(
        proofValidator.setTrustedSigner(ethers.ZeroAddress)
      ).to.be.revertedWith("ProofValidator: zero signer");
    });

    it("Should process batch proofs", async function () {
      const { proofValidator, signer, player1, player2 } =
        await loadFixture(deployFullFixture);

      const proofs = [
        {
          player: player1.address,
          questId: 1,
          txHash: ethers.keccak256(ethers.toUtf8Bytes("batch-1")),
          timestamp: Math.floor(Date.now() / 1000),
        },
        {
          player: player2.address,
          questId: 2,
          txHash: ethers.keccak256(ethers.toUtf8Bytes("batch-2")),
          timestamp: Math.floor(Date.now() / 1000),
        },
      ];

      const signatures = await Promise.all(
        proofs.map((p) => signProof(signer, p.player, p.questId, p.txHash, p.timestamp))
      );

      await proofValidator.submitProofBatch(proofs, signatures);

      // Verify via ProofAccepted events
    });

    it("Should handle invalid proof in batch gracefully", async function () {
      const { proofValidator, signer, player1, player2 } =
        await loadFixture(deployFullFixture);

      const proofs = [
        {
          player: player1.address,
          questId: 1,
          txHash: ethers.keccak256(ethers.toUtf8Bytes("batch-ok")),
          timestamp: Math.floor(Date.now() / 1000),
        },
        {
          player: player2.address,
          questId: 2,
          txHash: ethers.keccak256(ethers.toUtf8Bytes("batch-bad")),
          timestamp: Math.floor(Date.now() / 1000),
        },
      ];

      // Sign first correctly, second with wrong signer
      const sig1 = await signProof(signer, proofs[0].player, proofs[0].questId, proofs[0].txHash, proofs[0].timestamp);
      const sig2 = await signProof(player1, proofs[1].player, proofs[1].questId, proofs[1].txHash, proofs[1].timestamp); // wrong signer

      // Batch should not revert — it skips invalid proofs
      await proofValidator.submitProofBatch(proofs, [sig1, sig2]);
    });

    it("Should emit events on proof acceptance", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployFullFixture);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("event-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp }, sig
        )
      ).to.emit(proofValidator, "ProofAccepted")
        .withArgs(player1.address, 1, txHash);
    });
  });

  // ──────────────────────────────────────────
  //  IdentityNFT — Extended
  // ──────────────────────────────────────────

  describe("IdentityNFT Extended", function () {
    it("Should evolve identity after quest completion", async function () {
      const { identityNFT, proofValidator, signer, player1 } =
        await loadFixture(deployFullFixture);

      await identityNFT.connect(player1).mintIdentity();

      // Complete a quest → triggers evolution
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("evo-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash, timestamp }, sig
      );

      const tokenId = await identityNFT.playerTokenId(player1.address);
      const identity = await identityNFT.identities(tokenId);
      expect(identity.questsCompleted).to.equal(1);
    });

    it("Should not fail if player has no identity during evolution", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployFullFixture);

      // No identity minted — quest completion should still work
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("no-nft-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp }, sig
        )
      ).to.not.be.reverted;
    });

    it("Should allow owner to toggle soulbound", async function () {
      const { identityNFT, player1, player2 } = await loadFixture(deployFullFixture);

      await identityNFT.connect(player1).mintIdentity();
      const tokenId = await identityNFT.playerTokenId(player1.address);

      // Soulbound by default
      await expect(
        identityNFT.connect(player1).transferFrom(player1.address, player2.address, tokenId)
      ).to.be.revertedWith("IdentityNFT: soulbound - transfers disabled");

      // Disable soulbound
      await identityNFT.setSoulbound(false);

      // Now transfer should work
      await identityNFT.connect(player1).transferFrom(player1.address, player2.address, tokenId);
      expect(await identityNFT.ownerOf(tokenId)).to.equal(player2.address);
    });

    it("Should reject setFaction without identity", async function () {
      const { identityNFT, player1 } = await loadFixture(deployFullFixture);
      await expect(
        identityNFT.connect(player1).setFaction("Shadow")
      ).to.be.revertedWith("IdentityNFT: no identity");
    });

    it("Should generate valid SVG for different tiers", async function () {
      const { identityNFT, player1 } = await loadFixture(deployFullFixture);

      await identityNFT.connect(player1).mintIdentity();
      const tokenId = await identityNFT.playerTokenId(player1.address);

      const uri = await identityNFT.tokenURI(tokenId);
      expect(uri).to.include("data:application/json;base64,");

      // Decode and verify JSON
      const json = Buffer.from(uri.replace("data:application/json;base64,", ""), "base64").toString();
      const metadata = JSON.parse(json);
      expect(metadata.name).to.include("Arena Identity");
      expect(metadata.attributes).to.be.an("array");
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
    });

    it("Should support ERC721Enumerable", async function () {
      const { identityNFT, player1, player2 } = await loadFixture(deployFullFixture);

      await identityNFT.connect(player1).mintIdentity();
      await identityNFT.connect(player2).mintIdentity();

      expect(await identityNFT.totalSupply()).to.equal(2);
      expect(await identityNFT.tokenByIndex(0)).to.equal(1);
      expect(await identityNFT.tokenByIndex(1)).to.equal(2);
    });

    it("Should emit IdentityMinted event", async function () {
      const { identityNFT, player1 } = await loadFixture(deployFullFixture);
      await expect(identityNFT.connect(player1).mintIdentity())
        .to.emit(identityNFT, "IdentityMinted");
    });

    it("Should emit FactionSet event", async function () {
      const { identityNFT, player1 } = await loadFixture(deployFullFixture);
      await identityNFT.connect(player1).mintIdentity();
      await expect(identityNFT.connect(player1).setFaction("Aether"))
        .to.emit(identityNFT, "FactionSet")
        .withArgs(player1.address, "Aether");
    });
  });

  // ──────────────────────────────────────────
  //  RewardEngine — Extended
  // ──────────────────────────────────────────

  describe("RewardEngine Extended", function () {
    it("Should reject direct call to rewardPlayer", async function () {
      const { rewardEngine, player1 } = await loadFixture(deployFullFixture);
      await expect(
        rewardEngine.connect(player1).rewardPlayer(player1.address, 1)
      ).to.be.revertedWith("RewardEngine: not validator");
    });

    it("Should reject rewarding for inactive quest", async function () {
      const { rewardEngine, proofValidator, questRegistry, signer, player1 } =
        await loadFixture(deployFullFixture);

      // Deactivate quest 1
      await questRegistry.deactivateQuest(1);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("inactive-1"));
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = await signProof(signer, player1.address, 1, txHash, timestamp);

      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash, timestamp }, sig
        )
      ).to.be.revertedWith("RewardEngine: quest not active");
    });

    it("Should reject double completion", async function () {
      const { proofValidator, signer, player1 } = await loadFixture(deployFullFixture);

      // First completion
      const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("double-1"));
      const timestamp1 = Math.floor(Date.now() / 1000);
      const sig1 = await signProof(signer, player1.address, 1, txHash1, timestamp1);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash: txHash1, timestamp: timestamp1 }, sig1
      );

      // Second attempt (different proof but same quest+player)
      const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("double-2"));
      const timestamp2 = Math.floor(Date.now() / 1000);
      const sig2 = await signProof(signer, player1.address, 1, txHash2, timestamp2);
      await expect(
        proofValidator.submitProof(
          { player: player1.address, questId: 1, txHash: txHash2, timestamp: timestamp2 }, sig2
        )
      ).to.be.revertedWith("RewardEngine: already completed");
    });

    it("Should reject setQuestRegistry from non-owner", async function () {
      const { rewardEngine, player1 } = await loadFixture(deployFullFixture);
      await expect(
        rewardEngine.connect(player1).setQuestRegistry(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should reject zero address in setters", async function () {
      const { rewardEngine } = await loadFixture(deployFullFixture);
      await expect(
        rewardEngine.setQuestRegistry(ethers.ZeroAddress)
      ).to.be.revertedWith("RewardEngine: zero address");
      await expect(
        rewardEngine.setPlayerProgress(ethers.ZeroAddress)
      ).to.be.revertedWith("RewardEngine: zero address");
      await expect(
        rewardEngine.setIdentityNFT(ethers.ZeroAddress)
      ).to.be.revertedWith("RewardEngine: zero address");
      await expect(
        rewardEngine.setProofValidator(ethers.ZeroAddress)
      ).to.be.revertedWith("RewardEngine: zero address");
    });
  });

  // ──────────────────────────────────────────
  //  MockGame
  // ──────────────────────────────────────────

  describe("MockGame", function () {
    it("Should emit MatchWon event", async function () {
      const { mockGame, player1 } = await loadFixture(deployFullFixture);
      await expect(mockGame.connect(player1).winMatch())
        .to.emit(mockGame, "MatchWon")
        .withArgs(player1.address);
    });

    it("Should emit NFTMinted event", async function () {
      const { mockGame, player1 } = await loadFixture(deployFullFixture);
      await expect(mockGame.connect(player1).mintGameNFT(42))
        .to.emit(mockGame, "NFTMinted")
        .withArgs(player1.address, 42);
    });

    it("Should emit BossDefeated event", async function () {
      const { mockGame, player1 } = await loadFixture(deployFullFixture);
      await expect(mockGame.connect(player1).defeatBoss(7))
        .to.emit(mockGame, "BossDefeated")
        .withArgs(player1.address, 7);
    });

    it("Should emit ItemCrafted event", async function () {
      const { mockGame, player1 } = await loadFixture(deployFullFixture);
      await expect(mockGame.connect(player1).craftItem(99))
        .to.emit(mockGame, "ItemCrafted")
        .withArgs(player1.address, 99);
    });
  });

  // ──────────────────────────────────────────
  //  Multi-Player Scenarios
  // ──────────────────────────────────────────

  describe("Multi-Player Scenarios", function () {
    it("Should support multiple players completing different quests", async function () {
      const { playerProgress, proofValidator, signer, player1, player2, player3 } =
        await loadFixture(deployFullFixture);

      const players = [
        { signer: player1, questId: 1, tag: "mp-p1" },
        { signer: player2, questId: 2, tag: "mp-p2" },
        { signer: player3, questId: 3, tag: "mp-p3" },
      ];

      for (const p of players) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(p.tag));
        const timestamp = Math.floor(Date.now() / 1000);
        const sig = await signProof(signer, p.signer.address, p.questId, txHash, timestamp);
        await proofValidator.submitProof(
          { player: p.signer.address, questId: p.questId, txHash, timestamp }, sig
        );
      }

      expect(await playerProgress.totalXP(player1.address)).to.equal(120);
      expect(await playerProgress.totalXP(player2.address)).to.equal(50);
      expect(await playerProgress.totalXP(player3.address)).to.equal(500);
    });

    it("Should maintain independent quest completion state per player", async function () {
      const { playerProgress, proofValidator, signer, player1, player2 } =
        await loadFixture(deployFullFixture);

      // Player1 completes quest 1
      const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("indep-1"));
      const ts1 = Math.floor(Date.now() / 1000);
      const sig1 = await signProof(signer, player1.address, 1, txHash1, ts1);
      await proofValidator.submitProof(
        { player: player1.address, questId: 1, txHash: txHash1, timestamp: ts1 }, sig1
      );

      expect(await playerProgress.hasCompletedQuest(player1.address, 1)).to.be.true;
      expect(await playerProgress.hasCompletedQuest(player2.address, 1)).to.be.false;
    });
  });
});
