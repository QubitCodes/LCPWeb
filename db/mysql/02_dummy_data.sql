-- ====================================================================================
-- MYSQL DUMMY DATA SCRIPT
-- Assumes schema is created. 
-- ====================================================================================

-- 1. Create a Company
INSERT IGNORE INTO companies (id, name, registration_number, contact_email, contact_phone, status)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BuildCorp Global', 'REG-101', 'info@buildcorp.com', '555-0100', 'ACTIVE');

-- 2. Create Users (Supervisor & Worker)
INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash, role, company_id, years_experience)
VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'John', 'Supervisor', 'supervisor@buildcorp.com', '$2a$10$EpTh.sXz./g5e.i.z.k.u.x.y.z.A.B.C.D.E.F.G.H.I.J.K.L', 'SUPERVISOR', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 10),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Bob', 'Worker', 'worker@buildcorp.com', '$2a$10$EpTh.sXz./g5e.i.z.k.u.x.y.z.A.B.C.D.E.F.G.H.I.J.K.L', 'WORKER', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2);

-- 3. Create a Job
-- Find Category ID first or insert specific UUID if known. Here we reuse known UUIDs if possible or select subquery style isn't great for UUID in MySQL inserts easily without vars.
-- We will insert a category with known ID to make this script idempotent and safe.
INSERT IGNORE INTO categories (id, name) VALUES ('cat-uuid-001', 'Construction');

INSERT IGNORE INTO jobs (id, name, category_id)
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Masonry Expert', 'cat-uuid-001');

-- 4. Create a Course
INSERT IGNORE INTO courses (id, job_id, title, description, is_active)
VALUES 
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Certified Masonry Professional', 'Complete guide to masonry.', TRUE);

-- 5. Create Course Levels
INSERT IGNORE INTO course_levels (id, course_id, level_number, title, completion_window_days, fast_track_experience_required)
VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 1, 'Foundation', 30, 0),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 2, 'Intermediate', 45, 5);

-- 6. Create Content Items for Level 1
-- Video
INSERT IGNORE INTO content_items (id, course_level_id, title, type, sequence_order, video_url, video_duration_seconds, min_watch_percentage)
VALUES
('g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Intro to Bricks', 'VIDEO', 1, 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 600, 90);

-- Quiz
INSERT IGNORE INTO content_items (id, course_level_id, title, type, sequence_order, passing_score, max_attempts_allowed)
VALUES
('g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Safety Quiz', 'QUESTIONNAIRE', 2, 80, 3);

-- 7. Add Questions to Quiz
INSERT IGNORE INTO questions (id, content_item_id, text, type, points, sequence_order)
VALUES
('h1eebc99-9c0b-4ef8-bb6d-6bb9bd380b00', 'g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'What should you wear on head?', 'MCQ', 10, 1);

INSERT IGNORE INTO question_options (id, question_id, text, is_correct, order_seq)
VALUES
(UUID(), 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380b00', 'Hard Hat', TRUE, 1),
(UUID(), 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380b00', 'Cap', FALSE, 2);

-- 8. Create Active Enrollment for Worker Bob
INSERT IGNORE INTO orders (id, user_id, company_id, total_amount, status)
VALUES
('i1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 50.00, 'PAID');

INSERT IGNORE INTO level_enrollments (id, worker_id, course_level_id, start_date, deadline_date, status)
VALUES
('j1eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'ACTIVE');

-- 9. Initialize Progress (Unlocked first video)
INSERT IGNORE INTO content_progress (id, worker_id, enrollment_id, content_item_id, status, watch_percentage)
VALUES
(UUID(), 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'UNLOCKED', 0);
