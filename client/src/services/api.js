import axios from 'axios'

const TOKEN_KEY = 'mcq_token'

const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new Event('mcq:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api

/** Returns a safe message for every Axios/API failure without exposing internals. */
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback
