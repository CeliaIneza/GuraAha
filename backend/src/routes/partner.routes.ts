import { Router } from "express";
import { PartnerController } from "../controllers/partner.controller";
import { authenticate, optionalAuthenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createPartnerSchema, updatePartnerSchema } from "../validators/partner.validator";

const router = Router();
const partnerController = new PartnerController();

router.get("/", optionalAuthenticate, partnerController.list);
router.get("/:id", optionalAuthenticate, partnerController.getById);

router.post(
    "/",
    authenticate,
    requireRole("ADMIN"),
    validate(createPartnerSchema),
    partnerController.create
);

router.patch(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    validate(updatePartnerSchema),
    partnerController.update
);

router.delete(
    "/:id",
    authenticate,
    requireRole("ADMIN"),
    partnerController.delete
);

export default router;
