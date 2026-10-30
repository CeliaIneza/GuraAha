import { z } from "zod";
import {
    createPartnerSchema,
    updatePartnerSchema,
} from "../../validators/partner.validator";
import { dataResponseSchema, errorResponseSchema, messageOnlyResponseSchema } from "../common.schemas";
import { registry } from "../registry";

export const partnerResponseSchema = z.object({
    id: z.string().uuid(),
    type: z.string().describe("Partner category: SURVEYOR, NOTARY, VALUER, ENGINEER, LEGAL_ADVISOR, etc."),
    name: z.string(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    locationId: z.string().uuid().nullable().optional(),
    locationName: z.string().nullable().optional(),
    locationLevel: z.string().nullable().optional(),
    descriptionRw: z.string().nullable().optional(),
    descriptionEn: z.string().nullable().optional(),
    descriptionFr: z.string().nullable().optional(),
    isCertified: z.boolean(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const paginatedPartnerResponseSchema = z.object({
    items: z.array(partnerResponseSchema),
    pagination: z.object({
        total: z.number().int(),
        page: z.number().int(),
        limit: z.number().int(),
        totalPages: z.number().int(),
    }),
});

registry.registerPath({
    method: "get",
    path: "/partners",
    tags: ["Partners"],
    summary: "List certified due diligence partners (Surveyors, Notaries, Valuers, Engineers)",
    description: "Public endpoint returning active verified partners in Rwanda. Supports filtering by profession type, district/province locationId, certification status, and keyword search. Admins see inactive partners when authenticated.",
    request: {
        query: z.object({
            page: z.coerce.number().int().min(1).optional().default(1),
            limit: z.coerce.number().int().min(1).max(100).optional().default(20),
            type: z.string().optional().describe("Partner type filter e.g. SURVEYOR, NOTARY, VALUER, ENGINEER"),
            locationId: z.string().uuid().optional().describe("Location UUID filter (district or province)"),
            isCertified: z.enum(["true", "false"]).optional().describe("Filter by certified status"),
            isActive: z.enum(["true", "false"]).optional().describe("Filter by active status (Admin only)"),
            search: z.string().optional().describe("Text search across name and descriptions"),
        }),
    },
    responses: {
        200: {
            description: "Paginated list of partners",
            content: { "application/json": { schema: paginatedPartnerResponseSchema } },
        },
        400: {
            description: "Invalid query parameters",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/partners/{id}",
    tags: ["Partners"],
    summary: "Get partner profile by ID",
    description: "Returns the detailed profile of a verified partner, including contact info, certified badge, and operating location.",
    request: {
        params: z.object({
            id: z.string().uuid().describe("Partner UUID"),
        }),
    },
    responses: {
        200: {
            description: "Partner profile details",
            content: { "application/json": { schema: dataResponseSchema(partnerResponseSchema) } },
        },
        404: {
            description: "Partner not found",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "post",
    path: "/partners",
    tags: ["Partners"],
    summary: "Create a new professional partner (Admin only)",
    description: "Registers a new surveyor, notary, valuer, or engineer into the GuraAha directory. Enforces ADMIN role.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createPartnerSchema } },
        },
    },
    responses: {
        201: {
            description: "Partner created successfully",
            content: { "application/json": { schema: dataResponseSchema(partnerResponseSchema) } },
        },
        400: {
            description: "Validation error or invalid location reference",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        401: {
            description: "Authentication required",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        403: {
            description: "Insufficient permissions (requires ADMIN)",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "patch",
    path: "/partners/{id}",
    tags: ["Partners"],
    summary: "Update partner profile (Admin only)",
    description: "Modifies partner attributes, updates certification badge, or toggles active status.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().uuid().describe("Partner UUID"),
        }),
        body: {
            content: { "application/json": { schema: updatePartnerSchema } },
        },
    },
    responses: {
        200: {
            description: "Partner updated successfully",
            content: { "application/json": { schema: dataResponseSchema(partnerResponseSchema) } },
        },
        400: {
            description: "Invalid update payload",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        401: {
            description: "Authentication required",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        403: {
            description: "Requires ADMIN role",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        404: {
            description: "Partner not found",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "delete",
    path: "/partners/{id}",
    tags: ["Partners"],
    summary: "Deactivate or delete partner (Admin only)",
    description: "Soft deactivates partner (or permanently deletes if hard=true is provided).",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            id: z.string().uuid().describe("Partner UUID"),
        }),
        query: z.object({
            hard: z.enum(["true", "false"]).optional().describe("If true, performs permanent database deletion"),
        }),
    },
    responses: {
        200: {
            description: "Partner deactivated or deleted successfully",
            content: { "application/json": { schema: messageOnlyResponseSchema } },
        },
        401: {
            description: "Authentication required",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        403: {
            description: "Requires ADMIN role",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        404: {
            description: "Partner not found",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});
