import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // Derive trusted signer address from env (defaults to deployer)
  const signerKey = process.env.PROOF_SIGNER_PRIVATE_KEY || "";
  const trustedSignerAddress = signerKey
    ? new ethers.Wallet(signerKey).address
    : deployer.address;
  console.log("Trusted Signer:", trustedSignerAddress);

  // ──────────────────────────────────────────
  // 1. Deploy QuestRegistry
  // ──────────────────────────────────────────
  console.log("\n📋 Deploying QuestRegistry...");
  const QuestRegistry = await ethers.getContractFactory("QuestRegistry");
  const questRegistry = await QuestRegistry.deploy();
  await questRegistry.waitForDeployment();
  const questRegistryAddr = await questRegistry.getAddress();
  console.log("  QuestRegistry:", questRegistryAddr);

  // ──────────────────────────────────────────
  // 2. Deploy PlayerProgress
  // ──────────────────────────────────────────
  console.log("\n📊 Deploying PlayerProgress...");
  const PlayerProgress = await ethers.getContractFactory("PlayerProgress");
  const playerProgress = await PlayerProgress.deploy();
  await playerProgress.waitForDeployment();
  const playerProgressAddr = await playerProgress.getAddress();
  console.log("  PlayerProgress:", playerProgressAddr);

  // ──────────────────────────────────────────
  // 3. Deploy IdentityNFT
  // ──────────────────────────────────────────
  console.log("\n🎭 Deploying IdentityNFT...");
  const IdentityNFT = await ethers.getContractFactory("IdentityNFT");
  const identityNFT = await IdentityNFT.deploy();
  await identityNFT.waitForDeployment();
  const identityNFTAddr = await identityNFT.getAddress();
  console.log("  IdentityNFT:", identityNFTAddr);

  // ──────────────────────────────────────────
  // 4. Deploy RewardEngine
  // ──────────────────────────────────────────
  console.log("\n🏆 Deploying RewardEngine...");
  const RewardEngine = await ethers.getContractFactory("RewardEngine");
  const rewardEngine = await RewardEngine.deploy();
  await rewardEngine.waitForDeployment();
  const rewardEngineAddr = await rewardEngine.getAddress();
  console.log("  RewardEngine:", rewardEngineAddr);

  // ──────────────────────────────────────────
  // 5. Deploy ProofValidator
  // ──────────────────────────────────────────
  console.log("\n✅ Deploying ProofValidator...");
  // Use deployer as trusted signer for now (replace with dedicated signer)
  const ProofValidator = await ethers.getContractFactory("ProofValidator");
  const proofValidator = await ProofValidator.deploy(trustedSignerAddress);
  await proofValidator.waitForDeployment();
  const proofValidatorAddr = await proofValidator.getAddress();
  console.log("  ProofValidator:", proofValidatorAddr);

  // ──────────────────────────────────────────
  // 6. Wire Contracts Together
  // ──────────────────────────────────────────
  console.log("\n🔗 Wiring contracts...");

  // RewardEngine → QuestRegistry
  await rewardEngine.setQuestRegistry(questRegistryAddr);
  console.log("  RewardEngine → QuestRegistry ✓");

  // RewardEngine → PlayerProgress
  await rewardEngine.setPlayerProgress(playerProgressAddr);
  console.log("  RewardEngine → PlayerProgress ✓");

  // RewardEngine → IdentityNFT
  await rewardEngine.setIdentityNFT(identityNFTAddr);
  console.log("  RewardEngine → IdentityNFT ✓");

  // RewardEngine → ProofValidator (set who can call)
  await rewardEngine.setProofValidator(proofValidatorAddr);
  console.log("  RewardEngine → ProofValidator ✓");

  // ProofValidator → RewardEngine
  await proofValidator.setRewardEngine(rewardEngineAddr);
  console.log("  ProofValidator → RewardEngine ✓");

  // PlayerProgress → RewardEngine
  await playerProgress.setRewardEngine(rewardEngineAddr);
  console.log("  PlayerProgress → RewardEngine ✓");

  // IdentityNFT → RewardEngine
  await identityNFT.setRewardEngine(rewardEngineAddr);
  console.log("  IdentityNFT → RewardEngine ✓");

  // ──────────────────────────────────────────
  // 7. Deploy MockGame (testnet only)
  // ──────────────────────────────────────────
  console.log("\n🎮 Deploying MockGame...");
  const MockGame = await ethers.getContractFactory("MockGame");
  const mockGame = await MockGame.deploy();
  await mockGame.waitForDeployment();
  const mockGameAddr = await mockGame.getAddress();
  console.log("  MockGame:", mockGameAddr);

  // ──────────────────────────────────────────
  // 8. Deploy ArenaGovernance
  // ──────────────────────────────────────────
  console.log("\n🏛️ Deploying ArenaGovernance...");
  const ArenaGovernance = await ethers.getContractFactory("ArenaGovernance");
  const governance = await ArenaGovernance.deploy(
    identityNFTAddr,
    playerProgressAddr
  );
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  console.log("  ArenaGovernance:", governanceAddr);

  // ──────────────────────────────────────────
  // 9. Deploy ArenaMarketplace
  // ──────────────────────────────────────────
  console.log("\n🛒 Deploying ArenaMarketplace...");
  const ArenaMarketplace = await ethers.getContractFactory("ArenaMarketplace");
  const marketplace = await ArenaMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddr = await marketplace.getAddress();
  console.log("  ArenaMarketplace:", marketplaceAddr);

  // ──────────────────────────────────────────
  // 10. Deploy CrossChainQuestVerifier (ICM)
  // ──────────────────────────────────────────
  console.log("\n🌉 Deploying CrossChainQuestVerifier (ICM)...");
  const CrossChainQuestVerifier = await ethers.getContractFactory("CrossChainQuestVerifier");
  const crossChainVerifier = await CrossChainQuestVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  const crossChainVerifierAddr = await crossChainVerifier.getAddress();
  console.log("  CrossChainQuestVerifier:", crossChainVerifierAddr);

  // Wire CrossChainQuestVerifier
  await crossChainVerifier.setRewardEngine(rewardEngineAddr);
  console.log("  CrossChainVerifier → RewardEngine ✓");
  await crossChainVerifier.setPlayerProgress(playerProgressAddr);
  console.log("  CrossChainVerifier → PlayerProgress ✓");

  // ──────────────────────────────────────────
  // 11. Deploy ArenaReputationToken (ICTT)
  // ──────────────────────────────────────────
  console.log("\n🪙 Deploying ArenaReputationToken (ICTT)...");
  const ArenaReputationToken = await ethers.getContractFactory("ArenaReputationToken");
  const reputationToken = await ArenaReputationToken.deploy();
  await reputationToken.waitForDeployment();
  const reputationTokenAddr = await reputationToken.getAddress();
  console.log("  ArenaReputationToken:", reputationTokenAddr);

  // Set RewardEngine as minter
  await reputationToken.addMinter(rewardEngineAddr);
  console.log("  ART Minter → RewardEngine ✓");
  // Set CrossChainVerifier as minter too
  await reputationToken.addMinter(crossChainVerifierAddr);
  console.log("  ART Minter → CrossChainVerifier ✓");

  // ──────────────────────────────────────────
  // 12. Deploy ArenaPriceFeed (Chainlink)
  // ──────────────────────────────────────────
  console.log("\n📈 Deploying ArenaPriceFeed (Chainlink)...");
  const avaxUsdFeed = process.env.CHAINLINK_AVAX_USD_FEED || "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";
  const ArenaPriceFeed = await ethers.getContractFactory("ArenaPriceFeed");
  const priceFeed = await ArenaPriceFeed.deploy(avaxUsdFeed);
  await priceFeed.waitForDeployment();
  const priceFeedAddr = await priceFeed.getAddress();
  console.log("  ArenaPriceFeed:", priceFeedAddr);
  console.log("  AVAX/USD Feed:", avaxUsdFeed);

  // ──────────────────────────────────────────
  // 10. Create Sample Quests
  // ──────────────────────────────────────────
  console.log("\n📝 Creating sample quests...");

  const matchWonSig = ethers.id("MatchWon(address)");
  const nftMintedSig = ethers.id("NFTMinted(address,uint256)");
  const bossDefeatedSig = ethers.id("BossDefeated(address,uint256)");

  await questRegistry.createQuest(
    mockGameAddr,
    matchWonSig,
    120, // XP
    2,   // Difficulty
    3600 // 1 hour cooldown
  );
  console.log("  Quest 1: Win a Match (120 XP) ✓");

  await questRegistry.createQuest(
    mockGameAddr,
    nftMintedSig,
    50, // XP
    1,  // Difficulty
    0   // No cooldown
  );
  console.log("  Quest 2: Mint Game NFT (50 XP) ✓");

  await questRegistry.createQuest(
    mockGameAddr,
    bossDefeatedSig,
    500, // XP
    5,   // Difficulty
    86400 // 24 hour cooldown
  );
  console.log("  Quest 3: Defeat Boss (500 XP) ✓");

  // ──────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("🔺 AVALANCHE ARENA — Deployment Complete");
  console.log("═".repeat(50));
  console.log(`
  ── Core Contracts ──
  QuestRegistry:          ${questRegistryAddr}
  PlayerProgress:         ${playerProgressAddr}
  IdentityNFT:            ${identityNFTAddr}
  RewardEngine:           ${rewardEngineAddr}
  ProofValidator:         ${proofValidatorAddr}
  MockGame:               ${mockGameAddr}

  ── Governance & Market ──
  ArenaGovernance:        ${governanceAddr}
  ArenaMarketplace:       ${marketplaceAddr}

  ── Cross-Chain (ICM) ──
  CrossChainQuestVerifier: ${crossChainVerifierAddr}
  TeleporterMessenger:     0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf

  ── Token (ICTT) ──
  ArenaReputationToken:   ${reputationTokenAddr}

  ── Chainlink ──
  ArenaPriceFeed:         ${priceFeedAddr}

  ── Config ──
  Trusted Signer:         ${trustedSignerAddress}
  `);

  // Write addresses to JSON for other services
  const fs = require("fs");
  const network = await deployer.provider.getNetwork();
  const addresses = {
    // Core
    questRegistry: questRegistryAddr,
    playerProgress: playerProgressAddr,
    identityNFT: identityNFTAddr,
    rewardEngine: rewardEngineAddr,
    proofValidator: proofValidatorAddr,
    mockGame: mockGameAddr,
    // Governance & Market
    governance: governanceAddr,
    marketplace: marketplaceAddr,
    // Cross-Chain (ICM)
    crossChainQuestVerifier: crossChainVerifierAddr,
    teleporterMessenger: "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf",
    // Token (ICTT)
    arenaReputationToken: reputationTokenAddr,
    // Chainlink
    arenaPriceFeed: priceFeedAddr,
    chainlinkAvaxUsdFeed: avaxUsdFeed,
    // Meta
    trustedSigner: trustedSignerAddress,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("📄 Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
