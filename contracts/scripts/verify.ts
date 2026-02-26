import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Avalanche Arena — Contract Verification Script
 *
 * Verifies all deployed contracts on Snowtrace (Etherscan for Avalanche).
 * Reads addresses from deployed-addresses.json.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network fuji
 *   npx hardhat run scripts/verify.ts --network avalanche
 */

interface DeployedAddresses {
  questRegistry: string;
  playerProgress: string;
  identityNFT: string;
  rewardEngine: string;
  proofValidator: string;
  mockGame: string;
  governance: string;
  marketplace: string;
  trustedSigner: string;
  chainId: string;
  deployedAt: string;
}

async function main() {
  const addressesPath = path.join(__dirname, "../deployed-addresses.json");

  if (!fs.existsSync(addressesPath)) {
    console.error("❌ deployed-addresses.json not found. Run deploy first.");
    process.exit(1);
  }

  const addresses: DeployedAddresses = JSON.parse(
    fs.readFileSync(addressesPath, "utf-8")
  );

  console.log("═".repeat(50));
  console.log("🔍 AVALANCHE ARENA — Contract Verification");
  console.log("═".repeat(50));
  console.log(`Chain ID: ${addresses.chainId}`);
  console.log(`Deployed: ${addresses.deployedAt}\n`);

  const contracts = [
    {
      name: "QuestRegistry",
      address: addresses.questRegistry,
      constructorArguments: [],
    },
    {
      name: "PlayerProgress",
      address: addresses.playerProgress,
      constructorArguments: [],
    },
    {
      name: "IdentityNFT",
      address: addresses.identityNFT,
      constructorArguments: [],
    },
    {
      name: "RewardEngine",
      address: addresses.rewardEngine,
      constructorArguments: [],
    },
    {
      name: "ProofValidator",
      address: addresses.proofValidator,
      constructorArguments: [addresses.trustedSigner],
    },
    {
      name: "MockGame",
      address: addresses.mockGame,
      constructorArguments: [],
    },
    {
      name: "ArenaGovernance",
      address: addresses.governance,
      constructorArguments: [addresses.identityNFT, addresses.playerProgress],
    },
    {
      name: "ArenaMarketplace",
      address: addresses.marketplace,
      constructorArguments: [],
    },
  ];

  let verified = 0;
  let failed = 0;

  for (const contract of contracts) {
    console.log(`\n📋 Verifying ${contract.name} at ${contract.address}...`);

    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
      });
      console.log(`  ✅ ${contract.name} verified successfully!`);
      verified++;
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`  ✅ ${contract.name} already verified.`);
        verified++;
      } else {
        console.error(`  ❌ ${contract.name} verification failed:`, error.message);
        failed++;
      }
    }
  }

  console.log("\n" + "═".repeat(50));
  console.log(`Verification complete: ${verified} verified, ${failed} failed`);
  console.log("═".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
