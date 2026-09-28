import React, { useState, useEffect } from 'react'
import { AuthContext } from '../contexts/auth.context'
import axios from 'axios'
import { useNavigate, useLocation } from '@tanstack/react-router'

const TOKEN_KEY = 'gexam_admin_token'

// Attach the admin token to every admin API call
axios.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && cfg.url?.startsWith('/api/admin')) {
    cfg.headers.set('Authorization', `Bearer ${token}`)
  }
  return cfg
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gexam_admin_token'))
  const navigate = useNavigate()
  const location = useLocation()

  const login = (newToken: string) => {
    localStorage.setItem('gexam_admin_token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('gexam_admin_token')
    localStorage.removeItem('gexam_admin_name')
    setToken(null)
    navigate({ to: '/admin/setup', replace: true })
  }

  const isAuthenticated = !!token

  // An expired/invalid token sends the admin back to the login page
  useEffect(() => {
    const id = axios.interceptors.response.use(undefined, (err) => {
      if (err.response?.status === 401 && err.config?.url?.startsWith('/api/admin') && localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      }
      return Promise.reject(err)
    })
    return () => axios.interceptors.response.eject(id)
  }, [])

  const isSetupRoute = location.pathname === '/admin/setup'
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdminRoute && !isSetupRoute && !isAuthenticated) {
      navigate({ to: '/admin/setup', replace: true })
    } else if (isSetupRoute && isAuthenticated) {
      navigate({ to: '/admin/dashboard', replace: true })
    }
  }, [location.pathname, isAuthenticated, isAdminRoute, isSetupRoute, navigate])

  // Don't mount protected admin pages (and fire their API calls) until signed in
  const blocked = isAdminRoute && !isSetupRoute && !isAuthenticated

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {blocked ? null : children}
    </AuthContext.Provider>
  )
}
