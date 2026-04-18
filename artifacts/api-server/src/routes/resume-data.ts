import { Router, type IRouter } from "express";
import { db, resumeDataTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_KEY = "Zoom100*";

router.get("/resume", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(resumeDataTable)
      .orderBy(desc(resumeDataTable.updatedAt))
      .limit(1);

    if (rows.length === 0) {
      res.json({ data: null });
      return;
    }

    res.json({ data: JSON.parse(rows[0].data) });
  } catch (err) {
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

    const existing = await db
      .select()
      .from(resumeDataTable)
      .orderBy(desc(resumeDataTable.updatedAt))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(resumeDataTable).values({ data: dataStr });
    } else {
      await db
        .update(resumeDataTable)
        .set({ data: dataStr, updatedAt: new Date() });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save resume data" });
  }
});

export default router;
