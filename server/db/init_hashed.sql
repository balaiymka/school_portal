-- DB initialization with bcrypt-hashed passwords (for direct import)
-- Use this file if you prefer the SQL to contain hashed passwords and avoid runtime migration.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student',
  class_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  subject TEXT,
  img TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed data (hashed passwords)
INSERT INTO users (username, email, password, full_name, role, class_name)
VALUES
  ('admin', 'admin@test.com', '$2a$10$QGzCwngVmBGrI/3twwngpOfhbQCx/cFuHqOQhQVvFrmfgANrfI.L2', 'Жүйе әкімшісі', 'admin', NULL)
  ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password, full_name, role, class_name)
VALUES
  ('Balaiym', 'balaiym@test.com', '$2a$10$QGzCwngVmBGrI/3twwngpOfhbQCx/cFuHqOQhQVvFrmfgANrfI.L2', 'Жамауқұл Балайым', 'student', '11 A')
  ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password, full_name, role, class_name)
VALUES
  ('aigul_teacher', 'aigul@test.com', '$2a$10$5epROcI5PD004LxnbcJrd./CwJNCOM0cIR3ytUemJ0f/sdX0kBSH6', 'Айгүл Төлеубекова', 'teacher', NULL)
  ON CONFLICT (username) DO NOTHING;

-- End of init_hashed.sql

-- Seed sample news
INSERT INTO news (title, date, image)
VALUES
  ('Спорттық жарыс', '20 сәуір 2025', 'photo/news.jpg') ON CONFLICT DO NOTHING,
  ('Ғылыми апталық', '18 ақпан 2026', 'photo/gylym.png') ON CONFLICT DO NOTHING,
  ('Мектеп концерті', '5 наурыз 2026', 'photo/consert.png') ON CONFLICT DO NOTHING;

-- Seed sample teachers
INSERT INTO teachers (name, position, subject, img, contact)
VALUES
  ('Айгүл Төлеубекова', 'Директордың оқу ісі жөніндегі орынбасары', 'Қазақ тілі мен әдебиеті', 'photo/apai1.png', '' ) ON CONFLICT DO NOTHING,
  ('Ержан Бекжанов', 'Жоғары санатты мұғалім', 'Физика', 'photo/apai2.png', '') ON CONFLICT DO NOTHING;

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT,
  term TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Journal table
CREATE TABLE IF NOT EXISTS journal (
  id SERIAL PRIMARY KEY,
  student_email TEXT NOT NULL,
  note TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Additional tables: classes, subjects, schedule, attendance, notifications
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id INTEGER REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id),
  subject_id INTEGER REFERENCES subjects(id),
  weekday INTEGER, -- 0=Sun..6=Sat
  time TEXT,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_email TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT, -- present/absent/late
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sample subjects and classes
INSERT INTO subjects (name) VALUES ('Алгебра') ON CONFLICT DO NOTHING;
INSERT INTO subjects (name) VALUES ('Геометрия') ON CONFLICT DO NOTHING;
INSERT INTO classes (name, teacher_id) VALUES ('11 A', NULL) ON CONFLICT DO NOTHING;
