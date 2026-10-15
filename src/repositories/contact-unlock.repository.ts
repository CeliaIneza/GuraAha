import { db } from "../config/database";
import { ContactUnlockType } from "../config/payment-config";

type QueryExecutor = { query: typeof db.query };

export interface CreateContactUnlockInput {
  userId: string;
  listingId: string;
  paymentId: string;
  type: ContactUnlockType;
  amountRwf: number;
}

const CONTACT_UNLOCK_COLUMNS = `
id, user_id, listing_id, payment_id, type, amount_rwf, created_at
`;

export class ContactUnlockRepository {
  async create(input: CreateContactUnlockInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO contact_unlocks (user_id, listing_id, payment_id, type, amount_rwf)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${CONTACT_UNLOCK_COLUMNS}
      `,
      [
        input.userId,
        input.listingId,
        input.paymentId,
        input.type,
        input.amountRwf,
      ],
    );
    return result.rows[0];
  }

  async findByUserAndListing(
    userId: string,
    listingId: string,
    type: ContactUnlockType,
    executor: QueryExecutor = db,
  ) {
    const result = await executor.query(
      `
      SELECT ${CONTACT_UNLOCK_COLUMNS}
      FROM contact_unlocks
      WHERE user_id = $1 AND listing_id = $2 AND type = $3
      `,
      [userId, listingId, type],
    );
    return result.rows[0] ?? null;
  }

  async findByPaymentId(paymentId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `SELECT ${CONTACT_UNLOCK_COLUMNS} FROM contact_unlocks WHERE payment_id = $1`,
      [paymentId],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${CONTACT_UNLOCK_COLUMNS}
      FROM contact_unlocks
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows;
  }
}
