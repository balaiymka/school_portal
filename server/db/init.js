const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5433,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '1234',
    database: process.env.PGDATABASE || 'school_portal'
});

async function initDatabase() {
    try {
        console.log('Postgres қосулуда:', {
            host: process.env.PGHOST,
            port: process.env.PGPORT,
            user: process.env.PGUSER,
            database: process.env.PGDATABASE
        });

        const result = await pool.query('SELECT NOW()');
        console.log('PostgreSQL коннекшн сәтті:', result.rows[0]);

        // ============ КЕСТЕЛЕРДІ ПҰЛДАТЫҢЫЗ ============
        console.log('Қоршалған кестелерді өшіруде...');
        
        await pool.query('DROP TABLE IF EXISTS grades CASCADE');
        await pool.query('DROP TABLE IF EXISTS journal CASCADE');
        await pool.query('DROP TABLE IF EXISTS homework CASCADE');
        await pool.query('DROP TABLE IF EXISTS news CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');

        // ============ USERS КЕСТЕСІ ============
        console.log('Users кестесі жасалуда...');
        
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
                class_name VARCHAR(50),
                subject VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_role ON users(role);
        `);

        // ============ HOMEWORK КЕСТЕСІ ============
        console.log('Homework кестесі жасалуда...');
        
        await pool.query(`
            CREATE TABLE homework (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============ GRADES КЕСТЕСІ ============
        console.log('Grades кестесі жасалуда...');
        
        await pool.query(`
            CREATE TABLE grades (
                id SERIAL PRIMARY KEY,
                student_email VARCHAR(255),
                subject VARCHAR(100),
                grade VARCHAR(10),
                term VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX idx_grades_student ON grades(student_email);
            CREATE INDEX idx_grades_date ON grades(created_at);
        `);

        // ============ JOURNAL КЕСТЕСІ ============
        console.log('Journal кестесі жасалуда...');
        
        await pool.query(`
            CREATE TABLE journal (
                id SERIAL PRIMARY KEY,
                student_email VARCHAR(255),
                note TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX idx_journal_student ON journal(student_email);
        `);

        // ============ NEWS КЕСТЕСІ ============
        console.log('News кестесі жасалуда...');
        
        await pool.query(`
            CREATE TABLE news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                description TEXT,
                image VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ============ ПАЙДАЛАНУШЫЛАР ҚОСУ ============
        console.log('Пайдаланушыларды қосуда...');
        
        const hash123 = '$2a$10$QGzCwngVmBGrI/3twwngpOfhbQCx/cFuHqOQhQVvFrmfgANrfI.L2';
        const hash777 = '$2a$10$5epROcI5PD004LxnbcJrd./CwJNCOM0cIR3ytUemJ0f/sdX0kBSH6';

        await pool.query(`
            INSERT INTO users (email, password, full_name, role, class_name, subject) VALUES
            ('admin@test.com', $1, 'Системалық Әкімші', 'admin', NULL, NULL),
            ('balaiym@test.com', $2, 'Жамауқұл Балайым', 'student', '11 А', NULL),
            ('arujan@test.com', $2, 'Аружан Сәдуақас', 'student', '11 А', NULL),
            ('bolat@test.com', $2, 'Болат Ибрагим', 'student', '11 А', NULL),
            ('dauren@test.com', $2, 'Дәурен Мырзатай', 'student', '11 А', NULL),
            ('aigul@test.com', $3, 'Айгүл Төлеубекова', 'teacher', NULL, 'Қазақ тілі'),
            ('bakchaev@test.com', $2, 'Бахтыжан Бәккешев', 'teacher', NULL, 'Физика'),
            ('aliekbar@test.com', $2, 'Әлиқбар Сәмеев', 'teacher', NULL, 'Математика'),
            ('meruyert@test.com', $2, 'Меруерт Сапарова', 'teacher', NULL, 'Химия'),
            ('almira@test.com', $2, 'Алмира Ақмолдаева', 'teacher', NULL, 'Биология'),
            ('kairat@test.com', $2, 'Қайрат Болатов', 'teacher', NULL, 'Тарих'),
            ('meruert@test.com', $2, 'Меруерт Грей', 'teacher', NULL, 'Ағылшын тілі'),
            ('dauren2@test.com', $2, 'Дәурен Оспанов', 'teacher', NULL, 'Информатика'),
            ('serik@test.com', $2, 'Серік Қанат', 'teacher', NULL, 'Дене шынықтыру'),
            ('lazzat@test.com', $2, 'Ләззат Нұртас', 'teacher', NULL, 'Өзін-өзі тану'),
            ('bakyт@test.com', $2, 'Бақыт Искаков', 'teacher', NULL, 'География')
        `, [hash123, hash123, hash777]);

        // ============ ТЕСТІЛІК БАҒАЛАР - БАЛАЙЫМ ============
        console.log('Тестілік бағалар қосулуда...');
        
        await pool.query(`
            INSERT INTO grades (student_email, subject, grade, term, created_at) VALUES
            -- 1-ТОҚСАН
            ('balaiym@test.com', 'Қазақ тілі', '5', '1', NOW() - INTERVAL '5 days'),
            ('balaiym@test.com', 'Математика', '4', '1', NOW() - INTERVAL '4 days'),
            ('balaiym@test.com', 'Физика', '5', '1', NOW() - INTERVAL '3 days'),
            ('balaiym@test.com', 'Химия', '4', '1', NOW() - INTERVAL '2 days'),
            ('balaiym@test.com', 'Биология', '5', '1', NOW() - INTERVAL '1 day'),
            ('balaiym@test.com', 'Тарих', '3', '1', NOW()),
            
            -- 2-ТОҚСАН
            ('balaiym@test.com', 'Қазақ тілі', '4', '2', NOW() - INTERVAL '10 days'),
            ('balaiym@test.com', 'Математика', '5', '2', NOW() - INTERVAL '9 days'),
            ('balaiym@test.com', 'Физика', '3', '2', NOW() - INTERVAL '8 days'),
            ('balaiym@test.com', 'Химия', '4', '2', NOW() - INTERVAL '7 days'),
            
            -- 3-ТОҚСАН
            ('balaiym@test.com', 'Қазақ тілі', '5', '3', NOW() - INTERVAL '20 days'),
            ('balaiym@test.com', 'Математика', '4', '3', NOW() - INTERVAL '19 days'),
            
            -- 4-ТОҚСАН
            ('balaiym@test.com', 'Қазақ тілі', '5', '4', NOW() - INTERVAL '30 days'),
            
            -- ЖЫЛДЫҚ
            ('balaiym@test.com', 'Қазақ тілі', '4', 'year', NOW() - INTERVAL '35 days'),
            ('balaiym@test.com', 'Математика', '4', 'year', NOW() - INTERVAL '34 days'),
            ('balaiym@test.com', 'Физика', '4', 'year', NOW() - INTERVAL '33 days'),
            ('balaiym@test.com', 'Химия', '4', 'year', NOW() - INTERVAL '32 days')
        `);

        // ============ ТЕСТІЛІК ҮЙТАПСЫРМАЛАР ============
        console.log('Тестілік үйтапсырмалар қосулуда...');
        
        await pool.query(`
            INSERT INTO homework (title, description, due_date) VALUES
            ('Алгебра бөлімі 5.1', 'Есептер 1-15 беттің 5-тен 12-ке дейін орындаңыз', CURRENT_DATE + INTERVAL '2 days'),
            ('Қазақ тілі эссе', 'Өмірдің мағынасы туралы эссе жазыңыз (500 сөз)', CURRENT_DATE + INTERVAL '3 days'),
            ('Физика есептемесі', 'Механика тарауындағы барлық формулаларды есептеңіз', CURRENT_DATE + INTERVAL '5 days'),
            ('Қимия лабораториялық', 'Оксид реакциясын жүргізіп есептемесін құрыңыз', CURRENT_DATE + INTERVAL '7 days'),
            ('Сәл еңбек жобасы', 'Өндіктеу жобасын дайындап ұсындыңыз', CURRENT_DATE + INTERVAL '10 days')
        `);

        // ============ ТЕСТІЛІК ЖУРНАЛ ЖАЗБАЛАРЫ ============
        console.log('Тестілік журнал жазбалары қосулуда...');
        
        await pool.query(`
            INSERT INTO journal (student_email, note, date) VALUES
            ('balaiym@test.com', 'Сынақ жұмысы ең жақсы бағамен аяқталды!', NOW() - INTERVAL '10 days'),
            ('balaiym@test.com', 'Математика сабағына қатысты дерек беріңіз', NOW() - INTERVAL '5 days'),
            ('balaiym@test.com', 'Тамаша оқу ұлгерімін көрсету үшін сертификат беріледі', NOW() - INTERVAL '2 days'),
            ('arujan@test.com', 'Физика практикасына қатысты барлығы бітіп барады', NOW() - INTERVAL '3 days'),
            ('bolat@test.com', 'Сынақ жұмысында 5 баға алды', NOW() - INTERVAL '1 day')
        `);

        // ============ ТЕСТІЛІК ЖАҢАЛЫҚТАР ============
        console.log('Тестілік жаңалықтар қосулуда...');
        
        await pool.query(`
            INSERT INTO news (title, description, image) VALUES
            ('Облыстық олимпиада 2026', 'Сарышаған мектебінің оқушылары облыстық олимпиадада екінші орын алды!', 'https://via.placeholder.com/400x200?text=Olympiad'),
            ('Жаңа IT класс ашылды', 'Мектебіміздің 21-ге дейін компьютерлік класс пайда болды', 'https://via.placeholder.com/400x200?text=IT+Class'),
            ('Жаңа жыл тойы', 'Бәрінің жаңа жылын құттықтаймыз!', 'https://via.placeholder.com/400x200?text=New+Year'),
            ('Балалар өндіктеме фестивалі', 'Мектебіндегі балалар өндіктеме жобаларын көрсетті', 'https://via.placeholder.com/400x200?text=Projects'),
            ('Спорттық байқау', 'Барлық сыныптарда спорттық байқау 15 сәуеде өтіп жатыр', 'https://via.placeholder.com/400x200?text=Sports')
        `);

        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const gradeCount = await pool.query('SELECT COUNT(*) FROM grades');
        const homeworkCount = await pool.query('SELECT COUNT(*) FROM homework');
        const journalCount = await pool.query('SELECT COUNT(*) FROM journal');
        const newsCount = await pool.query('SELECT COUNT(*) FROM news');

        console.log('\n' + '='.repeat(60));
        console.log('БА БӘРІ СӘТТІ ОРНАТЫЛДЫ!');
        console.log('='.repeat(60));
        console.log('\nСТАТИСТИКА:');
        console.log(`  Пайдаланушылар: ${userCount.rows[0].count}`);
        console.log(`  Бағалар: ${gradeCount.rows[0].count}`);
        console.log(`  Үйтапсырмалар: ${homeworkCount.rows[0].count}`);
        console.log(`  Журнал жазбалары: ${journalCount.rows[0].count}`);
        console.log(`  Жаңалықтар: ${newsCount.rows[0].count}`);

        const users = await pool.query('SELECT id, email, full_name, role, subject FROM users ORDER BY id');
        console.log('\nПАЙДАЛАНУШЫЛАР:');
        users.rows.forEach(u => {
            const subjectInfo = u.subject ? ` - ${u.subject}` : '';
            console.log(`  ${u.id}. ${u.email.padEnd(25)} - ${u.full_name.padEnd(30)} (${u.role})${subjectInfo}`);
        });

        console.log('\nЛОГИН МӘЛІМЕТТЕРІ:');
        console.log('  АДМИН: admin@test.com / 123');
        console.log('  ОҚУШЫ: balaiym@test.com / 123');
        console.log('  ОҚУШЫ: arujan@test.com / 123');
        console.log('  ОҚУШЫ: bolat@test.com / 123');
        console.log('  ОҚУШЫ: dauren@test.com / 123');
        console.log('\n  ҰСТАЗ:');
        console.log('     Айгүл (Қазақ тілі): aigul@test.com / 777');
        console.log('     Бахтыжан (Физика): bakchaev@test.com / 123');
        console.log('     Әлиқбар (Математика): aliekbar@test.com / 123');
        console.log('     Меруерт (Химия): meruyert@test.com / 123');
        console.log('     Алмира (Биология): almira@test.com / 123');
        console.log('     Қайрат (Тарих): kairat@test.com / 123');
        console.log('     Меруерт (Ағылшын тілі): meruert@test.com / 123');
        console.log('     Дәурен (Информатика): dauren2@test.com / 123');
        console.log('     Серік (Дене шынықтыру): serik@test.com / 123');
        console.log('     Ләззат (Өзін-өзі тану): lazzat@test.com / 123');
        console.log('     Бақыт (География): bakyт@test.com / 123');

        console.log('\n' + '='.repeat(60));
        console.log('WEB АДРЕСІ: http://localhost:5001');
        console.log('='.repeat(60) + '\n');

        await pool.end();
        console.log('База орнатылды және коннекшн жабылды!');
    } catch (err) {
        console.error('ҚАТЕ:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

initDatabase();