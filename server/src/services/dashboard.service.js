import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

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

  const [registrationResult, performanceResult, studentsResult, teachersResult, examsResult] = await Promise.all([
    pool.execute(
      `SELECT DATE_FORMAT(created_at, '%b') AS label, COUNT(*) AS students
       FROM students
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
       ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`
    ),
    pool.execute(
      `SELECT exams.title AS label, COALESCE(ROUND(AVG(results.percentage), 2), 0) AS percentage
       FROM exams
       LEFT JOIN student_exams ON student_exams.exam_id = exams.id
       LEFT JOIN results ON results.student_exam_id = student_exams.id
       GROUP BY exams.id, exams.title
       ORDER BY exams.created_at DESC
       LIMIT 6`
    ),
    pool.execute(
      `SELECT users.name, students.student_number AS studentNumber, students.created_at AS createdAt
       FROM students INNER JOIN users ON users.id = students.user_id
       ORDER BY students.created_at DESC LIMIT 5`
    ),
    pool.execute(
      `SELECT users.name, teachers.employee_number AS employeeNumber, teachers.created_at AS createdAt
       FROM teachers INNER JOIN users ON users.id = teachers.user_id
       ORDER BY teachers.created_at DESC LIMIT 5`
    ),
    pool.execute(
      `SELECT exams.title, subjects.name AS subjectName, exams.status, exams.created_at AS createdAt
       FROM exams INNER JOIN subjects ON subjects.id = exams.subject_id
       ORDER BY exams.created_at DESC LIMIT 5`
    ),
  ]);
  const [studentRegistration] = registrationResult;
  const [examPerformance] = performanceResult;
  const [latestStudents] = studentsResult;
  const [latestTeachers] = teachersResult;
  const [latestExams] = examsResult;

  return {
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalQuestions,
    totalExams,
    activeExams,
    studentRegistration,
    examPerformance,
    recentActivity: {
      students: latestStudents,
      teachers: latestTeachers,
      exams: latestExams,
    },
  };
};

/** Dashboard deliberately uses the student profile id, never a supplied id. */
export const getStudentDashboard = async (userId) => {
  const [studentRows] = await pool.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
  if (!studentRows[0]) throw new AppError('Student profile not found', HTTP_STATUS.FORBIDDEN);
  const studentId = studentRows[0].id;
  const availableWhere = `exams.status IN ('published', 'active')
    AND (exams.starts_at IS NULL OR exams.starts_at <= NOW())
    AND (exams.ends_at IS NULL OR exams.ends_at >= NOW())`;
  const [availableRows, upcomingRows, completedRows, averageRows, recentRows] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS total FROM exams WHERE ${availableWhere}`),
    pool.execute(`SELECT COUNT(*) AS total FROM exams WHERE exams.status IN ('published', 'active') AND exams.starts_at > NOW()`),
    pool.execute(`SELECT COUNT(*) AS total FROM results INNER JOIN student_exams ON student_exams.id = results.student_exam_id WHERE student_exams.student_id = ?`, [studentId]),
    pool.execute(`SELECT COALESCE(ROUND(AVG(results.percentage), 2), 0) AS averageScore FROM results INNER JOIN student_exams ON student_exams.id = results.student_exam_id WHERE student_exams.student_id = ?`, [studentId]),
    pool.execute(`SELECT results.id, student_exams.id AS attemptId, exams.title AS examTitle, subjects.name AS subject, results.percentage, UPPER(results.status) AS status, student_exams.submitted_at AS submittedAt
      FROM results INNER JOIN student_exams ON student_exams.id = results.student_exam_id
      INNER JOIN exams ON exams.id = student_exams.exam_id INNER JOIN subjects ON subjects.id = exams.subject_id
      WHERE student_exams.student_id = ? ORDER BY student_exams.submitted_at DESC LIMIT 5`, [studentId]),
  ]);
  return {
    availableExams: Number(availableRows[0][0].total),
    upcomingExams: Number(upcomingRows[0][0].total),
    completedExams: Number(completedRows[0][0].total),
    averageScore: Number(averageRows[0][0].averageScore),
    recentResults: recentRows[0].map((result) => ({ ...result, percentage: Number(result.percentage) })),
  };
};
