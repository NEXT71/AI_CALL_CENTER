import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { AlertTriangle, X, Send, CheckCircle } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Don't show if email is verified or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/resend-verification');
      
      if (response.data.success) {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl shadow-sm animate-slide-in-right">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-amber-800 font-medium">
            Your email address has not been verified.
          </p>
          <div className="mt-2">
            <button
              onClick={handleResend}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 underline decoration-amber-400/50 hover:decoration-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Resend verification email
                </>
              )}
            </button>
          </div>
          {message && (
            <div className={`flex items-center gap-2 text-sm mt-2 font-medium ${message.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
              {message.includes('sent') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {message}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex text-amber-400 hover:text-amber-600 transition-colors p-1 rounded-full hover:bg-amber-100"
          >
            <span className="sr-only">Dismiss</span>
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
