import { useNavigate } from 'react-router-dom';
import { XCircle, Home, LayoutDashboard } from 'lucide-react';

const SubscriptionCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-slate-900">Subscription</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/app/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={() => navigate('/app/dashboard')}
                className="btn-enhanced btn-primary-enhanced flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 transform transition-all hover:scale-105 duration-300">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Subscription Cancelled
        </h1>

        <p className="text-slate-600 mb-8 font-medium">
          You've cancelled the subscription process. No charges have been made to your account.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription')}
            className="btn-enhanced btn-primary-enhanced w-full justify-center"
          >
            View Plans Again
          </button>

          <button
            onClick={() => navigate('/app/dashboard')}
            className="btn-enhanced btn-secondary-enhanced w-full justify-center"
          >
            Back to Dashboard
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          You can subscribe anytime. Your trial period is still active.
        </p>
      </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelled;
