import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wardsRouter from "./wards";
import attributionRouter from "./attribution";
import forecastRouter from "./forecast";
import enforcementRouter from "./enforcement";
import advisoriesRouter from "./advisories";
import compareRouter from "./compare";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wardsRouter);
router.use(attributionRouter);
router.use(forecastRouter);
router.use(enforcementRouter);
router.use(advisoriesRouter);
router.use(compareRouter);
router.use(chatRouter);

export default router;
