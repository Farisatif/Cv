import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

router.get("/resume", async (req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT data, updated_at FROM resume_data ORDER BY updated_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      res.json({ data: null, updatedAt: null });
      return;
    }

    res.json({
      data: JSON.parse(result.rows[0].data),
      updatedAt: result.rows[0].updated_at,
    });
  } catch (err) {
    console.error("[resume-data] GET error:", err);
    res.status(500).json({ error: "Failed to load resume data" });
  }
});

router.put("/resume", async (req, res): Promise<void> => {
  const key = req.headers["x-admin-key"];

  // Allow direct password or active session token
  let authorized = key === ADMIN_KEY;

  if (!authorized) {
    try {
      const sessionRes = await pool.query(
        `SELECT id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()`,
        [key]
      );
      authorized = sessionRes.rows.length > 0;
    } catch {
      // session check failed — fall through to 401
    }
  }

  if (!authorized) {
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

    const existing = await pool.query(
      `SELECT id FROM resume_data ORDER BY updated_at DESC LIMIT 1`
    );

    let updatedAt: string;

    if (existing.rows.length === 0) {
      const ins = await pool.query(
        `INSERT INTO resume_data (data) VALUES ($1) RETURNING updated_at`,
        [dataStr]
      );
      updatedAt = ins.rows[0].updated_at;
    } else {
      const upd = await pool.query(
        `UPDATE resume_data SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING updated_at`,
        [dataStr, existing.rows[0].id]
      );
      updatedAt = upd.rows[0].updated_at;
    }

    res.json({ success: true, updatedAt });
  } catch (err) {
    console.error("[resume-data] PUT error:", err);
    res.status(500).json({ error: "Failed to save resume data" });
  }
});

export default router;
