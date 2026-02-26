import * as fs from "fs";
import * as path from "path";

/**
 * Avalanche Arena — Post-Deploy .env Updater
 *
 * Reads deployed-addresses.json and updates the .env file with
 * contract addresses for all services (API, Indexer, Frontend).
 *
 * Usage:
 *   npx ts-node scripts/update-env.ts
 */

interface DeployedAddresses {
  questRegistry: string;
  playerProgress: string;
  identityNFT: string;
  rewardEngine: string;
  proofValidator: string;
  mockGame: string;
  trustedSigner: string;
  chainId: string;
  deployedAt: string;
}

function main() {
  const addressesPath = path.join(__dirname, "../deployed-addresses.json");
  const envPath = path.join(__dirname, "../../.env");

  if (!fs.existsSync(addressesPath)) {
    console.error("❌ deployed-addresses.json not found. Run deploy first.");
    process.exit(1);
  }

  const addresses: DeployedAddresses = JSON.parse(
    fs.readFileSync(addressesPath, "utf-8")
  );

  if (!fs.existsSync(envPath)) {
    console.error("❌ .env not found at project root.");
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, "utf-8");

  // Map of env keys → deployed values
  const updates: Record<string, string> = {
    QUEST_REGISTRY_ADDRESS: addresses.questRegistry,
    PLAYER_PROGRESS_ADDRESS: addresses.playerProgress,
    PROOF_VALIDATOR_ADDRESS: addresses.proofValidator,
    REWARD_ENGINE_ADDRESS: addresses.rewardEngine,
    IDENTITY_NFT_ADDRESS: addresses.identityNFT,
    NEXT_PUBLIC_QUEST_REGISTRY_ADDRESS: addresses.questRegistry,
    NEXT_PUBLIC_PLAYER_PROGRESS_ADDRESS: addresses.playerProgress,
    NEXT_PUBLIC_PROOF_VALIDATOR_ADDRESS: addresses.proofValidator,
    NEXT_PUBLIC_REWARD_ENGINE_ADDRESS: addresses.rewardEngine,
    NEXT_PUBLIC_IDENTITY_NFT_ADDRESS: addresses.identityNFT,
  };

  for (const [key, value] of Object.entries(updates)) {
    // Match "KEY=" or "KEY=<any value>" and replace with "KEY=<new value>"
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Key doesn't exist — append it
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);

  console.log("═".repeat(50));
  console.log("✅ .env updated with deployed contract addresses");
  console.log("═".repeat(50));
  console.log();
  for (const [key, value] of Object.entries(updates)) {
    console.log(`  ${key}=${value}`);
  }
  console.log();
  console.log(`Deployed at: ${addresses.deployedAt}`);
  console.log(`Chain ID:    ${addresses.chainId}`);
}

main();
