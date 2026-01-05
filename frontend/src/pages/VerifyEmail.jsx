import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2, ArrowRight, UserPlus } from 'lucide-react';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Invalid or expired verification link. Please request a new one.'
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="card-enhanced p-8 text-center shadow-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            {status === 'verifying' && (
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <Loader2 className="text-blue-600 animate-spin" size={40} />
              </div>
            )}

            {status === 'success' && (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-small">
                <CheckCircle className="text-green-600" size={40} />
              </div>
            )}

            {status === 'error' && (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-shake">
                <XCircle className="text-red-600" size={40} />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          {/* Message */}
          <p className="text-slate-600 mb-8 leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="space-y-4">
            {status === 'success' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-pulse">
                <p className="text-sm text-blue-800 font-medium">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3 animate-fade-in">
                <Link
                  to="/login"
                  className="w-full btn-enhanced btn-primary-enhanced py-3 flex items-center justify-center gap-2"
                >
                  Go to Login
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/signup"
                  className="w-full btn-enhanced btn-secondary-enhanced py-3 flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Create New Account
                </Link>
              </div>
            )}

            {status === 'verifying' && (
              <p className="text-sm text-slate-500 animate-pulse">
                Please wait while we verify your email address...
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} QualityPulse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
