import { supabase } from "./supabase";
import bcrypt from "bcrypt";

/**
 * Ensures at least one admin credential row exists in Supabase.
 * Runs once at server startup — safe to call repeatedly (idempotent).
 */
export async function seedAdminCredentials(): Promise<void> {
  try {
    const { data: existing, error: selectErr } = await supabase
      .from("admin_credentials")
      .select("id")
      .limit(1);

    if (selectErr) {
      console.error("[seed] Could not query admin_credentials:", selectErr.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log("[seed] Admin credentials already exist — skipping.");
      return;
    }

    const username = "admin";
    const password = process.env.ADMIN_DEFAULT_PASSWORD || "Zoom100*";
    const passwordHash = await bcrypt.hash(password, 12);

    const { error: insertErr } = await supabase
      .from("admin_credentials")
      .insert({ username, password_hash: passwordHash });

    if (insertErr) {
      console.error("[seed] Could not insert admin credentials:", insertErr.message);
      return;
    }

    console.log(`[seed] ✓ Default admin credentials created (username: "${username}")`);
  } catch (err) {
    console.error("[seed] Warning: could not seed admin credentials:", (err as Error).message);
  }
}
