import { Navigate, useLocation } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function AdminLayout({ children }) {
  const { admin } = useAdmin()
  const location = useLocation()
  const isLogin = location.pathname === '/admin/login'
  const isSignup = location.pathname === '/admin/signup'
  const isAuthPage = isLogin || isSignup

  if (admin && isAuthPage) {
    return <Navigate to="/admin" replace />
  }
  if (!admin && !isAuthPage) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
