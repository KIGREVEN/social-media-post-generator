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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        // Only remove token on 401 (Unauthorized) - token is actually invalid
        console.log('Token expired or invalid, removing...')
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } else {
        // For other errors (422, 500, etc.), keep the token but log the error
        console.error('Error fetching user profile:', response.status, response.statusText)
        // Don't remove the token, it might still be valid
      }
    } catch (error) {
      console.error('Network error fetching user profile:', error)
      // Don't remove token on network errors
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        const { access_token, user } = data
        localStorage.setItem('token', access_token)
        setToken(access_token)
        setUser(user)
        toast.success('Login erfolgreich!')
        return { success: true }
      } else {
        toast.error(data.error || 'Login fehlgeschlagen')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Verbindungsfehler')
      return { success: false, error: 'Verbindungsfehler' }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        const { access_token, user } = data
        localStorage.setItem('token', access_token)
        setToken(access_token)
        setUser(user)
        toast.success('Registrierung erfolgreich!')
        return { success: true }
      } else {
        toast.error(data.error || 'Registrierung fehlgeschlagen')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Verbindungsfehler')
      return { success: false, error: 'Verbindungsfehler' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    toast.success('Erfolgreich abgemeldet')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        toast.success('Profil aktualisiert!')
        return { success: true }
      } else {
        toast.error(data.error || 'Profil-Update fehlgeschlagen')
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Verbindungsfehler')
      return { success: false, error: 'Verbindungsfehler' }
    }
  }

  const isAdmin = () => {
    return user && user.role === 'admin'
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

