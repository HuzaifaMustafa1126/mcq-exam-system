import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from '../context/authContext'

const TOKEN_KEY = 'mcq_token'
const USER_KEY = 'mcq_user'

const readStoredAuth = () => {
  for (const storage of [localStorage, sessionStorage]) {
    const token = storage.getItem(TOKEN_KEY)
    const serializedUser = storage.getItem(USER_KEY)
    if (!token || !serializedUser) continue

    try {
      return { token, user: JSON.parse(serializedUser) }
    } catch {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(USER_KEY)
    }
  }
  return { token: null, user: null }
}

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  const logout = useCallback(() => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(TOKEN_KEY)
      storage.removeItem(USER_KEY)
    }
    setAuth({ token: null, user: null })
  }, [])

  const login = useCallback((payload, { remember = false } = {}) => {
    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage
    otherStorage.removeItem(TOKEN_KEY)
    otherStorage.removeItem(USER_KEY)
    storage.setItem(TOKEN_KEY, payload.token)
    storage.setItem(USER_KEY, JSON.stringify(payload.user))
    setAuth({ token: payload.token, user: payload.user })
  }, [])

  useEffect(() => {
    window.addEventListener('mcq:unauthorized', logout)
    return () => window.removeEventListener('mcq:unauthorized', logout)
  }, [logout])

  const value = useMemo(() => ({
    user: auth.user,
    token: auth.token,
    login,
    logout,
    isAuthenticated: Boolean(auth.user && auth.token),
  }), [auth, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
