// Reset DB: drop users table if exists, then run init.sql
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
try { require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') }); } catch (e) {}

const cfg = {
  user: process.env.PGUSER || process.env.PG_USER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || process.env.PG_DATABASE || 'school_portal',
  password: process.env.PGPASSWORD || process.env.PG_PASSWORD || '',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
};

async function run() {
  const sqlPath = path.join(__dirname, 'init.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('init.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool(cfg);
  const client = await pool.connect();
  try {
    console.log('Dropping users table if exists...');
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('Running init.sql...');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Reset completed.');
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Reset failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end().catch(()=>{});
  }
}

run().catch(err => { console.error('Unexpected reset error:', err.message || err); process.exit(99); });
