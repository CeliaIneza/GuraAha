import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
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
    description: 'refreshToken in the body is optional; this route has no request validation attached.',
    request: {
        body: {
            content: {
                'application/json': { schema: refreshTokenSchema.partial() },
            },
        },
    },
    responses: {
        200: {
            description: 'Logged out (idempotent — succeeds even for an already-invalid token)',
            content: { 'application/json': { schema: messageOnlyResponseSchema } },
        },
    },
})