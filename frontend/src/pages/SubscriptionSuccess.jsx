import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Home, LayoutDashboard, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
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
        // Refresh user data to update subscription status
        await refreshUser();
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

  const handleManualActivation = () => {
    // Redirect user to contact admin since self-activation is now disabled
    alert('⚠️ Self-activation is disabled for security.\n\nPlease contact an administrator to activate your subscription.\n\nYour payment has been received and is being processed.');
    navigate('/app/dashboard');
  };

  const handleGoToDashboard = () => {
    navigate('/app/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 animate-fade-in">
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold text-slate-900">Subscription Status</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Verification In Progress
            </h1>

            <p className="text-slate-600 mb-6 font-medium">
              Your payment was successful, but subscription activation requires admin approval.
            </p>

            <p className="text-sm text-slate-500 mb-8">
              Due to security measures, an administrator must approve and activate your subscription.
              This typically takes a few minutes. Please check your dashboard or contact support.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleManualActivation}
                className="btn-enhanced btn-primary-enhanced w-full justify-center"
              >
                Contact Administrator
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="btn-enhanced btn-secondary-enhanced w-full justify-center"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-slate-900">Subscription Confirmed</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 transform transition-all hover:scale-105 duration-300">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Subscription Successful!
        </h1>

        <p className="text-slate-600 mb-2 font-medium">
          Thank you for subscribing to QualityPulse.
        </p>
        <p className="text-slate-500 mb-8">
          Your account has been upgraded and you now have access to all premium features.
        </p>

        {sessionId && (
          <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-50 p-2 rounded border border-slate-100">
            Session ID: {sessionId.substring(0, 20)}...
          </p>
        )}

        <button
          onClick={handleGoToDashboard}
          className="btn-enhanced btn-primary-enhanced w-full justify-center"
        >
          Go to Dashboard
        </button>

        <p className="text-xs text-slate-400 mt-6">
          A confirmation email has been sent to your email address.
        </p>
      </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
