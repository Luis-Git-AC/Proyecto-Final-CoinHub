import { useEffect, useState, useCallback } from 'react'
import { AuthContext } from './AuthContext.js'
import { login as apiLogin, register as apiRegister, me } from '../services/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '')
  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState(null)

  const clearSessionState = useCallback(() => {
    setUser(null)
    setToken('')
    localStorage.removeItem('auth_token')
  }, [])

  const loadCurrentUser = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await me(token)
      setUser(data.user)
      setError(null)
    } catch {
      clearSessionState()
    } finally {
      setLoading(false)
    }
  }, [token, clearSessionState])

  useEffect(() => {
    if (token) loadCurrentUser()
  }, [token, loadCurrentUser])

  const loginUser = async (credentials) => {
    setLoading(true)
    try {
      const data = await apiLogin(credentials)
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)
      setUser(data.user)
      setError(null)
      return data.user
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const registerUser = async (payload) => {
    setLoading(true)
    try {
      const data = await apiRegister(payload)
      setToken(data.token)
      localStorage.setItem('auth_token', data.token)
      setUser(data.user)
      setError(null)
      return data.user
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logoutUser = () => {
    clearSessionState()
  }

  const contextValue = { user, token, loading, error, loginUser, registerUser, logoutUser, loadCurrentUser, isAuthenticated: !!user }
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
