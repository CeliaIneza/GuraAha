import { NewsRepository, CreateNewsArticleInput, NewsArticleRow } from "../repositories/news.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { AlertSubscriptionRepository } from "../repositories/alert-subscription.repository";
import { SmsNotificationService } from "./sms.service";

export interface PublishAndNotifyInput {
  topic: string;
  titleRw?: string | null;
  titleEn?: string | null;
  titleFr?: string | null;
  summary: string;
  bodyRw?: string | null;
  bodyEn?: string | null;
  bodyFr?: string | null;
  imageUrl?: string | null;
  readTime?: string;
  targetDistricts?: string[] | null;
  channels?: string[]; // ['IN_APP', 'SMS', 'WHATSAPP', 'NEWS_PAGE']
  audience?: 'Everyone' | 'Alert subscribers only' | 'VIP subscribers only' | 'Blockers only';
}

export class NewsService {
  constructor(
    private readonly newsRepository: NewsRepository = new NewsRepository(),
    private readonly notificationRepository: NotificationRepository = new NotificationRepository(),
    private readonly alertSubscriptionRepository: AlertSubscriptionRepository = new AlertSubscriptionRepository(),
    private readonly smsService: SmsNotificationService = new SmsNotificationService()
  ) {}

  async getPublishedArticles(filters: { topic?: string; district?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
    const offset = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.newsRepository.findPublished({ topic: filters.topic, district: filters.district, limit, offset }),
      this.newsRepository.countPublished({ topic: filters.topic, district: filters.district }),
    ]);

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getArticleById(id: string): Promise<NewsArticleRow> {
    const article = await this.newsRepository.findById(id);
    if (!article || !article.is_published) {
      throw new Error(`Article not found`);
    }
    return article;
  }

  async adminPublishAndNotify(input: PublishAndNotifyInput): Promise<{
    article: NewsArticleRow;
    inAppNotified: boolean;
    smsRecipientsCount: number;
  }> {
    const article = await this.newsRepository.create({
      topic: input.topic,
      titleRw: input.titleRw,
      titleEn: input.titleEn,
      titleFr: input.titleFr,
      summary: input.summary,
      bodyRw: input.bodyRw,
      bodyEn: input.bodyEn,
      bodyFr: input.bodyFr,
      imageUrl: input.imageUrl,
      readTime: input.readTime ?? '3 min',
      targetDistricts: input.targetDistricts,
      isPublished: true,
    });

    const channels = input.channels ?? ['IN_APP', 'NEWS_PAGE'];
    let inAppNotified = false;
    let smsRecipientsCount = 0;

    if (channels.includes('IN_APP')) {
      const headline = input.titleEn || input.titleRw || input.titleFr || input.summary;
      let icon = '📰';
      if (input.topic.includes('VIP')) icon = '⭐';
      else if (input.topic.includes('Auction') || input.topic.includes('Cyamunara')) icon = '🔨';
      else if (input.topic.includes('Plot') || input.topic.includes('Land')) icon = '📍';

      await this.notificationRepository.create({
        userId: null,
        icon,
        title: headline,
        summary: input.summary,
        actionType: 'ARTICLE',
        actionId: article.id,
      });
      inAppNotified = true;
    }

    // 2. Outward SMS / WhatsApp fan-out to matching alert subscribers
    if (channels.includes('SMS') || channels.includes('WHATSAPP')) {
      const subscribers = await this.alertSubscriptionRepository.findMatchingSubscribers(
        input.topic,
        input.targetDistricts
      );

      const phoneNumbers = subscribers
        .filter((s) => s.channels.includes('SMS') || s.channels.includes('WHATSAPP'))
        .map((s) => s.phone);

      if (phoneNumbers.length > 0) {
        const headline = input.titleEn || input.titleRw || input.titleFr || 'GuraAha Update';
        const smsBody = `[GuraAha Alert] ${headline}: ${input.summary}`;
        await this.smsService.sendBulkSms(phoneNumbers, smsBody);
        smsRecipientsCount = phoneNumbers.length;
      }
    }

    return {
      article,
      inAppNotified,
      smsRecipientsCount,
    };
  }
}
