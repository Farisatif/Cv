import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { GetVisitorCountResponse, TrackVisitResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureVisitorRow(): Promise<{ id: number; count: number }> {
  const { data } = await supabase.from("visitors").select("id, count").limit(1);
  if (data && data.length > 0) return data[0];

  const { data: inserted, error } = await supabase
    .from("visitors")
    .insert({ count: 0 })
    .select("id, count")
    .single();
  if (error) throw error;
  return inserted;
}

router.get("/visitors", async (req, res): Promise<void> => {
  try {
    const row = await ensureVisitorRow();
    res.json(GetVisitorCountResponse.parse({ count: row.count }));
  } catch (err) {
    console.warn("[visitors] GET fallback:", (err as Error).message);
    res.json(GetVisitorCountResponse.parse({ count: 0 }));
  }
});

router.post("/visitors", async (req, res): Promise<void> => {
  try {
    const row = await ensureVisitorRow();
    const { data: updated, error } = await supabase
      .from("visitors")
      .update({ count: row.count + 1 })
      .eq("id", row.id)
      .select("id, count")
      .single();
    if (error) throw error;
    res.json(TrackVisitResponse.parse({ count: updated.count }));
  } catch (err) {
    console.warn("[visitors] POST fallback:", (err as Error).message);
    res.json(TrackVisitResponse.parse({ count: 0 }));
  }
});

export default router;
