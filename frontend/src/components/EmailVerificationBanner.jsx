import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            Your email address has not been verified.{' '}
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-medium underline text-yellow-700 hover:text-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </button>
          </p>
          {message && (
            <p className={`text-sm mt-2 ${message.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </p>
          )}
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex text-yellow-400 hover:text-yellow-500"
          >
            <span className="sr-only">Dismiss</span>
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
