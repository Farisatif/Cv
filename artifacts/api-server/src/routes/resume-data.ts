import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const key = req.headers["x-admin-key"] || req.headers["x-session-token"];
  if (key === ADMIN_KEY) return true;
  if (key && typeof key === "string") {
    try {
      const { data } = await supabase
        .from("admin_sessions")
        .select("id")
        .eq("session_token", key)
        .gt("expires_at", new Date().toISOString())
        .limit(1);
      if (data && data.length > 0) return true;
    } catch { /* DB not initialized, fall through */ }
  }
  return false;
}

router.get("/resume", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("resume_data")
      .select("data, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      // Gracefully handle missing tables — site falls back to static defaults
      console.warn("[resume-data] GET warning:", error.message);
      res.json({ data: null, updatedAt: null });
      return;
    }

    if (!data || data.length === 0) {
      res.json({ data: null, updatedAt: null });
      return;
    }

    res.json({
      data: JSON.parse(data[0].data),
      updatedAt: data[0].updated_at,
    });
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

    const { data: existing, error: selectError } = await supabase
      .from("resume_data")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1);

    // Table not initialized — return a clear, actionable error
    if (selectError) {
      console.warn("[resume-data] PUT: table not ready:", selectError.message);
      res.status(503).json({
        error: "Database not initialized",
        hint: "Run supabase-migrations.sql in your Supabase SQL Editor to create the required tables.",
        dbNotReady: true,
      });
      return;
    }

    let updatedAt: string = now;

    if (existing && existing.length > 0) {
      const { data: updated, error } = await supabase
        .from("resume_data")
        .update({ data: dataStr, updated_at: now })
        .eq("id", existing[0].id)
        .select("updated_at")
        .single();
      if (error) throw error;
      updatedAt = updated?.updated_at ?? now;
    } else {
      const { data: inserted, error } = await supabase
        .from("resume_data")
        .insert({ data: dataStr, updated_at: now })
        .select("updated_at")
        .single();
      if (error) throw error;
      updatedAt = inserted?.updated_at ?? now;
    }

    res.json({ success: true, updatedAt });
  } catch (err) {
    console.error("[resume-data] PUT error:", err);
    res.status(500).json({ error: "Failed to save resume data" });
  }
});

export default router;
