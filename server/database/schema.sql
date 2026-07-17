-- Online MCQ Examination System schema
-- MySQL 8.0+ | utf8mb4 | InnoDB

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'Store a bcrypt/argon2 hash only; never plaintext passwords.',
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  student_number VARCHAR(50) NOT NULL,
  enrollment_year SMALLINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_user_id (user_id),
  UNIQUE KEY uq_students_student_number (student_number),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teachers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  employee_number VARCHAR(50) NOT NULL,
  department VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teachers_user_id (user_id),
  UNIQUE KEY uq_teachers_employee_number (employee_number),
  CONSTRAINT fk_teachers_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subjects_code (code),
  KEY idx_subjects_teacher_id (teacher_id),
  KEY idx_subjects_status (status),
  CONSTRAINT fk_subjects_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id BIGINT UNSIGNED NOT NULL,
  created_by_teacher_id BIGINT UNSIGNED NULL,
  question_text TEXT NOT NULL,
  explanation TEXT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  marks DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  negative_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_questions_subject_status (subject_id, status),
  KEY idx_questions_created_by_teacher (created_by_teacher_id),
  CONSTRAINT fk_questions_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE RESTRICT,
  CONSTRAINT fk_questions_created_by_teacher
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers (id) ON DELETE SET NULL,
  CONSTRAINT chk_questions_marks CHECK (marks >= 0 AND negative_marks >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_question_options_order (question_id, display_order),
  KEY idx_question_options_question_correct (question_id, is_correct),
  CONSTRAINT fk_question_options_question
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id BIGINT UNSIGNED NOT NULL,
  created_by_teacher_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  total_marks DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pass_marks DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  status ENUM('draft', 'published', 'active', 'closed', 'archived') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_exams_subject_status (subject_id, status),
  KEY idx_exams_teacher_id (created_by_teacher_id),
  KEY idx_exams_schedule (starts_at, ends_at),
  CONSTRAINT fk_exams_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE RESTRICT,
  CONSTRAINT fk_exams_created_by_teacher
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers (id) ON DELETE SET NULL,
  CONSTRAINT chk_exams_duration CHECK (duration_minutes > 0),
  CONSTRAINT chk_exams_attempts CHECK (max_attempts > 0),
  CONSTRAINT chk_exams_marks CHECK (total_marks >= 0 AND pass_marks >= 0),
  CONSTRAINT chk_exams_schedule CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  exam_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  marks DECIMAL(8,2) NOT NULL,
  negative_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_exam_questions_question (exam_id, question_id),
  UNIQUE KEY uq_exam_questions_order (exam_id, display_order),
  KEY idx_exam_questions_question_id (question_id),
  CONSTRAINT fk_exam_questions_exam
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_questions_question
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE RESTRICT,
  CONSTRAINT chk_exam_questions_marks CHECK (marks >= 0 AND negative_marks >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_exams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  exam_id BIGINT UNSIGNED NOT NULL,
  attempt_number TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('not_started', 'in_progress', 'submitted', 'expired') NOT NULL DEFAULT 'not_started',
  started_at DATETIME NULL,
  submitted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_exams_attempt (student_id, exam_id, attempt_number),
  KEY idx_student_exams_exam_status (exam_id, status),
  KEY idx_student_exams_student_status (student_id, status),
  CONSTRAINT fk_student_exams_student
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_student_exams_exam
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT chk_student_exams_attempt CHECK (attempt_number > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_answers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_exam_id BIGINT UNSIGNED NOT NULL,
  exam_question_id BIGINT UNSIGNED NOT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  is_correct BOOLEAN NULL,
  marks_awarded DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  answered_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_answers_exam_question (student_exam_id, exam_question_id),
  KEY idx_student_answers_exam_question (exam_question_id),
  KEY idx_student_answers_selected_option (selected_option_id),
  CONSTRAINT fk_student_answers_student_exam
    FOREIGN KEY (student_exam_id) REFERENCES student_exams (id) ON DELETE CASCADE,
  CONSTRAINT fk_student_answers_exam_question
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_student_answers_selected_option
    FOREIGN KEY (selected_option_id) REFERENCES question_options (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE results (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_exam_id BIGINT UNSIGNED NOT NULL,
  total_questions SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  attempted_questions SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  correct_answers SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  incorrect_answers SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  unattempted_answers SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('pass', 'fail', 'pending') NOT NULL DEFAULT 'pending',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_results_student_exam (student_exam_id),
  KEY idx_results_status (status),
  CONSTRAINT fk_results_student_exam
    FOREIGN KEY (student_exam_id) REFERENCES student_exams (id) ON DELETE CASCADE,
  CONSTRAINT chk_results_counts CHECK (
    total_questions >= attempted_questions
    AND attempted_questions = correct_answers + incorrect_answers
    AND total_questions = attempted_questions + unattempted_answers
  ),
  CONSTRAINT chk_results_percentage CHECK (percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
