import { pool } from "@workspace/db";
import bcrypt from "bcrypt";

/**
 * Ensures at least one admin credential row exists in the database.
 * Runs once at server startup — safe to call repeatedly (idempotent).
 */
export async function seedAdminCredentials(): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT id FROM admin_credentials LIMIT 1`
    );

    if (existing.rows.length > 0) {
      console.log("[seed] Admin credentials already exist — skipping.");
      return;
    }

    const username = "admin";
    const password = process.env.ADMIN_DEFAULT_PASSWORD || "Zoom100*";
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO admin_credentials (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [username, passwordHash]
    );

    console.log(`[seed] ✓ Default admin credentials created (username: "${username}")`);
  } catch (err) {
    console.error("[seed] Warning: could not seed admin credentials:", (err as Error).message);
  }
}
