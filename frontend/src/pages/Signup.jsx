import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, ArrowLeft, Shield, Zap } from 'lucide-react';
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
          <div className="card text-center">
            <div className="mb-6">
              <div className="icon-container icon-container-green mx-auto mb-4 w-16 h-16">
                <Check size={32} />
              </div>
              <h2 className="heading-2 mb-2">Welcome to QualityPulse!</h2>
              <p className="body-text text-slate-600">
                Your account has been created successfully.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">Free Trial Active</span>
              </div>
              <p className="text-sm text-blue-800">
                Your {currentPlan.trialDays}-day free trial has started. No credit card required!
              </p>
            </div>

            <div className="space-y-2 mb-6 text-left">
              <h3 className="heading-4 mb-3">What's Next?</h3>
              <div className="flex items-start gap-3">
                <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="body-text">Upload your first call recording</span>
              </div>
              <div className="flex items-start gap-3">
                <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="body-text">Set up compliance rules</span>
              </div>
              <div className="flex items-start gap-3">
                <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="body-text">Explore your analytics dashboard</span>
              </div>
            </div>

            <p className="caption-text text-slate-500">
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
            <h1 className="heading-1 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-slate-600">
              Start with a {plans[selectedPlan].trialDays}-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                className={`card relative ${
                  plan.popular ? 'border-2 border-blue-600 shadow-xl' : ''
                } ${formData.plan === key ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="heading-3 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                    <Zap size={14} />
                    {plan.trialDays}-day free trial
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(key)}
                  className={`btn w-full ${
                    plan.popular || formData.plan === key ? 'btn-primary' : 'btn-secondary'
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
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <button
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Change Plan
          </button>
          <h1 className="heading-1 mb-2">Create Your Account</h1>
          <p className="text-slate-600">
            Selected: <span className="font-semibold text-blue-600">{currentPlan.name}</span> plan
          </p>
        </div>

        <div className="card">
          {/* Trial Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {currentPlan.trialDays}-Day Free Trial Included
                </h3>
                <p className="text-sm text-slate-700">
                  No credit card required. Cancel anytime during the trial period.
                  After the trial, you'll be billed {currentPlan.price}{currentPlan.period}.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="input-label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="input-label">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <div>
              <label className="input-label">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="input-label">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="input-label">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? 'Creating Account...' : `Start ${currentPlan.trialDays}-Day Free Trial`}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
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
