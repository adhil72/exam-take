import { Router } from "express";
import examRoutes from "./exam.route";
import studentRoutes from "./student.route";
import clientRoutes from "./client.route";
import sessionRoutes from "./session.route";

const router = Router();

router.use("/", examRoutes);
router.use("/", studentRoutes);
router.use("/", clientRoutes);
router.use("/", sessionRoutes);

export default router;
