import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';

const subjectSelect = `
  SELECT
    id,
    name,
    code,
    description,
    status,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM subjects
`;

const duplicateCodeError = () =>
  new AppError('A subject with this code already exists', HTTP_STATUS.CONFLICT);

const getSubjectByIdWithExecutor = async (executor, id) => {
  const [rows] = await executor.execute(`${subjectSelect} WHERE id = ?`, [id]);

  if (!rows[0]) {
    throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND);
  }

  return rows[0];
};

const ensureCodeAvailable = async (code, excludedId = null) => {
  const sql = excludedId
    ? 'SELECT id FROM subjects WHERE code = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM subjects WHERE code = ? LIMIT 1';
  const values = excludedId ? [code, excludedId] : [code];
  const [rows] = await pool.execute(sql, values);

  if (rows.length > 0) throw duplicateCodeError();
};

const translateDatabaseError = (error) => {
  if (error.code === 'ER_DUP_ENTRY') throw duplicateCodeError();

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new AppError(
      'Subject cannot be deleted while it is used by exams or questions',
      HTTP_STATUS.CONFLICT
    );
  }

  throw error;
};

export const createSubject = async ({ name, code, description, status = 'active' }) => {
  await ensureCodeAvailable(code);

  try {
    const [result] = await pool.execute(
      'INSERT INTO subjects (name, code, description, status) VALUES (?, ?, ?, ?)',
      [name, code, description ?? null, status]
    );

    return await getSubjectByIdWithExecutor(pool, result.insertId);
  } catch (error) {
    translateDatabaseError(error);
  }
};

export const getSubjects = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const searchTerm = search ? `%${search}%` : null;
  const whereClause = searchTerm ? 'WHERE name LIKE ? OR code LIKE ?' : '';
  const searchValues = searchTerm ? [searchTerm, searchTerm] : [];

  const [subjectsResult, totalResult] = await Promise.all([
    pool.execute(
      `${subjectSelect} ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...searchValues, limit, offset]
    ),
    pool.execute(`SELECT COUNT(*) AS total FROM subjects ${whereClause}`, searchValues),
  ]);
  const [subjects] = subjectsResult;
  const [totalRows] = totalResult;
  const total = Number(totalRows[0].total);

  return {
    subjects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSubjectById = (id) => getSubjectByIdWithExecutor(pool, id);

export const updateSubject = async (id, updates) => {
  await getSubjectById(id);

  if (updates.code !== undefined) {
    await ensureCodeAvailable(updates.code, id);
  }

  const columnByField = {
    name: 'name',
    code: 'code',
    description: 'description',
    status: 'status',
  };
  const fields = [];
  const values = [];
  for (const [field, column] of Object.entries(columnByField)) {
    if (updates[field] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(field === 'description' ? updates[field] || null : updates[field]);
    }
  }

  try {
    await pool.execute(
      `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
      [...values, id]
    );

    return await getSubjectById(id);
  } catch (error) {
    translateDatabaseError(error);
  }
};

export const deleteSubject = async (id) => {
  await getSubjectById(id);

  try {
    await pool.execute('DELETE FROM subjects WHERE id = ?', [id]);
  } catch (error) {
    translateDatabaseError(error);
  }
};
