import { Router, type IRouter } from "express";
import pool from "../lib/db";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey === ADMIN_KEY) return true;
  const sessionToken = req.headers["x-session-token"] as string | undefined;
  if (!sessionToken) return false;
  if (sessionToken === ADMIN_KEY) return true;
  try {
    const { rows } = await pool.query(
      "SELECT id FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW() LIMIT 1",
      [sessionToken]
    );
    return rows.length > 0;
  } catch { return false; }
}

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [visitors, total, pending, approved, resumeRow] = await Promise.all([
      pool.query("SELECT count FROM visitors LIMIT 1"),
      pool.query("SELECT COUNT(*) AS c FROM comments"),
      pool.query("SELECT COUNT(*) AS c FROM comments WHERE approved = false"),
      pool.query("SELECT COUNT(*) AS c FROM comments WHERE approved = true"),
      pool.query("SELECT updated_at FROM resume_data ORDER BY updated_at DESC LIMIT 1"),
    ]);

    res.json({
      visitors: visitors.rows[0]?.count ?? 0,
      totalComments: parseInt(total.rows[0]?.c ?? "0"),
      pendingComments: parseInt(pending.rows[0]?.c ?? "0"),
      approvedComments: parseInt(approved.rows[0]?.c ?? "0"),
      resumeLastSaved: resumeRow.rows[0]?.updated_at ?? null,
      dbStatus: "ok",
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/stats] Error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/admin/db-status", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }

  const tables = ["visitors", "comments", "resume_data", "admin_credentials", "admin_sessions", "comment_tokens"];
  const status: Record<string, boolean> = {};

  await Promise.all(
    tables.map(async (table) => {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        status[table] = true;
      } catch {
        status[table] = false;
      }
    })
  );

  const allReady = Object.values(status).every(Boolean);
  res.json({ ready: allReady, tables: status });
});

router.get("/admin/migration-sql", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send("-- Tables are now managed automatically via PostgreSQL (DATABASE_URL).\n-- No manual migration needed.");
});

export default router;
