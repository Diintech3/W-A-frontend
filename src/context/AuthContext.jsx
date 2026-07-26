import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
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

  const login = useCallback(async (email, password, expectedRole = null) => {
    const { data } = await authApi.login({ email, password, expectedRole })
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
    if (sessionStorage.getItem('isImpersonatedSession')) {
      sessionStorage.clear()
    } else {
      sessionStorage.clear()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('originalAccessToken')
      localStorage.removeItem('originalUser')
    }
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

  const impersonate = useCallback(async (targetUserId) => {
    const { data } = await authApi.impersonate({ targetUserId })
    if (data.success && data.data?.accessToken) {
      if (!localStorage.getItem('originalAccessToken')) {
        localStorage.setItem('originalAccessToken', localStorage.getItem('accessToken') || '')
        localStorage.setItem('originalUser', JSON.stringify(user))
      }
      localStorage.setItem('accessToken', data.data.accessToken)
      setUser(data.data.user)
    }
    return data
  }, [user])

  const openWorkspaceInNewTab = useCallback(async (targetUserId, targetRole = 'client') => {
    const { data } = await authApi.impersonate({ targetUserId })
    if (data.success && data.data?.accessToken) {
      const token = data.data.accessToken
      const url = `/impersonate-session?token=${encodeURIComponent(token)}&role=${targetRole}`
      window.open(url, '_blank')
    }
    return data
  }, [])

  const revertImpersonation = useCallback(async () => {
    const origToken = localStorage.getItem('originalAccessToken')
    const origUserStr = localStorage.getItem('originalUser')
    if (origToken) {
      localStorage.setItem('accessToken', origToken)
      localStorage.removeItem('originalAccessToken')
      localStorage.removeItem('originalUser')
      if (origUserStr) {
        try { setUser(JSON.parse(origUserStr)) } catch { /* ignore */ }
      }
      await refreshUser()
    }
  }, [refreshUser])

  const isImpersonating = Boolean(localStorage.getItem('originalAccessToken')) || Boolean(sessionStorage.getItem('isImpersonatedSession'))
  let originalUser = null
  try {
    const str = localStorage.getItem('originalUser')
    if (str) originalUser = JSON.parse(str)
  } catch { /* ignore */ }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      loadMe,
      refreshUser,
      impersonate,
      openWorkspaceInNewTab,
      revertImpersonation,
      isImpersonating,
      originalUser,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, login, register, logout, loadMe, refreshUser, impersonate, openWorkspaceInNewTab, revertImpersonation, isImpersonating, originalUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
