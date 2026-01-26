import { useState, useEffect } from 'react';
import { Check, Loader2, CreditCard, ArrowLeft, Home, LayoutDashboard, Star, Shield, Zap, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const Subscription = () => {
  const navigate = useNavigate();
  // Default plans if API fails
  const defaultPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'forever',
      icon: Home,
      features: [
        '10 calls/month',
        'Basic transcription',
        'Community support',
        '1 user',
        '7-day retention',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      interval: 'month',
      icon: Zap,
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
      icon: Star,
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
      icon: Shield,
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansResponse, subResponse] = await Promise.all([
        apiService.getPlans().catch(() => ({ success: false })),
        apiService.getCurrentSubscription().catch(() => ({ success: false })),
      ]);
      
      if (plansResponse.success && plansResponse.data?.length > 0) {
        // Merge icons into fetched plans
        const mergedPlans = plansResponse.data.map(plan => {
          const defaultPlan = defaultPlans.find(p => p.id === plan.id);
          return { ...plan, icon: defaultPlan?.icon || Star };
        });
        setPlans(mergedPlans);
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

      // Free tier - activate immediately
      if (planId === 'free') {
        const response = await apiService.createCheckoutSession(planId);
        if (response.success) {
          await fetchData();
          alert('✅ Successfully switched to free plan!');
          return;
        }
      }

      // For paid plans, show payment modal
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Error processing request. Please contact support.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessingPlan(selectedPlan.id);
      setShowPaymentModal(false);

      const response = await apiService.createCheckoutSession(selectedPlan.id);

      if (response.success) {
        await fetchData();
        alert('✅ Subscription request submitted! Our team will contact you to complete the payment.');
        setSelectedPlan(null);
      } else {
        alert('❌ Error submitting request. Please contact support.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error submitting request. Please contact support.');
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Select the perfect plan for your call center needs. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Current Subscription Info - Only show for paid subscribers */}
      {currentSubscription && currentSubscription.status === 'active' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                Current Plan: {currentSubscription.plan?.toUpperCase()}
                <span className="badge-compact badge-success capitalize">{currentSubscription.status}</span>
              </h3>
              {currentSubscription.currentPeriodEnd && (
                <p className="text-blue-700 text-sm mt-1 font-medium">
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
              className="btn-enhanced bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
            >
              {processingPlan === 'portal' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Trial Info - Only show for trial users */}
      {currentSubscription && currentSubscription.status === 'trial' && currentSubscription.trialEndsAt && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🎉</span> You're on a Free Trial
              </h3>
              <p className="text-amber-800 mb-1 font-medium">
                Your trial ends on <span className="font-bold">{new Date(currentSubscription.trialEndsAt).toLocaleDateString()}</span>
              </p>
              <p className="text-amber-700 text-sm">
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
          const Icon = plan.icon || Star;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border ${
                isMostPopular ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'
              }`}
            >
              {isMostPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-xl shadow-md z-10">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-lg ${
                    isMostPopular ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-slate-900">
                      ${plan.price}
                    </span>
                    <span className="text-slate-500 font-medium ml-1">/{plan.interval}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {plan.id === 'starter' ? 'Perfect for small teams' : 
                     plan.id === 'professional' ? 'Best for growing businesses' : 
                     'For large scale operations'}
                  </p>
                </div>

                <div className="h-px bg-slate-100 w-full mb-6"></div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 p-0.5 rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-600 text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || processingPlan === plan.id}
                  className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 ${
                    isCurrentPlan
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : isMostPopular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
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
      <div className="mt-16 text-center pb-12">
        <p className="text-slate-600 mb-4 font-medium">
          All plans include 14-day free trial. No credit card required to start.
        </p>
        <p className="text-slate-500 text-sm">
          Need a custom plan? <a href="mailto:sales@qualitypulse.com" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Contact sales</a>
        </p>
      </div>

      {/* Manual Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Complete Your Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <selectedPlan.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedPlan.name} Plan</h4>
                    <p className="text-blue-700 text-sm">${selectedPlan.price}/{selectedPlan.interval}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-slate-900">Payment Instructions</h4>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Manual Payment Required</p>
                      <p>Contact our support team to complete your subscription activation.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">Email Support</p>
                      <p className="text-sm text-slate-600">support@yourcompany.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-900">Reference</p>
                      <p className="text-sm text-slate-600">Plan: {selectedPlan.name}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium text-slate-900 mb-2">Payment Methods</h5>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Bank Transfer</li>
                    <li>• PayPal</li>
                    <li>• Payoneer</li>
                    <li>• Other (contact support)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn btn-secondary"
                  disabled={processingPlan === selectedPlan.id}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={processingPlan === selectedPlan.id}
                  className="flex-1 btn btn-primary"
                >
                  {processingPlan === selectedPlan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Request Subscription'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Subscription;
