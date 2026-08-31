import api from "./api";

export const getQuestions = async (params) =>
  (await api.get("/questions", { params })).data.data;
export const getAllQuestions = async (params = {}) => {
  const limit = 100;
  const firstPage = await getQuestions({ ...params, page: 1, limit });
  const totalPages = firstPage.pagination?.totalPages ?? 1;

  if (totalPages <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getQuestions({ ...params, page: index + 2, limit }),
    ),
  );

  return {
    ...firstPage,
    questions: [
      ...(firstPage.questions ?? []),
      ...remainingPages.flatMap((page) => page.questions ?? []),
    ],
  };
};
export const getQuestion = async (id) =>
  (await api.get(`/questions/${id}`)).data.data;
export const createQuestion = async (payload) =>
  (await api.post("/questions", payload)).data.data;
export const updateQuestion = async ({ id, payload }) =>
  (await api.put(`/questions/${id}`, payload)).data.data;
export const deleteQuestion = async (id) =>
  (await api.delete(`/questions/${id}`)).data.data;
