import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';

const teacherSelect = `
  SELECT
    teachers.id,
    teachers.user_id AS userId,
    users.name,
    users.email,
    users.status,
    teachers.employee_number AS employeeNumber,
    teachers.department,
    teachers.created_at AS createdAt,
    teachers.updated_at AS updatedAt
  FROM teachers
  INNER JOIN users ON users.id = teachers.user_id
`;

const duplicateError = (field) =>
  new AppError(`A teacher with this ${field} already exists`, HTTP_STATUS.CONFLICT);

const getTeacherByIdWithExecutor = async (executor, id, { lock = false } = {}) => {
  const [rows] = await executor.execute(
    `${teacherSelect} WHERE teachers.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id]
  );

  if (!rows[0]) {
    throw new AppError('Teacher not found', HTTP_STATUS.NOT_FOUND);
  }

  return rows[0];
};

const ensureEmailAvailable = async (connection, email, excludedUserId = null) => {
  const query = excludedUserId
    ? 'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1 FOR UPDATE'
    : 'SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE';
  const values = excludedUserId ? [email, excludedUserId] : [email];
  const [rows] = await connection.execute(query, values);

  if (rows.length > 0) {
    throw duplicateError('email address');
  }
};

const ensureEmployeeNumberAvailable = async (connection, employeeNumber, excludedTeacherId = null) => {
  const query = excludedTeacherId
    ? 'SELECT id FROM teachers WHERE employee_number = ? AND id != ? LIMIT 1 FOR UPDATE'
    : 'SELECT id FROM teachers WHERE employee_number = ? LIMIT 1 FOR UPDATE';
  const values = excludedTeacherId ? [employeeNumber, excludedTeacherId] : [employeeNumber];
  const [rows] = await connection.execute(query, values);

  if (rows.length > 0) {
    throw duplicateError('employee number');
  }
};

const translateDuplicateKeyError = (error) => {
  if (error.code !== 'ER_DUP_ENTRY') throw error;

  if (error.message.includes('uq_users_email')) throw duplicateError('email address');
  if (error.message.includes('uq_teachers_employee_number')) throw duplicateError('employee number');

  throw new AppError('A teacher with these details already exists', HTTP_STATUS.CONFLICT);
};

export const createTeacher = async ({
  name,
  email,
  password,
  employeeNumber,
  department,
  status = 'active',
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureEmailAvailable(connection, email);
    await ensureEmployeeNumberAvailable(connection, employeeNumber);

    const passwordHash = await hashPassword(password);
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'teacher', status]
    );
    const [teacherResult] = await connection.execute(
      'INSERT INTO teachers (user_id, employee_number, department) VALUES (?, ?, ?)',
      [userResult.insertId, employeeNumber, department ?? null]
    );

    const teacher = await getTeacherByIdWithExecutor(connection, teacherResult.insertId);
    await connection.commit();

    return teacher;
  } catch (error) {
    await connection.rollback();
    translateDuplicateKeyError(error);
  } finally {
    connection.release();
  }
};

export const getTeachers = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const searchTerm = search ? `%${search}%` : null;
  const whereClause = searchTerm
    ? 'WHERE users.name LIKE ? OR users.email LIKE ? OR teachers.employee_number LIKE ?'
    : '';
  const searchValues = searchTerm ? [searchTerm, searchTerm, searchTerm] : [];

  const [teachersResult, totalResult] = await Promise.all([
    pool.execute(
      `${teacherSelect} ${whereClause} ORDER BY teachers.id DESC LIMIT ? OFFSET ?`,
      [...searchValues, limit, offset]
    ),
    pool.execute(
      `SELECT COUNT(*) AS total FROM teachers INNER JOIN users ON users.id = teachers.user_id ${whereClause}`,
      searchValues
    ),
  ]);

  const [teachers] = teachersResult;
  const [totalRows] = totalResult;
  const total = Number(totalRows[0].total);

  return {
    teachers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTeacherById = (id) => getTeacherByIdWithExecutor(pool, id);

export const updateTeacher = async (id, updates) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const currentTeacher = await getTeacherByIdWithExecutor(connection, id, { lock: true });

    if (updates.email) {
      await ensureEmailAvailable(connection, updates.email, currentTeacher.userId);
    }
    if (updates.employeeNumber) {
      await ensureEmployeeNumberAvailable(connection, updates.employeeNumber, id);
    }

    const userFields = [];
    const userValues = [];
    for (const field of ['name', 'email', 'status']) {
      if (updates[field] !== undefined) {
        userFields.push(`${field} = ?`);
        userValues.push(updates[field]);
      }
    }
    if (updates.password !== undefined) {
      userFields.push('password = ?');
      userValues.push(await hashPassword(updates.password));
    }
    if (userFields.length > 0) {
      await connection.execute(
        `UPDATE users SET ${userFields.join(', ')} WHERE id = ?`,
        [...userValues, currentTeacher.userId]
      );
    }

    const teacherFields = [];
    const teacherValues = [];
    if (updates.employeeNumber !== undefined) {
      teacherFields.push('employee_number = ?');
      teacherValues.push(updates.employeeNumber);
    }
    if (updates.department !== undefined) {
      teacherFields.push('department = ?');
      teacherValues.push(updates.department || null);
    }
    if (teacherFields.length > 0) {
      await connection.execute(
        `UPDATE teachers SET ${teacherFields.join(', ')} WHERE id = ?`,
        [...teacherValues, id]
      );
    }

    const teacher = await getTeacherByIdWithExecutor(connection, id);
    await connection.commit();

    return teacher;
  } catch (error) {
    await connection.rollback();
    translateDuplicateKeyError(error);
  } finally {
    connection.release();
  }
};

export const deleteTeacher = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const teacher = await getTeacherByIdWithExecutor(connection, id, { lock: true });
    await connection.execute('DELETE FROM users WHERE id = ?', [teacher.userId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
