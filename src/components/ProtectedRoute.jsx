import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Spinner } from './Feedback'

export default function ProtectedRoute() {
  const { session, initialized } = useAuthStore()
  const location = useLocation()
  if (!initialized) return <Spinner label="Verificando sua sessão…" />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
