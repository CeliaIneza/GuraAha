import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface ContactUnlockRow {
  id: string;
  user_id: string;
  listing_id: string;
  payment_id: string;
  type: string;
  amount_rwf: string | number;
  created_at: Date;
}

export class UnlockRepository {
  async findByUserAndListing(
    userId: string,
    listingId: string,
    executor: QueryExecutor = db
  ): Promise<ContactUnlockRow[]> {
    const result = await executor.query(
      `
      SELECT *
      FROM contact_unlocks
      WHERE user_id = $1 AND listing_id = $2
      ORDER BY created_at DESC
      `,
      [userId, listingId]
    );

    return result.rows;
  }

  async findByUser(
    userId: string,
    executor: QueryExecutor = db
  ): Promise<ContactUnlockRow[]> {
    const result = await executor.query(
      `
      SELECT *
      FROM contact_unlocks
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows;
  }

  async findOne(
    userId: string,
    listingId: string,
    type: string,
    executor: QueryExecutor = db
  ): Promise<ContactUnlockRow | null> {
    const result = await executor.query(
      `
      SELECT *
      FROM contact_unlocks
      WHERE user_id = $1 AND listing_id = $2 AND type = $3
      `,
      [userId, listingId, type]
    );

    return result.rows[0] ?? null;
  }

  async create(
    input: {
      userId: string;
      listingId: string;
      paymentId: string;
      type: string;
      amountRwf: number;
    },
    executor: QueryExecutor = db
  ): Promise<ContactUnlockRow> {
    const result = await executor.query(
      `
      INSERT INTO contact_unlocks (
        user_id,
        listing_id,
        payment_id,
        type,
        amount_rwf,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [input.userId, input.listingId, input.paymentId, input.type, input.amountRwf]
    );

    return result.rows[0]!;
  }
}
