import { z } from "zod";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  logoutSchema,
} from "../../validators/auth.validator";
import { dataResponseSchema, errorResponseSchema, messageOnlyResponseSchema } from "../common.schemas";
import { registry } from "../registry";

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      description:
        "Registered - returns an access/refresh token pair and the user",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
    400: {
      description: "Duplicate phone/email, or USER role not configured",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: "Logged in - returns a fresh access/refresh token pair",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: refreshTokenSchema } } },
  },
  responses: {
    200: {
      description:
        "Refresh token rotated - role is re-read from the DB at this point",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
    401: {
      description:
        "Invalid or expired refresh token, or account no longer active",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    description: 'Revokes the supplied refresh token in the database and immediately blacklists the active JWT access token.',
    request: {
        body: {
            content: {
                'application/json': { schema: logoutSchema },
            },
        },
    },
    responses: {
        200: {
            description: 'Logged out successfully (access token revoked and refresh token retired)',
            content: { 'application/json': { schema: messageOnlyResponseSchema } },
        },
        400: {
            description: 'Failed to process logout',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/logout-all',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    description: 'Terminates all active sessions for the authenticated user by revoking all refresh tokens and invalidating the active access token.',
    responses: {
        200: {
            description: 'All sessions successfully terminated',
            content: { 'application/json': { schema: messageOnlyResponseSchema } },
        },
        401: {
            description: 'Missing or invalid authentication token',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/verification/send',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    description: 'Generates a 6-digit OTP code and dispatches it via Brevo / SMTP to the user email or phone.',
    responses: {
        200: {
            description: 'Verification code dispatched successfully',
            content: { 'application/json': { schema: messageOnlyResponseSchema } },
        },
        400: {
            description: 'Account already verified or recipient destination missing',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: {
            description: 'Missing or invalid token',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/auth/verification/verify',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    description: 'Verifies the submitted 6-digit code, activates the account, and updates verification timestamps.',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        code: z.string().min(4).max(10).describe('6-digit verification code'),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Account verified successfully — returns updated user profile with is_verified=true',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        400: {
            description: 'Invalid, expired, or already-used verification code',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: {
            description: 'Missing or invalid token',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});