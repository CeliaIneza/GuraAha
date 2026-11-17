import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface NotificationRow {
  id: string;
  user_id: string | null;
  icon: string;
  title: string;
  summary: string;
  action_type: string;
  action_id: string | null;
  is_read: boolean;
  created_at: Date;
}

export interface CreateNotificationInput {
  userId?: string | null;
  icon?: string;
  title: string;
  summary: string;
  actionType?: string;
  actionId?: string | null;
}

const NOTIFICATION_COLUMNS = `
  id, user_id, icon, title, summary, action_type, action_id, is_read, created_at
`;

export class NotificationRepository {
  async create(input: CreateNotificationInput, executor: QueryExecutor = db): Promise<NotificationRow> {
    const result = await executor.query(
      `
      INSERT INTO notifications (user_id, icon, title, summary, action_type, action_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${NOTIFICATION_COLUMNS}
      `,
      [
        input.userId ?? null,
        input.icon ?? '🔔',
        input.title,
        input.summary,
        input.actionType ?? 'CUSTOM',
        input.actionId ?? null,
      ]
    );
    return result.rows[0];
  }

  async createBulk(items: CreateNotificationInput[], executor: QueryExecutor = db): Promise<void> {
    if (items.length === 0) return;

    for (const item of items) {
      await executor.query(
        `
        INSERT INTO notifications (user_id, icon, title, summary, action_type, action_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          item.userId ?? null,
          item.icon ?? '🔔',
          item.title,
          item.summary,
          item.actionType ?? 'CUSTOM',
          item.actionId ?? null,
        ]
      );
    }
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    executor: QueryExecutor = db
  ): Promise<NotificationRow[]> {
    const result = await executor.query(
      `
      SELECT
        n.id,
        n.user_id,
        n.icon,
        n.title,
        n.summary,
        n.action_type,
        n.action_id,
        CASE
          WHEN n.user_id IS NULL THEN (nr.notification_id IS NOT NULL OR n.is_read)
          ELSE n.is_read
        END AS is_read,
        n.created_at
      FROM notifications n
      LEFT JOIN notification_reads nr
        ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE n.user_id = $1 OR n.user_id IS NULL
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async countUnreadByUserId(userId: string, executor: QueryExecutor = db): Promise<number> {
    const result = await executor.query(
      `
      SELECT COUNT(*)::int AS count
      FROM notifications n
      LEFT JOIN notification_reads nr
        ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE (n.user_id = $1 AND n.is_read = FALSE)
         OR (n.user_id IS NULL AND n.is_read = FALSE AND nr.notification_id IS NULL)
      `,
      [userId]
    );
    return result.rows[0].count as number;
  }

  async markAsRead(userId: string, notificationId: string, executor: QueryExecutor = db): Promise<boolean> {
    const directResult = await executor.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      `,
      [notificationId, userId]
    );
    if ((directResult.rowCount ?? 0) > 0) {
      return true;
    }

    const broadcastResult = await executor.query(
      `
      INSERT INTO notification_reads (notification_id, user_id)
      SELECT id, $2 FROM notifications WHERE id = $1 AND user_id IS NULL
      ON CONFLICT (notification_id, user_id) DO NOTHING
      `,
      [notificationId, userId]
    );
    return (broadcastResult.rowCount ?? 0) > 0;
  }

  async markAllAsRead(userId: string, executor: QueryExecutor = db): Promise<number> {
    const directResult = await executor.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
      `,
      [userId]
    );

    const broadcastResult = await executor.query(
      `
      INSERT INTO notification_reads (notification_id, user_id)
      SELECT n.id, $1
      FROM notifications n
      LEFT JOIN notification_reads nr
        ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE n.user_id IS NULL AND nr.notification_id IS NULL
      ON CONFLICT (notification_id, user_id) DO NOTHING
      `,
      [userId]
    );

    return (directResult.rowCount ?? 0) + (broadcastResult.rowCount ?? 0);
  }
}
