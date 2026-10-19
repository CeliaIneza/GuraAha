import { db } from '../config/database';

type QueryExecutor = { query: typeof db.query };

export interface Subscription {
  id: string;
  blocker_id: string;
  plan: string;
  payment_id: string | null;
  starts_at: Date;
  expires_at: Date;
  status: string;
  created_at: Date;
}

export interface CreateSubscriptionInput {
  blockerId: string;
  plan: string;
  paymentId: string;
  startsAt: Date;
  expiresAt: Date;
}

export class SubscriptionRepository {
  async findActiveByBlockerId(blockerId: string, executor: QueryExecutor = db): Promise<Subscription | null> {
    const res = await executor.query(
      `SELECT * FROM subscriptions
       WHERE blocker_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [blockerId]
    );
    return res.rows[0] || null;
  }

  async create(input: CreateSubscriptionInput, executor: QueryExecutor = db): Promise<Subscription> {
    const res = await executor.query(
      `INSERT INTO subscriptions (blocker_id, plan, payment_id, starts_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *`,
      [input.blockerId, input.plan, input.paymentId, input.startsAt, input.expiresAt]
    );
    return res.rows[0];
  }

  async findByBlockerId(blockerId: string): Promise<Subscription[]> {
    const res = await db.query(
      `SELECT * FROM subscriptions WHERE blocker_id = $1 ORDER BY created_at DESC`,
      [blockerId]
    );
    return res.rows;
  }
}
