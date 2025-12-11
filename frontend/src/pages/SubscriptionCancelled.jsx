import { useNavigate } from 'react-router-dom';
import { XCircle, Home, LayoutDashboard } from 'lucide-react';

const SubscriptionCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Subscription</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Subscription Cancelled
        </h1>

        <p className="text-gray-600 mb-8">
          You've cancelled the subscription process. No charges have been made to your account.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            View Plans Again
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Dashboard
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          You can subscribe anytime. Your trial period is still active.
        </p>
      </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelled;
