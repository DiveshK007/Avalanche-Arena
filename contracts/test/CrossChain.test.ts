import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

/**
 * 🔺 Avalanche Arena — Cross-Chain Integration Tests
 *
 * Tests for:
 *   1. ICM CrossChainQuestVerifier
 *   2. ICM CrossChainQuestSender
 *   3. ICTT ArenaReputationToken
 *   4. Chainlink ArenaPriceFeed
 *   5. End-to-end cross-chain quest flow
 */

describe("Cross-Chain Integration", function () {

  // ──────────────────────────────────────────
  //  Fixture
  // ──────────────────────────────────────────

  async function deployFixture() {
    const [owner, player1, player2, reporter, fakeTeleporter] = await ethers.getSigners();

    // Core contracts
    const QuestRegistry = await ethers.getContractFactory("QuestRegistry");
    const questRegistry = await QuestRegistry.deploy();

    const PlayerProgress = await ethers.getContractFactory("PlayerProgress");
    const playerProgress = await PlayerProgress.deploy();

    const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
    const identityNFT = await IdentityNFT.deploy();

    const RewardEngine = await ethers.getContractFactory("RewardEngine");
    const rewardEngine = await RewardEngine.deploy();

    const MockGame = await ethers.getContractFactory("MockGame");
    const mockGame = await MockGame.deploy();

    // Wire core contracts
    await rewardEngine.setQuestRegistry(await questRegistry.getAddress());
    await rewardEngine.setPlayerProgress(await playerProgress.getAddress());
    await rewardEngine.setIdentityNFT(await identityNFT.getAddress());
    await playerProgress.setRewardEngine(await rewardEngine.getAddress());
    await identityNFT.setRewardEngine(await rewardEngine.getAddress());

    // Create a test quest
    const matchWonSig = ethers.id("MatchWon(address)");
    await questRegistry.createQuest(
      await mockGame.getAddress(), matchWonSig, 100, 2, 3600
    );

    // ICM Contracts
    const CrossChainQuestVerifier = await ethers.getContractFactory("CrossChainQuestVerifier");
    const verifier = await CrossChainQuestVerifier.deploy();

    await verifier.setRewardEngine(await rewardEngine.getAddress());
    await verifier.setPlayerProgress(await playerProgress.getAddress());

    // Set the verifier as a valid proof validator on RewardEngine
    // (the verifier calls rewardEngine.rewardPlayer)
    await rewardEngine.setProofValidator(await verifier.getAddress());

    // ArenaReputationToken
    const ArenaReputationToken = await ethers.getContractFactory("ArenaReputationToken");
    const reputationToken = await ArenaReputationToken.deploy();
    await reputationToken.addMinter(await rewardEngine.getAddress());
    await reputationToken.addMinter(await verifier.getAddress());

    // Test chain IDs
    const gameChainID = ethers.encodeBytes32String("game-chain-1");
    const arenaChainID = ethers.encodeBytes32String("arena-chain");

    return {
      owner, player1, player2, reporter, fakeTeleporter,
      questRegistry, playerProgress, identityNFT, rewardEngine, mockGame,
      verifier, reputationToken,
      gameChainID, arenaChainID,
    };
  }

  // ──────────────────────────────────────────
  //  CrossChainQuestVerifier Tests
  // ──────────────────────────────────────────

  describe("CrossChainQuestVerifier", function () {

    it("should deploy correctly", async function () {
      const { verifier, owner } = await loadFixture(deployFixture);
      expect(await verifier.owner()).to.equal(owner.address);
      expect(await verifier.crossChainCompletions()).to.equal(0);
    });

    it("should approve and revoke source chains", async function () {
      const { verifier, gameChainID } = await loadFixture(deployFixture);

      await verifier.approveSourceChain(gameChainID, "Test Game Chain");
      expect(await verifier.approvedSourceChains(gameChainID)).to.be.true;

      const info = await verifier.getChainInfo(gameChainID);
      expect(info.name).to.equal("Test Game Chain");
      expect(info.active).to.be.true;

      await verifier.revokeSourceChain(gameChainID);
      expect(await verifier.approvedSourceChains(gameChainID)).to.be.false;
    });

    it("should approve and revoke senders", async function () {
      const { verifier, gameChainID, reporter } = await loadFixture(deployFixture);

      await verifier.approveSender(gameChainID, reporter.address);
      expect(await verifier.approvedSenders(gameChainID, reporter.address)).to.be.true;

      await verifier.revokeSender(gameChainID, reporter.address);
      expect(await verifier.approvedSenders(gameChainID, reporter.address)).to.be.false;
    });

    it("should reject messages from non-Teleporter addresses", async function () {
      const { verifier, player1, gameChainID } = await loadFixture(deployFixture);

      const message = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "bytes"],
        [0, "0x"]
      );

      // Non-Teleporter should fail
      await expect(
        verifier.connect(player1).receiveTeleporterMessage(
          gameChainID, player1.address, message
        )
      ).to.be.revertedWith("ICMVerifier: unauthorized caller");
    });

    it("should track registered chains count", async function () {
      const { verifier, gameChainID } = await loadFixture(deployFixture);

      expect(await verifier.getRegisteredChainCount()).to.equal(0);

      await verifier.approveSourceChain(gameChainID, "Game 1");
      expect(await verifier.getRegisteredChainCount()).to.equal(1);

      const chain2 = ethers.encodeBytes32String("chain-2");
      await verifier.approveSourceChain(chain2, "Game 2");
      expect(await verifier.getRegisteredChainCount()).to.equal(2);
    });

    it("should return stats correctly", async function () {
      const { verifier } = await loadFixture(deployFixture);

      const [completions, xpSynced, chains] = await verifier.getStats();
      expect(completions).to.equal(0);
      expect(xpSynced).to.equal(0);
      expect(chains).to.equal(0);
    });

    it("should only allow owner to configure", async function () {
      const { verifier, player1, gameChainID } = await loadFixture(deployFixture);

      await expect(
        verifier.connect(player1).approveSourceChain(gameChainID, "Test")
      ).to.be.revertedWithCustomError(verifier, "OwnableUnauthorizedAccount");

      await expect(
        verifier.connect(player1).approveSender(gameChainID, player1.address)
      ).to.be.revertedWithCustomError(verifier, "OwnableUnauthorizedAccount");

      await expect(
        verifier.connect(player1).setRewardEngine(player1.address)
      ).to.be.revertedWithCustomError(verifier, "OwnableUnauthorizedAccount");
    });
  });

  // ──────────────────────────────────────────
  //  CrossChainQuestSender Tests
  // ──────────────────────────────────────────

  describe("CrossChainQuestSender", function () {

    async function deploySenderFixture() {
      const base = await loadFixture(deployFixture);

      const arenaChainID = ethers.encodeBytes32String("arena-chain");
      const verifierAddr = await base.verifier.getAddress();

      const CrossChainQuestSender = await ethers.getContractFactory("CrossChainQuestSender");
      const sender = await CrossChainQuestSender.deploy(
        arenaChainID,
        verifierAddr,
        "TestGame"
      );

      return { ...base, sender };
    }

    it("should deploy with correct config", async function () {
      const { sender, arenaChainID } = await deploySenderFixture();

      expect(await sender.gameName()).to.equal("TestGame");
      expect(await sender.requiredGasLimit()).to.equal(500_000);
      expect(await sender.messagesSent()).to.equal(0);
    });

    it("should manage reporters", async function () {
      const { sender, reporter, player1 } = await deploySenderFixture();

      await sender.approveReporter(reporter.address);
      expect(await sender.approvedReporters(reporter.address)).to.be.true;

      await sender.revokeReporter(reporter.address);
      expect(await sender.approvedReporters(reporter.address)).to.be.false;
    });

    it("should reject unauthorized reporters", async function () {
      const { sender, player1 } = await deploySenderFixture();

      await expect(
        sender.connect(player1).reportQuestCompletion(
          player1.address,
          1,
          ethers.encodeBytes32String("tx1")
        )
      ).to.be.revertedWith("QuestSender: not authorized reporter");
    });

    it("should reject zero player address", async function () {
      const { sender, owner } = await deploySenderFixture();

      await expect(
        sender.reportQuestCompletion(
          ethers.ZeroAddress,
          1,
          ethers.encodeBytes32String("tx1")
        )
      ).to.be.revertedWith("QuestSender: zero player");
    });

    it("should update arena chain config", async function () {
      const { sender } = await deploySenderFixture();
      const newChainID = ethers.encodeBytes32String("new-chain");
      const newVerifier = "0x1234567890123456789012345678901234567890";

      await sender.setArenaChain(newChainID, newVerifier);
      expect(await sender.arenaChainID()).to.equal(newChainID);
      expect(await sender.arenaVerifierAddress()).to.equal(newVerifier);
    });

    it("should update gas limit", async function () {
      const { sender } = await deploySenderFixture();
      await sender.setRequiredGasLimit(1_000_000);
      expect(await sender.requiredGasLimit()).to.equal(1_000_000);
    });
  });

  // ──────────────────────────────────────────
  //  ArenaReputationToken Tests
  // ──────────────────────────────────────────

  describe("ArenaReputationToken", function () {

    it("should deploy with correct metadata", async function () {
      const { reputationToken } = await loadFixture(deployFixture);

      expect(await reputationToken.name()).to.equal("Arena Reputation Token");
      expect(await reputationToken.symbol()).to.equal("ART");
      expect(await reputationToken.totalSupply()).to.equal(0);
    });

    it("should allow minters to mint reputation", async function () {
      const { reputationToken, owner, player1 } = await loadFixture(deployFixture);

      await reputationToken.mintReputation(player1.address, ethers.parseEther("100"));

      expect(await reputationToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("100")
      );
      expect(await reputationToken.lifetimeReputation(player1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("should reject non-minters from minting", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      await expect(
        reputationToken.connect(player1).mintReputation(player1.address, 100)
      ).to.be.revertedWith("ART: not a minter");
    });

    it("should manage minters correctly", async function () {
      const { reputationToken, player1, owner } = await loadFixture(deployFixture);

      // Owner is a minter by default
      expect(await reputationToken.isMinter(owner.address)).to.be.true;

      // Add player1 as minter
      await reputationToken.addMinter(player1.address);
      expect(await reputationToken.isMinter(player1.address)).to.be.true;

      // Remove player1
      await reputationToken.removeMinter(player1.address);
      expect(await reputationToken.isMinter(player1.address)).to.be.false;
    });

    it("should be burnable", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      await reputationToken.mintReputation(player1.address, ethers.parseEther("50"));
      await reputationToken.connect(player1).burn(ethers.parseEther("20"));

      expect(await reputationToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("30")
      );
      // Lifetime reputation doesn't decrease
      expect(await reputationToken.lifetimeReputation(player1.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("should respect max supply cap", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      const maxSupply = await reputationToken.MAX_SUPPLY();
      await expect(
        reputationToken.mintReputation(player1.address, maxSupply + 1n)
      ).to.be.revertedWith("ART: supply cap reached");
    });

    it("should set tokenHome for ICTT bridging", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      const fakeTokenHome = "0x1234567890123456789012345678901234567890";
      await reputationToken.setTokenHome(fakeTokenHome);
      expect(await reputationToken.tokenHome()).to.equal(fakeTokenHome);
    });

    it("should approve for bridge when tokenHome is set", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      const fakeTokenHome = "0x1234567890123456789012345678901234567890";
      await reputationToken.setTokenHome(fakeTokenHome);

      await reputationToken.mintReputation(player1.address, ethers.parseEther("100"));
      await reputationToken.connect(player1).approveForBridge(ethers.parseEther("50"));

      expect(await reputationToken.allowance(player1.address, fakeTokenHome)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("should reject approveForBridge without tokenHome", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      await expect(
        reputationToken.connect(player1).approveForBridge(ethers.parseEther("50"))
      ).to.be.revertedWith("ART: token home not set");
    });
  });

  // ──────────────────────────────────────────
  //  ArenaPriceFeed Tests
  // ──────────────────────────────────────────

  describe("ArenaPriceFeed", function () {

    async function deployPriceFeedFixture() {
      const base = await loadFixture(deployFixture);

      // Deploy a mock aggregator for testing
      const MockAggregator = await ethers.getContractFactory("MockAggregatorV3");
      const mockAggregator = await MockAggregator.deploy(
        8,                                // decimals
        "AVAX / USD",                     // description
        ethers.parseUnits("25", 8)        // $25.00 initial price
      );

      const ArenaPriceFeed = await ethers.getContractFactory("ArenaPriceFeed");
      const priceFeed = await ArenaPriceFeed.deploy(
        await mockAggregator.getAddress()
      );

      return { ...base, priceFeed, mockAggregator };
    }

    it("should deploy correctly", async function () {
      const { priceFeed } = await deployPriceFeedFixture();
      expect(await priceFeed.maxStaleness()).to.equal(3600);
    });

    it("should get AVAX/USD price", async function () {
      const { priceFeed } = await deployPriceFeedFixture();
      const price = await priceFeed.getAvaxUsdPrice();
      expect(price).to.equal(ethers.parseUnits("25", 8)); // $25
    });

    it("should convert AVAX to USD", async function () {
      const { priceFeed } = await deployPriceFeedFixture();

      // 1 AVAX at $25 = $25
      const usd = await priceFeed.avaxToUsd(ethers.parseEther("1"));
      expect(usd).to.equal(ethers.parseUnits("25", 8));
    });

    it("should convert USD to AVAX", async function () {
      const { priceFeed } = await deployPriceFeedFixture();

      // $25 at $25/AVAX = 1 AVAX
      const avax = await priceFeed.usdToAvax(ethers.parseUnits("25", 8));
      expect(avax).to.equal(ethers.parseEther("1"));
    });

    it("should check payment sufficiency", async function () {
      const { priceFeed } = await deployPriceFeedFixture();

      // Item costs $10 USD, AVAX is $25, need 0.4 AVAX
      const [sufficient, overpayment] = await priceFeed.isPaymentSufficient(
        ethers.parseUnits("10", 8),  // $10 USD
        ethers.parseEther("0.5")     // 0.5 AVAX
      );

      expect(sufficient).to.be.true;
      expect(overpayment).to.be.gt(0);
    });

    it("should detect insufficient payment", async function () {
      const { priceFeed } = await deployPriceFeedFixture();

      const [sufficient] = await priceFeed.isPaymentSufficient(
        ethers.parseUnits("100", 8),  // $100 USD
        ethers.parseEther("1")         // 1 AVAX ($25)
      );

      expect(sufficient).to.be.false;
    });

    it("should update max staleness", async function () {
      const { priceFeed } = await deployPriceFeedFixture();

      await priceFeed.setMaxStaleness(7200);
      expect(await priceFeed.maxStaleness()).to.equal(7200);
    });

    it("should reject too-short staleness", async function () {
      const { priceFeed } = await deployPriceFeedFixture();
      await expect(priceFeed.setMaxStaleness(30)).to.be.revertedWith("PriceFeed: too short");
    });

    it("should add additional price feeds", async function () {
      const { priceFeed, mockAggregator } = await deployPriceFeedFixture();

      await priceFeed.addPriceFeed("ETH/USD", await mockAggregator.getAddress());
      const price = await priceFeed.getPrice("ETH/USD");
      expect(price).to.equal(ethers.parseUnits("25", 8));
    });
  });

  // ──────────────────────────────────────────
  //  Integration: Multi-Chain Flow
  // ──────────────────────────────────────────

  describe("Multi-Chain Integration Flow", function () {

    it("should track lifetime reputation across multiple mints", async function () {
      const { reputationToken, player1 } = await loadFixture(deployFixture);

      await reputationToken.mintReputation(player1.address, ethers.parseEther("100"));
      await reputationToken.mintReputation(player1.address, ethers.parseEther("200"));

      expect(await reputationToken.balanceOf(player1.address)).to.equal(
        ethers.parseEther("300")
      );
      expect(await reputationToken.lifetimeReputation(player1.address)).to.equal(
        ethers.parseEther("300")
      );
    });

    it("should support multiple game chain registrations", async function () {
      const { verifier } = await loadFixture(deployFixture);

      const chains = [
        { id: ethers.encodeBytes32String("defi-kingdoms"), name: "DeFi Kingdoms" },
        { id: ethers.encodeBytes32String("beam-chain"), name: "Beam" },
        { id: ethers.encodeBytes32String("off-the-grid"), name: "Off The Grid" },
      ];

      for (const chain of chains) {
        await verifier.approveSourceChain(chain.id, chain.name);
      }

      expect(await verifier.getRegisteredChainCount()).to.equal(3);

      for (const chain of chains) {
        const info = await verifier.getChainInfo(chain.id);
        expect(info.name).to.equal(chain.name);
        expect(info.active).to.be.true;
      }
    });

    it("should deactivate chains independently", async function () {
      const { verifier } = await loadFixture(deployFixture);

      const chain1 = ethers.encodeBytes32String("chain-1");
      const chain2 = ethers.encodeBytes32String("chain-2");

      await verifier.approveSourceChain(chain1, "Chain 1");
      await verifier.approveSourceChain(chain2, "Chain 2");

      await verifier.revokeSourceChain(chain1);

      expect(await verifier.approvedSourceChains(chain1)).to.be.false;
      expect(await verifier.approvedSourceChains(chain2)).to.be.true;
    });

    it("should support full price-fed marketplace flow", async function () {
      const base = await loadFixture(deployFixture);

      const MockAggregator = await ethers.getContractFactory("MockAggregatorV3");
      const mockAgg = await MockAggregator.deploy(8, "AVAX/USD", ethers.parseUnits("30", 8));

      const ArenaPriceFeed = await ethers.getContractFactory("ArenaPriceFeed");
      const pf = await ArenaPriceFeed.deploy(await mockAgg.getAddress());

      // Simulate: item is $15 USD, AVAX is $30, needs 0.5 AVAX
      const [sufficient, overpay] = await pf.isPaymentSufficient(
        ethers.parseUnits("15", 8),
        ethers.parseEther("0.6")
      );

      expect(sufficient).to.be.true;
      // overpay = 0.6 - 0.5 = 0.1 AVAX
      expect(overpay).to.equal(ethers.parseEther("0.1"));
    });
  });
});
