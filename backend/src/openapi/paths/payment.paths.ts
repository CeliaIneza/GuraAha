import { z } from 'zod';
import { registry, bearerAuthSecurity } from '../registry';
import {
  dataResponseSchema,
  errorResponseSchema,
  idParamSchema,
  unauthorizedResponse,
} from '../common.schemas';

const webhookBodySchema = z.object({
  partnerTransactionId: z.string().optional().describe('Our internal payment ID / reference passed at initiation'),
  transactionId: z.string().optional().describe('InTouchPay gateway transaction ID'),
  requestamount: z.coerce.number().optional().describe('Amount in RWF'),
  status: z.string().optional().describe('Status e.g. SUCCESS, FAILED, PENDING'),
  statuscode: z.string().optional().describe('Status code from telecom operator (MTN / Airtel)'),
  statusdesc: z.string().optional().describe('Human readable status description'),
}).passthrough();

registry.registerPath({
  method: 'post',
  path: '/payments/webhook/intouchpay',
  tags: ['Payments'],
  description:
    'Server-to-server webhook callback dispatched by InTouchPay upon completion of Mobile Money transaction. Validates transaction signature/payload and emits payment events to unlock contacts or activate subscriptions.',
  request: {
    body: {
      content: {
        'application/json': { schema: webhookBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Webhook acknowledged by GuraAha server',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            partnerTransactionId: z.string().optional(),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/payments/mine',
  tags: ['Payments'],
  security: bearerAuthSecurity,
  description: 'Retrieve a chronological list of Mobile Money payments initiated by the caller.',
  responses: {
    200: {
      description: 'List of payments with status, amounts, and purpose',
      content: { 'application/json': { schema: dataResponseSchema(z.array(z.any())) } },
    },
    401: unauthorizedResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/payments/{id}',
  tags: ['Payments'],
  security: bearerAuthSecurity,
  description: 'Retrieve specific payment details and current transaction settlement status.',
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: 'Payment record details',
      content: { 'application/json': { schema: dataResponseSchema() } },
    },
    401: unauthorizedResponse,
    404: {
      description: 'Payment not found or does not belong to the authenticated user',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
