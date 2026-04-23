import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey === ADMIN_KEY) return true;

  const sessionToken = req.headers["x-session-token"] as string | undefined;
  if (!sessionToken) return false;

  // Offline mode: ADMIN_KEY is returned as static session token
  if (sessionToken === ADMIN_KEY) return true;

  try {
    const { data } = await supabase
      .from("admin_sessions")
      .select("id")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    if (data && data.length > 0) return true;
  } catch { /* fall through */ }
  return false;
}

// ── Admin stats endpoint ────────────────────────────────────────────────────
router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const results = await Promise.allSettled([
    supabase.from("visitors").select("count").limit(1),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("approved", false),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("approved", true),
    supabase.from("resume_data").select("updated_at").order("updated_at", { ascending: false }).limit(1),
  ]);

  const get = (r: PromiseSettledResult<any>, key: string) =>
    r.status === "fulfilled" ? r.value : { data: null, count: null, error: null };

  const [v, tc, pc, ac, rd] = results.map(get);
  const dbReady = results.every((r) => r.status === "fulfilled" && !r.value.error);

  res.json({
    visitors: v?.data?.[0]?.count ?? 0,
    totalComments: tc?.count ?? 0,
    pendingComments: pc?.count ?? 0,
    approvedComments: ac?.count ?? 0,
    resumeLastSaved: rd?.data?.[0]?.updated_at ?? null,
    dbStatus: dbReady ? "ok" : "not_initialized",
    serverTime: new Date().toISOString(),
  });
});

// ── DB readiness check ──────────────────────────────────────────────────────
router.get("/admin/db-status", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }

  const tables = ["visitors", "comments", "resume_data", "admin_credentials", "admin_sessions", "comment_tokens"];
  const status: Record<string, boolean> = {};

  await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
      status[table] = !error;
    })
  );

  const allReady = Object.values(status).every(Boolean);
  res.json({ ready: allReady, tables: status });
});

// ── Migration SQL ──────────────────────────────────────────────────────────
router.get("/admin/migration-sql", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const sqlPath = join(__dirname, "..", "supabase-migrations.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(sql);
  } catch {
    res.status(404).json({ error: "Migration file not found" });
  }
});

export default router;
