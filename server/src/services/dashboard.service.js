import pool from '../config/db.js';

const getCount = async (query, values = []) => {
  const [rows] = await pool.execute(query, values);

  return Number(rows[0].total);
};

export const getDashboardMetrics = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalQuestions,
    totalExams,
    activeExams,
  ] = await Promise.all([
    getCount('SELECT COUNT(*) AS total FROM students'),
    getCount('SELECT COUNT(*) AS total FROM teachers'),
    getCount('SELECT COUNT(*) AS total FROM subjects'),
    getCount('SELECT COUNT(*) AS total FROM questions'),
    getCount('SELECT COUNT(*) AS total FROM exams'),
    getCount('SELECT COUNT(*) AS total FROM exams WHERE status = ?', ['active']),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalQuestions,
    totalExams,
    activeExams,
  };
};
