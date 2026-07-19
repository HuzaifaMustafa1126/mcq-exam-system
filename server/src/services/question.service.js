import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const questionSelect = `
  SELECT
    questions.id,
    questions.subject_id AS subjectId,
    subjects.name AS subjectName,
    questions.question_text AS questionText,
    questions.marks,
    questions.difficulty,
    questions.status,
    questions.created_by_teacher_id AS createdByTeacherId,
    users.name AS createdBy,
    questions.created_at AS createdAt,
    questions.updated_at AS updatedAt
  FROM questions
  INNER JOIN subjects ON subjects.id = questions.subject_id
  LEFT JOIN teachers ON teachers.id = questions.created_by_teacher_id
  LEFT JOIN users ON users.id = teachers.user_id
`;

const getQuestionByIdWithExecutor = async (executor, id, { lock = false } = {}) => {
  const [rows] = await executor.execute(
    `${questionSelect} WHERE questions.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id]
  );
  if (!rows[0]) throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND);
  return rows[0];
};

const getQuestionOptions = async (executor, questionId) => {
  const [options] = await executor.execute(
    `SELECT id, option_text AS optionText, is_correct AS isCorrect, display_order AS displayOrder
     FROM question_options WHERE question_id = ? ORDER BY display_order ASC`,
    [questionId]
  );
  return options;
};

const ensureSubjectExists = async (connection, subjectId) => {
  const [rows] = await connection.execute('SELECT id FROM subjects WHERE id = ? LIMIT 1', [subjectId]);
  if (!rows[0]) throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND);
};

const getTeacherIdForUser = async (connection, user) => {
  if (user.role !== 'teacher') return null;
  const [rows] = await connection.execute('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [user.id]);
  if (!rows[0]) throw new AppError('Teacher profile not found', HTTP_STATUS.FORBIDDEN);
  return rows[0].id;
};

const insertOptions = async (connection, questionId, options) => {
  const values = options.map((option, index) => [
    questionId,
    option.optionText,
    option.isCorrect,
    index + 1,
  ]);
  await connection.query(
    `INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES ?`,
    [values]
  );
};

const translateDatabaseError = (error) => {
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new AppError('Question cannot be deleted while it is assigned to an exam', HTTP_STATUS.CONFLICT);
  }
  throw error;
};

export const createQuestion = async (data, user) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureSubjectExists(connection, data.subjectId);
    const teacherId = await getTeacherIdForUser(connection, user);
    const [result] = await connection.execute(
      `INSERT INTO questions
        (subject_id, created_by_teacher_id, question_text, marks, difficulty, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.subjectId, teacherId, data.questionText, data.marks, data.difficulty, data.status ?? 'active']
    );
    await insertOptions(connection, result.insertId, data.options);
    await connection.commit();
    const question = await getQuestionByIdWithExecutor(connection, result.insertId);
    const options = await getQuestionOptions(connection, result.insertId);
    return {
      ...question,
      options,
      correctOption: options.find((option) => Boolean(option.isCorrect)) ?? null,
    };
  } catch (error) {
    await connection.rollback();
    translateDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const getQuestions = async ({ page, limit, search, subjectId, difficulty, status }) => {
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];
  if (search) {
    filters.push('(questions.question_text LIKE ? OR subjects.name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }
  if (subjectId) {
    filters.push('questions.subject_id = ?');
    values.push(subjectId);
  }
  if (difficulty) {
    filters.push('questions.difficulty = ?');
    values.push(difficulty);
  }
  if (status) {
    filters.push('questions.status = ?');
    values.push(status);
  }
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total FROM questions
    INNER JOIN subjects ON subjects.id = questions.subject_id ${whereClause}`;
  const [questionsResult, totalResult] = await Promise.all([
    pool.execute(
      `${questionSelect} ${whereClause} ORDER BY questions.id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    ),
    pool.execute(countSql, values),
  ]);
  const [questions] = questionsResult;
  const [totalRows] = totalResult;
  const total = Number(totalRows[0].total);
  return {
    questions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getQuestionById = async (id) => {
  const question = await getQuestionByIdWithExecutor(pool, id);
  const options = await getQuestionOptions(pool, id);
  return {
    ...question,
    options,
    correctOption: options.find((option) => Boolean(option.isCorrect)) ?? null,
  };
};

export const updateQuestion = async (id, updates) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await getQuestionByIdWithExecutor(connection, id, { lock: true });
    if (updates.subjectId !== undefined) await ensureSubjectExists(connection, updates.subjectId);
    const columnByField = {
      subjectId: 'subject_id',
      questionText: 'question_text',
      marks: 'marks',
      difficulty: 'difficulty',
      status: 'status',
    };
    const fields = [];
    const values = [];
    for (const [field, column] of Object.entries(columnByField)) {
      if (updates[field] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(updates[field]);
      }
    }
    if (fields.length > 0) {
      await connection.execute(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    }
    if (updates.options !== undefined) {
      await connection.execute('DELETE FROM question_options WHERE question_id = ?', [id]);
      await insertOptions(connection, id, updates.options);
    }
    await connection.commit();
    return await getQuestionById(id);
  } catch (error) {
    await connection.rollback();
    translateDatabaseError(error);
  } finally {
    connection.release();
  }
};

export const deleteQuestion = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await getQuestionByIdWithExecutor(connection, id, { lock: true });
    await connection.execute('DELETE FROM question_options WHERE question_id = ?', [id]);
    await connection.execute('DELETE FROM questions WHERE id = ?', [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    translateDatabaseError(error);
  } finally {
    connection.release();
  }
};
