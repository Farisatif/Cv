import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import {
  ListCommentsResponse,
  CreateCommentBody,
  LikeCommentParams,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "Zoom100*";
const ADMIN_EMAIL = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "farisatif7780@gmail.com";
const APP_BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : (process.env.APP_BASE_URL || "https://cv-resume.replit.app");

async function isAuthorized(req: import("express").Request): Promise<boolean> {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  if (adminKey === ADMIN_KEY) return true;

  const sessionToken = req.headers["x-session-token"] as string | undefined;
  if (sessionToken) {
    try {
      const { data } = await supabase
        .from("admin_sessions")
        .select("id")
        .eq("session_token", sessionToken)
        .gt("expires_at", new Date().toISOString())
        .limit(1);
      if (data && data.length > 0) return true;
    } catch { /* fall through */ }
  }
  return false;
}

function createTransporter() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

async function sendApprovalEmail(comment: { id: number; name: string; message: string }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("[Email] No transporter configured — skipping notification");
    return;
  }

  const approveToken = randomBytes(32).toString("hex");
  const rejectToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("comment_tokens").insert([
    { comment_id: comment.id, token: approveToken, action: "approve", expires_at: expiresAt },
    { comment_id: comment.id, token: rejectToken, action: "reject", expires_at: expiresAt },
  ]);

  const approveUrl = `${APP_BASE_URL}/api/comments/moderate?token=${approveToken}&action=approve`;
  const rejectUrl = `${APP_BASE_URL}/api/comments/moderate?token=${rejectToken}&action=reject`;

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.header{background:#000;color:white;padding:24px;text-align:center}
.header h1{margin:0;font-size:20px}
.body{padding:28px}
.comment-box{background:#f8f8f8;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:20px 0}
.meta{color:#666;font-size:13px;margin-bottom:8px}
.message{font-size:15px;line-height:1.6;color:#333}
.buttons{display:flex;gap:12px;margin-top:28px;justify-content:center}
.btn{display:inline-block;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px}
.approve{background:#16a34a;color:white}
.reject{background:#dc2626;color:white}
.footer{text-align:center;padding:16px;color:#999;font-size:12px;border-top:1px solid #eee}</style>
</head><body>
<div class="container">
<div class="header"><h1>تعليق جديد يحتاج موافقة</h1></div>
<div class="body">
<p>تم استقبال تعليق جديد على ملفك الشخصي ويحتاج إلى موافقتك.</p>
<div class="comment-box">
<div class="meta">الاسم: <strong>${comment.name}</strong></div>
<div class="message">${comment.message}</div>
</div>
<div class="buttons">
<a href="${approveUrl}" class="btn approve">✓ قبول التعليق</a>
<a href="${rejectUrl}" class="btn reject">✗ رفض التعليق</a>
</div>
<p style="color:#999;font-size:12px;margin-top:20px;text-align:center">تنتهي صلاحية هذا الرابط بعد 7 أيام</p>
</div>
<div class="footer">CV Admin — ${ADMIN_EMAIL}</div>
</div></body></html>`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER || process.env.SMTP_USER || ADMIN_EMAIL,
    to: ADMIN_EMAIL,
    subject: `تعليق جديد من ${comment.name} — يحتاج موافقة`,
    html,
  });
}

router.get("/comments", async (req, res): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id, name, message, likes, approved, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[comments] GET warning:", error.message);
      res.json(ListCommentsResponse.parse([]));
      return;
    }

    const rows = (data ?? []).map((r) => ({
      ...r,
      createdAt: r.created_at,
    }));

    res.json(ListCommentsResponse.parse(rows));
  } catch (err) {
    console.warn("[comments] GET fallback:", (err as Error).message);
    res.json(ListCommentsResponse.parse([]));
  }
});

router.get("/comments/all", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id, name, message, likes, approved, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json((data ?? []).map((r) => ({ ...r, createdAt: r.created_at })));
  } catch (err) {
    console.error("[comments] GET all error:", err);
    res.status(500).json({ error: "Failed to load comments" });
  }
});

router.post("/comments", async (req, res): Promise<void> => {
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const name = parsed.data.name?.trim();
  const message = parsed.data.message?.trim();
  if (!name || !message) { res.status(400).json({ error: "Name and message are required" }); return; }

  try {
    const { data, error } = await supabase
      .from("comments")
      .insert({ name, message, likes: 0, approved: false })
      .select("id, name, message, likes, approved, created_at")
      .single();

    if (error) throw error;

    try {
      await sendApprovalEmail({ id: data.id, name: data.name, message: data.message });
    } catch (emailErr) {
      console.error("[Email] Failed to send approval email:", emailErr);
    }

    res.status(201).json({ ...data, createdAt: data.created_at, pending: true });
  } catch (err) {
    console.error("[comments] POST error:", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

router.get("/comments/moderate", async (req, res): Promise<void> => {
  const { token, action } = req.query as { token?: string; action?: string };
  if (!token || !action) { res.status(400).send("<h2>رابط غير صحيح</h2>"); return; }

  try {
    const { data: tokens } = await supabase
      .from("comment_tokens")
      .select("*")
      .eq("token", token)
      .eq("action", action)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (!tokens || tokens.length === 0) {
      res.status(404).send(`<!DOCTYPE html><html dir="rtl"><body style="font-family:Arial;text-align:center;padding:40px"><h2>❌ الرابط غير صحيح أو منتهي الصلاحية</h2></body></html>`);
      return;
    }

    const tokenRow = tokens[0];
    if (tokenRow.used_at) {
      res.send(`<!DOCTYPE html><html dir="rtl"><body style="font-family:Arial;text-align:center;padding:40px"><h2>ℹ️ تم استخدام هذا الرابط مسبقاً</h2></body></html>`);
      return;
    }

    if (action === "approve") {
      await supabase.from("comments").update({ approved: true }).eq("id", tokenRow.comment_id);
    } else if (action === "reject") {
      await supabase.from("comments").delete().eq("id", tokenRow.comment_id);
    }

    await supabase.from("comment_tokens").update({ used_at: new Date().toISOString() }).eq("id", tokenRow.id);

    const successHtml = action === "approve"
      ? `<h2>✅ تم قبول التعليق بنجاح</h2><p>سيظهر التعليق الآن على الموقع.</p>`
      : `<h2>🗑️ تم حذف التعليق بنجاح</h2><p>لن يظهر هذا التعليق على الموقع.</p>`;

    res.send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تأكيد</title>
<style>body{font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:white;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1)}
.btn{display:inline-block;margin-top:20px;padding:12px 28px;background:#000;color:white;border-radius:8px;text-decoration:none;font-size:15px}</style>
</head><body><div class="card">${successHtml}<a href="${APP_BASE_URL}" class="btn">← العودة للموقع</a></div></body></html>`);
  } catch (err) {
    console.error("[moderate] Error:", err);
    res.status(500).send("<h2>حدث خطأ</h2>");
  }
});

router.post("/comments/:id/approve", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const { data, error } = await supabase
      .from("comments")
      .update({ approved: true })
      .eq("id", id)
      .select("id, name, message, likes, approved, created_at")
      .single();
    if (error || !data) { res.status(404).json({ error: "Comment not found" }); return; }
    res.json({ ...data, createdAt: data.created_at });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve comment" });
  }
});

router.delete("/comments/:id", async (req, res): Promise<void> => {
  if (!(await isAuthorized(req))) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await supabase.from("comments").delete().eq("id", id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

router.post("/comments/:id/like", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = LikeCommentParams.safeParse({ id: rawId });
  if (!parsed.success) { res.status(400).json({ error: "Invalid comment ID" }); return; }

  try {
    const { data: existing } = await supabase
      .from("comments")
      .select("id, likes")
      .eq("id", parsed.data.id)
      .eq("approved", true)
      .limit(1);

    if (!existing || existing.length === 0) { res.status(404).json({ error: "Comment not found" }); return; }

    const { data: updated, error } = await supabase
      .from("comments")
      .update({ likes: existing[0].likes + 1 })
      .eq("id", parsed.data.id)
      .select("id, name, message, likes, approved, created_at")
      .single();

    if (error || !updated) throw error;
    res.json({ ...updated, createdAt: updated.created_at });
  } catch (err) {
    res.status(500).json({ error: "Failed to like comment" });
  }
});

export default router;
