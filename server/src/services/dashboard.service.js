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
