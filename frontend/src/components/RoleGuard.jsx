import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleGuard = ({ allowedRoles, children, redirectTo = '/app/dashboard' }) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(allowedRoles)) {
    // User doesn't have required role, redirect to dashboard
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleGuard;
