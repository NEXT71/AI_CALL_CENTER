import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Home, LayoutDashboard } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your subscription...</p>
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
