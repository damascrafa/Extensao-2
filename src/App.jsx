import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ConfigMissing from './components/ConfigMissing'
import ErrorBoundary from './components/ErrorBoundary'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import CourseDetail from './pages/CourseDetail'
import Learn from './pages/Learn'
import Exam from './pages/Exam'
import Certificates from './pages/Certificates'
import CertificateView from './pages/CertificateView'
import ValidateCertificate from './pages/ValidateCertificate'
import Feedback from './pages/Feedback'
import NotFound from './pages/NotFound'

// Links como "/#cursos" não rolam sozinhos no React Router.
function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash, pathname])
  return null
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => init(), [init])

  if (!isSupabaseConfigured) return <ConfigMissing />

  return (
    <ErrorBoundary>
      <ScrollToHash />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/cursos/:slug" element={<CourseDetail />} />
          <Route path="/validar/:code?" element={<ValidateCertificate />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/painel" element={<Dashboard />} />
            <Route path="/aprender/:slug/:lessonId?" element={<Learn />} />
            <Route path="/cursos/:slug/prova" element={<Exam />} />
            <Route path="/certificados" element={<Certificates />} />
            <Route path="/certificados/:id" element={<CertificateView />} />
            <Route path="/feedback" element={<Feedback />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
