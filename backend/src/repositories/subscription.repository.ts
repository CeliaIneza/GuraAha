import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreateSubscriptionInput {
  blockerId: string;
  plan: string;
  paymentId: string | null;
  startsAt: Date;
  expiresAt: Date;
}

const SUBSCRIPTION_COLUMNS = `
  id, blocker_id, plan, payment_id, starts_at, expires_at, status, created_at
`;

export class SubscriptionRepository {
  async create(input: CreateSubscriptionInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO subscriptions (blocker_id, plan, payment_id, starts_at, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${SUBSCRIPTION_COLUMNS}
      `,
      [input.blockerId, input.plan, input.paymentId, input.startsAt, input.expiresAt]
    );
    return result.rows[0];
  }

  /**
   * The status column only changes on an explicit action (e.g.
   * cancellation). This is the right place to add a scheduled job later if
   * you want the column itself to reflect reality for admin dashboards —
   * queries through this method are correct either way.
   */
  async findCurrentActive(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE blocker_id = $1
        AND status = 'ACTIVE'
        AND starts_at <= NOW()
        AND expires_at > NOW()
      ORDER BY expires_at DESC
      LIMIT 1
      `,
      [blockerId]
    );
    return result.rows[0] ?? null;
  }

  async findLatest(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE blocker_id = $1
      ORDER BY expires_at DESC
      LIMIT 1
      `,
      [blockerId]
    );
    return result.rows[0] ?? null;
  }

  async findByBlockerId(blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE blocker_id = $1
      ORDER BY created_at DESC
      `,
      [blockerId]
    );
    return result.rows;
  }

  async cancel(id: string, blockerId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE subscriptions
      SET status = 'CANCELLED'
      WHERE id = $1 AND blocker_id = $2 AND status = 'ACTIVE'
      RETURNING ${SUBSCRIPTION_COLUMNS}
      `,
      [id, blockerId]
    );
    return result.rows[0] ?? null;
  }
}