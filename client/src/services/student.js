import api from './api'

export const getStudentDashboard = async () => (await api.get('/student/dashboard')).data.data
export const getStudentExams = async () => (await api.get('/student/exams')).data.data
export const getStudentExam = async (id) => (await api.get(`/student/exams/${id}`)).data.data
export const startStudentExam = async (id) => (await api.post(`/student/exams/${id}/start`)).data.data
export const getStudentQuestions = async (id) => (await api.get(`/student/exams/${id}/questions`, { params: { limit: 100 } })).data.data
export const submitStudentExam = async ({ id, answers }) => (await api.post(`/student/exams/${id}/submit`, { answers })).data.data
export const getStudentResults = async () => (await api.get('/student/results')).data.data
export const getStudentResult = async (id) => (await api.get(`/student/results/${id}`)).data.data
export const updateProfile = async (payload) => (await api.put('/auth/profile', payload)).data.data
