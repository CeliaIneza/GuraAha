import { z } from "zod";
import { upsertSettingSchema } from "../../validators/setting.validator";
import { dataResponseSchema, errorResponseSchema, messageOnlyResponseSchema } from "../common.schemas";
import { registry } from "../registry";

export const settingRowSchema = z.object({
    key: z.string().describe("Configuration key identifier"),
    value: z.string().describe("Configuration value (stringified JSON or scalar)"),
    description: z.string().nullable().optional().describe("Description of setting purpose"),
    updated_at: z.string().datetime().describe("Last updated timestamp"),
});

export const publicSettingsMapSchema = z.record(z.string(), z.any()).describe("Key-value map of client configuration settings");

registry.registerPath({
    method: "get",
    path: "/settings/public",
    tags: ["Settings"],
    summary: "Get public platform settings and operational parameters",
    description: "Returns whitelisted public configuration values needed by mobile apps and web frontend (unlock fee, subscription plan pricing, lotto fee, support phone/email/WhatsApp, maintenance mode). No authentication required.",
    responses: {
        200: {
            description: "Public configuration key-value dictionary",
            content: { "application/json": { schema: dataResponseSchema(publicSettingsMapSchema) } },
        },
        500: {
            description: "Internal server error",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/settings",
    tags: ["Settings"],
    summary: "List all configuration settings (Admin only)",
    description: "Returns all system settings and operational constants. Requires ADMIN role.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Array of all settings",
            content: { "application/json": { schema: dataResponseSchema(z.array(settingRowSchema)) } },
        },
        401: {
            description: "Authentication required",
            content: { "application/json": { schema: errorResponseSchema } },
        },
        403: {
            description: "Requires ADMIN role",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/settings/{key}",
    tags: ["Settings"],
    summary: "Get single setting by key (Admin only)",
    description: "Retrieves a specific configuration setting entry by its unique key.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            key: z.string().describe("Setting key identifier"),
        }),
    },
    responses: {
        200: {
            description: "Setting details",
            content: { "application/json": { schema: dataResponseSchema(settingRowSchema) } },
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
            description: "Setting not found",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "put",
    path: "/settings/{key}",
    tags: ["Settings"],
    summary: "Upsert configuration setting (Admin only)",
    description: "Creates or updates a system configuration setting value and description.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            key: z.string().describe("Setting key identifier"),
        }),
        body: {
            content: { "application/json": { schema: upsertSettingSchema } },
        },
    },
    responses: {
        200: {
            description: "Setting saved successfully",
            content: { "application/json": { schema: dataResponseSchema(settingRowSchema) } },
        },
        400: {
            description: "Invalid input payload",
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
    },
});

registry.registerPath({
    method: "delete",
    path: "/settings/{key}",
    tags: ["Settings"],
    summary: "Delete custom setting (Admin only)",
    description: "Removes a setting entry from the database. Requires ADMIN role.",
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({
            key: z.string().describe("Setting key identifier"),
        }),
    },
    responses: {
        200: {
            description: "Setting deleted successfully",
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
            description: "Setting not found",
            content: { "application/json": { schema: errorResponseSchema } },
        },
    },
});
