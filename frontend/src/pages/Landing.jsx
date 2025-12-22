import { Link } from 'react-router-dom';
import { Check, Phone, TrendingUp, Shield, Zap, BarChart3, Clock, Users, ArrowRight, Star, Award, Lock, Globe, HeadphonesIcon, ChevronDown, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const features = [
    {
      icon: Phone,
      title: 'AI-Powered Transcription',
      description: 'Automatic speech-to-text conversion with 99% accuracy using OpenAI Whisper technology.'
    },
    {
      icon: TrendingUp,
      title: 'Quality Scoring',
      description: 'Intelligent quality analysis measuring tone, professionalism, clarity, and engagement.'
    },
    {
      icon: Shield,
      title: 'Compliance Monitoring',
      description: 'Real-time compliance checking against mandatory and forbidden phrases with fuzzy matching.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards with performance trends, agent rankings, and campaign insights.'
    },
    {
      icon: Zap,
      title: 'Real-Time Processing',
      description: 'Fast call analysis with automated scoring and feedback generation in minutes.'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Role-based access control for admins, managers, QA teams, and agents.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$299',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 500 calls/month',
        'AI transcription & scoring',
        'Basic compliance rules',
        'Email support',
        '3 team members',
        'Dashboard analytics'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=starter',
      popular: false
    },
    {
      name: 'Professional',
      price: '$799',
      period: '/month',
      description: 'Best for growing organizations',
      features: [
        'Up to 2,500 calls/month',
        'Advanced AI analysis',
        'Custom compliance rules',
        'Priority support',
        '15 team members',
        'Advanced analytics',
        'API access',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=professional',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large-scale operations',
      features: [
        'Unlimited calls',
        'Dedicated AI models',
        'White-label options',
        '24/7 premium support',
        'Unlimited team members',
        'Custom reporting',
        'On-premise deployment',
        'SLA guarantees'
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Maria Gonzalez',
      role: 'QA Manager',
      company: 'NextelBPO',
      content: 'QualityPulse has been essential for our ACA campaign compliance. We\'ve reduced compliance violations by 65% and improved agent training effectiveness.',
      rating: 5
    },
    {
      name: 'David Thompson',
      role: 'Operations Director',
      company: 'NextelBPO',
      content: 'For our Medicare campaigns, the AI analysis helps us maintain the highest quality standards. We can now monitor every call and provide real-time feedback to agents.',
      rating: 5
    },
    {
      name: 'Lisa Chen',
      role: 'Team Lead',
      company: 'NextelBPO',
      content: 'The Final Expense campaign requires perfect compliance, and QualityPulse ensures we meet all regulatory requirements while maintaining excellent customer service.',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: 'How does the AI transcription work?',
      answer: 'We use OpenAI\'s Whisper technology, the most advanced speech-to-text AI available, achieving 99% accuracy across multiple languages and accents. The transcription process is fully automated and typically completes within minutes of upload.'
    },
    {
      question: 'Can I customize the compliance rules?',
      answer: 'Absolutely! You can create custom compliance rules with mandatory phrases, forbidden phrases, and fuzzy matching tolerance. Set up rules specific to your industry regulations and internal policies.'
    },
    {
      question: 'How long does call analysis take?',
      answer: 'Most calls are analyzed within 2-5 minutes depending on length. Our AI processes transcription, quality scoring, compliance checking, and generates detailed insights all automatically.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use enterprise-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We\'re GDPR compliant, SOC 2 certified, and offer role-based access controls to protect your sensitive call data.'
    },
    {
      question: 'Can I integrate with my existing systems?',
      answer: 'Yes! We provide a REST API for seamless integration with your CRM, help desk, or workforce management systems. Enterprise plans also support custom integrations and webhooks.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support all common audio formats including WAV, MP3, M4A, FLAC, OGG, and more. Files can be uploaded via web interface, API, or direct integrations.'
    },
    {
      question: 'Do you offer training and support?',
      answer: 'Professional and Enterprise plans include dedicated onboarding, training sessions, and ongoing support. All plans have access to our knowledge base and email support.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! There are no long-term contracts. You can cancel your subscription at any time and retain access until the end of your billing period. We also offer a 14-30 day free trial with no credit card required.'
    }
  ];

  const trustBadges = [
    { text: 'SOC 2 Certified', icon: Shield },
    { text: 'GDPR Compliant', icon: Lock },
    { text: '99.9% Uptime', icon: Award },
    { text: '24/7 Support', icon: HeadphonesIcon }
  ];

  const clientLogos = [
    'NextelBPO'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-blue-600">QualityPulse</h1>
                <p className="text-xs text-slate-500 -mt-0.5">AI-powered Quality Assurance</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-600 hover:text-slate-900">Features</a>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</a>
              <a href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900">Testimonials</a>
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-bounce">
              <Star size={16} className="fill-blue-700" />
              #1 AI-Powered Call Quality Platform
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Transform Call Center 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Quality</span>
              <br />with AI Intelligence
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              Automate quality assurance, ensure compliance, and boost performance with <br className="hidden md:inline" />
              <span className="font-semibold text-slate-800">intelligent call analysis powered by artificial intelligence.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link to="/signup" className="btn btn-primary btn-lg group shadow-lg hover:shadow-xl transition-shadow">
                Start 14-Day Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#demo" className="btn btn-secondary btn-lg shadow-lg">
                Watch Demo
              </a>
            </div>
            
            <p className="text-sm text-slate-500 mb-8">
              ✓ No credit card required  •  ✓ 14-day free trial  •  ✓ Cancel anytime  •  ✓ Setup in 5 minutes
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-600">
                  <badge.icon size={18} className="text-green-600" />
                  <span className="text-sm font-medium">{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Trusted By */}
            <div className="mt-16">
              <p className="text-sm text-slate-500 mb-6 font-medium">TRUSTED BY LEADING CALL CENTERS</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
                {clientLogos.map((logo, idx) => (
                  <div key={idx} className="text-lg font-bold text-slate-600">
                    {logo}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="mt-20">
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl overflow-hidden">
                {/* Dashboard Preview */}
                <div className="p-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    {/* Browser-like Header */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-white/20 rounded px-4 py-1 text-xs text-white/80">
                        https://ai-call-center.app/dashboard
                      </div>
                    </div>
                    
                    {/* Dashboard Content Mockup */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {[
                        { label: 'Total Calls', value: '2,847', trend: '+12%', color: 'blue' },
                        { label: 'Avg Quality', value: '87.5%', trend: '+5%', color: 'green' },
                        { label: 'Compliance', value: '94.2%', trend: '+3%', color: 'purple' },
                        { label: 'Violations', value: '23', trend: '-18%', color: 'red' }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white/90 rounded-xl p-4 backdrop-blur">
                          <div className="text-xs font-medium text-slate-600 mb-1">{stat.label}</div>
                          <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                          <div className={`text-xs font-semibold ${stat.color === 'red' ? 'text-red-600' : 'text-green-600'} mt-1`}>
                            {stat.trend}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart Visualization */}
                    <div className="bg-white/90 rounded-xl p-6 backdrop-blur">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Quality Score Trend</h3>
                        <div className="flex gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Last 7 Days</span>
                        </div>
                      </div>
                      {/* Simple Chart Bars */}
                      <div className="flex items-end justify-between gap-2 h-32">
                        {[65, 72, 68, 85, 82, 89, 87].map((height, idx) => (
                          <div key={idx} className="flex-1 flex flex-col justify-end">
                            <div 
                              className="bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all hover:from-blue-700 hover:to-indigo-600"
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="text-xs text-slate-600 text-center mt-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Call List Preview */}
                    <div className="mt-4 bg-white/90 rounded-xl p-4 backdrop-blur">
                      <div className="text-xs font-bold text-slate-900 mb-3">Recent Calls</div>
                      {[
                        { agent: 'John Smith', score: 92, status: 'success' },
                        { agent: 'Sarah Lee', score: 88, status: 'success' },
                        { agent: 'Mike Davis', score: 76, status: 'warning' }
                      ].map((call, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {call.agent.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs font-medium text-slate-900">{call.agent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${call.status === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {call.score}%
                            </span>
                            <div className={`w-2 h-2 rounded-full ${call.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">99%</p>
              <p className="text-sm text-slate-600 mt-2">Transcription Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">10x</p>
              <p className="text-sm text-slate-600 mt-2">Faster QA Process</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">40%</p>
              <p className="text-sm text-slate-600 mt-2">Quality Improvement</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">24/7</p>
              <p className="text-sm text-slate-600 mt-2">Automated Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Modern Call Centers
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to elevate your quality assurance and deliver exceptional customer experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card hover:shadow-lg transition-shadow duration-300 group">
                <div className="icon-container icon-container-blue mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h3 className="heading-4 mb-3">{feature.title}</h3>
                <p className="body-text text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-slate-600">
              Simple three-step process from upload to actionable insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"></div>
            
            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                1
              </div>
              {/* Upload Illustration */}
              <div className="bg-white rounded-2xl p-8 shadow-lg mb-6 mx-auto max-w-xs">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center">
                    <Phone className="w-12 h-12 text-blue-600 mb-2" />
                    <div className="text-xs font-semibold text-slate-600">Drop audio files here</div>
                    <div className="mt-2 flex gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="heading-4 mb-3">Upload Calls</h3>
              <p className="body-text text-slate-600">Upload call recordings in any format. Drag & drop or browse files.</p>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                2
              </div>
              {/* AI Processing Illustration */}
              <div className="bg-white rounded-2xl p-8 shadow-lg mb-6 mx-auto max-w-xs">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center overflow-hidden relative">
                    {/* AI Brain Animation */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      {/* Pulse rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    {/* Floating particles */}
                    <div className="absolute top-2 left-4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-4 right-6 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute top-6 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
              <h3 className="heading-4 mb-3">AI Analysis</h3>
              <p className="body-text text-slate-600">AI transcribes, scores quality, and checks compliance automatically.</p>
            </div>

            <div className="text-center relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                3
              </div>
              {/* Results Illustration */}
              <div className="bg-white rounded-2xl p-8 shadow-lg mb-6 mx-auto max-w-xs">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 flex flex-col justify-center">
                    {/* Score Display */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">Quality Score</span>
                      <span className="text-xl font-bold text-green-600">89%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                    {/* Status badges */}
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 bg-green-100 rounded px-2 py-1 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">Compliant</span>
                      </div>
                      <div className="flex-1 bg-blue-100 rounded px-2 py-1 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">Good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="heading-4 mb-3">Get Insights</h3>
              <p className="body-text text-slate-600">View detailed reports, scores, and actionable recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 mb-4">
              Choose the plan that fits your needs. All plans include a free trial.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-5 py-2.5 rounded-full text-sm font-medium shadow-sm">
              <Check size={16} />
              14-30 day free trial • No credit card required • Cancel anytime
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`card relative transition-transform hover:scale-105 ${
                  plan.popular ? 'border-2 border-blue-600 shadow-2xl ring-4 ring-blue-100' : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="heading-3 mb-3">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600 text-lg">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaLink}
                  className={`btn w-full ${
                    plan.popular ? 'btn-primary shadow-lg' : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-2">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
              <span>✓ AI Transcription</span>
              <span>✓ Quality Scoring</span>
              <span>✓ Compliance Monitoring</span>
              <span>✓ Analytics Dashboard</span>
              <span>✓ Unlimited Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Loved by Call Centers Worldwide
            </h2>
            <p className="text-xl text-slate-600">
              Join thousands of quality assurance professionals who trust QualityPulse
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card hover:shadow-xl transition-shadow bg-white">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="body-text text-slate-700 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                    <p className="text-xs text-slate-500">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Why Call Centers Choose QualityPulse
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Join thousands of call centers already using AI to deliver exceptional customer experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock size={24} className="text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="heading-4 mb-2">Save 10+ Hours Per Week</h3>
                <p className="body-text text-slate-600">
                  Eliminate manual call reviews. Our AI analyzes 100% of calls automatically, freeing your QA team to focus on coaching and improvement.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="heading-4 mb-2">40% Quality Improvement</h3>
                <p className="body-text text-slate-600">
                  Real data from our customers shows significant improvements in call quality scores within the first 3 months of deployment.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield size={24} className="text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="heading-4 mb-2">100% Compliance Coverage</h3>
                <p className="body-text text-slate-600">
                  Never miss a compliance violation. Our AI monitors every call for regulatory requirements and company policies automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Globe size={24} className="text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="heading-4 mb-2">Multi-Language Support</h3>
                <p className="body-text text-slate-600">
                  Support for 50+ languages and accents. Perfect for global teams and diverse customer bases with accurate transcription worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about QualityPulse
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  {openFaq === idx ? (
                    <Minus size={20} className="text-blue-600 flex-shrink-0 ml-4" />
                  ) : (
                    <Plus size={20} className="text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact our sales team →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Call Center Quality?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join thousands of call centers using AI to deliver exceptional customer experiences.<br />
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/signup" className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50 border-white shadow-xl group">
              Start 14-Day Free Trial
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/contact" className="btn btn-lg bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 shadow-xl transition-all">
              Contact Sales
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-blue-100 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@qualitypulse.com" className="hover:text-white">support@qualitypulse.com</a></li>
                <li><a href="tel:+1234567890" className="hover:text-white">+1 (234) 567-890</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            <p>&copy; 2025 QualityPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
