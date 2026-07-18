import pool from '../config/db.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import AppError from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';

const studentSelect = `
  SELECT
    students.id,
    students.user_id AS userId,
    users.name,
    users.email,
    users.status,
    students.student_number AS rollNumber,
    students.registration_number AS registrationNumber,
    students.semester,
    students.section,
    students.\`session\` AS session,
    students.phone,
    students.created_at AS createdAt,
    students.updated_at AS updatedAt
  FROM students
  INNER JOIN users ON users.id = students.user_id
`;

const duplicateError = (field) =>
  new AppError(`A student with this ${field} already exists`, HTTP_STATUS.CONFLICT);

const getStudentByIdWithExecutor = async (executor, id, { lock = false } = {}) => {
  const [rows] = await executor.execute(
    `${studentSelect} WHERE students.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id]
  );

  if (!rows[0]) {
    throw new AppError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  return rows[0];
};

const ensureEmailAvailable = async (connection, email, excludedUserId = null) => {
  const sql = excludedUserId
    ? 'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1 FOR UPDATE'
    : 'SELECT id FROM users WHERE email = ? LIMIT 1 FOR UPDATE';
  const values = excludedUserId ? [email, excludedUserId] : [email];
  const [rows] = await connection.execute(sql, values);

  if (rows.length > 0) throw duplicateError('email address');
};

const ensureRollNumberAvailable = async (connection, rollNumber, excludedStudentId = null) => {
  const sql = excludedStudentId
    ? 'SELECT id FROM students WHERE student_number = ? AND id != ? LIMIT 1 FOR UPDATE'
    : 'SELECT id FROM students WHERE student_number = ? LIMIT 1 FOR UPDATE';
  const values = excludedStudentId ? [rollNumber, excludedStudentId] : [rollNumber];
  const [rows] = await connection.execute(sql, values);

  if (rows.length > 0) throw duplicateError('roll number');
};

const translateDuplicateKeyError = (error) => {
  if (error.code !== 'ER_DUP_ENTRY') throw error;

  if (error.message.includes('uq_users_email')) throw duplicateError('email address');
  if (error.message.includes('uq_students_student_number')) throw duplicateError('roll number');

  throw new AppError('A student with these details already exists', HTTP_STATUS.CONFLICT);
};

export const createStudent = async ({
  name,
  email,
  password,
  rollNumber,
  registrationNumber,
  semester,
  section,
  session,
  phone,
  status = 'active',
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureEmailAvailable(connection, email);
    await ensureRollNumberAvailable(connection, rollNumber);

    const passwordHash = await hashPassword(password);
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'student', status]
    );
    const [studentResult] = await connection.execute(
      `INSERT INTO students
        (user_id, student_number, registration_number, semester, section, \`session\`, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, rollNumber, registrationNumber, semester, section, session, phone]
    );

    const student = await getStudentByIdWithExecutor(connection, studentResult.insertId);
    await connection.commit();

    return student;
  } catch (error) {
    await connection.rollback();
    translateDuplicateKeyError(error);
  } finally {
    connection.release();
  }
};

export const getStudents = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const searchTerm = search ? `%${search}%` : null;
  const whereClause = searchTerm
    ? 'WHERE users.name LIKE ? OR users.email LIKE ? OR students.student_number LIKE ?'
    : '';
  const searchValues = searchTerm ? [searchTerm, searchTerm, searchTerm] : [];

  const [studentsResult, totalResult] = await Promise.all([
    pool.execute(
      `${studentSelect} ${whereClause} ORDER BY students.id DESC LIMIT ? OFFSET ?`,
      [...searchValues, limit, offset]
    ),
    pool.execute(
      `SELECT COUNT(*) AS total FROM students INNER JOIN users ON users.id = students.user_id ${whereClause}`,
      searchValues
    ),
  ]);

  const [students] = studentsResult;
  const [totalRows] = totalResult;
  const total = Number(totalRows[0].total);

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getStudentById = (id) => getStudentByIdWithExecutor(pool, id);

export const updateStudent = async (id, updates) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const currentStudent = await getStudentByIdWithExecutor(connection, id, { lock: true });

    if (updates.email !== undefined) {
      await ensureEmailAvailable(connection, updates.email, currentStudent.userId);
    }
    if (updates.rollNumber !== undefined) {
      await ensureRollNumberAvailable(connection, updates.rollNumber, id);
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
        [...userValues, currentStudent.userId]
      );
    }

    const studentFields = [];
    const studentValues = [];
    const studentColumnByField = {
      rollNumber: 'student_number',
      registrationNumber: 'registration_number',
      semester: 'semester',
      section: 'section',
      session: '`session`',
      phone: 'phone',
    };
    for (const [field, column] of Object.entries(studentColumnByField)) {
      if (updates[field] !== undefined) {
        studentFields.push(`${column} = ?`);
        studentValues.push(updates[field]);
      }
    }
    if (studentFields.length > 0) {
      await connection.execute(
        `UPDATE students SET ${studentFields.join(', ')} WHERE id = ?`,
        [...studentValues, id]
      );
    }

    const student = await getStudentByIdWithExecutor(connection, id);
    await connection.commit();

    return student;
  } catch (error) {
    await connection.rollback();
    translateDuplicateKeyError(error);
  } finally {
    connection.release();
  }
};

export const deleteStudent = async (id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const student = await getStudentByIdWithExecutor(connection, id, { lock: true });
    await connection.execute('DELETE FROM users WHERE id = ?', [student.userId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
