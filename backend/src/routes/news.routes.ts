import { Router } from "express";
import { NewsController } from "../controllers/news.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { publishNewsSchema } from "../validators/news.validator";

const router = Router();
const controller = new NewsController();

router.get("/", controller.getArticles);
router.get("/admin/all", authenticate, requireRole("ADMIN"), controller.getAllAdmin);
router.post("/admin/save", authenticate, requireRole("ADMIN"), controller.adminSave);
router.post(
  "/admin/publish",
  authenticate,
  requireRole("ADMIN"),
  validate(publishNewsSchema),
  controller.adminPublish
);

router.get("/:id", controller.getArticle);
router.patch("/:id/toggle-publish", authenticate, requireRole("ADMIN"), controller.togglePublish);
router.post("/:id/push", authenticate, requireRole("ADMIN"), controller.pushArticle);
router.delete("/:id", authenticate, requireRole("ADMIN"), controller.deleteArticle);

export default router;
