import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitorsRouter from "./visitors";
import commentsRouter from "./comments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitorsRouter);
router.use(commentsRouter);

export default router;
