// Run from server/: AUDIT_DATABASE_TEST=1 node --test test/audit.integration.test.js
// All fixtures and service writes use ONE transaction and are rolled back.
import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { generateToken } from "../src/utils/jwt.js";
import pool from "../src/config/db.js";
import {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} from "../src/services/question.service.js";
import {
  createExam,
  deleteExam,
  updateExam,
} from "../src/services/exam.service.js";
import {
  startStudentExam,
  saveStudentAnswer,
  getStudentExamQuestions,
  submitStudentExam,
} from "../src/services/studentExam.service.js";

test(
  "subject isolation, saved answers, expiry, history guards and idempotent submission",
  { skip: process.env.AUDIT_DATABASE_TEST !== "1" },
  async () => {
    const connection = await pool.getConnection();
    const originals = {
      getConnection: pool.getConnection,
      query: pool.query,
      execute: pool.execute,
    };
    const executor = {
      query: connection.query.bind(connection),
      execute: connection.execute.bind(connection),
      beginTransaction: () => connection.query("SAVEPOINT audit_service"),
      commit: async () => {},
      rollback: () => connection.query("ROLLBACK TO SAVEPOINT audit_service"),
      release: () => {},
    };
    const http = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => http.once("listening", resolve));
    const base = `http://127.0.0.1:${http.address().port}/api/v1`;
    await connection.beginTransaction();
    pool.getConnection = async () => executor;
    pool.query = executor.query;
    pool.execute = executor.execute;
    try {
      const suffix = `audit-${Date.now()}`;
      const [user] = await connection.execute(
        "INSERT INTO users (name,email,password,role) VALUES (?,?,'test-only-unusable-hash','student')",
        [suffix, `${suffix}@invalid.example`],
      );
      await connection.execute(
        "INSERT INTO students (user_id,student_number) VALUES (?,?)",
        [user.insertId, suffix],
      );
      const token = generateToken({
        id: user.insertId,
        name: suffix,
        email: `${suffix}@invalid.example`,
        role: "student",
      });
      const request = (path, method = "GET", body) =>
        fetch(`${base}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      assert.equal((await fetch(`${base}/health`)).status, 200);
      assert.equal((await fetch(`${base}/questions`)).status, 401);
      assert.equal((await request("/questions")).status, 403);
      assert.equal(
        (await request("/subjects", "POST", { name: "Unauthorized" })).status,
        403,
      );
      const subjects = [];
      for (const name of ["English", "Mathematics"]) {
        const [subject] = await connection.execute(
          "INSERT INTO subjects (name,code) VALUES (?,?)",
          [`${name} audit`, `${suffix}-${name}`],
        );
        subjects.push(subject.insertId);
      }
      const questions = [];
      for (const subjectId of subjects) {
        for (let i = 0; i < 5; i++) {
          const q = await createQuestion(
            {
              subjectId,
              questionText: `Audit question ${i}`,
              marks: 1,
              difficulty: "easy",
              status: "active",
              options: ["A", "B", "C", "D"].map((optionText, index) => ({
                optionText,
                isCorrect: index === 0,
              })),
            },
            { role: "admin", id: user.insertId },
          );
          assert.equal(q.subjectId, subjectId);
          questions.push(q);
        }
        const listed = await getQuestions(
          { page: 1, limit: 2, subjectId },
          { role: "admin" },
        );
        assert.equal(listed.pagination.total, 5);
        assert.equal(listed.questions.length, 2);
        assert.ok(listed.questions.every((q) => q.subjectId === subjectId));
      }
      const exam = await createExam(
        {
          subjectId: subjects[0],
          title: suffix,
          durationMinutes: 1,
          totalMarks: 5,
          passingMarks: 1,
          maxAttempts: 2,
          status: "published",
          questionIds: questions.slice(0, 5).map((q) => q.id),
        },
        { role: "admin" },
      );
      const attempt = await startStudentExam(user.insertId, exam.id);
      const resumed = await startStudentExam(user.insertId, exam.id);
      assert.equal(resumed.attemptId, attempt.attemptId);
      assert.equal(
        new Date(resumed.expiresAt).getTime(),
        new Date(attempt.expiresAt).getTime(),
      );
      const q = questions[0];
      await saveStudentAnswer(user.insertId, exam.id, {
        attemptId: attempt.attemptId,
        questionId: q.id,
        optionId: q.options[0].id,
      });
      await assert.rejects(
        saveStudentAnswer(user.insertId, exam.id, {
          attemptId: attempt.attemptId,
          questionId: q.id,
          optionId: questions[5].options[0].id,
        }),
        /does not belong/,
      );
      await assert.rejects(
        saveStudentAnswer(user.insertId, exam.id, {
          attemptId: attempt.attemptId + 1,
          questionId: q.id,
          optionId: q.options[0].id,
        }),
        /not editable/,
      );
      let loaded = await getStudentExamQuestions(user.insertId, exam.id, {
        page: 1,
        limit: 1,
      });
      assert.equal(loaded.answers[q.id], q.options[0].id);
      assert.equal(loaded.questions.length, 1);
      assert.equal(loaded.questionIds.length, 5);
      assert.ok(
        loaded.questions[0].options.every(
          (o) => !Object.hasOwn(o, "isCorrect"),
        ),
      );
      await assert.rejects(
        updateQuestion(q.id, { questionText: "Changed" }, { role: "admin" }),
        /cannot be changed/,
      );
      await assert.rejects(
        deleteQuestion(q.id, { role: "admin" }),
        /cannot be changed/,
      );
      await assert.rejects(
        updateExam(exam.id, { durationMinutes: 2 }, { role: "admin" }),
        /cannot be edited/,
      );
      await connection.execute(
        "UPDATE student_exams SET expires_at = NOW() WHERE id = ?",
        [attempt.attemptId],
      );
      loaded = await getStudentExamQuestions(user.insertId, exam.id, {
        page: 1,
        limit: 1,
      });
      assert.equal(loaded.status, "TIME_COMPLETED");
      await assert.rejects(
        saveStudentAnswer(user.insertId, exam.id, {
          attemptId: attempt.attemptId,
          questionId: q.id,
          optionId: q.options[1].id,
        }),
        (e) => e.code === "EXAM_TIME_COMPLETED",
      );
      const expiredResponse = await request(
        `/student/exams/${exam.id}/answer`,
        "PUT",
        {
          attemptId: attempt.attemptId,
          questionId: q.id,
          optionId: q.options[1].id,
        },
      );
      assert.equal(expiredResponse.status, 409);
      assert.equal((await expiredResponse.json()).code, "EXAM_TIME_COMPLETED");
      const [before] = await connection.execute(
        "SELECT COUNT(*) AS total FROM results WHERE student_exam_id = ?",
        [attempt.attemptId],
      );
      assert.equal(before[0].total, 0, "Expiry must not generate a result");
      const reopened = await startStudentExam(user.insertId, exam.id);
      assert.equal(reopened.attemptId, attempt.attemptId);
      assert.equal(reopened.status, "TIME_COMPLETED");
      const result = await submitStudentExam(
        user.insertId,
        exam.id,
        [{ questionId: q.id, optionId: q.options[1].id }],
        attempt.attemptId,
      );
      assert.equal(result.score, 1, "Only previously saved answers are graded");
      const repeated = await submitStudentExam(
        user.insertId,
        exam.id,
        [],
        attempt.attemptId,
      );
      assert.equal(repeated.resultId, result.resultId);
      const [after] = await connection.execute(
        "SELECT COUNT(*) AS total FROM results WHERE student_exam_id = ?",
        [attempt.attemptId],
      );
      assert.equal(after[0].total, 1);
    const nextAttempt = await startStudentExam(user.insertId, exam.id);
    assert.notEqual(nextAttempt.attemptId, attempt.attemptId);
    const oldRetry = await submitStudentExam(user.insertId, exam.id, [], attempt.attemptId);
    assert.equal(oldRetry.resultId, result.resultId, "Retries stay bound to the original attempt even after a retake starts");
    await deleteExam(exam.id, { role: "admin" });
    const [deletedExam] = await connection.execute("SELECT id FROM exams WHERE id = ?", [exam.id]);
    assert.equal(deletedExam.length, 0, "Admin deletion removes an exam with attempts and results");
    } finally {
      await new Promise((resolve) => http.close(resolve));
      Object.assign(pool, originals);
      await connection.rollback();
      connection.release();
      await pool.end();
    }
  },
);
