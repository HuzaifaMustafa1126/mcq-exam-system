import api from './api'

export const getResults = async (params) => (await api.get('/results', { params })).data.data
export const getResult = async (id) => (await api.get(`/results/${id}`)).data.data
