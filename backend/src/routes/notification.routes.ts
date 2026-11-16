import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();
const controller = new NotificationController();

router.get("/", authenticate, controller.getMine);
router.get("/unread-count", authenticate, controller.getUnreadCount);
router.patch("/mark-all-read", authenticate, controller.markAllAsRead);
router.patch("/:id/read", authenticate, controller.markAsRead);

export default router;
