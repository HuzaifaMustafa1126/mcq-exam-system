import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
export default function ProtectedRoute({ roles }) { const { user, isAuthenticated } = useAuth(); const location = useLocation(); if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />; if (roles && !roles.includes(user?.role)) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />; return <Outlet/> }
