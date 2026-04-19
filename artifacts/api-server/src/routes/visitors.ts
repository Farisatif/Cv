import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { GetVisitorCountResponse, TrackVisitResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureVisitorRow() {
  const result = await pool.query(`SELECT id, count FROM visitors LIMIT 1`);
  if (result.rows.length === 0) {
    const inserted = await pool.query(
      `INSERT INTO visitors (count) VALUES (0) RETURNING id, count`
    );
    return inserted.rows[0];
  }
  return result.rows[0];
}

router.get("/visitors", async (req, res): Promise<void> => {
  try {
    const row = await ensureVisitorRow();
    res.json(GetVisitorCountResponse.parse({ count: row.count }));
  } catch (err) {
    console.error("[visitors] GET error:", err);
    res.status(500).json({ error: "Failed to get visitors" });
  }
});

router.post("/visitors", async (req, res): Promise<void> => {
  try {
    const row = await ensureVisitorRow();
    const updated = await pool.query(
      `UPDATE visitors SET count = count + 1 WHERE id = $1 RETURNING id, count`,
      [row.id]
    );
    res.json(TrackVisitResponse.parse({ count: updated.rows[0].count }));
  } catch (err) {
    console.error("[visitors] POST error:", err);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

export default router;
