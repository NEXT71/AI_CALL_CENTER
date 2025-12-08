import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CallsList from './pages/CallsList';
import CallDetails from './pages/CallDetails';
import UploadCall from './pages/UploadCall';
import ComplianceRules from './pages/ComplianceRules';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calls" element={<CallsList />} />
            <Route path="calls/:id" element={<CallDetails />} />
            <Route path="upload" element={<UploadCall />} />
            <Route path="rules" element={<ComplianceRules />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
