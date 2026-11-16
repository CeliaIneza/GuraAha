import { AlertSubscriptionRepository, UpsertAlertSubscriptionInput, AlertSubscriptionRow } from "../repositories/alert-subscription.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { SmsNotificationService } from "./sms.service";

export class AlertSubscriptionService {
  constructor(
    private readonly alertSubscriptionRepository: AlertSubscriptionRepository = new AlertSubscriptionRepository(),
    private readonly notificationRepository: NotificationRepository = new NotificationRepository(),
    private readonly smsService: SmsNotificationService = new SmsNotificationService()
  ) {}

  async subscribe(input: UpsertAlertSubscriptionInput): Promise<AlertSubscriptionRow> {
    const subscription = await this.alertSubscriptionRepository.upsert({
      userId: input.userId,
      phone: input.phone,
      topics: input.topics && input.topics.length > 0 ? input.topics : ['Land & plots', 'Construction', 'Auctions', 'VIP deals'],
      districts: input.districts,
      channels: input.channels && input.channels.length > 0 ? input.channels : ['IN_APP', 'SMS'],
    });

    // 1. Dispatch confirmation SMS
    const welcomeMsg = `[GuraAha Alerts] You are now subscribed to deal & market alerts for: ${subscription.topics.join(', ')}. Reply STOP to opt out.`;
    await this.smsService.sendSms(input.phone, welcomeMsg);

    // 2. In-app notification if logged-in user
    if (input.userId) {
      await this.notificationRepository.create({
        userId: input.userId,
        icon: '✅',
        title: 'Alerts switched on',
        summary: `You will receive updates for ${subscription.topics.slice(0, 3).join(', ')} in selected districts.`,
        actionType: 'CUSTOM',
      });
    }

    return subscription;
  }

  async getByPhone(phone: string): Promise<AlertSubscriptionRow | null> {
    return this.alertSubscriptionRepository.findByPhone(phone);
  }

  async getByUserId(userId: string): Promise<AlertSubscriptionRow | null> {
    return this.alertSubscriptionRepository.findByUserId(userId);
  }

  async unsubscribe(phone: string): Promise<boolean> {
    return this.alertSubscriptionRepository.deactivate(phone);
  }
}
