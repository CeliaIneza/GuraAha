import { z } from 'zod';
import { registry, bearerAuthSecurity } from '../registry';
import {
  dataResponseSchema,
  errorResponseSchema,
  unauthorizedResponse,
  forbiddenResponse,
} from '../common.schemas';
import { initiateContactUnlockSchema } from '../../validators/contact-unlock.validator';

const listingIdParamSchema = z.object({
  listingId: z.string().describe('ID or UUID of the property listing'),
});

registry.registerPath({
  method: 'post',
  path: '/listings/{listingId}/contact/unlock',
  tags: ['Contact Unlocks'],
  security: bearerAuthSecurity,
  description:
    'Initiates a MoMo USSD payment prompt via InTouchPay to unlock verified contact details (either OWNER or BLOCKER) for a specific listing.',
  request: {
    params: listingIdParamSchema,
    body: {
      content: {
        'application/json': { schema: initiateContactUnlockSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment initiated — user receives USSD prompt on their mobile device',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    400: {
      description: 'Listing not approved, invalid phone format, or unlock already purchased',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/listings/{listingId}/contact',
  tags: ['Contact Unlocks'],
  security: bearerAuthSecurity,
  description:
    'Retrieves decrypted contact information for a listing. Succeeded only if the caller has completed a verified unlock payment for this listing (or is the listing owner/admin).',
  request: {
    params: listingIdParamSchema,
  },
  responses: {
    200: {
      description: 'Unlocked contact details (phone numbers, full names)',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    401: unauthorizedResponse,
    404: {
      description: 'Listing not found or contact not unlocked for this user',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/contact-unlocks/mine',
  tags: ['Contact Unlocks'],
  security: bearerAuthSecurity,
  description: 'Lists all property listings and contact numbers successfully unlocked by the authenticated user.',
  responses: {
    200: {
      description: 'List of unlocked contacts with listing summaries and timestamps',
      content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
    },
    401: unauthorizedResponse,
  },
});
