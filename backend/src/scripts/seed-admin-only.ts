/**
 * seed-admin-only.ts
 * Seeds ONLY an admin account + roles + location data for production deployment.
 * Usage: npx tsx src/scripts/seed-admin-only.ts
 *
 * Set environment variables:
 *   ADMIN_EMAIL=admin@yourdomain.com
 *   ADMIN_PASSWORD=YourSecurePassword123!
 *   ADMIN_FIRST_NAME=Admin
 *   ADMIN_LAST_NAME=User
 */
import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { env } from '../config/env';

async function seedAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirst = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLast = process.env.ADMIN_LAST_NAME || 'User';
  const adminPhone = process.env.ADMIN_PHONE || '+250780000000';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running this script.'
    );
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Ensure roles exist
    await client.query(`
      INSERT INTO roles (name) VALUES ('USER'), ('BLOCKER'), ('ADMIN')
      ON CONFLICT (name) DO NOTHING
    `);

    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'ADMIN'");
    const adminRoleId = roleRes.rows[0]?.id;
    if (!adminRoleId) throw new Error('ADMIN role not found after insert');

    const hash = await bcrypt.hash(adminPassword, 12);

    const result = await client.query(
      `INSERT INTO users (role_id, phone, email, password_hash, first_name, last_name, phone_verified_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'ACTIVE')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role_id = EXCLUDED.role_id,
             status = 'ACTIVE'
       RETURNING id, email`,
      [adminRoleId, adminPhone, adminEmail.toLowerCase(), hash, adminFirst, adminLast]
    );

    await client.query('COMMIT');
    console.log(`✅ Admin seeded: ${result.rows[0].email} (id: ${result.rows[0].id})`);
    console.log('   Password: [set via ADMIN_PASSWORD env var]');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedAdmin()
    .then(() => db.end())
    .catch(async (err) => {
      console.error('Admin seed failed:', err);
      await db.end();
      process.exit(1);
    });
}
