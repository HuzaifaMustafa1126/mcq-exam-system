import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const examSelect = `
  SELECT
    exams.id,
    exams.subject_id AS subjectId,
    subjects.name AS subjectName,
    exams.title,
    exams.description,
    exams.duration_minutes AS durationMinutes,
    (SELECT COUNT(*) FROM exam_questions WHERE exam_questions.exam_id = exams.id) AS totalQuestions,
    exams.total_marks AS totalMarks,
    exams.pass_marks AS passingMarks,
    exams.starts_at AS startTime,
    exams.ends_at AS endTime,
    exams.status,
    exams.created_by_teacher_id AS createdByTeacherId,
    users.name AS createdBy,
    exams.created_at AS createdAt,
    exams.updated_at AS updatedAt
  FROM exams
  INNER JOIN subjects ON subjects.id = exams.subject_id
  LEFT JOIN teachers ON teachers.id = exams.created_by_teacher_id
  LEFT JOIN users ON users.id = teachers.user_id
`;

const getExamByIdWithExecutor = async (executor, id, { lock = false } = {}) => {
  const [rows] = await executor.execute(
    `${examSelect} WHERE exams.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id]
  );
  if (!rows[0]) throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
  return rows[0];
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

const validateExamConstraints = ({ totalMarks, passingMarks, startTime, endTime }) => {
  if (Number(passingMarks) > Number(totalMarks)) {
    throw new AppError('Passing marks cannot exceed total marks', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (endTime && (!startTime || new Date(endTime) <= new Date(startTime))) {
    throw new AppError('End time must be later than start time', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
};

export const createExam = async (data, user) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    validateExamConstraints(data);
    await ensureSubjectExists(connection, data.subjectId);
    const teacherId = await getTeacherIdForUser(connection, user);
    const [result] = await connection.execute(
      `INSERT INTO exams
        (subject_id, created_by_teacher_id, title, description, duration_minutes, total_marks, pass_marks, starts_at, ends_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.subjectId,
        teacherId,
        data.title,
        data.description ?? null,
        data.durationMinutes,
        data.totalMarks,
        data.passingMarks,
        data.startTime ?? null,
        data.endTime ?? null,
        data.status ?? 'draft',
      ]
    );
    await connection.commit();
    return await getExamByIdWithExecutor(connection, result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getExams = async ({ page, limit, search, subjectId }) => {
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];
  if (search) {
    filters.push('exams.title LIKE ?');
    values.push(`%${search}%`);
  }
  if (subjectId) {
    filters.push('exams.subject_id = ?');
    values.push(subjectId);
  }
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) AS total FROM exams
    INNER JOIN subjects ON subjects.id = exams.subject_id ${whereClause}`;
  const [examsResult, totalResult] = await Promise.all([
    pool.execute(
      `${examSelect} ${whereClause} ORDER BY exams.id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    ),
    pool.execute(countSql, values),
  ]);
  const [exams] = examsResult;
  const [totalRows] = totalResult;
  const total = Number(totalRows[0].total);
  return {
    exams,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getExamById = (id) => getExamByIdWithExecutor(pool, id);

export const updateExam = async (id, updates) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const currentExam = await getExamByIdWithExecutor(connection, id, { lock: true });
    if (updates.subjectId !== undefined) await ensureSubjectExists(connection, updates.subjectId);

    validateExamConstraints({
      totalMarks: updates.totalMarks ?? currentExam.totalMarks,
      passingMarks: updates.passingMarks ?? currentExam.passingMarks,
      startTime: updates.startTime === undefined ? currentExam.startTime : updates.startTime,
      endTime: updates.endTime === undefined ? currentExam.endTime : updates.endTime,
    });

    const columnByField = {
      subjectId: 'subject_id',
      title: 'title',
      description: 'description',
      durationMinutes: 'duration_minutes',
      totalMarks: 'total_marks',
      passingMarks: 'pass_marks',
      startTime: 'starts_at',
      endTime: 'ends_at',
      status: 'status',
    };
    const fields = [];
    const values = [];
    for (const [field, column] of Object.entries(columnByField)) {
      if (updates[field] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(['description', 'startTime', 'endTime'].includes(field) ? updates[field] ?? null : updates[field]);
      }
    }
    await connection.execute(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    await connection.commit();
    return await getExamById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteExam = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await getExamByIdWithExecutor(connection, id, { lock: true });
    await connection.execute('DELETE FROM exams WHERE id = ?', [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
