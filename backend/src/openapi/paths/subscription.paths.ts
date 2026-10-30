import { z } from 'zod';
import { registry, bearerAuthSecurity } from '../registry';
import {
  dataResponseSchema,
  errorResponseSchema,
  idParamSchema,
  unauthorizedResponse,
  forbiddenResponse,
} from '../common.schemas';
import { initiateSubscriptionSchema } from '../../validators/subscription.validator';

registry.registerPath({
  method: 'post',
  path: '/subscriptions/initiate',
  tags: ['Subscriptions'],
  security: bearerAuthSecurity,
  description:
    'Initiates a recurring or fixed-period Blocker Pro subscription payment via InTouchPay Mobile Money push prompt. Requires an approved BLOCKER account.',
  request: {
    body: {
      content: {
        'application/json': { schema: initiateSubscriptionSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Payment prompt initiated on blocker mobile phone',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    400: {
      description: 'Invalid plan, invalid phone number, or blocker profile missing',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

export const subscriptionPlanConfigSchema = z.object({
  priceRwf: z.number().describe('Subscription fee in Rwandan Francs (RWF)'),
  durationDays: z.number().describe('Validity period in days'),
});

registry.registerPath({
  method: 'get',
  path: '/subscriptions/plans',
  tags: ['Subscriptions'],
  summary: 'Get active subscription plans and pricing',
  description: 'Retrieves all available Blocker Pro subscription tiers (e.g. MONTHLY, QUARTERLY, YEARLY) dynamically configured in database settings. No authentication required.',
  responses: {
    200: {
      description: 'Dictionary of subscription plans with price and duration',
      content: { 'application/json': { schema: dataResponseSchema(z.record(z.string(), subscriptionPlanConfigSchema)) } },
    },
    500: {
      description: 'Internal server error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/subscriptions/mine',
  tags: ['Subscriptions'],

  security: bearerAuthSecurity,
  description: 'Retrieves all historical and current subscriptions for the authenticated blocker.',
  responses: {
    200: {
      description: 'List of blocker subscriptions with active period and status',
      content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/subscriptions/status',
  tags: ['Subscriptions'],
  security: bearerAuthSecurity,
  description: 'Checks current active subscription tier, remaining validity days, and renewal timestamp for the caller.',
  responses: {
    200: {
      description: 'Current subscription validity status',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/subscriptions/{id}/cancel',
  tags: ['Subscriptions'],
  security: bearerAuthSecurity,
  description: 'Cancels an active subscription or disables automatic renewal for the specified subscription ID.',
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: 'Subscription marked as cancelled',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    400: {
      description: 'Subscription not found or not belonging to the blocker',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});
