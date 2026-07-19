import api from './api'

export const getSubjects = async (params) => (await api.get('/subjects', { params })).data.data
export const getSubject = async (id) => (await api.get(`/subjects/${id}`)).data.data
export const createSubject = async (payload) => (await api.post('/subjects', payload)).data.data
export const updateSubject = async ({ id, payload }) => (await api.put(`/subjects/${id}`, payload)).data.data
export const deleteSubject = async (id) => (await api.delete(`/subjects/${id}`)).data.data
