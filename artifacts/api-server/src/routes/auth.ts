import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { pool } from "@workspace/db";
import bcrypt from "bcrypt";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "farisatif7780@gmail.com";

// ── Password-based login (credentials stored in DB) ────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const credResult = await pool.query(
      `SELECT id, username, password_hash FROM admin_credentials WHERE username = $1 LIMIT 1`,
      [username.trim().toLowerCase()]
    );

    if (credResult.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const cred = credResult.rows[0];
    const isValid = await bcrypt.compare(password, cred.password_hash);

    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const googleId = `local:${cred.username}`;

    const existing = await pool.query(
      `SELECT id FROM admin_sessions WHERE google_id = $1 LIMIT 1`,
      [googleId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE admin_sessions SET session_token = $1, expires_at = $2 WHERE google_id = $3`,
        [sessionToken, expiresAt, googleId]
      );
    } else {
      await pool.query(
        `INSERT INTO admin_sessions (google_id, email, name, session_token, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [googleId, cred.username, cred.username, sessionToken, expiresAt]
      );
    }

    console.log(`[Auth] Password login success: ${cred.username}`);
    res.json({ success: true, token: sessionToken, username: cred.username });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── Change password ────────────────────────────────────────────────────────
router.post("/auth/change-password", async (req, res): Promise<void> => {
  const token = req.headers["x-session-token"] as string;
  const { currentPassword, newPassword } = req.body;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const sessionResult = await pool.query(
      `SELECT google_id, expires_at FROM admin_sessions WHERE session_token = $1 LIMIT 1`,
      [token]
    );
    if (sessionResult.rows.length === 0 || sessionResult.rows[0].expires_at < new Date()) {
      res.status(401).json({ error: "Session expired or invalid" });
      return;
    }

    const googleId: string = sessionResult.rows[0].google_id;
    if (!googleId.startsWith("local:")) {
      res.status(403).json({ error: "Password change only available for local accounts" });
      return;
    }

    const username = googleId.replace("local:", "");
    const credResult = await pool.query(
      `SELECT password_hash FROM admin_credentials WHERE username = $1 LIMIT 1`,
      [username]
    );
    if (credResult.rows.length === 0) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, credResult.rows[0].password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE admin_credentials SET password_hash = $1, updated_at = NOW() WHERE username = $2`,
      [newHash, username]
    );

    console.log(`[Auth] Password changed for: ${username}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ── Google OAuth login ─────────────────────────────────────────────────────
router.post("/auth/google", async (req, res): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Missing credential" });
      return;
    }

    const parts = credential.split(".");
    if (parts.length !== 3) {
      res.status(400).json({ error: "Invalid token format" });
      return;
    }

    let payload: { email?: string; name?: string; sub?: string; exp?: number };
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = Buffer.from(base64, "base64").toString("utf-8");
      payload = JSON.parse(json);
    } catch {
      res.status(400).json({ error: "Failed to parse token" });
      return;
    }

    const exp = payload.exp ? payload.exp * 1000 : 0;
    if (exp < Date.now()) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    const email = payload.email;
    if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Not authorized — admin only" });
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const googleId = payload.sub || email;

    const existing = await pool.query(
      `SELECT id FROM admin_sessions WHERE google_id = $1 LIMIT 1`,
      [googleId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE admin_sessions SET session_token = $1, expires_at = $2, email = $3, name = $4 WHERE google_id = $5`,
        [sessionToken, expiresAt, email, payload.name || null, googleId]
      );
    } else {
      await pool.query(
        `INSERT INTO admin_sessions (google_id, email, name, session_token, expires_at) VALUES ($1, $2, $3, $4, $5)`,
        [googleId, email, payload.name || null, sessionToken, expiresAt]
      );
    }

    res.json({ success: true, token: sessionToken, email, name: payload.name });
  } catch (err) {
    console.error("[Auth] Google auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// ── Session verification ───────────────────────────────────────────────────
router.get("/auth/verify", async (req, res): Promise<void> => {
  const token = req.headers["x-session-token"] as string;
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }

  try {
    const now = new Date();
    const result = await pool.query(
      `SELECT email, name, expires_at FROM admin_sessions WHERE session_token = $1 LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0 || result.rows[0].expires_at < now) {
      res.status(401).json({ error: "Session expired or invalid" });
      return;
    }

    const session = result.rows[0];
    res.json({ valid: true, email: session.email, name: session.name });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────
router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.headers["x-session-token"] as string;
  if (token) {
    try {
      await pool.query(`DELETE FROM admin_sessions WHERE session_token = $1`, [token]);
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    }
  }
  res.json({ success: true });
});

export default router;
