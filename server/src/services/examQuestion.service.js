import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const getExam = async (connection, examId, { lock = false } = {}) => {
  const [rows] = await connection.execute(
    `SELECT id, subject_id AS subjectId FROM exams WHERE id = ?${lock ? ' FOR UPDATE' : ''}`,
    [examId]
  );
  if (!rows[0]) throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
  return rows[0];
};

const assertExamAccess = async (connection, examId, user) => {
  if (user.role !== 'teacher') return;
  const [teacherRows] = await connection.execute('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [user.id]);
  if (!teacherRows[0]) throw new AppError('Teacher profile not found', HTTP_STATUS.FORBIDDEN);
  const [rows] = await connection.execute('SELECT id FROM exams WHERE id = ? AND created_by_teacher_id = ? LIMIT 1', [examId, teacherRows[0].id]);
  if (!rows[0]) throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
};

const getQuestions = async (connection, questionIds) => {
  const placeholders = questionIds.map(() => '?').join(', ');
  const [questions] = await connection.execute(
    `SELECT id, subject_id AS subjectId, marks FROM questions WHERE id IN (${placeholders})`,
    questionIds
  );
  if (questions.length !== questionIds.length) {
    throw new AppError('One or more questions were not found', HTTP_STATUS.NOT_FOUND);
  }
  return questions;
};

const getTotalAssignedQuestions = async (executor, examId) => {
  const [rows] = await executor.execute(
    'SELECT COUNT(*) AS total FROM exam_questions WHERE exam_id = ?',
    [examId]
  );
  return Number(rows[0].total);
};

const getLastDisplayOrder = async (connection, examId) => {
  const [rows] = await connection.execute(
    `SELECT display_order FROM exam_questions
     WHERE exam_id = ? ORDER BY display_order DESC LIMIT 1 FOR UPDATE`,
    [examId]
  );
  return rows[0] ? Number(rows[0].display_order) : 0;
};

const translateDuplicateError = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('One or more questions are already assigned to this exam', HTTP_STATUS.CONFLICT);
  }
  throw error;
};

export const assignQuestions = async (examId, questionIds, user) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertExamAccess(connection, examId, user);
    const exam = await getExam(connection, examId, { lock: true });
    const questions = await getQuestions(connection, questionIds);

    if (questions.some((question) => question.subjectId !== exam.subjectId)) {
      throw new AppError(
        'Every assigned question must belong to the exam subject',
        HTTP_STATUS.UNPROCESSABLE_ENTITY
      );
    }

    const placeholders = questionIds.map(() => '?').join(', ');
    const [existingAssignments] = await connection.execute(
      `SELECT question_id FROM exam_questions
       WHERE exam_id = ? AND question_id IN (${placeholders})`,
      [examId, ...questionIds]
    );
    if (existingAssignments.length > 0) {
      throw new AppError('One or more questions are already assigned to this exam', HTTP_STATUS.CONFLICT);
    }

    const questionById = new Map(questions.map((question) => [question.id, question]));
    const lastDisplayOrder = await getLastDisplayOrder(connection, examId);
    const values = questionIds.map((questionId, index) => {
      const question = questionById.get(questionId);
      return [examId, questionId, lastDisplayOrder + index + 1, question.marks, 0];
    });
    await connection.query(
      `INSERT INTO exam_questions
        (exam_id, question_id, display_order, marks, negative_marks)
       VALUES ?`,
      [values]
    );

    const totalAssignedQuestions = await getTotalAssignedQuestions(connection, examId);
    await connection.commit();

    return { assignedQuestions: questionIds.length, totalAssignedQuestions };
  } catch (error) {
    await connection.rollback();
    translateDuplicateError(error);
  } finally {
    connection.release();
  }
};

export const getAssignedQuestions = async (examId, user) => {
  const connection = await pool.getConnection();

  try {
    await assertExamAccess(connection, examId, user);
    await getExam(connection, examId);
    const [questions] = await connection.execute(
      `SELECT
        questions.id,
        questions.question_text AS questionText,
        questions.difficulty,
        questions.status,
        exam_questions.marks,
        exam_questions.negative_marks AS negativeMarks,
        exam_questions.display_order AS displayOrder
       FROM exam_questions
       INNER JOIN questions ON questions.id = exam_questions.question_id
       WHERE exam_questions.exam_id = ?
       ORDER BY exam_questions.display_order ASC`,
      [examId]
    );
    const totalAssignedQuestions = await getTotalAssignedQuestions(connection, examId);

    return { questions, totalAssignedQuestions };
  } finally {
    connection.release();
  }
};

export const removeAssignedQuestion = async (examId, questionId, user) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await assertExamAccess(connection, examId, user);
    await getExam(connection, examId, { lock: true });
    const [result] = await connection.execute(
      'DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?',
      [examId, questionId]
    );
    if (result.affectedRows === 0) {
      throw new AppError('Question is not assigned to this exam', HTTP_STATUS.NOT_FOUND);
    }

    const totalAssignedQuestions = await getTotalAssignedQuestions(connection, examId);
    await connection.commit();

    return { totalAssignedQuestions };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
