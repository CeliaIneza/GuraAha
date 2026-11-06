import { Router } from "express";
import { NewsController } from "../controllers/news.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { publishNewsSchema } from "../validators/news.validator";

const router = Router();
const controller = new NewsController();

router.get("/", controller.getArticles);
router.get("/:id", controller.getArticle);

router.post(
  "/admin/publish",
  authenticate,
  requireRole("ADMIN"),
  validate(publishNewsSchema),
  controller.adminPublish
);

export default router;
