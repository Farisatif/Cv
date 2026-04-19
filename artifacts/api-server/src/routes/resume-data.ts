import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

router.get("/resume", async (req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT data FROM resume_data ORDER BY updated_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      res.json({ data: null });
      return;
    }

    res.json({ data: JSON.parse(result.rows[0].data) });
  } catch (err) {
    console.error("[resume-data] GET error:", err);
    res.status(500).json({ error: "Failed to load resume data" });
  }
});

router.put("/resume", async (req, res): Promise<void> => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
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

    if (existing.rows.length === 0) {
      await pool.query(`INSERT INTO resume_data (data) VALUES ($1)`, [dataStr]);
    } else {
      await pool.query(
        `UPDATE resume_data SET data = $1, updated_at = NOW() WHERE id = $2`,
        [dataStr, existing.rows[0].id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[resume-data] PUT error:", err);
    res.status(500).json({ error: "Failed to save resume data" });
  }
});

export default router;
