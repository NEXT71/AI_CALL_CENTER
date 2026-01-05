import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, ArrowLeft, Shield, Zap, UserPlus } from 'lucide-react';
import DOMPurify from 'dompurify';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'professional';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    plan: selectedPlan,
    agreeTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Plan Selection, 2: Account Details, 3: Confirmation
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const plans = {
    starter: {
      name: 'Starter',
      price: '$299',
      period: '/month',
      trialDays: 14,
      features: [
        'Up to 500 calls/month',
        'AI transcription & scoring',
        'Basic compliance rules',
        'Email support',
        '3 team members'
      ]
    },
    professional: {
      name: 'Professional',
      price: '$799',
      period: '/month',
      trialDays: 14,
      features: [
        'Up to 2,500 calls/month',
        'Advanced AI analysis',
        'Custom compliance rules',
        'Priority support',
        '15 team members',
        'API access'
      ],
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      trialDays: 30,
      features: [
        'Unlimited calls',
        'Dedicated AI models',
        'White-label options',
        '24/7 premium support',
        'Unlimited team members',
        'On-premise deployment'
      ]
    }
  };

  const currentPlan = plans[formData.plan];

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (!hasUpperCase) {
      return 'Password must include at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must include at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must include at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must include at least one special character (!@#$%^&*...)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedName = DOMPurify.sanitize(formData.name, { ALLOWED_TAGS: [] });
    const sanitizedCompany = DOMPurify.sanitize(formData.company, { ALLOWED_TAGS: [] });
    const sanitizedPhone = DOMPurify.sanitize(formData.phone, { ALLOWED_TAGS: [] });

    // Strong password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: sanitizedName,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        company: sanitizedCompany,
        phone: sanitizedPhone,
        plan: formData.plan,
        role: 'Admin' // First user is admin
      });

      if (result.success) {
        setStep(3); // Show confirmation
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 2000);
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePlanSelect = (planKey) => {
    setFormData({ ...formData, plan: planKey });
    setStep(2);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full">
          <div className="card-enhanced text-center p-8 animate-fade-in">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Check className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to QualityPulse!</h2>
              <p className="text-slate-600">
                Your account has been created successfully.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">Free Trial Active</span>
              </div>
              <p className="text-sm text-blue-800">
                Your {currentPlan.trialDays}-day free trial has started. No credit card required!
              </p>
            </div>

            <div className="space-y-3 mb-8 text-left">
              <h3 className="font-semibold text-slate-900">What's Next?</h3>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-slate-600 text-sm">Upload your first call recording</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-slate-600 text-sm">Set up compliance rules</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-slate-600 text-sm">Explore your analytics dashboard</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 animate-pulse">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-slate-600">
              Start with a {plans[selectedPlan].trialDays}-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`card-enhanced relative transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular ? 'border-2 border-blue-600 shadow-xl' : ''
                } ${formData.plan === key ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mb-2 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600 font-medium">{plan.period}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Zap size={14} />
                    {plan.trialDays}-day free trial
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(key)}
                  className={`w-full btn-enhanced py-3 ${
                    plan.popular || formData.plan === key ? 'btn-primary-enhanced' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {formData.plan === key ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Change Plan
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
          <p className="text-slate-600">
            Selected: <span className="font-semibold text-blue-600">{currentPlan.name}</span> plan
          </p>
        </div>

        <div className="card-enhanced p-8">
          {/* Trial Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {currentPlan.trialDays}-Day Free Trial Included
                </h3>
                <p className="text-sm text-slate-600">
                  No credit card required. Cancel anytime during the trial period.
                  After the trial, you'll be billed {currentPlan.price}{currentPlan.period}.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-slide-in-right">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-enhanced w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-enhanced w-full"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="input-enhanced w-full"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                className="input-enhanced w-full"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className="input-enhanced w-full"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className="input-enhanced w-full"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                      <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-enhanced btn-primary-enhanced py-4 text-base font-semibold shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                `Start ${currentPlan.trialDays}-Day Free Trial`
              )}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
