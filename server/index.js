const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ СТАТИКАЛЫҚ ФАЙЛДАРДЫ ӘЗІРЛЕУ
app.use(express.static(path.join(__dirname, '..')));

// PostgreSQL Pool
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5433,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '1234',
    database: process.env.PGDATABASE || 'school_portal'
});

pool.on('connect', () => {
    console.log('PostgreSQL коннекшн сәтті');
});

pool.on('error', (err) => {
    console.error('PostgreSQL қатесі:', err);
});

// JWT құпиялық кілті
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// ============ MIDDLEWARE ============

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token жоқ' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token жарамсыз' });
    }
};

const verifyAdmin = (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Рұқсат жоқ - Админ болу қажет' });
        }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Рөл тексерісі сәтсіз' });
    }
};

const verifyTeacher = (req, res, next) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: 'Рұқсат жоқ - Мұғалім болу қажет' });
        }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Мұғалім тексерісі сәтсіз' });
    }
};

// ============ API МАРШРУТТАРЫ ============

// ЛОГИН
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('[login] attempt:', { email });

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            console.log('[login] user not found for', email);
            return res.status(401).json({ error: 'Пайдаланушы табылмады' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            console.log('[login] invalid password for', email);
            return res.status(401).json({ error: 'Пароль қате' });
        }

        console.log('[login] success for', email);

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
                class_name: user.class_name,
                subject: user.subject
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// РЕГИСТРАЦИЯ
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Бұл email тіркелген' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, hashedPassword, email, 'student']
        );

        res.json({ message: 'Тіркелгі жасалды', user: result.rows[0] });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ПРОФИЛЬ
app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пайдаланушы табылмады' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ МҰҒАЛІМ: ӨЗІНІҢ ПӘНІ ============

app.get('/api/teacher/subject', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT subject FROM users WHERE id = $1 AND role = $2', 
            [req.user.id, 'teacher']
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Мұғалім табылмады' });
        }

        res.json({ subject: result.rows[0].subject });
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ ОҚУШЫЛАР ============

app.get('/api/students', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, class_name FROM users WHERE role = $1 ORDER BY full_name',
            ['student']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ МҰҒАЛІМДЕР ============

app.get('/api/teachers', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, full_name, subject FROM users WHERE role = $1 ORDER BY full_name',
            ['teacher']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ ҮЙТАПСЫРМАЛАРЫ ============

app.get('/api/homework', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM homework ORDER BY due_date');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

app.post('/api/homework', verifyToken, async (req, res) => {
    try {
        const { title, description, due_date } = req.body;
        const result = await pool.query(
            'INSERT INTO homework (title, description, due_date) VALUES ($1, $2, $3) RETURNING *',
            [title, description || '', due_date || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ БАҒАЛАР ============

// БАРЛЫҚ БАҒАЛАРДЫ АЛЫҢЫЗ (ФИЛЬТРЛЕУСІЗ)
app.get('/api/grades', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM grades ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get grades error:', err);
        res.status(500).json({ error: 'Бағаларды жүктеу сәтсіз' });
    }
});

// БАҒА ҚОСУ (МҰҒАЛІМ)
app.post('/api/grades', verifyToken, verifyTeacher, async (req, res) => {
    try {
        const { student_email, subject, grade, term } = req.body;

        // БАҒА ВАЛИДАЦИЯСЫ
        const gradeNum = parseInt(grade);
        if (!grade || isNaN(gradeNum) || gradeNum < 1 || gradeNum > 5) {
            return res.status(400).json({ 
                error: 'Баға 1-5 аралығында болуы тиіс!' 
            });
        }

        // МҰҒАЛІМНІҢ ПӘНІН ТЕКСЕРУ
        const teacherResult = await pool.query(
            'SELECT subject FROM users WHERE id = $1 AND role = $2',
            [req.user.id, 'teacher']
        );

        if (teacherResult.rows.length === 0) {
            return res.status(403).json({ error: 'Мұғалім табылмады' });
        }

        const teacherSubject = teacherResult.rows[0].subject;

        if (subject !== teacherSubject) {
            return res.status(403).json({ 
                error: `Сіз тек ${teacherSubject} пәнінен баға қоя аласыз.` 
            });
        }

        const result = await pool.query(
            'INSERT INTO grades (student_email, subject, grade, term, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [student_email, subject, gradeNum, term || 'year']
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Grade error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ ЖУРНАЛ ============

app.get('/api/journal', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM journal ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

app.post('/api/journal', verifyToken, async (req, res) => {
    try {
        const { student_email, note, date } = req.body;
        const result = await pool.query(
            'INSERT INTO journal (student_email, note, date) VALUES ($1, $2, $3) RETURNING *',
            [student_email, note, date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ ЖАҢАЛЫҚТАР ============

app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

app.post('/api/news', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { title, description, image } = req.body;
        const result = await pool.query(
            'INSERT INTO news (title, description, image) VALUES ($1, $2, $3) RETURNING *',
            [title, description || '', image || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

// ============ АДМИН: ПАЙДАЛАНУШЫЛАР ============

app.post('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { email, password, full_name, role, class_name, subject } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Барлық өрістерді толтырыңыз' });
        }

        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Бұл email бұрын тіркелген' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password, full_name, role, class_name, subject) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, role, class_name, subject, created_at',
            [email, hashedPassword, full_name, role, class_name || null, subject || null]
        );

        res.status(201).json({
            message: 'Пайдаланушы сәтті қосылды',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Add user error:', err);
        res.status(500).json({ error: 'Сервер қатесі: ' + err.message });
    }
});

app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, class_name, subject, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});

app.delete('/api/admin/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пайдаланушы табылмады' });
        }

        res.json({ message: 'Пайдаланушы өшірілді' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Сервер қатесі' });
    }
});





// ============ SPA: БАРЛЫҚ ӨЗГЕ БЕТТЕРГЕ ИНДЕКСІ ҚАЙТАРУ ============

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ============ ПОРТТЫ ІСКЕ ҚОСУ ============

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Сервер ${PORT}-портында іске қосылды`);
});