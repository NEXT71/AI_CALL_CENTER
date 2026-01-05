import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DOMPurify from 'dompurify';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // '', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus('');
    setMessage('');

    try {
      const sanitizedEmail = DOMPurify.sanitize(email.trim());
      const response = await api.post('/auth/forgot-password', { 
        email: sanitizedEmail 
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Password reset instructions have been sent to your email address.');
        setEmail('');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'An error occurred. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Forgot Password?
          </h2>
          <p className="text-slate-600 text-sm">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {status === 'success' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-800 px-4 py-3 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-enhanced w-full pl-10"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-enhanced btn-primary-enhanced w-full flex justify-center items-center gap-2 py-2.5"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <Link
            to="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <div className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
