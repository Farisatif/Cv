import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey === ADMIN_KEY) return true;

  const sessionToken = req.headers["x-session-token"] as string | undefined;
  if (sessionToken) {
    try {
      const result = await pool.query(
        `SELECT expires_at FROM admin_sessions WHERE session_token = $1 LIMIT 1`,
        [sessionToken]
      );
      if (result.rows.length > 0 && new Date(result.rows[0].expires_at) > new Date()) {
        return true;
      }
    } catch {
      // fall through
    }
  }
  return false;
}

// ── Admin stats endpoint ────────────────────────────────────────────────────
router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [visitors, totalComments, pendingComments, approved, resumeData, dbTime] = await Promise.all([
      pool.query(`SELECT count FROM visitors LIMIT 1`),
      pool.query(`SELECT COUNT(*) AS total FROM comments`),
      pool.query(`SELECT COUNT(*) AS pending FROM comments WHERE approved = false`),
      pool.query(`SELECT COUNT(*) AS approved FROM comments WHERE approved = true`),
      pool.query(`SELECT updated_at FROM resume_data ORDER BY updated_at DESC LIMIT 1`),
      pool.query(`SELECT NOW() AS time`),
    ]);

    res.json({
      visitors: visitors.rows[0]?.count ?? 0,
      totalComments: parseInt(totalComments.rows[0]?.total ?? "0"),
      pendingComments: parseInt(pendingComments.rows[0]?.pending ?? "0"),
      approvedComments: parseInt(approved.rows[0]?.approved ?? "0"),
      resumeLastSaved: resumeData.rows[0]?.updated_at ?? null,
      dbStatus: "ok",
      serverTime: dbTime.rows[0]?.time ?? null,
    });
  } catch (err) {
    console.error("[admin/stats] error:", err);
    res.status(500).json({ error: "Failed to load stats", dbStatus: "error" });
  }
});

export default router;
