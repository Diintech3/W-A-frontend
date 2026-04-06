import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      if (data.success) setUser(data.data.user)
      else setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken)
      setUser(data.data.user)
    }
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken)
      setUser(data.data.user)
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me()
      if (data.success) setUser(data.data.user)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
