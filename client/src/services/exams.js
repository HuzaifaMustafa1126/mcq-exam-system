import api from './api'

export const getExams = async (params) => (await api.get('/exams', { params })).data.data
export const getExam = async (id) => (await api.get(`/exams/${id}`)).data.data
export const createExam = async (payload) => (await api.post('/exams', payload)).data.data
export const updateExam = async ({ id, payload }) => (await api.put(`/exams/${id}`, payload)).data.data
export const deleteExam = async (id) => (await api.delete(`/exams/${id}`)).data.data
export const getExamQuestions = async (id) => (await api.get(`/exams/${id}/questions`)).data.data
export const assignExamQuestions = async ({ id, questionIds }) => {
  const batchSize = 500
  let result

  for (let index = 0; index < questionIds.length; index += batchSize) {
    result = (await api.post(`/exams/${id}/questions`, {
      questionIds: questionIds.slice(index, index + batchSize),
    })).data.data
  }

  return result
}
export const removeExamQuestion = async ({ id, questionId }) => (await api.delete(`/exams/${id}/questions/${questionId}`)).data.data
