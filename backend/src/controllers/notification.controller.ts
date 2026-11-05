import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";

export class NotificationController {
  constructor(private readonly notificationService: NotificationService = new NotificationService()) {}

  getMine = async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
      const limit = req.query.limit ? Math.min(50, Math.max(1, Number(req.query.limit))) : 20;
      const offset = (page - 1) * limit;

      const [notifications, unreadCount] = await Promise.all([
        this.notificationService.getUserNotifications(req.user.id, limit, offset),
        this.notificationService.getUnreadCount(req.user.id),
      ]);

      return res.status(200).json({
        data: notifications,
        unreadCount,
        pagination: { page, limit },
      });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve notifications",
      });
    }
  };

  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const count = await this.notificationService.getUnreadCount(req.user.id);
      return res.status(200).json({ data: { unreadCount: count } });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve unread count",
      });
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const success = await this.notificationService.markAsRead(req.user.id, String(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      return res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to mark notification as read",
      });
    }
  };

  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const count = await this.notificationService.markAllAsRead(req.user.id);
      return res.status(200).json({
        message: `Marked ${count} notifications as read`,
        data: { markedCount: count },
      });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to mark all as read",
      });
    }
  };
}
