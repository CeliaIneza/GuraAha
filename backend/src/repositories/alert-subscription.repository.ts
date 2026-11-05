import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface AlertSubscriptionRow {
  id: string;
  user_id: string | null;
  phone: string;
  topics: string[];
  districts: string[] | null;
  channels: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpsertAlertSubscriptionInput {
  userId?: string | null;
  phone: string;
  topics: string[];
  districts?: string[] | null;
  channels?: string[];
}

const ALERT_SUBSCRIPTION_COLUMNS = `
  id, user_id, phone, topics, districts, channels, is_active, created_at, updated_at
`;

export class AlertSubscriptionRepository {
  async upsert(input: UpsertAlertSubscriptionInput, executor: QueryExecutor = db): Promise<AlertSubscriptionRow> {
    const result = await executor.query(
      `
      INSERT INTO alert_subscriptions (user_id, phone, topics, districts, channels, is_active, updated_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
      ON CONFLICT (phone) DO UPDATE
      SET
        user_id = COALESCE(EXCLUDED.user_id, alert_subscriptions.user_id),
        topics = EXCLUDED.topics,
        districts = EXCLUDED.districts,
        channels = EXCLUDED.channels,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING ${ALERT_SUBSCRIPTION_COLUMNS}
      `,
      [
        input.userId ?? null,
        input.phone,
        input.topics,
        input.districts ?? null,
        input.channels ?? ['IN_APP', 'SMS'],
      ]
    );
    return result.rows[0];
  }

  async findByPhone(phone: string, executor: QueryExecutor = db): Promise<AlertSubscriptionRow | null> {
    const result = await executor.query(
      `SELECT ${ALERT_SUBSCRIPTION_COLUMNS} FROM alert_subscriptions WHERE phone = $1`,
      [phone]
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string, executor: QueryExecutor = db): Promise<AlertSubscriptionRow | null> {
    const result = await executor.query(
      `SELECT ${ALERT_SUBSCRIPTION_COLUMNS} FROM alert_subscriptions WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] ?? null;
  }

  async findMatchingSubscribers(
    topic: string,
    districts?: string[] | null,
    executor: QueryExecutor = db
  ): Promise<AlertSubscriptionRow[]> {
    const params: unknown[] = [topic];
    let districtCondition = '';

    if (districts && districts.length > 0) {
      params.push(districts);
      districtCondition = `AND (districts IS NULL OR districts && $${params.length}::text[])`;
    }

    const result = await executor.query(
      `
      SELECT ${ALERT_SUBSCRIPTION_COLUMNS}
      FROM alert_subscriptions
      WHERE is_active = TRUE
        AND $1 = ANY(topics)
        ${districtCondition}
      `,
      params
    );
    return result.rows;
  }

  async deactivate(phone: string, executor: QueryExecutor = db): Promise<boolean> {
    const result = await executor.query(
      `
      UPDATE alert_subscriptions
      SET is_active = FALSE, updated_at = NOW()
      WHERE phone = $1
      `,
      [phone]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
