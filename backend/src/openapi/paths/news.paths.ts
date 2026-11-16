import { z } from "zod";
import { registry, bearerAuthSecurity } from "../registry";
import { dataResponseSchema, errorResponseSchema, messageOnlyResponseSchema, idParamSchema } from "../common.schemas";
import { publishNewsSchema } from "../../validators/news.validator";

export const newsArticleSchema = z.object({
  id: z.string().uuid(),
  topic: z.string(),
  title_rw: z.string().nullable().optional(),
  title_en: z.string().nullable().optional(),
  title_fr: z.string().nullable().optional(),
  summary: z.string(),
  body_rw: z.string().nullable().optional(),
  body_en: z.string().nullable().optional(),
  body_fr: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  read_time: z.string(),
  target_districts: z.array(z.string()).nullable().optional(),
  author_name: z.string(),
  is_published: z.boolean(),
  published_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

registry.registerPath({
  method: "get",
  path: "/news",
  tags: ["News & Updates"],
  summary: "Get published news, market reports and auction announcements",
  description: "Browse articles filtered by topic (Land & plots, Construction, Market, Policy & law, Auctions, VIP deals) and target district.",
  request: {
    query: z.object({
      topic: z.string().optional(),
      district: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of published news articles with pagination",
      content: { "application/json": { schema: dataResponseSchema(z.array(newsArticleSchema)) } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/news/{id}",
  tags: ["News & Updates"],
  summary: "Get article details by ID",
  description: "Retrieves complete article content, translations, and author details.",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Article details",
      content: { "application/json": { schema: dataResponseSchema(newsArticleSchema) } },
    },
    404: {
      description: "Article not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/news/admin/publish",
  tags: ["News & Updates"],
  summary: "Publish article and push notifications (Admin only)",
  description: "Creates an article and fans out in-app bell and SMS/WhatsApp notifications to matching alert subscribers.",
  security: bearerAuthSecurity,
  request: {
    body: {
      content: { "application/json": { schema: publishNewsSchema } },
    },
  },
  responses: {
    201: {
      description: "Article published and notification fan-out complete",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - requires ADMIN role" },
  },
});
