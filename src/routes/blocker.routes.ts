import { Router } from "express";
import { BlockerRepository } from "../repositories/blocker.repository";
import { UserRepository } from "../repositories/user.repository";
import { BlockerService } from "../services/blocker.service";
import { BlockerController } from "../controllers/blocker.controller";

const router = Router();


const blockerRepository = new BlockerRepository();
const userRepository = new UserRepository();

const blockerService = new BlockerService(
    blockerRepository,
    userRepository
);

const blockerController = new BlockerController(
    blockerService
);

router.post('/apply', blockerController.apply);

router.get('/applications/:id', blockerController.getApplication);

router.get('/applications', blockerController.getPendingApplications);

export default router;