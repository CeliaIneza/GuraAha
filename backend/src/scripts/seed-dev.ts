import bcrypt from 'bcrypt';
import { db } from '../config/database';

export const DEV_PASSWORD = 'Password123!';

const USERS = [
  { key: 'admin',    role: 'ADMIN',   phone: '+250780000001', email: 'admin@guraaha.test',    first: 'Admin',  last: 'User' },
  { key: 'blocker1', role: 'BLOCKER', phone: '+250780000002', email: 'blocker1@guraaha.test', first: 'Jean',   last: 'Habimana' },
  { key: 'blocker2', role: 'BLOCKER', phone: '+250780000003', email: 'blocker2@guraaha.test', first: 'Aline',  last: 'Uwase' },
  { key: 'user1',    role: 'USER',    phone: '+250780000004', email: 'user1@guraaha.test',    first: 'Eric',   last: 'Mugisha' },
  { key: 'user2',    role: 'USER',    phone: '+250780000005', email: 'user2@guraaha.test',    first: 'Grace',  last: 'Ingabire' },
];

const BLOCKERS = [
  { key: 'blocker1', nationalId: '1199080000000001', code: 'BLK001' },
  { key: 'blocker2', nationalId: '1199280000000002', code: 'BLK002' },
];

const LISTINGS = [
  { blocker: 'blocker1', village: 0, type: 'PLOT', status: 'APPROVED', upi: 'SEED-UPI-0001',
    titleEn: 'Residential plot near the main road', titleRw: 'Ikibanza cyo guturamo hafi y\'umuhanda',
    descEn: 'Flat plot, water and electricity nearby.', price: 18000000, size: 600, unit: 'sqm',
    owner: 'Patrick Niyonzima', ownerPhone: '+250780000010', reason: null },
  { blocker: 'blocker2', village: 1, type: 'HOUSE', status: 'APPROVED', upi: 'SEED-UPI-0002',
    titleEn: 'Three-bedroom family house', titleRw: 'Inzu y\'ibyumba bitatu',
    descEn: 'Fenced compound, tiled floors, quiet neighbourhood.', price: 55000000, size: 350, unit: 'sqm',
    owner: 'Claudine Mukamana', ownerPhone: '+250780000011', reason: null },
  { blocker: 'blocker1', village: 2, type: 'PLOT', status: 'PENDING', upi: 'SEED-UPI-0003',
    titleEn: 'Plot awaiting admin approval', titleRw: 'Ikibanza gitegereje kwemezwa',
    descEn: 'Use this one to test the admin approval flow.', price: 9500000, size: 400, unit: 'sqm',
    owner: 'Samuel Nkurunziza', ownerPhone: '+250780000012', reason: null },
  { blocker: 'blocker2', village: 0, type: 'FARM', status: 'REJECTED', upi: 'SEED-UPI-0004',
    titleEn: 'Farmland with missing documents', titleRw: 'Ubutaka bw\'ubuhinzi',
    descEn: 'Use this one to test the rejected state.', price: 7000000, size: 1.5, unit: 'ha',
    owner: 'Diane Uwimana', ownerPhone: '+250780000013', reason: 'Ownership document is unreadable' },
];

export async function seedDev(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const roles = await client.query('SELECT id, name FROM roles');
    const roleId: Record<string, number> = Object.fromEntries(roles.rows.map((r) => [r.name, r.id]));

    const villages = await client.query(
      `SELECT id FROM locations WHERE level = 'VILLAGE' ORDER BY id LIMIT 3`
    );
    if (villages.rows.length < 3) {
      throw new Error('No villages found. Run "npm run seedlocations" first.');
    }
    const villageIds: string[] = villages.rows.map((v) => v.id);

    const hash = await bcrypt.hash(DEV_PASSWORD, 12);

    const userIds: Record<string, string> = {};
    for (const u of USERS) {
      const res = await client.query(
        `INSERT INTO users (role_id, phone, email, password_hash, first_name, last_name, phone_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
         RETURNING id`,
        [roleId[u.role], u.phone, u.email, hash, u.first, u.last]
      );
      userIds[u.key] = res.rows[0].id;
    }

    const blockerIds: Record<string, string> = {};
    for (const [i, b] of BLOCKERS.entries()) {
      const res = await client.query(
        `INSERT INTO blocker_profiles
           (user_id, national_id, operating_location_id, verification_code, status, reviewed_by, reviewed_at, approved_at)
         VALUES ($1, $2, $3, $4, 'APPROVED', $5, NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id`,
        [userIds[b.key], b.nationalId, villageIds[i], b.code, userIds.admin]
      );
      blockerIds[b.key] = res.rows[0].id;
    }

    let created = 0;
    for (const l of LISTINGS) {
      const exists = await client.query('SELECT 1 FROM listings WHERE upi_number = $1', [l.upi]);
      if (exists.rows.length > 0) continue;

      const reviewed = l.status !== 'PENDING';
      const approved = l.status === 'APPROVED';
      await client.query(
        `INSERT INTO listings
           (blocker_id, village_id, type, title_en, title_rw, description_en, price_rwf,
            size_value, size_unit, upi_number, owner_name, owner_phone, status,
            rejection_reason, reviewed_by, reviewed_at, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          blockerIds[l.blocker], villageIds[l.village], l.type, l.titleEn, l.titleRw, l.descEn, l.price,
          l.size, l.unit, l.upi, l.owner, l.ownerPhone, l.status, l.reason,
          reviewed ? userIds.admin : null,
          reviewed ? new Date() : null,
          approved ? new Date() : null,
        ]
      );
      created++;
    }

    await client.query('COMMIT');
    console.log(`Dev seed complete (${created} new listings). Password for all seed users: ${DEV_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDev()
    .then(() => db.end())
    .catch(async (err) => {
      console.error('Dev seed failed:', err);
      await db.end();
      process.exit(1);
    });
}
