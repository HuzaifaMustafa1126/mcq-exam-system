import api from "./api";

export const getStudentDashboard = async () =>
  (await api.get("/student/dashboard")).data.data;
export const getStudentExams = async () =>
  (await api.get("/student/exams")).data.data;
export const getStudentExam = async (id) =>
  (await api.get(`/student/exams/${id}`)).data.data;
export const startStudentExam = async (id) =>
  (await api.post(`/student/exams/${id}/start`)).data.data;
export const getStudentQuestions = async (id, page = 1, signal) => {
  const receivedAt = performance.now();
  const data = (
    await api.get(`/student/exams/${id}/questions`, {
      params: { page, limit: 1 },
      signal,
    })
  ).data.data;
  return { ...data, receivedAt };
};
export const saveStudentAnswer = async ({ id, ...payload }) =>
  (await api.put(`/student/exams/${id}/answer`, payload)).data.data;
export const submitStudentExam = async ({ id, attemptId }) =>
  (await api.post(`/student/exams/${id}/submit`, { attemptId, answers: [] }))
    .data.data;
export const getStudentResults = async (params) =>
  (await api.get("/student/results", { params })).data.data;
export const getStudentResult = async (id) =>
  (await api.get(`/student/results/${id}`)).data.data;
export const updateProfile = async (payload) =>
  (await api.put("/auth/profile", payload)).data.data;
