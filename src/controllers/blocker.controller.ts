import { Request, Response } from "express";
import {
  BlockerService,
  ApplyForBlockerInput,
} from "../services/blocker.service";

export class BlockerController {
  constructor(private readonly blockerService: BlockerService) {}

  apply = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const {
        nationalId,
        operatingLocationId,
        verificationCode,
        agreementDocumentPath,
      } = req.body;

      if (!nationalId) {
        return res.status(400).json({
          message: "National ID is required",
        });
      }

      const input: ApplyForBlockerInput = {
        userId,
        nationalId,
        operatingLocationId,
        verificationCode,
        agreementDocumentPath,
      };

      const application = await this.blockerService.apply(input);

      return res.status(201).json({
        message: "Blocker application submitted successfully",
        data: application,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit blocker application",
      });
    }
  };

  getApplication = async (req: Request, res: Response) => {
    try {
      const application = await this.blockerService.getApplicationById(
        req.params.id,
      );

      return res.status(200).json({
        data: application,
      });
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Blocker application not found",
      });
    }
  };

  getPendingApplications = async (_req: Request, res: Response) => {
    try {
      const applications = await this.blockerService.getPendingApplications();

      return res.status(200).json({
        data: applications,
      });
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve applications",
      });
    }
  };
}
