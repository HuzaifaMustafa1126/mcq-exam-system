import api from './api'

export const getExams = async (params) => (await api.get('/exams', { params })).data.data
export const getExam = async (id) => (await api.get(`/exams/${id}`)).data.data
export const createExam = async (payload) => (await api.post('/exams', payload)).data.data
export const updateExam = async ({ id, payload }) => (await api.put(`/exams/${id}`, payload)).data.data
export const deleteExam = async (id) => (await api.delete(`/exams/${id}`)).data.data
export const getExamQuestions = async (id) => (await api.get(`/exams/${id}/questions`)).data.data
export const assignExamQuestions = async ({ id, questionIds }) => (await api.post(`/exams/${id}/questions`, { questionIds })).data.data
export const removeExamQuestion = async ({ id, questionId }) => (await api.delete(`/exams/${id}/questions/${questionId}`)).data.data
