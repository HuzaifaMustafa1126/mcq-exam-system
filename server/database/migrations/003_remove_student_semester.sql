-- Removes the retired semester field from existing MySQL 8+ databases.
-- Safe to run once or repeatedly: it only drops the column when present.
SET @semester_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'students'
    AND column_name = 'semester'
);

SET @remove_semester_sql := IF(
  @semester_column_exists > 0,
  'ALTER TABLE students DROP COLUMN semester',
  'SELECT 1'
);

PREPARE remove_semester_statement FROM @remove_semester_sql;
EXECUTE remove_semester_statement;
DEALLOCATE PREPARE remove_semester_statement;
