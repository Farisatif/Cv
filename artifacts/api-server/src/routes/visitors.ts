import { Router, type IRouter } from "express";
import pool from "../lib/db";
import { GetVisitorCountResponse, TrackVisitResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/visitors", async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query("SELECT id, count FROM visitors LIMIT 1");
    const count = rows.length > 0 ? rows[0].count : 0;
    res.json(GetVisitorCountResponse.parse({ count }));
  } catch (err) {
    console.warn("[visitors] GET error:", (err as Error).message);
    res.json(GetVisitorCountResponse.parse({ count: 0 }));
  }
});

router.post("/visitors", async (req, res): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "UPDATE visitors SET count = count + 1 RETURNING id, count"
    );
    const count = rows.length > 0 ? rows[0].count : 0;
    res.json(TrackVisitResponse.parse({ count }));
  } catch (err) {
    console.warn("[visitors] POST error:", (err as Error).message);
    res.json(TrackVisitResponse.parse({ count: 0 }));
  }
});

export default router;
