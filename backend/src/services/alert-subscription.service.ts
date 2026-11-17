import { AlertSubscriptionRepository, UpsertAlertSubscriptionInput, AlertSubscriptionRow } from "../repositories/alert-subscription.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { UserRepository } from "../repositories/user.repository";
import { EmailService } from "./email.service";

export class AlertSubscriptionService {
  constructor(
    private readonly alertSubscriptionRepository: AlertSubscriptionRepository = new AlertSubscriptionRepository(),
    private readonly notificationRepository: NotificationRepository = new NotificationRepository(),
    private readonly emailService: EmailService = new EmailService(),
    private readonly userRepository: UserRepository = new UserRepository()
  ) {}

  async subscribe(input: UpsertAlertSubscriptionInput): Promise<AlertSubscriptionRow> {
    let email = input.email ?? null;
    if (!email && input.userId) {
      const user = await this.userRepository.findById(input.userId);
      email = user?.email ?? null;
    }

    const subscription = await this.alertSubscriptionRepository.upsert({
      userId: input.userId,
      phone: input.phone,
      email,
      topics: input.topics && input.topics.length > 0 ? input.topics : ['Land & plots', 'Construction', 'Auctions', 'VIP deals'],
      districts: input.districts,
      channels: input.channels && input.channels.length > 0 ? input.channels : ['IN_APP', 'EMAIL'],
    });

    // 1. Dispatch confirmation email
    if (email) {
      const summary = `You are now subscribed to deal & market alerts for: ${subscription.topics.join(', ')}.`;
      await this.emailService.sendAlertEmail(
        email,
        'GuraAha – Deal & Market Alerts Activated',
        'Alerts Switched On',
        summary
      );
    }

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
