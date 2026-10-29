import z from "zod";
import { registry, bearerAuthSecurity } from "../registry";
import { createAdminSchema } from "../../validators/auth.validator";
import {
  dataResponseSchema,
  errorResponseSchema,
  paginatedDataResponseSchema,
  unauthorizedResponse,
  forbiddenResponse,
} from "../common.schemas";

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().describe("Page number (1-indexed, default 1)"),
  limit: z.coerce.number().int().positive().max(100).optional().describe("Items per page (default 20, max 100)"),
  status: z.string().optional().describe("Filter by status (e.g. PENDING, APPROVED, REJECTED, ACTIVE)"),
});

registry.registerPath({
  method: "post",
  path: "/admin/setup",
  tags: ["Admin"],
  description:
    "Gated by the ADMIN_SETUP_SECRET header, not a role check — there is no admin yet to gate the first one, and this stays secret-gated permanently by design",
  request: {
    headers: z.object({
      "x-admin-setup-secret": z
        .string()
        .describe("Shared secret required to mint an admin account"),
    }),
    body: { content: { "application/json": { schema: createAdminSchema } } },
  },
  responses: {
    201: {
      description: "Admin account created",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
    403: {
      description:
        "Missing/invalid secret, duplicate phone/email, or ADMIN role not configured",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/blockers",
  tags: ["Admin"],
  security: bearerAuthSecurity,
  description: "Retrieve paginated blocker applications with filtering by verification status.",
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Paginated list of blockers with total count and metadata",
      content: { "application/json": { schema: paginatedDataResponseSchema() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/listings",
  tags: ["Admin"],
  security: bearerAuthSecurity,
  description: "Retrieve paginated property listings across the system with status filters.",
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Paginated list of listings with total count and metadata",
      content: { "application/json": { schema: paginatedDataResponseSchema() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/subscriptions",
  tags: ["Admin"],
  security: bearerAuthSecurity,
  description: "Retrieve paginated blocker subscriptions with active/expired/cancelled status filters.",
  request: { query: paginationQuerySchema },
  responses: {
    200: {
      description: "Paginated list of subscriptions with total count and metadata",
      content: { "application/json": { schema: paginatedDataResponseSchema() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

