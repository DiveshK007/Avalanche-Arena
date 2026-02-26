import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://arena:arena@localhost:5432/avalanche_arena",
});

export default pool;
