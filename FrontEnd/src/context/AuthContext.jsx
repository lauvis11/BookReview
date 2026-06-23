import { createContext, useContext, useState, useEffect } from 'react'
import * as authAPI from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const handleLogin = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    const user = data.user
    if (user?.id) {
      const userData = { id: user.id, name: user.name, role: user.role, profile_img: user.profile_img }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    }
    throw new Error('Error al iniciar sesión')
  }

  const handleRegister = async (credentials) => {
    const { data } = await authAPI.register(credentials)
    return data
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (_) { /* ignore */ }
    setUser(null)
    localStorage.removeItem('user')
  }

  const updateUser = (data) => {
    setUser(prev => {
      if (!prev) return null
      const updated = { ...prev, ...data }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
