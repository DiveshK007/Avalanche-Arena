import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

/**
 * Environment Validation Schema
 *
 * Fails fast on startup if required env vars are missing or malformed.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default("postgresql://arena:arena@localhost:5432/avalanche_arena"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // API
  API_PORT: z.string().default("3001").transform(Number),

  // RPC
  FUJI_RPC_URL: z.string().optional(),
  FUJI_WS_URL: z.string().optional(),

  // Contract addresses (optional — empty until deployment)
  QUEST_REGISTRY_ADDRESS: z.string().optional(),
  PLAYER_PROGRESS_ADDRESS: z.string().optional(),
  PROOF_VALIDATOR_ADDRESS: z.string().optional(),
  REWARD_ENGINE_ADDRESS: z.string().optional(),
  IDENTITY_NFT_ADDRESS: z.string().optional(),

  // Auth (JWT secret for SIWE)
  JWT_SECRET: z.string().min(16).default("arena-dev-jwt-secret-change-me"),

  // Proof signer
  PROOF_SIGNER_PRIVATE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:\n");
    for (const issue of result.error.issues) {
      console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error("\nFix your .env file and try again.\n");
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) return validateEnv();
  return _env;
}
