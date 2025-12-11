import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import DOMPurify from 'dompurify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if user is locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${remainingSeconds} seconds.`);
      return;
    }

    setLoading(true);

    // Sanitize email input
    const sanitizedEmail = DOMPurify.sanitize(email.toLowerCase().trim(), { ALLOWED_TAGS: [] });

    const result = await login(sanitizedEmail, password);

    if (result.success) {
      // Reset attempts on successful login
      setLoginAttempts(0);
      setLockoutTime(null);
      navigate('/app/dashboard');
    } else {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lockout after 5 failed attempts
      if (newAttempts >= 5) {
        const lockout = Date.now() + 60000; // 60 second lockout
        setLockoutTime(lockout);
        setLoginAttempts(0);
        setError('Too many failed attempts. Please wait 60 seconds before trying again.');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            QualityPulse
          </h1>
          <p className="text-gray-600">AI-powered Quality Assurance</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary-100 p-3 rounded-full">
              <LogIn className="text-primary-600" size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Sign In
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot your password?
            </Link>
          </div>

          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Start free trial
            </Link>
          </p>

          {import.meta.env.MODE === 'development' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials (Dev Only):</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Admin: admin@nextel.com / Admin123!</p>
                <p>• Manager: manager@nextel.com / Manager123!</p>
                <p>• Agent: agent1@nextel.com / Agent123!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
