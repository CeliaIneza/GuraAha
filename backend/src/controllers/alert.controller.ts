import { Request, Response } from "express";
import { AlertSubscriptionService } from "../services/alert-subscription.service";

export class AlertController {
  constructor(private readonly alertService: AlertSubscriptionService = new AlertSubscriptionService()) {}

  subscribe = async (req: Request, res: Response) => {
    try {
      const userId = req.user ? req.user.id : undefined;
      const subscription = await this.alertService.subscribe({
        userId,
        phone: req.body.phone,
        topics: req.body.topics,
        districts: req.body.districts,
        channels: req.body.channels,
      });

      return res.status(200).json({
        message: "Successfully subscribed to alerts",
        data: subscription,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to subscribe to alerts",
      });
    }
  };

  getMyPreferences = async (req: Request, res: Response) => {
    try {
      const preferences = await this.alertService.getByUserId(req.user.id);
      return res.status(200).json({ data: preferences });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve alert preferences",
      });
    }
  };

  unsubscribe = async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      await this.alertService.unsubscribe(phone);
      return res.status(200).json({ message: "Successfully unsubscribed from alerts" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to unsubscribe from alerts",
      });
    }
  };
}
