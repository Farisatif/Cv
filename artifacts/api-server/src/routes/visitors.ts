import { Router, type IRouter } from "express";
import { db, visitorsTable } from "@workspace/db";
import { GetVisitorCountResponse, TrackVisitResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function ensureVisitorRow() {
  const [existing] = await db.select().from(visitorsTable).limit(1);
  if (!existing) {
    const [row] = await db.insert(visitorsTable).values({ count: 0 }).returning();
    return row;
  }
  return existing;
}

router.get("/visitors", async (req, res): Promise<void> => {
  const row = await ensureVisitorRow();
  res.json(GetVisitorCountResponse.parse({ count: row.count }));
});

router.post("/visitors", async (req, res): Promise<void> => {
  const row = await ensureVisitorRow();
  const [updated] = await db
    .update(visitorsTable)
    .set({ count: row.count + 1 })
    .where(eq(visitorsTable.id, row.id))
    .returning();
  res.json(TrackVisitResponse.parse({ count: updated.count }));
});

export default router;
