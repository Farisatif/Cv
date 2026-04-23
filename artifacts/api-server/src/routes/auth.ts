import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { supabase } from "../lib/supabase";
import bcrypt from "bcrypt";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "farisatif7780@gmail.com";

const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "Zoom100*";

// ── Password-based login ───────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    // Attempt DB-backed authentication first
    const { data: creds, error: dbError } = await supabase
      .from("admin_credentials")
      .select("id, username, password_hash")
      .eq("username", username.trim().toLowerCase())
      .limit(1);

    // Fallback: if DB tables don't exist, allow login with default password
    if (dbError) {
      console.warn("[Auth] DB not ready — using env fallback:", dbError.message);
      const adminEmail = (process.env.ADMIN_EMAIL || "farisatif7780@gmail.com").toLowerCase();
      const lc = username.trim().toLowerCase();
      const isDefaultUser = lc === "admin" || lc === adminEmail;
      const isValidPassword = password === ADMIN_DEFAULT_PASSWORD;
      if (isDefaultUser && isValidPassword) {
        // Return the ADMIN_KEY as token (works without DB session validation)
        const staticToken = process.env.ADMIN_KEY || "Zoom100*";
        console.log("[Auth] Fallback login success for admin (no DB)");
        res.json({ success: true, token: staticToken, username: "admin", dbMode: "offline" });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
      return;
    }

    if (!creds || creds.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const cred = creds[0];
    const isValid = await bcrypt.compare(password, cred.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const googleId = `local:${cred.username}`;

    const { data: existing } = await supabase
      .from("admin_sessions")
      .select("id")
      .eq("google_id", googleId)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("admin_sessions")
        .update({ session_token: sessionToken, expires_at: expiresAt })
        .eq("google_id", googleId);
    } else {
      await supabase.from("admin_sessions").insert({
        google_id: googleId,
        email: cred.username,
        name: cred.username,
        session_token: sessionToken,
        expires_at: expiresAt,
      });
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

  if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Invalid request" }); return;
  }

  try {
    const { data: sessions } = await supabase
      .from("admin_sessions")
      .select("google_id, expires_at")
      .eq("session_token", token)
      .limit(1);

    if (!sessions || sessions.length === 0 || new Date(sessions[0].expires_at) < new Date()) {
      res.status(401).json({ error: "Session expired or invalid" }); return;
    }

    const googleId: string = sessions[0].google_id;
    if (!googleId.startsWith("local:")) {
      res.status(403).json({ error: "Password change only available for local accounts" }); return;
    }

    const username = googleId.replace("local:", "");
    const { data: creds } = await supabase
      .from("admin_credentials")
      .select("password_hash")
      .eq("username", username)
      .limit(1);

    if (!creds || creds.length === 0) {
      res.status(404).json({ error: "Account not found" }); return;
    }

    const isValid = await bcrypt.compare(currentPassword, creds[0].password_hash);
    if (!isValid) { res.status(401).json({ error: "Current password is incorrect" }); return; }

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase
      .from("admin_credentials")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("username", username);

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
    if (!credential) { res.status(400).json({ error: "Missing credential" }); return; }

    const parts = credential.split(".");
    if (parts.length !== 3) { res.status(400).json({ error: "Invalid token format" }); return; }

    let payload: { email?: string; name?: string; sub?: string; exp?: number };
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    } catch {
      res.status(400).json({ error: "Failed to parse token" }); return;
    }

    if ((payload.exp ?? 0) * 1000 < Date.now()) {
      res.status(401).json({ error: "Token expired" }); return;
    }

    const email = payload.email;
    if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Not authorized — admin only" }); return;
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const googleId = payload.sub || email;

    const { data: existing } = await supabase
      .from("admin_sessions")
      .select("id")
      .eq("google_id", googleId)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase.from("admin_sessions").update({
        session_token: sessionToken, expires_at: expiresAt,
        email, name: payload.name ?? null,
      }).eq("google_id", googleId);
    } else {
      await supabase.from("admin_sessions").insert({
        google_id: googleId, email, name: payload.name ?? null,
        session_token: sessionToken, expires_at: expiresAt,
      });
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
  if (!token) { res.status(401).json({ error: "No token" }); return; }

  // Offline mode: ADMIN_KEY acts as static session token
  const adminKey = process.env.ADMIN_KEY || "Zoom100*";
  if (token === adminKey) {
    res.json({ valid: true, email: "admin", name: "Admin" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("admin_sessions")
      .select("email, name, expires_at")
      .eq("session_token", token)
      .limit(1);

    if (error || !data || data.length === 0 || new Date(data[0].expires_at) < new Date()) {
      res.status(401).json({ error: "Session expired or invalid" }); return;
    }

    res.json({ valid: true, email: data[0].email, name: data[0].name });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────
router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.headers["x-session-token"] as string;
  if (token) {
    try {
      await supabase.from("admin_sessions").delete().eq("session_token", token);
    } catch (err) {
      console.error("[Auth] Logout error:", err);
    }
  }
  res.json({ success: true });
});

export default router;
