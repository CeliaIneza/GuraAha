import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreatePaymentInput {
  userId: string;
  provider: string;
  providerReference: string;
  amountRwf: number;
  purpose: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  provider: string;
  provider_reference: string | null;
  amount_rwf: string | number;
  purpose: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  raw_response: any;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class PaymentRepository {
  async create(
    input: CreatePaymentInput,
    executor: QueryExecutor = db
  ): Promise<PaymentRow> {
    const result = await executor.query(
      `
      INSERT INTO payments (
        user_id,
        provider,
        provider_reference,
        amount_rwf,
        purpose,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
      RETURNING *
      `,
      [
        input.userId,
        input.provider,
        input.providerReference,
        input.amountRwf,
        input.purpose,
      ]
    );

    return result.rows[0]!;
  }

  async findById(
    id: string,
    executor: QueryExecutor = db
  ): Promise<PaymentRow | null> {
    const result = await executor.query(
      `SELECT * FROM payments WHERE id = $1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async markVerified(
    id: string,
    rawResponse?: any,
    executor: QueryExecutor = db
  ): Promise<PaymentRow | null> {
    const result = await executor.query(
      `
      UPDATE payments
      SET status = 'VERIFIED',
          verified_at = NOW(),
          updated_at = NOW(),
          raw_response = COALESCE($2, raw_response)
      WHERE id = $1
      RETURNING *
      `,
      [id, rawResponse ? JSON.stringify(rawResponse) : null]
    );

    return result.rows[0] ?? null;
  }

  async markFailed(
    id: string,
    rawResponse?: any,
    executor: QueryExecutor = db
  ): Promise<PaymentRow | null> {
    const result = await executor.query(
      `
      UPDATE payments
      SET status = 'FAILED',
          updated_at = NOW(),
          raw_response = COALESCE($2, raw_response)
      WHERE id = $1
      RETURNING *
      `,
      [id, rawResponse ? JSON.stringify(rawResponse) : null]
    );

    return result.rows[0] ?? null;
  }
}
