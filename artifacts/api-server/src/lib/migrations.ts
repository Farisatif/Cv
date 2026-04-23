import pool from "./db";

export async function runMigrations(): Promise<void> {
  console.log("[migrations] Running PostgreSQL migrations...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id          BIGSERIAL PRIMARY KEY,
        name        TEXT    NOT NULL,
        message     TEXT    NOT NULL,
        likes       INTEGER NOT NULL DEFAULT 0,
        approved    BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS comment_tokens (
        id          BIGSERIAL PRIMARY KEY,
        comment_id  BIGINT  NOT NULL,
        token       TEXT    NOT NULL,
        action      TEXT    NOT NULL,
        used_at     TIMESTAMPTZ,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS visitors (
        id    BIGSERIAL PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      );

      INSERT INTO visitors (count)
        SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM visitors);

      CREATE TABLE IF NOT EXISTS resume_data (
        id         BIGSERIAL PRIMARY KEY,
        data       TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_credentials (
        id            BIGSERIAL PRIMARY KEY,
        username      TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_sessions (
        id            BIGSERIAL PRIMARY KEY,
        google_id     TEXT NOT NULL UNIQUE,
        email         TEXT,
        name          TEXT,
        session_token TEXT NOT NULL,
        expires_at    TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[migrations] ✓ All tables are ready.");
  } catch (err) {
    console.error("[migrations] ✗ Migration failed:", (err as Error).message);
    throw err;
  }
}
