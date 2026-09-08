import "dotenv/config";
import { Pool } from "pg";
import { readFile } from "node:fs/promises";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("Checking database tables...");
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = res.rows.map(r => r.table_name);
    console.log("Existing tables:", tables);

    // Check if RateLimit table exists
    if (!tables.includes("RateLimit")) {
      console.log("Applying migration 202609080002_access_workflow_sla/migration.sql...");
      const sql = await readFile("prisma/migrations/202609080002_access_workflow_sla/migration.sql", "utf8");
      await client.query(sql);
      console.log("Migration successfully applied!");
    } else {
      console.log("RateLimit table already exists.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
