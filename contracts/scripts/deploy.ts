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
  QuestRegistry:     ${questRegistryAddr}
  PlayerProgress:    ${playerProgressAddr}
  IdentityNFT:       ${identityNFTAddr}
  RewardEngine:      ${rewardEngineAddr}
  ProofValidator:    ${proofValidatorAddr}
  MockGame:          ${mockGameAddr}
  ArenaGovernance:   ${governanceAddr}
  ArenaMarketplace:  ${marketplaceAddr}
  Trusted Signer:    ${trustedSignerAddress}
  `);

  // Write addresses to JSON for other services
  const fs = require("fs");
  const addresses = {
    questRegistry: questRegistryAddr,
    playerProgress: playerProgressAddr,
    identityNFT: identityNFTAddr,
    rewardEngine: rewardEngineAddr,
    proofValidator: proofValidatorAddr,
    mockGame: mockGameAddr,
    governance: governanceAddr,
    marketplace: marketplaceAddr,
    trustedSigner: trustedSignerAddress,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
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
