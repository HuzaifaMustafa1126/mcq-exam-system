ALTER TABLE student_exams
  ADD COLUMN expires_at DATETIME NULL AFTER started_at;
