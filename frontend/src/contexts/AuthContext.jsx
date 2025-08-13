import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // NO JWT AUTHENTICATION - MOCK ADMIN USER
  const [user, setUser] = useState({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    is_active: true
  })
  const [loading, setLoading] = useState(false) // No loading needed
  const [token, setToken] = useState('mock-token') // Mock token

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // No JWT authentication needed
  useEffect(() => {
    // Always logged in as admin
    setLoading(false)
  }, [])

  const fetchUserProfile = async () => {
    // No need to fetch - always admin
    return
  }

  const login = async (username, password) => {
    // Always successful login as admin
    toast.success('Login erfolgreich!')
    return { success: true }
  }

  const register = async (username, email, password) => {
    // Always successful registration as admin
    toast.success('Registrierung erfolgreich!')
    return { success: true }
  }

  const logout = () => {
    // No real logout - just show message
    toast.success('Erfolgreich abgemeldet')
  }

  const updateProfile = async (profileData) => {
    // Mock profile update
    toast.success('Profil aktualisiert!')
    return { success: true }
  }

  const isAdmin = () => {
    // Always admin
    return true
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    API_BASE_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

