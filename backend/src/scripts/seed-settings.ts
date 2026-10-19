import { db } from '../config/database';

interface DefaultSetting {
  key: string;
  value: string;
  description: string;
}

const defaultSettings: DefaultSetting[] = [
  {
    key: 'blocker_unlock_fee',
    value: '100',
    description: 'Fee in RWF to unlock blocker contact',
  },
  {
    key: 'owner_unlock_fee',
    value: '200',
    description: 'Fee in RWF to unlock owner contact',
  },
  {
    key: 'blocker_pro_weekly',
    value: '1500',
    description: 'Weekly subscription fee for Blocker Pro',
  },
  {
    key: 'blocker_pro_monthly',
    value: '5000',
    description: 'Monthly subscription fee for Blocker Pro',
  },
  {
    key: 'unlock_pass_weekly',
    value: '1000',
    description: 'Weekly pass for unlocking contacts',
  },
  {
    key: 'unlock_pass_monthly',
    value: '3500',
    description: 'Monthly pass for unlocking contacts',
  },
];

async function main() {
  console.log('Seeding settings...');

  for (const setting of defaultSettings) {
    await db.query(
      `
      INSERT INTO settings (key, value, description, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
      [setting.key, setting.value, setting.description]
    );

    console.log(`✓ Set ${setting.key} = ${setting.value}`);
  }

  console.log('Settings seeded successfully.');
}

main()
  .then(async () => {
    await db.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Error seeding settings:', e);
    await db.end().catch(() => {});
    process.exit(1);
  });
