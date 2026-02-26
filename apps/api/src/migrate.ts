import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

/**
 * Database Migration Runner
 *
 * Runs SQL migration files in order, tracking which have been applied.
 * Usage: npx tsx src/migrate.ts
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://arena:arena@localhost:5432/avalanche_arena",
});

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query("SELECT filename FROM _migrations ORDER BY id ASC");
  return new Set(result.rows.map((r: any) => r.filename));
}

async function runMigrations(): Promise<void> {
  console.log("🗄️  Avalanche Arena — Database Migration Runner\n");

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  // Collect migration files from both init.sql and migrations/
  const migrationDirs = [
    path.resolve(__dirname, "../../../docker"),
    path.resolve(__dirname, "../../../docker/migrations"),
  ];

  const allFiles: Array<{ dir: string; file: string }> = [];

  for (const dir of migrationDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      allFiles.push({ dir, file });
    }
  }

  let appliedCount = 0;

  for (const { dir, file } of allFiles) {
    if (applied.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(dir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO _migrations (filename) VALUES ($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`  ✅ ${file} (applied)`);
      appliedCount++;
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error(`  ❌ ${file} — Error: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  if (appliedCount === 0) {
    console.log("\n  Database is up to date. No new migrations.\n");
  } else {
    console.log(`\n  Applied ${appliedCount} migration(s).\n`);
  }

  await pool.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
