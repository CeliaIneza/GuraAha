import { registry } from '../registry';
import { dataResponseSchema, errorResponseSchema, idParamSchema } from '../common.schemas';

registry.registerPath({
    method: 'get',
    path: '/locations/provinces',
    tags: ['Locations'],
    description: 'Root level of the administrative hierarchy. Public — no auth required.',
    responses: {
        200: {
            description: 'The 5 provinces',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/locations/{id}/children',
    tags: ['Locations'],
    description:
        'Direct children of a location (province→districts, district→sectors, etc.). Stop calling this once the selected row\'s `level` is VILLAGE. Public — no auth required.',
    request: { params: idParamSchema },
    responses: {
        200: {
            description: 'Direct children of this location',
            content: { 'application/json': { schema: dataResponseSchema() } },
        },
        404: {
            description: 'Location not found, or it is already a VILLAGE (no children) — not distinguishable by status code alone, see message',
            content: { 'application/json': { schema: errorResponseSchema } },
        },
    },
});