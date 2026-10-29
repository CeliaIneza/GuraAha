import { z } from 'zod';
import { registry, bearerAuthSecurity } from '../registry';
import {
  dataResponseSchema,
  errorResponseSchema,
  unauthorizedResponse,
  forbiddenResponse,
} from '../common.schemas';

registry.registerPath({
  method: 'get',
  path: '/lotto/mine',
  tags: ['Lotto'],
  security: bearerAuthSecurity,
  description: 'Retrieves all lottery ticket entries earned by the authenticated user from contact unlocks.',
  responses: {
    200: {
      description: 'List of lotto tickets tied to contact unlock transactions',
      content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
    },
    400: {
      description: 'Failed to retrieve lotto entries',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: unauthorizedResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/lotto/count',
  tags: ['Lotto', 'Admin'],
  security: bearerAuthSecurity,
  description: 'Returns the total system-wide lottery entry count for auditing and prize draws. Admin only.',
  responses: {
    200: {
      description: 'Total lotto entries count in the system',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              count: z.number().int(),
            }),
          }),
        },
      },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
