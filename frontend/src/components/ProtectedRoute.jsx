// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

export default function ProtectedRoute({ requireAdmin = false, requireApprovedMentor = false }) {
  const { user, loading, isAdmin, isApprovedMentor, isMentor } = useAuth();

  if (loading) return null; // or a spinner

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  if (requireApprovedMentor) {
    // if mentor but not approved, send to pending page or home
    if (isMentor && !isApprovedMentor) return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}
