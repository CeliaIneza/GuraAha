import { z } from "zod";
import { registry, bearerAuthSecurity } from "../registry";
import { dataResponseSchema, errorResponseSchema, messageOnlyResponseSchema } from "../common.schemas";
import { subscribeAlertsSchema } from "../../validators/news.validator";

export const alertSubscriptionSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  topics: z.array(z.string()),
  districts: z.array(z.string()).nullable().optional(),
  channels: z.array(z.string()),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

registry.registerPath({
  method: "post",
  path: "/alerts/subscribe",
  tags: ["Alerts"],
  summary: "Subscribe or update topic and district alert preferences",
  description: "Registers SMS/WhatsApp/In-app preferences for news, auctions, and VIP deal drops.",
  request: {
    body: {
      content: { "application/json": { schema: subscribeAlertsSchema } },
    },
  },
  responses: {
    200: {
      description: "Alert preferences saved and welcome confirmation dispatched",
      content: { "application/json": { schema: dataResponseSchema(alertSubscriptionSchema) } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/alerts/me",
  tags: ["Alerts"],
  summary: "Get current alert preferences for authenticated user",
  security: bearerAuthSecurity,
  responses: {
    200: {
      description: "User alert subscription preferences",
      content: { "application/json": { schema: dataResponseSchema(alertSubscriptionSchema.nullable()) } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/alerts/unsubscribe",
  tags: ["Alerts"],
  summary: "Unsubscribe from SMS/WhatsApp alerts",
  request: {
    body: {
      content: { "application/json": { schema: z.object({ phone: z.string() }) } },
    },
  },
  responses: {
    200: {
      description: "Successfully unsubscribed",
      content: { "application/json": { schema: messageOnlyResponseSchema } },
    },
    400: {
      description: "Phone number required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
