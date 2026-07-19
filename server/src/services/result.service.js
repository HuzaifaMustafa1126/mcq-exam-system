import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const resultSelect = `
  SELECT
    results.id AS resultId,
    student_exams.id AS attemptId,
    exams.title AS examName,
    exams.id AS examId,
    exams.subject_id AS subjectId,
    subjects.name AS subjectName,
    students.id AS studentId,
    students.student_number AS studentNumber,
    students.registration_number AS registrationNumber,
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
  INNER JOIN subjects ON subjects.id = exams.subject_id
`;

const toResult = (result) => ({
  ...result,
  id: Number(result.resultId),
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

export const getResults = async (user, { page = 1, limit = 20, search, studentId, subjectId, examId, dateFrom, dateTo, status } = {}) => {
  const scope = await getScope(user);
  const conditions = scope.clause ? [scope.clause.replace(/^WHERE\s+/, '')] : [];
  const values = [...scope.values];
  if (search) {
    conditions.push('(users.name LIKE ? OR students.student_number LIKE ? OR exams.title LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (studentId) { conditions.push('students.id = ?'); values.push(studentId); }
  if (subjectId) { conditions.push('exams.subject_id = ?'); values.push(subjectId); }
  if (examId) { conditions.push('exams.id = ?'); values.push(examId); }
  if (dateFrom) { conditions.push('DATE(student_exams.submitted_at) >= ?'); values.push(dateFrom); }
  if (dateTo) { conditions.push('DATE(student_exams.submitted_at) <= ?'); values.push(dateTo); }
  if (status) { conditions.push('results.status = ?'); values.push(status); }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const [results] = await pool.query(
    `${resultSelect} ${whereClause} ORDER BY student_exams.submitted_at DESC, student_exams.id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    values
  );
  const countSql = `SELECT COUNT(*) AS total, COALESCE(AVG(results.percentage), 0) AS averagePercentage,
    SUM(results.status = 'pass') AS passed, SUM(results.status = 'fail') AS failed
    FROM results INNER JOIN student_exams ON student_exams.id = results.student_exam_id
    INNER JOIN students ON students.id = student_exams.student_id INNER JOIN users ON users.id = students.user_id
    INNER JOIN exams ON exams.id = student_exams.exam_id ${whereClause}`;
  const [summaryRows] = await pool.execute(countSql, values);
  const summary = summaryRows[0];
  const total = Number(summary.total);
  return {
    results: results.map(toResult),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: { total, passed: Number(summary.passed || 0), failed: Number(summary.failed || 0), averagePercentage: Number(Number(summary.averagePercentage || 0).toFixed(2)) },
  };
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

export const getResultDetails = async (user, attemptId) => {
  const result = await getResultByAttemptId(user, attemptId);
  const [answers] = await pool.execute(
    `SELECT questions.question_text AS questionText, student_answers.marks_awarded AS marksAwarded,
      student_answers.is_correct AS isCorrect, selected.option_text AS selectedOption,
      correct.option_text AS correctOption
     FROM student_answers
     INNER JOIN exam_questions ON exam_questions.id = student_answers.exam_question_id
     INNER JOIN questions ON questions.id = exam_questions.question_id
     LEFT JOIN question_options AS selected ON selected.id = student_answers.selected_option_id
     LEFT JOIN question_options AS correct ON correct.question_id = questions.id AND correct.is_correct = TRUE
     WHERE student_answers.student_exam_id = ? ORDER BY exam_questions.display_order ASC`,
    [result.attemptId]
  );
  return { ...result, answers: answers.map((answer) => ({ ...answer, marksAwarded: Number(answer.marksAwarded), isCorrect: answer.isCorrect === null ? null : Boolean(answer.isCorrect) })) };
};
