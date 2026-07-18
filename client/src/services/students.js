import api from './api'

export const getStudents = async (params) => (await api.get('/students', { params })).data.data
export const getStudent = async (id) => (await api.get(`/students/${id}`)).data.data
export const createStudent = async (payload) => (await api.post('/students', payload)).data.data
export const updateStudent = async ({ id, payload }) => (await api.put(`/students/${id}`, payload)).data.data
export const deleteStudent = async (id) => (await api.delete(`/students/${id}`)).data.data
