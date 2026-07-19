import api from './api'

export const getQuestions = async (params) => (await api.get('/questions', { params })).data.data
export const getQuestion = async (id) => (await api.get(`/questions/${id}`)).data.data
export const createQuestion = async (payload) => (await api.post('/questions', payload)).data.data
export const updateQuestion = async ({ id, payload }) => (await api.put(`/questions/${id}`, payload)).data.data
export const deleteQuestion = async (id) => (await api.delete(`/questions/${id}`)).data.data
