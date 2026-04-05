const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5433,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '1234',
    database: process.env.PGDATABASE || 'school_portal'
});

async function checkStatus() {
    try {
        console.log('🔍 PostgreSQL статусын тексеруде...');
        console.log('   Host:', process.env.PGHOST);
        console.log('   Port:', process.env.PGPORT);
        console.log('   User:', process.env.PGUSER);
        console.log('   Database:', process.env.PGDATABASE);
        
        const result = await pool.query('SELECT version();');
        console.log('\nPostgreSQL түрі:', result.rows[0].version);

        const userCount = await pool.query('SELECT COUNT(*) FROM users;');
        console.log('Пайдаланушылар саны:', userCount.rows[0].count);

        const users = await pool.query('SELECT id, email, full_name, role FROM users;');
        console.log('\nПайдаланушылар тізімі:');
        users.rows.forEach(u => {
            console.log(`  ${u.id}. ${u.email} - ${u.full_name} (${u.role})`);
        });

        await pool.end();
    } catch (err) {
        console.error('Қате:', err.message);
        process.exit(1);
    }
}

checkStatus();