import { Router, type IRouter } from "express";
import pool from "../lib/db";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const key = (req.headers["x-admin-key"] || req.headers["x-session-token"]) as string | undefined;
  if (!key) return false;
  if (key === ADMIN_KEY) return true;
  try {
    const { rows } = await pool.query(
      "SELECT id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW() LIMIT 1",
      [key]
    );
    return rows.length > 0;
  } catch { return false; }
}

router.get("/resume", async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT data, updated_at FROM resume_data ORDER BY updated_at DESC LIMIT 1"
    );
    if (rows.length === 0) {
      res.json({ data: null, updatedAt: null });
      return;
    }
    res.json({ data: JSON.parse(rows[0].data), updatedAt: rows[0].updated_at });
  } catch (err) {
    console.error("[resume-data] GET error:", err);
    res.json({ data: null, updatedAt: null });
  }
});

router.put("/resume", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "Invalid data" });
      return;
    }
    const dataStr = JSON.stringify(payload);
    const now = new Date().toISOString();

    const { rows: existing } = await pool.query(
      "SELECT id FROM resume_data ORDER BY updated_at DESC LIMIT 1"
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE resume_data SET data = $1, updated_at = $2 WHERE id = $3",
        [dataStr, now, existing[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO resume_data (data, updated_at) VALUES ($1, $2)",
        [dataStr, now]
      );
    }

    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error("[resume-data] PUT error:", err);
    res.status(500).json({ error: "Failed to save resume data" });
  }
});

export default router;
