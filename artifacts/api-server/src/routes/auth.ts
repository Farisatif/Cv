import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "farisatif7780@gmail.com";

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
