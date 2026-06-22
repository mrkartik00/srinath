import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'doctor') return <Navigate to="/login" replace />;
  if (user.approvalStatus && user.approvalStatus !== 'approved' && user.approvalStatus !== 'not_applicable') {
    return <Navigate to="/pending-approval" replace />;
  }
  return children;
}
