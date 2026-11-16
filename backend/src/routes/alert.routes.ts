import { Router } from "express";
import { AlertController } from "../controllers/alert.controller";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { subscribeAlertsSchema } from "../validators/news.validator";

const router = Router();
const controller = new AlertController();

router.post("/subscribe", optionalAuthenticate, validate(subscribeAlertsSchema), controller.subscribe);
router.get("/me", authenticate, controller.getMyPreferences);
router.post("/unsubscribe", controller.unsubscribe);

export default router;
