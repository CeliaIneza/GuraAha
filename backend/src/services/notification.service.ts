import { NotificationRepository, CreateNotificationInput, NotificationRow } from "../repositories/notification.repository";
import { AlertSubscriptionRepository } from "../repositories/alert-subscription.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { EmailService } from "./email.service";

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository = new NotificationRepository(),
    private readonly alertSubscriptionRepository: AlertSubscriptionRepository = new AlertSubscriptionRepository(),
    private readonly subscriptionRepository: SubscriptionRepository = new SubscriptionRepository(),
    private readonly emailService: EmailService = new EmailService()
  ) {}

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<NotificationRow[]> {
    return this.notificationRepository.findByUserId(userId, limit, offset);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    return this.notificationRepository.markAsRead(userId, notificationId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async pushNotification(input: CreateNotificationInput): Promise<NotificationRow> {
    return this.notificationRepository.create(input);
  }

  async fanOutVipDealAlert(deal: {
    listingId: string;
    title: string;
    district?: string;
    discountPercent?: number;
    priceRwf: number;
    daysLeft?: number;
  }): Promise<{ notificationsSent: number; emailsSent: number }> {
    const summary = `${deal.title} is listed ${deal.discountPercent ? `${deal.discountPercent}% below market` : 'at exclusive VIP pricing'}. Early access for ${deal.daysLeft ?? 7} days.`;

    // 1. In-app notification for VIP members
    await this.notificationRepository.create({
      userId: null,
      icon: '⭐',
      title: `New VIP Deal${deal.district ? ` in ${deal.district}` : ''}`,
      summary,
      actionType: 'VIP_DEAL',
      actionId: deal.listingId,
    });

    // 2. Dispatches email to matching alert subscribers
    const subscribers = await this.alertSubscriptionRepository.findMatchingSubscribers(
      'VIP deals',
      deal.district ? [deal.district] : undefined
    );

    const emailRecipients = subscribers
      .map((s) => s.email)
      .filter((e): e is string => Boolean(e));

    if (emailRecipients.length > 0) {
      const title = `New VIP Deal${deal.district ? ` in ${deal.district}` : ''}: ${deal.title}`;
      const emailBody = `${deal.title} (${deal.priceRwf.toLocaleString()} RWF) is now available in the VIP Room. ${summary}`;
      await this.emailService.sendBulkAlertEmails(emailRecipients, `[GuraAha VIP] ${title}`, title, emailBody);
    }

    return {
      notificationsSent: 1,
      emailsSent: emailRecipients.length,
    };
  }
}
