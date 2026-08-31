-- Adds the student profile fields used by the Student Management API.
-- Run this once for databases created with an earlier version of schema.sql.

ALTER TABLE students
  ADD COLUMN registration_number VARCHAR(50) NULL AFTER student_number,
  ADD COLUMN section VARCHAR(30) NULL AFTER registration_number,
  ADD COLUMN `session` VARCHAR(30) NULL AFTER section,
  ADD COLUMN phone VARCHAR(30) NULL AFTER `session`;
