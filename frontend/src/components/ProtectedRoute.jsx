import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card-enhanced max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-shake">
            <ShieldAlert className="text-red-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="btn-enhanced btn-secondary-enhanced w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
