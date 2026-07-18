import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const toPositiveId = (value, label) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(`${label} must be a positive integer`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  return id;
};

const getStudentId = async (connection, userId) => {
  const [rows] = await connection.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
  if (!rows[0]) throw new AppError('Student profile not found', HTTP_STATUS.FORBIDDEN);
  return rows[0].id;
};

const availableExamWhere = `
  exams.status IN ('published', 'active')
  AND (exams.starts_at IS NULL OR exams.starts_at <= NOW())
  AND (exams.ends_at IS NULL OR exams.ends_at >= NOW())
`;

const getAvailableExam = async (connection, examId, { lock = false } = {}) => {
  const [rows] = await connection.execute(
    `SELECT
      exams.id,
      exams.subject_id AS subjectId,
      subjects.name AS subjectName,
      exams.title,
      exams.description,
      exams.duration_minutes AS durationMinutes,
      exams.total_marks AS totalMarks,
      exams.pass_marks AS passingMarks,
      exams.max_attempts AS maxAttempts,
      exams.starts_at AS startTime,
      exams.ends_at AS endTime,
      exams.status,
      (SELECT COUNT(*) FROM exam_questions WHERE exam_questions.exam_id = exams.id) AS totalQuestions
     FROM exams
     INNER JOIN subjects ON subjects.id = exams.subject_id
     WHERE exams.id = ? AND ${availableExamWhere}${lock ? ' FOR UPDATE' : ''}`,
    [examId]
  );
  if (!rows[0]) throw new AppError('Exam is not available', HTTP_STATUS.NOT_FOUND);
  return rows[0];
};

const getPublishedExamForStart = async (connection, examId) => {
  const [rows] = await connection.execute(
    `SELECT
      id,
      duration_minutes AS durationMinutes,
      max_attempts AS maxAttempts,
      status,
      starts_at AS startTime,
      ends_at AS endTime,
      (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW()) AS isWithinWindow
     FROM exams
     WHERE id = ?
     FOR UPDATE`,
    [examId]
  );

  if (!rows[0]) throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
  if (rows[0].status !== 'published') {
    throw new AppError('Only published exams can be started', HTTP_STATUS.CONFLICT);
  }
  if (Number(rows[0].isWithinWindow) !== 1) {
    throw new AppError('Exam is not available at the current time', HTTP_STATUS.CONFLICT);
  }

  return rows[0];
};

const getLatestAttempt = async (connection, studentId, examId, { lock = false } = {}) => {
  const [rows] = await connection.execute(
    `SELECT
       id,
       attempt_number AS attemptNumber,
       status,
       started_at AS startedAt,
       expires_at AS expiresAt,
       submitted_at AS submittedAt
     FROM student_exams
     WHERE student_id = ? AND exam_id = ?
     ORDER BY attempt_number DESC
     LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [studentId, examId]
  );
  return rows[0] ?? null;
};

const getInProgressAttempt = async (connection, studentId, examId) => {
  const attempt = await getLatestAttempt(connection, studentId, examId);
  if (!attempt || attempt.status !== 'in_progress') {
    throw new AppError('Start the exam before accessing its questions', HTTP_STATUS.CONFLICT);
  }
  if (attempt.expiresAt && new Date(attempt.expiresAt) <= new Date()) {
    throw new AppError('This exam attempt has expired', HTTP_STATUS.CONFLICT);
  }
  return attempt;
};

const translateDuplicateError = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('An exam attempt is already in progress', HTTP_STATUS.CONFLICT);
  }
  throw error;
};

export const getStudentExams = async (userId) => {
  const connection = await pool.getConnection();
  try {
    const studentId = await getStudentId(connection, userId);
    const [exams] = await connection.execute(
      `SELECT
        exams.id,
        subjects.name AS subjectName,
        exams.title,
        exams.duration_minutes AS durationMinutes,
        exams.total_marks AS totalMarks,
        exams.pass_marks AS passingMarks,
        exams.starts_at AS startTime,
        exams.ends_at AS endTime,
        exams.status,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_questions.exam_id = exams.id) AS totalQuestions,
        (SELECT status FROM student_exams
         WHERE student_exams.student_id = ? AND student_exams.exam_id = exams.id
         ORDER BY attempt_number DESC LIMIT 1) AS attemptStatus
       FROM exams
       INNER JOIN subjects ON subjects.id = exams.subject_id
       WHERE ${availableExamWhere}
       ORDER BY exams.starts_at IS NULL DESC, exams.starts_at ASC, exams.id DESC`,
      [studentId]
    );
    return exams;
  } finally {
    connection.release();
  }
};

export const getStudentExam = async (userId, examIdParam) => {
  const examId = toPositiveId(examIdParam, 'Exam id');
  const connection = await pool.getConnection();
  try {
    await getStudentId(connection, userId);
    return await getAvailableExam(connection, examId);
  } finally {
    connection.release();
  }
};

export const startStudentExam = async (userId, examIdParam) => {
  const examId = toPositiveId(examIdParam, 'Exam id');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const studentId = await getStudentId(connection, userId);
    const exam = await getPublishedExamForStart(connection, examId);
    let latestAttempt = await getLatestAttempt(connection, studentId, examId, { lock: true });

    if (latestAttempt?.status === 'in_progress' && latestAttempt.expiresAt
      && new Date(latestAttempt.expiresAt) <= new Date()) {
      await connection.execute(
        "UPDATE student_exams SET status = 'expired' WHERE id = ?",
        [latestAttempt.id]
      );
      latestAttempt = { ...latestAttempt, status: 'expired' };
    }
    if (latestAttempt?.status === 'in_progress') {
      throw new AppError('This exam attempt has already been started', HTTP_STATUS.CONFLICT);
    }
    if (latestAttempt && latestAttempt.attemptNumber >= exam.maxAttempts) {
      throw new AppError('Maximum exam attempts have been reached', HTTP_STATUS.CONFLICT);
    }

    const attemptNumber = (latestAttempt?.attemptNumber ?? 0) + 1;
    const [result] = await connection.execute(
      `INSERT INTO student_exams
        (student_id, exam_id, attempt_number, status, started_at, expires_at)
       SELECT
         ?, ?, ?, 'in_progress', NOW(),
         CASE
           WHEN ends_at IS NOT NULL AND ends_at < DATE_ADD(NOW(), INTERVAL duration_minutes MINUTE)
             THEN ends_at
           ELSE DATE_ADD(NOW(), INTERVAL duration_minutes MINUTE)
         END
       FROM exams
       WHERE id = ?`,
      [studentId, examId, attemptNumber, examId]
    );
    const [attemptRows] = await connection.execute(
      `SELECT
         id,
         started_at AS startedAt,
         expires_at AS expiresAt
       FROM student_exams WHERE id = ?`,
      [result.insertId]
    );
    await connection.commit();

    return {
      attemptId: attemptRows[0].id,
      startedAt: attemptRows[0].startedAt,
      expiresAt: attemptRows[0].expiresAt,
    };
  } catch (error) {
    await connection.rollback();
    translateDuplicateError(error);
  } finally {
    connection.release();
  }
};

export const getStudentExamQuestions = async (userId, examIdParam, { page = 1, limit = 20 } = {}) => {
  const examId = toPositiveId(examIdParam, 'Exam id');
  const offset = (page - 1) * limit;
  const connection = await pool.getConnection();
  try {
    const studentId = await getStudentId(connection, userId);
    const exam = await getAvailableExam(connection, examId);
    const attempt = await getInProgressAttempt(connection, studentId, examId);
    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) AS total FROM exam_questions WHERE exam_id = ?',
      [examId]
    );
    const totalQuestions = Number(totalRows[0].total);
    const [questionRows] = await connection.execute(
      `SELECT
        questions.id,
        questions.question_text AS questionText,
        exam_questions.marks,
        exam_questions.display_order AS displayOrder
       FROM exam_questions
       INNER JOIN questions ON questions.id = exam_questions.question_id
       WHERE exam_questions.exam_id = ?
       ORDER BY exam_questions.display_order ASC
       LIMIT ? OFFSET ?`,
      [examId, limit, offset]
    );
    const questionIds = questionRows.map((question) => question.id);
    let optionRows = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => '?').join(', ');
      [optionRows] = await connection.execute(
        `SELECT
          question_id AS questionId,
          id,
          option_text AS optionText,
          display_order AS displayOrder
         FROM question_options
         WHERE question_id IN (${placeholders})
         ORDER BY question_id, display_order ASC`,
        questionIds
      );
    }
    const optionsByQuestionId = new Map();
    for (const option of optionRows) {
      const options = optionsByQuestionId.get(option.questionId) ?? [];
      options.push({ id: option.id, optionText: option.optionText, displayOrder: option.displayOrder });
      optionsByQuestionId.set(option.questionId, options);
    }

    return {
      attemptId: attempt.id,
      expiresAt: attempt.expiresAt,
      title: exam.title,
      duration: Number(exam.durationMinutes),
      totalQuestions,
      questions: questionRows.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        marks: question.marks,
        options: optionsByQuestionId.get(question.id) ?? [],
      })),
      pagination: {
        page,
        limit,
        total: totalQuestions,
        totalPages: Math.ceil(totalQuestions / limit),
      },
    };
  } finally {
    connection.release();
  }
};

const normalizeAnswers = (answers) => {
  if (!Array.isArray(answers)) {
    throw new AppError('Answers must be an array', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const answersByQuestionId = new Map();
  for (const answer of answers) {
    const questionId = toPositiveId(answer.questionId, 'Question id');
    const selectedOptionId = toPositiveId(answer.selectedOptionId, 'Selected option id');
    if (answersByQuestionId.has(questionId)) {
      throw new AppError('Duplicate answers are not allowed', HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    answersByQuestionId.set(questionId, selectedOptionId);
  }

  return answersByQuestionId;
};

export const submitStudentExam = async (userId, examIdParam, answers) => {
  const examId = toPositiveId(examIdParam, 'Exam id');
  const answersByQuestionId = normalizeAnswers(answers);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const studentId = await getStudentId(connection, userId);
    const [examRows] = await connection.execute(
      'SELECT total_marks AS totalMarks, pass_marks AS passingMarks FROM exams WHERE id = ? FOR UPDATE',
      [examId]
    );
    if (!examRows[0]) throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
    const exam = examRows[0];
    const attempt = await getLatestAttempt(connection, studentId, examId, { lock: true });

    if (!attempt) {
      throw new AppError('Start the exam before submitting it', HTTP_STATUS.CONFLICT);
    }
    if (attempt.status === 'submitted') {
      throw new AppError('This exam has already been submitted', HTTP_STATUS.CONFLICT);
    }
    if (attempt.status !== 'in_progress') {
      throw new AppError('This exam attempt cannot be submitted', HTTP_STATUS.CONFLICT);
    }

    const [examQuestions] = await connection.execute(
      `SELECT
        exam_questions.id AS examQuestionId,
        exam_questions.question_id AS questionId,
        exam_questions.marks,
        exam_questions.negative_marks AS negativeMarks,
        MAX(CASE WHEN question_options.is_correct = TRUE THEN question_options.id END) AS correctOptionId,
        SUM(question_options.is_correct = TRUE) AS correctOptionCount
       FROM exam_questions
       LEFT JOIN question_options
         ON question_options.question_id = exam_questions.question_id
       WHERE exam_questions.exam_id = ?
       GROUP BY
         exam_questions.id,
         exam_questions.question_id,
         exam_questions.marks,
         exam_questions.negative_marks,
         exam_questions.display_order
       ORDER BY exam_questions.display_order ASC`,
      [examId]
    );
    if (examQuestions.some((question) => Number(question.correctOptionCount) !== 1)) {
      throw new AppError(
        'Exam cannot be submitted because each question must have exactly one correct option',
        HTTP_STATUS.CONFLICT
      );
    }
    const examQuestionById = new Map(examQuestions.map((question) => [question.questionId, question]));

    for (const questionId of answersByQuestionId.keys()) {
      if (!examQuestionById.has(questionId)) {
        throw new AppError('One or more answers do not belong to this exam', HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }
    }

    const selectedOptionIds = [...answersByQuestionId.values()];
    if (selectedOptionIds.length > 0) {
      const placeholders = selectedOptionIds.map(() => '?').join(', ');
      const [selectedOptions] = await connection.execute(
        `SELECT id, question_id AS questionId FROM question_options WHERE id IN (${placeholders})`,
        selectedOptionIds
      );
      const selectedOptionById = new Map(selectedOptions.map((option) => [option.id, option]));
      for (const [questionId, selectedOptionId] of answersByQuestionId) {
        if (selectedOptionById.get(selectedOptionId)?.questionId !== questionId) {
          throw new AppError('A selected option does not belong to its question', HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
      }
    }

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let attempted = 0;
    const answerValues = examQuestions.map((question) => {
      const selectedOptionId = answersByQuestionId.get(question.questionId) ?? null;
      const isCorrect = selectedOptionId === question.correctOptionId;
      const marksAwarded = isCorrect ? Number(question.marks) : 0;
      if (selectedOptionId) {
        attempted += 1;
        if (isCorrect) correct += 1;
        else wrong += 1;
      }
      score += marksAwarded;
      return [attempt.id, question.examQuestionId, selectedOptionId, selectedOptionId ? isCorrect : null, marksAwarded];
    });

    if (answerValues.length > 0) {
      await connection.query(
        `INSERT INTO student_answers
          (student_exam_id, exam_question_id, selected_option_id, is_correct, marks_awarded)
         VALUES ?`,
        [answerValues]
      );
    }

    const totalQuestions = examQuestions.length;
    const unattempted = totalQuestions - attempted;
    const totalMarks = Number(exam.totalMarks);
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const resultStatus = score >= Number(exam.passingMarks) ? 'pass' : 'fail';

    await connection.execute(
      `UPDATE student_exams
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = ?`,
      [attempt.id]
    );
    await connection.execute(
      `INSERT INTO results
        (student_exam_id, total_questions, attempted_questions, correct_answers, incorrect_answers,
         unattempted_answers, score, percentage, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        attempt.id,
        totalQuestions,
        attempted,
        correct,
        wrong,
        unattempted,
        score,
        percentage,
        resultStatus,
      ]
    );
    await connection.commit();

    return {
      score,
      totalMarks,
      correct,
      wrong,
      percentage,
      status: resultStatus.toUpperCase(),
    };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('This exam has already been submitted', HTTP_STATUS.CONFLICT);
    }
    throw error;
  } finally {
    connection.release();
  }
};
