import { Router, Request, Response, NextFunction } from "express";
import { NewsController } from "../controllers/news.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { publishNewsSchema } from "../validators/news.validator";
import { createImageUploader, handleUploadErrors } from "../middleware/upload";

const router = Router();
const controller = new NewsController();
const newsImageUploader = createImageUploader("news");

router.get("/", controller.getArticles);
router.get("/admin/all", authenticate, requireRole("ADMIN"), controller.getAllAdmin);

router.post(
  "/admin/upload-image",
  authenticate,
  requireRole("ADMIN"),
  handleUploadErrors(newsImageUploader.single("image")),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: "Please select an image file to upload" });
    }
    const imageUrl = `/uploads/news/${req.file.filename}`;
    return res.status(201).json({
      message: "Cover image uploaded",
      data: { imageUrl },
    });
  }
);

router.post(
  "/admin/save",
  authenticate,
  requireRole("ADMIN"),
  handleUploadErrors(newsImageUploader.single("image")),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.file) {
      req.body.imageUrl = `/uploads/news/${req.file.filename}`;
    }
    next();
  },
  controller.adminSave
);
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
