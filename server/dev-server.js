const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Development CORS: allow all origins for local testing
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory users for development (mirrors frontend sample)
const users = [
  { id: 1, username: 'admin', password: '123', full_name: 'Жүйе әкімшісі', role: 'admin' },
  { id: 2, username: 'Balaiym', password: '123', full_name: 'Жамауқұл Балайым', role: 'student', class_name: '11 A' },
  { id: 3, username: 'aigul_teacher', password: '777', full_name: 'Айгүл Төлеубекова', role: 'teacher', subject: 'Қазақ тілі' }
];

// Simple login endpoint using in-memory users
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // allow login by username or email (for dev we use username)
  const user = users.find(u => (u.username === email || u.email === email) );
  if (!user) return res.status(404).json({ error: 'Пайдаланушы табылмады!' });
  if (user.password !== password) return res.status(401).json({ error: 'Құпия сөз қате!' });

  // return safe user data
  const safe = { id: user.id, name: user.full_name || user.username, role: user.role, class: user.class_name };
  res.json({ message: 'Сәтті кірдіңіз!', user: safe });
});

// Simple register endpoint (development only)
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email және пароль қажет' });

  if (users.find(u => u.username === email || u.email === email)) {
    return res.status(409).json({ error: 'Пайдаланушы бар' });
  }

  const newUser = { id: users.length + 1, username: email, password, full_name: email, role: 'student' };
  users.push(newUser);
  res.json({ message: 'Пайдаланушы тіркелді', user: { id: newUser.id, name: newUser.full_name, role: newUser.role } });
});

// Return all users (safe view)
app.get('/api/users', (req, res) => {
  const safe = users.map(u => ({ id: u.id, username: u.username, full_name: u.full_name, role: u.role, class_name: u.class_name }));
  res.json(safe);
});

// Fallback to serve static files from project root (optional)
app.use('/', express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Dev server listening on http://localhost:${PORT}`);
});

// This file is a simple development server. If you want production-grade
// behavior (Postgres, authentication, sessions), we can wire that up later.
