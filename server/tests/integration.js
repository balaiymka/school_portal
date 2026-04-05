// Simple integration test: register -> login -> seeded login (migration)
const fetch = global.fetch || require('node-fetch');
const assert = require('assert');

const BASE = process.env.TEST_BASE || 'http://localhost:5001';

async function post(path, body) {
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = text; }
  return { status: res.status, body: json };
}

async function run() {
  console.log('Integration test hitting', BASE);

  // 1) Register a unique user
  const u = { email: 'testuser+' + Date.now() + '@example.com', password: 'pw123' };
  const r1 = await post('/api/register', u);
  console.log('/api/register', r1.status, r1.body);
  assert(r1.status === 200 || r1.status === 201, 'register failed');

  // 2) Login with that user
  const r2 = await post('/api/login', u);
  console.log('/api/login', r2.status, r2.body);
  assert(r2.status === 200, 'login failed');

  // 3) Login with seeded user to ensure migration works (if DB-backed)
  const r3 = await post('/api/login', { email: 'balaiym@test.com', password: '123' });
  console.log('seeded login', r3.status, r3.body);
  assert(r3.status === 200, 'seeded login failed');

  console.log('Integration tests passed.');
}

run().catch(err => { console.error('Integration test failed:', err.message || err); process.exit(1); });
