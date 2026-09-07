import pool from "../config/db.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import AppError from "../utils/AppError.js";

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
    exams.max_attempts AS maxAttempts,
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
    `${examSelect} WHERE exams.id = ?${lock ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (!rows[0]) throw new AppError("Exam not found", HTTP_STATUS.NOT_FOUND);
  return rows[0];
};

const ensureSubjectExists = async (connection, subjectId) => {
  const [rows] = await connection.execute(
    "SELECT id FROM subjects WHERE id = ? LIMIT 1",
    [subjectId],
  );
  if (!rows[0]) throw new AppError("Subject not found", HTTP_STATUS.NOT_FOUND);
};

const getTeacherIdForUser = async (connection, user) => {
  if (user.role !== "teacher") return null;
  const [rows] = await connection.execute(
    "SELECT id FROM teachers WHERE user_id = ? LIMIT 1",
    [user.id],
  );
  if (!rows[0])
    throw new AppError("Teacher profile not found", HTTP_STATUS.FORBIDDEN);
  return rows[0].id;
};

const assertExamAccess = async (connection, examId, user) => {
  if (user.role !== "teacher") return;
  const teacherId = await getTeacherIdForUser(connection, user);
  const [rows] = await connection.execute(
    "SELECT id FROM exams WHERE id = ? AND created_by_teacher_id = ? LIMIT 1",
    [examId, teacherId],
  );
  if (!rows[0]) throw new AppError("Exam not found", HTTP_STATUS.NOT_FOUND);
};

const validateExamConstraints = ({
  totalMarks,
  passingMarks,
  startTime,
  endTime,
}) => {
  if (Number(passingMarks) > Number(totalMarks)) {
    throw new AppError(
      "Passing marks cannot exceed total marks",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
  if (endTime && (!startTime || new Date(endTime) <= new Date(startTime))) {
    throw new AppError(
      "End time must be later than start time",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
};

const replaceQuestions = async (
  connection,
  examId,
  questionIds,
  subjectId,
  teacherId,
  passingMarks,
) => {
  if (
    !Array.isArray(questionIds) ||
    questionIds.length === 0 ||
    questionIds.length > 2000 ||
    questionIds.some((id) => !Number.isSafeInteger(id) || id < 1) ||
    new Set(questionIds).size !== questionIds.length
  )
    throw new AppError(
      "Choose between 1 and 2000 unique questions",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  const [questions] = await connection.execute(
    `SELECT id, subject_id AS subjectId, created_by_teacher_id AS teacherId, marks, negative_marks AS negativeMarks
     FROM questions WHERE id IN (${questionIds.map(() => "?").join(",")}) FOR UPDATE`,
    questionIds,
  );
  if (
    questions.length !== questionIds.length ||
    questions.some(
      (q) =>
        Number(q.subjectId) !== Number(subjectId) ||
        (teacherId && Number(q.teacherId) !== Number(teacherId)),
    )
  )
    throw new AppError(
      "Every question must belong to the exam subject and be accessible to you",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  const total = questions.reduce((sum, q) => sum + Number(q.marks), 0);
  if (Number(passingMarks) > total)
    throw new AppError(
      "Passing marks exceed selected question marks",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  const byId = new Map(questions.map((q) => [q.id, q]));
  await connection.execute("DELETE FROM exam_questions WHERE exam_id = ?", [
    examId,
  ]);
  await connection.query(
    "INSERT INTO exam_questions (exam_id, question_id, display_order, marks, negative_marks) VALUES ?",
    [
      questionIds.map((id, i) => [
        examId,
        id,
        i + 1,
        byId.get(id).marks,
        byId.get(id).negativeMarks,
      ]),
    ],
  );
  await connection.execute("UPDATE exams SET total_marks = ? WHERE id = ?", [
    total,
    examId,
  ]);
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
        (subject_id, created_by_teacher_id, title, description, duration_minutes, total_marks, pass_marks, max_attempts, starts_at, ends_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.subjectId,
        teacherId,
        data.title,
        data.description ?? null,
        data.durationMinutes,
        data.totalMarks,
        data.passingMarks,
        data.maxAttempts ?? 1,
        data.startTime ?? null,
        data.endTime ?? null,
        data.status ?? "draft",
      ],
    );
    if (data.questionIds !== undefined)
      await replaceQuestions(
        connection,
        result.insertId,
        data.questionIds,
        data.subjectId,
        teacherId,
        data.passingMarks,
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

export const getExams = async (
  { page, limit, search, subjectId, status },
  user,
) => {
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];
  if (search) {
    filters.push("exams.title LIKE ?");
    values.push(`%${search}%`);
  }
  if (subjectId) {
    filters.push("exams.subject_id = ?");
    values.push(subjectId);
  }
  if (status) {
    filters.push("exams.status = ?");
    values.push(status);
  }
  if (user?.role === "teacher") {
    const connection = await pool.getConnection();
    try {
      const teacherId = await getTeacherIdForUser(connection, user);
      filters.push("exams.created_by_teacher_id = ?");
      values.push(teacherId);
    } finally {
      connection.release();
    }
  }
  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const countSql = `SELECT COUNT(*) AS total FROM exams
    INNER JOIN subjects ON subjects.id = exams.subject_id ${whereClause}`;
  const [examsResult, totalResult] = await Promise.all([
    pool.query(
      `${examSelect} ${whereClause} ORDER BY exams.id DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      values,
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

export const getExamById = async (id, user) => {
  const connection = await pool.getConnection();
  try {
    await assertExamAccess(connection, id, user);
    return await getExamByIdWithExecutor(connection, id);
  } finally {
    connection.release();
  }
};

export const updateExam = async (id, updates, user) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await assertExamAccess(connection, id, user);
    const currentExam = await getExamByIdWithExecutor(connection, id, {
      lock: true,
    });
    const [attempts] = await connection.execute(
      "SELECT id FROM student_exams WHERE exam_id = ? LIMIT 1",
      [id],
    );
    if (attempts.length)
      throw new AppError(
        "Exams with attempts cannot be edited. Create a new exam instead.",
        HTTP_STATUS.CONFLICT,
      );
    if (updates.subjectId !== undefined)
      await ensureSubjectExists(connection, updates.subjectId);

    validateExamConstraints({
      totalMarks: updates.totalMarks ?? currentExam.totalMarks,
      passingMarks: updates.passingMarks ?? currentExam.passingMarks,
      startTime:
        updates.startTime === undefined
          ? currentExam.startTime
          : updates.startTime,
      endTime:
        updates.endTime === undefined ? currentExam.endTime : updates.endTime,
    });

    const columnByField = {
      subjectId: "subject_id",
      title: "title",
      description: "description",
      durationMinutes: "duration_minutes",
      totalMarks: "total_marks",
      passingMarks: "pass_marks",
      maxAttempts: "max_attempts",
      startTime: "starts_at",
      endTime: "ends_at",
      status: "status",
    };
    const fields = [];
    const values = [];
    for (const [field, column] of Object.entries(columnByField)) {
      if (updates[field] !== undefined) {
        fields.push(`${column} = ?`);
        values.push(
          ["description", "startTime", "endTime"].includes(field)
            ? (updates[field] ?? null)
            : updates[field],
        );
      }
    }
    await connection.execute(
      `UPDATE exams SET ${fields.join(", ")} WHERE id = ?`,
      [...values, id],
    );
    if (updates.questionIds !== undefined)
      await replaceQuestions(
        connection,
        id,
        updates.questionIds,
        updates.subjectId ?? currentExam.subjectId,
        await getTeacherIdForUser(connection, user),
        updates.passingMarks ?? currentExam.passingMarks,
      );
    else if (
      updates.subjectId !== undefined &&
      Number(updates.subjectId) !== Number(currentExam.subjectId)
    ) {
      const [assigned] = await connection.execute(
        "SELECT id FROM exam_questions WHERE exam_id = ? LIMIT 1",
        [id],
      );
      if (assigned.length)
        throw new AppError(
          "Replace assigned questions when changing the exam subject",
          HTTP_STATUS.CONFLICT,
        );
    }
    await connection.commit();
    return await getExamByIdWithExecutor(connection, id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteExam = async (id, user) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await assertExamAccess(connection, id, user);
    await getExamByIdWithExecutor(connection, id, { lock: true });
    const [attempts] = await connection.execute(
      "SELECT id FROM student_exams WHERE exam_id = ? LIMIT 1",
      [id],
    );
    if (attempts.length)
      throw new AppError(
        "Exams with attempts cannot be deleted.",
        HTTP_STATUS.CONFLICT,
      );
    await connection.execute("DELETE FROM exams WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
