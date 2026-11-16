import { z } from "zod";
import { registry, bearerAuthSecurity } from "../registry";
import { dataResponseSchema, errorResponseSchema, idParamSchema } from "../common.schemas";

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  icon: z.string(),
  title: z.string(),
  summary: z.string(),
  action_type: z.string(),
  action_id: z.string().nullable().optional(),
  is_read: z.boolean(),
  created_at: z.string().datetime(),
});

registry.registerPath({
  method: "get",
  path: "/notifications",
  tags: ["Notifications"],
  summary: "Get user in-app notification feed",
  description: "Returns notifications for the authenticated user, unread count badge, and pagination.",
  security: bearerAuthSecurity,
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "User notification feed",
      content: { "application/json": { schema: dataResponseSchema(z.array(notificationItemSchema)) } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/notifications/unread-count",
  tags: ["Notifications"],
  summary: "Get unread notification count badge",
  description: "Returns the number of unread notifications to display on the bell icon.",
  security: bearerAuthSecurity,
  responses: {
    200: {
      description: "Unread count",
      content: { "application/json": { schema: dataResponseSchema(z.object({ unreadCount: z.number() })) } },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  tags: ["Notifications"],
  summary: "Mark a single notification as read",
  security: bearerAuthSecurity,
  request: {
    params: idParamSchema,
  },
  responses: {
    200: { description: "Notification marked as read" },
    401: { description: "Unauthorized" },
    404: { description: "Notification not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/mark-all-read",
  tags: ["Notifications"],
  summary: "Mark all notifications as read",
  security: bearerAuthSecurity,
  responses: {
    200: { description: "All notifications marked as read" },
    401: { description: "Unauthorized" },
  },
});
