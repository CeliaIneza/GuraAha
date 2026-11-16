import { Router } from "express";
import { SettingController } from "../controllers/setting.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { upsertSettingSchema } from "../validators/setting.validator";

const router = Router();
const settingController = new SettingController();

router.get("/public", settingController.getPublic);

router.get("/", authenticate, requireRole("ADMIN"), settingController.getAll);
router.get("/:key", authenticate, requireRole("ADMIN"), settingController.getByKey);
router.put(
    "/:key",
    authenticate,
    requireRole("ADMIN"),
    validate(upsertSettingSchema),
    settingController.upsert
);
router.delete("/:key", authenticate, requireRole("ADMIN"), settingController.delete);

export default router;
