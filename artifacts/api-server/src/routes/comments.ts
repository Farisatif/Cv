import { Router, type IRouter } from "express";
import { db, commentsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  ListCommentsResponse,
  CreateCommentBody,
  LikeCommentParams,
  LikeCommentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/comments", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(commentsTable)
    .orderBy(desc(commentsTable.createdAt));
  res.json(
    ListCommentsResponse.parse(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    )
  );
});

router.post("/comments", async (req, res): Promise<void> => {
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name?.trim();
  const message = parsed.data.message?.trim();

  if (!name || !message) {
    res.status(400).json({ error: "Name and message are required" });
    return;
  }

  const [row] = await db
    .insert(commentsTable)
    .values({ name, message, likes: 0 })
    .returning();

  res.status(201).json({
    ...row,
    createdAt: row.createdAt.toISOString(),
  });
});

router.post("/comments/:id/like", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = LikeCommentParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid comment ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  const [updated] = await db
    .update(commentsTable)
    .set({ likes: existing.likes + 1 })
    .where(eq(commentsTable.id, parsed.data.id))
    .returning();

  res.json(
    LikeCommentResponse.parse({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    })
  );
});

export default router;
