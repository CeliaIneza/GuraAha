import { z } from "zod";

export const publishNewsSchema = z.object({
  topic: z.string().min(1).max(50),
  titleRw: z.string().max(255).optional().nullable(),
  titleEn: z.string().max(255).optional().nullable(),
  titleFr: z.string().max(255).optional().nullable(),
  summary: z.string().min(5),
  bodyRw: z.string().optional().nullable(),
  bodyEn: z.string().optional().nullable(),
  bodyFr: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  readTime: z.string().max(20).optional(),
  targetDistricts: z.array(z.string()).optional().nullable(),
  channels: z.array(z.enum(['IN_APP', 'SMS', 'WHATSAPP', 'NEWS_PAGE'])).optional(),
  audience: z.enum(['Everyone', 'Alert subscribers only', 'VIP subscribers only', 'Blockers only']).optional(),
}).refine((data) => Boolean(data.titleRw || data.titleEn || data.titleFr || data.summary), {
  message: "At least one title language or summary is required",
  path: ["titleEn"],
});

export type PublishNewsInput = z.infer<typeof publishNewsSchema>;

export const subscribeAlertsSchema = z.object({
  phone: z.string().min(8).max(20),
  topics: z.array(z.string()).min(1),
  districts: z.array(z.string()).optional().nullable(),
  channels: z.array(z.enum(['IN_APP', 'SMS', 'WHATSAPP'])).optional(),
});

export type SubscribeAlertsInput = z.infer<typeof subscribeAlertsSchema>;
