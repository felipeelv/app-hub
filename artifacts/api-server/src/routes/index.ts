import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import requesterRouter from "./requester.js";
import providerRouter from "./provider.js";
import adminRouter from "./admin.js";
import notificationsRouter from "./notifications.js";
import agendaRouter from "./agenda.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/requester", requesterRouter);
router.use("/provider", providerRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationsRouter);
router.use("/agenda", agendaRouter);

export default router;
