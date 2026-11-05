import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface CreateSubscriptionInput {
  userId: string;
  blockerId?: string | null;
  subscriptionType?: string;
  period?: string;
  plan: string;
  paymentId: string | null;
  startsAt: Date;
  expiresAt: Date;
}

const SUBSCRIPTION_COLUMNS = `
  id, user_id, blocker_id, subscription_type, period, plan, payment_id, starts_at, expires_at, status, created_at
`;

export class SubscriptionRepository {
  async create(input: CreateSubscriptionInput, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      INSERT INTO subscriptions (
        user_id, blocker_id, subscription_type, period, plan, payment_id, starts_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${SUBSCRIPTION_COLUMNS}
      `,
      [
        input.userId,
        input.blockerId ?? null,
        input.subscriptionType ?? 'BLOCKER_PRO',
        input.period ?? 'MONTH',
        input.plan,
        input.paymentId,
        input.startsAt,
        input.expiresAt,
      ]
    );
    return result.rows[0];
  }

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

  async findActiveByUserAndType(userId: string, subscriptionType: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE user_id = $1
        AND subscription_type = $2
        AND status = 'ACTIVE'
        AND starts_at <= NOW()
        AND expires_at > NOW()
      ORDER BY expires_at DESC
      LIMIT 1
      `,
      [userId, subscriptionType]
    );
    return result.rows[0] ?? null;
  }

  async hasActiveVip(userId: string, executor: QueryExecutor = db): Promise<boolean> {
    const active = await this.findActiveByUserAndType(userId, 'VIP_ROOM', executor);
    return active !== null;
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

  async findLatestByUserAndType(userId: string, subscriptionType: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE user_id = $1
        AND subscription_type = $2
      ORDER BY expires_at DESC
      LIMIT 1
      `,
      [userId, subscriptionType]
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

  async findByUserId(userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      SELECT ${SUBSCRIPTION_COLUMNS}
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows;
  }

  async cancel(id: string, userId: string, executor: QueryExecutor = db) {
    const result = await executor.query(
      `
      UPDATE subscriptions
      SET status = 'CANCELLED'
      WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
      RETURNING ${SUBSCRIPTION_COLUMNS}
      `,
      [id, userId]
    );
    return result.rows[0] ?? null;
  }
}