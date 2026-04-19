import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitorsRouter from "./visitors";
import commentsRouter from "./comments";
import resumeDataRouter from "./resume-data";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitorsRouter);
router.use(commentsRouter);
router.use(resumeDataRouter);
router.use(authRouter);
router.use(adminRouter);

export default router;
