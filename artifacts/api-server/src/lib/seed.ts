import pool from "./db";
import bcrypt from "bcrypt";

export async function seedAdminCredentials(): Promise<void> {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM admin_credentials LIMIT 1"
    );

    if (rows.length > 0) {
      console.log("[seed] Admin credentials already exist — skipping.");
      return;
    }

    const username = "admin";
    const password = process.env.ADMIN_DEFAULT_PASSWORD || "Zoom100*";
    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash]
    );

    console.log(`[seed] ✓ Default admin credentials created (username: "${username}")`);
  } catch (err) {
    console.error("[seed] Warning: could not seed admin credentials:", (err as Error).message);
  }
}
