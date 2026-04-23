import { supabase } from "./supabase";

/**
 * For Supabase: tables must be created via the Supabase SQL editor.
 * See: artifacts/api-server/supabase-migrations.sql
 *
 * This function verifies connectivity and logs a helpful message.
 */
export async function runMigrations(): Promise<void> {
  console.log("[migrations] Using Supabase backend.");
  console.log("[migrations] If tables are missing, run supabase-migrations.sql in your Supabase SQL Editor.");

  try {
    // Verify connectivity by pinging the visitors table
    const { error } = await supabase.from("visitors").select("id").limit(1);
    if (error) {
      if (error.code === "42P01") {
        console.warn("[migrations] ⚠ Tables not found — please run supabase-migrations.sql in your Supabase SQL Editor.");
      } else {
        console.warn("[migrations] ⚠ Supabase connectivity check warning:", error.message);
      }
    } else {
      console.log("[migrations] ✓ Supabase connection verified.");
    }
  } catch (err) {
    console.warn("[migrations] ⚠ Could not verify Supabase connection:", (err as Error).message);
  }
}
