-- Пайдаланушылар кестесі
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    class_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Үйтапсырмалары кестесі
CREATE TABLE IF NOT EXISTS homework (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Бағалар кестесі
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_email VARCHAR(255),
    subject VARCHAR(100),
    grade VARCHAR(10),
    term VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Журнал кестесі
CREATE TABLE IF NOT EXISTS journal (
    id SERIAL PRIMARY KEY,
    student_email VARCHAR(255),
    note TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Жаңалықтар кестесі
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексті қосу
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_email);
CREATE INDEX IF NOT EXISTS idx_journal_student ON journal(student_email);

-- Әдеттегі пайдаланушыларды қосу
INSERT INTO users (email, password, full_name, role) 
VALUES 
    ('admin@test.com', '$2a$10$P3R2qM8QJrVVvJTbZ5L4i.ZhfQxq8z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Системалық Әкімші', 'admin'),
    ('balaiym@test.com', '$2a$10$P3R2qM8QJrVVvJTbZ5L4i.ZhfQxq8z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Жамауқұл Балайым', 'student'),
    ('aigul@test.com', '$2a$10$P3R2qM8QJrVVvJTbZ5L4i.ZhfQxq8z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Айгүл Төлеубекова', 'teacher')
ON CONFLICT (email) DO NOTHING;


