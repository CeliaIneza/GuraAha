import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

  const blockerRes = await db.query(
    `SELECT id FROM blocker_profiles WHERE user_id = $1 AND status = 'APPROVED'`,
    [userId]
  );
  if (!blockerRes.rows[0]) { res.status(403).json({ message: 'Approved blocker profile required' }); return; }

  const subRes = await db.query(
    `SELECT id FROM subscriptions WHERE blocker_id = $1 AND status = 'ACTIVE' AND expires_at > NOW() LIMIT 1`,
    [blockerRes.rows[0].id]
  );
  if (subRes.rows.length === 0) {
    res.status(403).json({
      message: 'An active subscription is required to post listings.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
    return;
  }
  next();
};
