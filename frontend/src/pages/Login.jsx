import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, AlertCircle, Info } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-200/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <LogIn className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            QualityPulse
          </h1>
          <p className="text-slate-600 font-medium">AI-powered Quality Assurance Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-slide-in-right">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-enhanced w-full pl-12 transition-all duration-200"
                  placeholder="you@company.com"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Mail size={20} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-enhanced w-full pl-12 transition-all duration-200"
                  placeholder="••••••••"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Lock size={20} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-enhanced btn-primary-enhanced py-3.5 text-base font-semibold group shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                Start free trial
              </Link>
            </p>
          </div>

          {import.meta.env.MODE === 'development' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600 font-semibold mb-3 flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                Demo Credentials (Dev Only)
              </p>
              <div className="text-xs text-slate-500 space-y-1.5">
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-100">
                  <span>Admin:</span>
                  <code className="font-mono text-blue-600">admin@nextel.com</code>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-100">
                  <span>User:</span>
                  <code className="font-mono text-blue-600">qa.manager@nextel.com</code>
                </div>
                <div className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-100">
                  <span>Agent:</span>
                  <code className="font-mono text-blue-600">agent1@nextel.com</code>
                </div>
                <div className="text-center pt-2 border-t border-slate-200 mt-2">
                  <code className="font-mono text-slate-600">Password: [Role]123!</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
