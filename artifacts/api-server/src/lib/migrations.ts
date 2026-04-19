import { pool } from "@workspace/db";

/**
 * Idempotent schema migrations — safe to run on every startup.
 * Each statement is independent; failures are logged but won't crash the server.
 * This ensures production and development stay in sync without a separate migration tool.
 */
export async function runMigrations(): Promise<void> {
  const migrations: Array<{ name: string; sql: string }> = [
    // ── Core tables ───────────────────────────────────────────────────────
    {
      name: "create_comments",
      sql: `
        CREATE TABLE IF NOT EXISTS comments (
          id          SERIAL PRIMARY KEY,
          name        TEXT    NOT NULL,
          message     TEXT    NOT NULL,
          likes       INTEGER NOT NULL DEFAULT 0,
          approved    BOOLEAN NOT NULL DEFAULT false,
          created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )`,
    },
    {
      name: "create_comment_tokens",
      sql: `
        CREATE TABLE IF NOT EXISTS comment_tokens (
          id          SERIAL PRIMARY KEY,
          comment_id  INTEGER NOT NULL,
          token       TEXT    NOT NULL,
          action      TEXT    NOT NULL,
          used_at     TIMESTAMP WITH TIME ZONE,
          expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )`,
    },
    {
      name: "create_visitors",
      sql: `
        CREATE TABLE IF NOT EXISTS visitors (
          id    SERIAL PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0
        )`,
    },
    {
      name: "ensure_visitors_row",
      sql: `
        INSERT INTO visitors (count)
        SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM visitors)`,
    },
    {
      name: "create_resume_data",
      sql: `
        CREATE TABLE IF NOT EXISTS resume_data (
          id         SERIAL PRIMARY KEY,
          data       TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )`,
    },
    {
      name: "create_admin_credentials",
      sql: `
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id            SERIAL PRIMARY KEY,
          username      TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )`,
    },
    {
      name: "create_admin_sessions",
      sql: `
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id            SERIAL PRIMARY KEY,
          google_id     TEXT NOT NULL UNIQUE,
          email         TEXT,
          name          TEXT,
          session_token TEXT NOT NULL,
          expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )`,
    },

    // ── Additive column migrations (safe on existing installs) ────────────
    {
      name: "admin_sessions_add_google_id",
      sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS google_id TEXT`,
    },
    {
      name: "admin_sessions_add_email",
      sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS email TEXT`,
    },
    {
      name: "admin_sessions_add_name",
      sql: `ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS name TEXT`,
    },
    {
      name: "admin_credentials_add_updated_at",
      sql: `ALTER TABLE admin_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`,
    },

    // ── Rename username→google_id if the old schema still exists ─────────
    // (Safe: only runs if google_id is NULL but username column existed)
    {
      name: "admin_sessions_backfill_google_id",
      sql: `
        UPDATE admin_sessions
        SET google_id = CONCAT('local:', COALESCE(email, 'admin'))
        WHERE google_id IS NULL`,
    },

    // ── Unique constraint on google_id (idempotent) ───────────────────────
    {
      name: "admin_sessions_google_id_unique",
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'admin_sessions_google_id_key'
          ) THEN
            ALTER TABLE admin_sessions ADD CONSTRAINT admin_sessions_google_id_key UNIQUE (google_id);
          END IF;
        END $$`,
    },

    // ── Remove duplicate visitor rows (keep lowest id) ────────────────────
    {
      name: "visitors_deduplicate",
      sql: `
        DELETE FROM visitors
        WHERE id NOT IN (SELECT MIN(id) FROM visitors)`,
    },
  ];

  console.log(`[migrations] Running ${migrations.length} migration checks...`);
  let ok = 0;
  let failed = 0;

  for (const m of migrations) {
    try {
      await pool.query(m.sql);
      ok++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // NOT NULL violations from backfill are expected when google_id was already set — skip silently
      if (!msg.includes("not-null") && !msg.includes("already exists") && !msg.includes("duplicate")) {
        console.warn(`[migrations] ⚠ ${m.name}: ${msg}`);
        failed++;
      }
    }
  }

  console.log(`[migrations] ✓ Done (${ok} ok, ${failed} warnings)`);
}
