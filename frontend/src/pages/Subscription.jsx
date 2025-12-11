import { useState, useEffect } from 'react';
import { Check, Loader2, CreditCard, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const Subscription = () => {
  const navigate = useNavigate();
  // Default plans if API fails
  const defaultPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      interval: 'month',
      features: [
        '100 calls/month',
        'Basic analytics',
        'Email support',
        '1 user',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      interval: 'month',
      features: [
        '500 calls/month',
        'Advanced analytics',
        'Priority support',
        '5 users',
        'Custom rules',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 249,
      interval: 'month',
      features: [
        'Unlimited calls',
        'Full analytics suite',
        '24/7 support',
        'Unlimited users',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
      ],
    },
  ];

  const [plans, setPlans] = useState(defaultPlans);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansResponse, subResponse] = await Promise.all([
        apiService.getSubscriptionPlans().catch(() => ({ success: false })),
        apiService.getCurrentSubscription().catch(() => ({ success: false })),
      ]);
      
      if (plansResponse.success && plansResponse.data?.length > 0) {
        setPlans(plansResponse.data);
      }
      
      if (subResponse.success) {
        setCurrentSubscription(subResponse.data);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      // Keep default plans
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlan(planId);
      const response = await apiService.createCheckoutSession(planId);
      
      if (response.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error(response.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Show user-friendly error
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start checkout process';
      
      if (errorMessage.includes('Price ID not configured')) {
        alert(
          '⚠️ Stripe Products Not Configured\n\n' +
          'To enable subscriptions, please:\n' +
          '1. Go to https://dashboard.stripe.com/test/products\n' +
          '2. Create 3 products (Starter, Professional, Enterprise)\n' +
          '3. Copy the Price IDs to your .env file\n\n' +
          'Contact support if you need assistance.'
        );
      } else {
        alert(`Error: ${errorMessage}\n\nPlease try again or contact support.`);
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setProcessingPlan('portal');
      const response = await apiService.createBillingPortalSession();
      
      if (response.success && response.data.url) {
        // Redirect to Stripe Billing Portal
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Subscription Plans</h1>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your call center needs
        </p>
      </div>

      {/* Current Subscription Info - Only show for paid subscribers */}
      {currentSubscription && currentSubscription.status === 'active' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Current Plan: {currentSubscription.plan?.toUpperCase()}
              </h3>
              <p className="text-blue-700">
                Status: <span className="font-medium capitalize">{currentSubscription.status}</span>
              </p>
              {currentSubscription.currentPeriodEnd && (
                <p className="text-blue-600 text-sm mt-1">
                  {currentSubscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
            <button
              onClick={handleManageBilling}
              disabled={processingPlan === 'portal'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {processingPlan === 'portal' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Manage Billing
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Trial Info - Only show for trial users */}
      {currentSubscription && currentSubscription.status === 'trial' && currentSubscription.trialEndsAt && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                🎉 You're on a Free Trial
              </h3>
              <p className="text-yellow-800 mb-1">
                Your trial ends on <span className="font-semibold">{new Date(currentSubscription.trialEndsAt).toLocaleDateString()}</span>
              </p>
              <p className="text-yellow-700 text-sm">
                Choose a plan below to continue using QualityPulse after your trial ends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan === plan.id;
          const isMostPopular = plan.id === 'professional';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                isMostPopular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {isMostPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || processingPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isMostPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-gray-600 mb-4">
          All plans include 14-day free trial. No credit card required to start.
        </p>
        <p className="text-gray-600">
          Need a custom plan? <a href="mailto:sales@qualitypulse.com" className="text-blue-600 hover:underline">Contact sales</a>
        </p>
      </div>
      </div>
    </div>
  );
};

export default Subscription;
