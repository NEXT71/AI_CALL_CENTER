import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CallsList from './pages/CallsList';
import CallDetails from './pages/CallDetails';
import UploadCall from './pages/UploadCall';
import ComplianceRules from './pages/ComplianceRules';
import Analytics from './pages/Analytics';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancelled from './pages/SubscriptionCancelled';
import ViewSales from './pages/ViewSales';
import AddSales from './pages/AddSales';
import SalesReports from './pages/SalesReports';
import Landing from './pages/Landing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            <Route path="calls" element={<RoleGuard allowedRoles={['Admin', 'Manager', 'QA']}><CallsList /></RoleGuard>} />
            <Route path="calls/:id" element={<RoleGuard allowedRoles={['Admin', 'Manager', 'QA']}><CallDetails /></RoleGuard>} />
            <Route path="upload" element={<RoleGuard allowedRoles={['Admin', 'Manager', 'QA']}><UploadCall /></RoleGuard>} />
            <Route path="rules" element={<RoleGuard allowedRoles={['Admin', 'Manager']}><ComplianceRules /></RoleGuard>} />
            <Route path="analytics" element={<RoleGuard allowedRoles={['Admin', 'Manager']}><Analytics /></RoleGuard>} />
            <Route path="sales-data" element={<RoleGuard allowedRoles={['Admin', 'Manager', 'QA']}><ViewSales /></RoleGuard>} />
            <Route path="sales-data/add" element={<RoleGuard allowedRoles={['Admin', 'Manager', 'QA']}><AddSales /></RoleGuard>} />
            <Route path="sales-reports" element={<RoleGuard allowedRoles={['Admin', 'Manager']}><SalesReports /></RoleGuard>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
