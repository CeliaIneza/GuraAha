import { z } from 'zod';
import { registry, bearerAuthSecurity } from '../registry';
import {
    dataResponseSchema,
    errorResponseSchema,
    messageOnlyResponseSchema,
    idParamSchema,
    photoIdParamSchema,
    unauthorizedResponse,
    forbiddenResponse,
} from '../common.schemas';
import {
    createListingSchema,
    rejectListingSchema,
    addListingPhotoSchema,
} from '../../validators/listing.validator';

const listingQuerySchema = z.object({
    villageId: z.string().uuid().optional(),
    type: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
});

registry.registerPath({
    method: 'get',
    path: '/listings',
    tags: ['Listings'],
    description: 'Public, paginated browse of APPROVED listings only.',
    request: { query: listingQuerySchema },
    responses: {
        200: {
            description: 'Approved listings matching the filters',
            content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/listings/{id}',
    tags: ['Listings'],
    description:
        'Public for APPROVED listings only. A PENDING/REJECTED listing returns 404 to anyone except its owning blocker or an admin — deliberately indistinguishable from "does not exist".',
    request: { params: idParamSchema },
    responses: {
        200: {
            description: 'The listing',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        404: {
            description: 'Not found, or not visible to the caller',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/listings/{id}/photos',
    tags: ['Listings'],
    request: { params: idParamSchema },
    responses: {
        200: {
            description: 'Photos attached to this listing',
            content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/listings',
    tags: ['Listings'],
    security: bearerAuthSecurity,
    description: 'Requires an APPROVED blocker profile. villageId must reference a VILLAGE-level location.',
    request: {
        body: { content: { 'application/json': { schema: createListingSchema } } },
    },
    responses: {
        201: {
            description: 'Listing submitted (PENDING)',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        400: {
            description: 'Not an approved blocker, invalid/wrong-level village, or duplicate active UPI number',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/listings/me/mine',
    tags: ['Listings'],
    security: bearerAuthSecurity,
    responses: {
        200: {
            description: "The caller's own listings, any status",
            content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});

registry.registerPath({
    method: 'post',
    path: '/listings/{id}/photos',
    tags: ['Listings'],
    security: bearerAuthSecurity,
    description: 'filePath assumes a file has already been uploaded elsewhere — this endpoint only records the path.',
    request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: addListingPhotoSchema } } },
    },
    responses: {
        201: {
            description: 'Photo record created',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        400: {
            description: 'Listing not found, or caller does not own it',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});

registry.registerPath({
    method: 'delete',
    path: '/listings/photos/{photoId}',
    tags: ['Listings'],
    security: bearerAuthSecurity,
    request: { params: photoIdParamSchema },
    responses: {
        200: {
            description: 'Photo removed',
            content: { 'application/json': { schema: messageOnlyResponseSchema } },
        },
        400: {
            description: 'Photo or listing not found, or caller does not own it',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});

registry.registerPath({
    method: 'get',
    path: '/listings/admin/pending',
    tags: ['Listings', 'Admin'],
    security: bearerAuthSecurity,
    responses: {
        200: {
            description: 'All PENDING listings',
            content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
        },
        401: unauthorizedResponse,
        403: forbiddenResponse,
    },
});

registry.registerPath({
    method: 'patch',
    path: '/listings/{id}/approve',
    tags: ['Listings', 'Admin'],
    security: bearerAuthSecurity,
    description: 'Role is re-verified against the DB, not the JWT claim (requireFreshRole).',
    request: { params: idParamSchema },
    responses: {
        200: {
            description: 'Approved',
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
    path: '/listings/{id}/reject',
    tags: ['Listings', 'Admin'],
    security: bearerAuthSecurity,
    request: {
        params: idParamSchema,
        body: { content: { 'application/json': { schema: rejectListingSchema } } },
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