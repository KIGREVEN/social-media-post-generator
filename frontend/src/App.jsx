import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PostGeneratorPage from './pages/PostGeneratorPage'
import PostsPage from './pages/PostsPage'
import SocialAccountsPage from './pages/SocialAccountsPage'
import AdminPageSimple from './pages/AdminPageSimple'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/generate" 
                element={
                  <ProtectedRoute>
                    <PostGeneratorPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/posts" 
                element={
                  <ProtectedRoute>
                    <PostsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/social-accounts" 
                element={
                  <ProtectedRoute>
                    <SocialAccountsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPageSimple />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
