import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'mcq_token'
const USER_KEY = 'mcq_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
  const login = (payload) => { localStorage.setItem(TOKEN_KEY, payload.token); localStorage.setItem(USER_KEY, JSON.stringify(payload.user)); setUser(payload.user) }
  const logout = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null) }
  const value = useMemo(() => ({ user, login, logout, isAuthenticated: Boolean(user && localStorage.getItem(TOKEN_KEY)) }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
