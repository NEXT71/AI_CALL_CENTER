import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Eager load critical components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';

// Lazy load public pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Lazy load authenticated pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CallsList = lazy(() => import('./pages/CallsList'));
const CallDetails = lazy(() => import('./pages/CallDetails'));
const UploadCall = lazy(() => import('./pages/UploadCall'));
const ComplianceRules = lazy(() => import('./pages/ComplianceRules'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Subscription = lazy(() => import('./pages/Subscription'));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess'));
const SubscriptionCancelled = lazy(() => import('./pages/SubscriptionCancelled'));
const ViewSales = lazy(() => import('./pages/ViewSales'));
const AddSales = lazy(() => import('./pages/AddSales'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemReports = lazy(() => import('./pages/SystemReports'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Marketing Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Subscription Pages */}
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
          <Route path="/subscription/cancelled" element={<ProtectedRoute><SubscriptionCancelled /></ProtectedRoute>} />
          
          {/* Protected App Pages */}
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calls" element={<RoleGuard allowedRoles={['User']}><CallsList /></RoleGuard>} />
            <Route path="calls/:id" element={<RoleGuard allowedRoles={['User']}><CallDetails /></RoleGuard>} />
            <Route path="upload" element={<RoleGuard allowedRoles={['User']}><UploadCall /></RoleGuard>} />
            <Route path="rules" element={<RoleGuard allowedRoles={['Admin']}><ComplianceRules /></RoleGuard>} />
            <Route path="analytics" element={<RoleGuard allowedRoles={['User']}><Analytics /></RoleGuard>} />
            <Route path="sales-data" element={<RoleGuard allowedRoles={['User']}><ViewSales /></RoleGuard>} />
            <Route path="sales-data/add" element={<RoleGuard allowedRoles={['User']}><AddSales /></RoleGuard>} />
            <Route path="sales-reports" element={<RoleGuard allowedRoles={['Admin']}><SalesReports /></RoleGuard>} />
            <Route path="users" element={<RoleGuard allowedRoles={['Admin']}><UserManagement /></RoleGuard>} />
            <Route path="reports" element={<RoleGuard allowedRoles={['Admin']}><SystemReports /></RoleGuard>} />
          </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
