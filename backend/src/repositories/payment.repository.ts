import { db } from '../config/database';

type QueryExecutor = {query: typeof db.query};

export type PaymentPurpose = 'CONTACT_UNLOCK' | 'SUBSCRIPTION';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CreatePaymentInput {
    userId: string;
    provider: string;
    amountRwf: number;
    purpose: PaymentPurpose;
    providerReference?: string;

    metadata?: Record<string, unknown>;
}

const PAYMENT_COLUMNS = `
  id,
  user_id,
  provider,
  provider_reference,
  amount_rwf,
  purpose,
  status,
  raw_response,
  metadata,
  verified_at,
  created_at,
  updated_at
`;


export class PaymentRepository {
    async create(input: CreatePaymentInput, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            INSERT INTO payments (user_id, provider, provider_reference, amount_rwf, purpose, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${PAYMENT_COLUMNS}
            `,
            [
                input.userId,
                input.provider,
                input.providerReference ?? null,
                input.amountRwf,
                input.purpose,
                input.metadata ? JSON.stringify(input.metadata) : null,
            ]
        );
        return result.rows[0];
    }

    async findById(id: string, executor: QueryExecutor = db) {
        const result = await executor.query(
            `
            SELECT ${PAYMENT_COLUMNS}
            FROM payments
            WHERE id = $1
            `,
            [id]
        );
        return result.rows[0];
    }

    async findByProviderReference(providerReference: string, executor: QueryExecutor = db) {
        const result = await executor.query(
      `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE provider_reference = $1`,
      [providerReference]
    );
    return result.rows[0] ?? null;
    }

    async setProviderReference(id: string, providerReference: string, rawResponse: unknown, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE payments
      SET provider_reference = $1, raw_response = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING ${PAYMENT_COLUMNS}
      `,
      [providerReference, JSON.stringify(rawResponse ?? null), id]
    );
    return result.rows[0] ?? null;
  }

  async markCompleted(id: string, rawResponse: unknown, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE payments
      SET status = 'COMPLETED', verified_at = NOW(), raw_response = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'PENDING'
      RETURNING ${PAYMENT_COLUMNS}
      `,
      [JSON.stringify(rawResponse ?? null), id]
    );
    return result.rows[0] ?? null;
  }

  async markFailed(id: string, rawResponse: unknown, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE payments
      SET status = 'FAILED', raw_response = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'PENDING'
      RETURNING ${PAYMENT_COLUMNS}
      `,
      [JSON.stringify(rawResponse ?? null), id]
    );
    return result.rows[0] ?? null;
  }
 
  async findByUserId(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `SELECT ${PAYMENT_COLUMNS} FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}