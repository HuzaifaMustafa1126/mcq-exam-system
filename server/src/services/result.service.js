import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const resultSelect = `
  SELECT
    student_exams.id AS attemptId,
    exams.title AS examName,
    users.name AS studentName,
    results.total_questions AS totalQuestions,
    results.correct_answers AS correct,
    results.incorrect_answers AS wrong,
    results.unattempted_answers AS unanswered,
    results.score AS obtainedMarks,
    exams.total_marks AS totalMarks,
    results.percentage,
    UPPER(results.status) AS status,
    exams.duration_minutes AS durationMinutes,
    student_exams.submitted_at AS submittedAt
  FROM results
  INNER JOIN student_exams ON student_exams.id = results.student_exam_id
  INNER JOIN students ON students.id = student_exams.student_id
  INNER JOIN users ON users.id = students.user_id
  INNER JOIN exams ON exams.id = student_exams.exam_id
`;

const toResult = (result) => ({
  ...result,
  totalQuestions: Number(result.totalQuestions),
  correct: Number(result.correct),
  wrong: Number(result.wrong),
  unanswered: Number(result.unanswered),
  obtainedMarks: Number(result.obtainedMarks),
  totalMarks: Number(result.totalMarks),
  percentage: Number(result.percentage),
  durationMinutes: Number(result.durationMinutes),
});

const getProfileId = async (role, userId) => {
  const table = role === 'student' ? 'students' : 'teachers';
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE user_id = ? LIMIT 1`, [userId]);

  if (!rows[0]) {
    throw new AppError(`${role === 'student' ? 'Student' : 'Teacher'} profile not found`, HTTP_STATUS.FORBIDDEN);
  }

  return rows[0].id;
};

const getScope = async (user) => {
  if (user.role === 'admin') return { clause: '', values: [] };

  if (user.role === 'student') {
    const studentId = await getProfileId('student', user.id);
    return { clause: 'WHERE student_exams.student_id = ?', values: [studentId] };
  }

  if (user.role === 'teacher') {
    const teacherId = await getProfileId('teacher', user.id);
    return { clause: 'WHERE exams.created_by_teacher_id = ?', values: [teacherId] };
  }

  throw new AppError('You do not have permission to access results', HTTP_STATUS.FORBIDDEN);
};

export const getResults = async (user) => {
  const scope = await getScope(user);
  const [results] = await pool.execute(
    `${resultSelect} ${scope.clause} ORDER BY student_exams.submitted_at DESC, student_exams.id DESC`,
    scope.values
  );

  return results.map(toResult);
};

export const getResultByAttemptId = async (user, attemptId) => {
  const scope = await getScope(user);
  const [results] = await pool.execute(
    `${resultSelect} ${scope.clause ? `${scope.clause} AND` : 'WHERE'} student_exams.id = ? LIMIT 1`,
    [...scope.values, attemptId]
  );

  if (!results[0]) {
    throw new AppError('Result not found', HTTP_STATUS.NOT_FOUND);
  }

  return toResult(results[0]);
};
