import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../config/database';

const DATA_PATH = path.resolve(__dirname, '../data/rwanda-administrative.json');

const BATCH_SIZE = 1000;

type LocationLevel = 'PROVINCE' | 'DISTRICT' | 'SECTOR' | 'CELL' | 'VILLAGE';

interface LocationRow {
  id: string;
  parentId: string | null;
  level: LocationLevel;
  name: string;
  code: string | null;
}

interface VillageJson {
  id: string;
  name: string;
  nep?: string;
}

interface CellJson {
  id: string;
  name: string;
  villages: VillageJson[];
}

interface SectorJson {
  id: string;
  name: string;
  cells: CellJson[];
}

interface DistrictJson {
  id: string;
  name: string;
  sectors: SectorJson[];
}

interface ProvinceJson {
  id: string;
  name: string;
  districts: DistrictJson[];
}

interface RwandaAdminJson {
  country: string;
  provinces: ProvinceJson[];
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildRows(data: RwandaAdminJson): LocationRow[] {
  const rows: LocationRow[] = [];

  for (const province of data.provinces) {
    const provinceId = randomUUID();
    rows.push({
      id: provinceId,
      parentId: null,
      level: 'PROVINCE',
      name: province.name,
      code: slugify(province.name),
    });

    for (const district of province.districts) {
      const districtId = randomUUID();
      rows.push({
        id: districtId,
        parentId: provinceId,
        level: 'DISTRICT',
        name: district.name,
        code: slugify(district.name),
      });

      for (const sector of district.sectors) {
        const sectorId = randomUUID();
        rows.push({
          id: sectorId,
          parentId: districtId,
          level: 'SECTOR',
          name: sector.name,
          code: slugify(sector.name),
        });

        for (const cell of sector.cells) {
          const cellId = randomUUID();
          rows.push({
            id: cellId,
            parentId: sectorId,
            level: 'CELL',
            name: cell.name,
            code: slugify(cell.name),
          });

          for (const village of cell.villages) {
            rows.push({
              id: randomUUID(),
              parentId: cellId,
              level: 'VILLAGE',
              name: village.name,
              code: village.id.replace(/^village-/, ''),
            });
          }
        }
      }
    }
  }

  return rows;
}

async function insertBatch(
  client: { query: typeof db.query },
  rows: LocationRow[]
) {
  const placeholders: string[] = [];
  const values: unknown[] = [];

  rows.forEach((row, i) => {
    const base = i * 5;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
    );
    values.push(row.id, row.parentId, row.level, row.name, row.code);
  });

  await client.query(
    `INSERT INTO locations (id, parent_id, level, name, code) VALUES ${placeholders.join(', ')}`,
    values
  );
}

async function seedLocations() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data: RwandaAdminJson = JSON.parse(raw);

  const rows = buildRows(data);
  console.log(`Prepared ${rows.length} location rows. Inserting...`);

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await insertBatch(client, rows.slice(i, i + BATCH_SIZE));
      console.log(`  inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }

    await client.query('COMMIT');
    console.log('Done.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedLocations()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    // Standalone script — close the pool so the process actually exits.
    // Don't reuse this pattern if this file is ever imported into the
    // long-running server instead of run standalone.
    void db.end();
  });