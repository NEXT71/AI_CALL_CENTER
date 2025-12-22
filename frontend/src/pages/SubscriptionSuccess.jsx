import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Home, LayoutDashboard, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    verifySubscription();
  }, []);

  const verifySubscription = async () => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    try {
      // Verify the subscription was activated
      const response = await apiService.verifySubscriptionSession(sessionId);
      
      if (response.success) {
        setVerified(true);
      } else {
        setError('Subscription verification failed. You can try manual activation below.');
      }
    } catch (err) {
      console.error('Error verifying subscription:', err);
      setError('Failed to verify subscription status. You can try manual activation below.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualActivation = async () => {
    // Extract plan type from URL or use a default
    const urlParams = new URLSearchParams(window.location.search);
    const planType = urlParams.get('plan') || 'starter'; // Default to starter if not specified

    try {
      setLoading(true);
      // Try the new endpoint first, fallback to creating a checkout session if it fails
      try {
        const response = await apiService.activateSubscription(planType);
        
        if (response.success) {
          setVerified(true);
          setError(null);
          return;
        }
      } catch (activateError) {
        console.warn('Manual activation endpoint not available, trying alternative method:', activateError);
        
        // Fallback: Create a minimal checkout session and immediately verify it
        // This is a workaround until the server is restarted
        const checkoutResponse = await apiService.createCheckoutSession(planType);
        if (checkoutResponse.success && checkoutResponse.data.sessionId) {
          // Try to verify the session (this might work if webhooks are set up)
          const verifyResponse = await apiService.verifySubscriptionSession(checkoutResponse.data.sessionId);
          if (verifyResponse.success) {
            setVerified(true);
            setError(null);
            return;
          }
        }
      }
      
      setError('Manual activation failed. Please restart your backend server and try again, or contact support.');
    } catch (err) {
      console.error('Error activating subscription manually:', err);
      setError('Manual activation failed. Please restart your backend server and try again, or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/app/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-semibold text-gray-900">Subscription Status</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Verification In Progress
            </h1>

            <p className="text-gray-600 mb-6">
              {error}
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Your payment was successful, but we're still processing your subscription.
              You can try manual activation or check your dashboard in a few moments.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleManualActivation}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Activating...' : 'Activate Subscription Manually'}
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Subscription Confirmed</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Subscription Successful!
        </h1>

        <p className="text-gray-600 mb-2">
          Thank you for subscribing to QualityPulse.
        </p>
        <p className="text-gray-600 mb-8">
          Your account has been upgraded and you now have access to all premium features.
        </p>

        {sessionId && (
          <p className="text-sm text-gray-500 mb-6">
            Session ID: {sessionId.substring(0, 20)}...
          </p>
        )}

        <button
          onClick={handleGoToDashboard}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
        >
          Go to Dashboard
        </button>

        <p className="text-sm text-gray-500 mt-6">
          A confirmation email has been sent to your email address.
        </p>
      </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
