import api from './api'

export const getTeachers = async ({ page, limit, search }) => {
  const { data } = await api.get('/teachers', { params: { page, limit, search: search || undefined } })
  return data.data
}

export const getTeacher = async (id) => (await api.get(`/teachers/${id}`)).data.data
export const createTeacher = async (payload) => (await api.post('/teachers', payload)).data.data
export const updateTeacher = async ({ id, payload }) => (await api.put(`/teachers/${id}`, payload)).data.data
export const deleteTeacher = async (id) => (await api.delete(`/teachers/${id}`)).data.data
