import { applyForBlockerSchema, rejectBlockerSchema } from "../../validators/blocker.validator";
import { dataResponseSchema, errorResponseSchema, forbiddenResponse, idParamSchema, unauthorizedResponse } from "../common.schemas";
import { bearerAuthSecurity, registry } from "../registry";

registry.registerPath({
    method: 'post',
    path: '/blocker/apply',
    tags: ['Blocker'],
    security: bearerAuthSecurity,
    request: {
        body: { content: { 'application/json': { schema: applyForBlockerSchema}}},
    },
    responses: {
        201: {
            description: 'Blocker application submitted (PENDING)',
            content: { 'application/json': {schema: dataResponseSchema() }},
        },
        400: {
            description: 'Phone not verified, profile already exists, account not active or wrong role',
            content: { 'application/json': {schema: errorResponseSchema}},
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});


registry.registerPath({
    method: 'get',
    path: '/blocker/application/me',
    tags: ['Blocker'],
    security: bearerAuthSecurity,
    responses: {
        200: {
            description: "The caller's own blocker application",
            content: { 'application/json': {schema: dataResponseSchema()}},
        },
        404: {
            description: 'No application found for this user',
            content: { 'application/json': {schema: errorResponseSchema}},
        },
        401: unauthorizedResponse,
        403: forbiddenResponse
    },
});



registry.registerPath({
    method: 'get',
    path: '/blocker/applications',
    tags: ['Blocker', 'Admin'],
    security: bearerAuthSecurity,
    responses: {
        200: {
            description: 'All PENDING blocker applications',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});


registry.registerPath({
    method: 'patch',
    path: '/blocker/applications/{id}/approve',
    tags: ['Blocker', 'Admin'],
    security: bearerAuthSecurity,
    description: 'Role is re-verified against the DB, not the JWT claim, before this runs (requireFreshRole).',
    request: { params: idParamSchema },
    responses: {
        200: {
            description: 'Approved — the applicant is promoted from USER to BLOCKER in the same transaction',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        400: {
            description: 'Not found, or not PENDING',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});


registry.registerPath({
    method: 'patch',
    path: '/blocker/applications/{id}/reject',
    tags: ['Blocker', 'Admin'],
    security: bearerAuthSecurity,
    request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: rejectBlockerSchema } } },
    },
    responses: {
        200: {
            description: 'Rejected',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        400: {
            description: 'Not found, or not PENDING',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});