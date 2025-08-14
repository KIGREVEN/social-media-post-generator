import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from '@/components/ui/sonner'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PostGeneratorPage from './pages/PostGeneratorPage'
import SimplePostGeneratorPage from './pages/SimplePostGeneratorPage'
import SimplePostGeneratorPageAsync from './pages/SimplePostGeneratorPageAsync'
import PostsPageNew from './pages/PostsPageNew'
import SocialAccountsPage from './pages/SocialAccountsPage'
import Planner from './pages/Planner'
import Scheduler from './pages/Scheduler'
import AdminPageFinalWorking from './pages/AdminPageFinalWorking'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/simple-generator" element={<SimplePostGeneratorPage />} />
              <Route path="/async-generator" element={<SimplePostGeneratorPageAsync />} />
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
                    <PostsPageNew />
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
                path="/planner" 
                element={
                  <ProtectedRoute>
                    <Planner />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/scheduler" 
                element={
                  <ProtectedRoute>
                    <Scheduler />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPageFinalWorking />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  )
}

export default App
