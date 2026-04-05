// Seed users with bcrypt-hashed passwords (idempotent upsert)
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') }); } catch (e) {}

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ? Number(process.env.BCRYPT_SALT_ROUNDS) : 10;
const pool = new Pool({
  user: process.env.PGUSER || process.env.PG_USER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || process.env.PG_DATABASE || 'school_portal',
  password: process.env.PGPASSWORD || process.env.PG_PASSWORD || '',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});

const seeds = [
  { username: 'admin', email: 'admin@test.com', password: '123', full_name: 'Жүйе әкімшісі', role: 'admin', class_name: null },
  { username: 'Balaiym', email: 'balaiym@test.com', password: '123', full_name: 'Жамауқұл Балайым', role: 'student', class_name: '11 A' },
  { username: 'aigul_teacher', email: 'aigul@test.com', password: '777', full_name: 'Айгүл Төлеубекова', role: 'teacher', class_name: null },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of seeds) {
      const hash = await bcrypt.hash(s.password, SALT_ROUNDS);
      const q = `INSERT INTO users (username, email, password, full_name, role, class_name)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, full_name = EXCLUDED.full_name, role = EXCLUDED.role, class_name = EXCLUDED.class_name`;
      await client.query(q, [s.username, s.email, hash, s.full_name, s.role, s.class_name]);
      console.log('Upserted user', s.username);
    }
    await client.query('COMMIT');
    console.log('Seeding completed');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Seeding failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end().catch(()=>{});
  }
}

seed().catch(err => {
  console.error('Unexpected seed error:', err.message || err);
  process.exit(99);
});
