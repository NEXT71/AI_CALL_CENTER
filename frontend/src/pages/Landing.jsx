import { Link } from 'react-router-dom';
import { Check, Phone, TrendingUp, Shield, Zap, BarChart3, Clock, Users, ArrowRight, Star, Award, Lock, Globe, HeadphonesIcon, ChevronDown, Plus, Minus, Play, Mail } from 'lucide-react';
import { useState } from 'react';

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const features = [
    {
      icon: Phone,
      title: 'AI-Powered Transcription',
      description: 'Automatic speech-to-text conversion with high accuracy using advanced Whisper technology.'
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
      title: 'Fast Automated Processing',
      description: 'Quick call analysis with automated scoring and feedback generation within minutes.'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Role-based access control for admins and users with secure authentication.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      description: 'Perfect for trying out the platform',
      features: [
        '10 calls/month',
        'Basic AI transcription',
        'Basic quality scoring',
        'Community support',
        '1 team member',
        '7-day data retention'
      ],
      cta: 'Get Started Free',
      ctaLink: '/signup?plan=free',
      popular: false
    },
    {
      name: 'Starter',
      price: '$149',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 100 calls/month',
        'AI transcription & scoring',
        'Basic compliance rules',
        'Email support',
        '1 team member',
        '1 dedicated pod',
        '30-day data retention'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=starter',
      popular: false
    },
    {
      name: 'Professional',
      price: '$249',
      period: '/month',
      description: 'Best for growing organizations',
      features: [
        'Up to 500 calls/month',
        'Advanced AI analysis',
        'Custom compliance rules',
        'Priority support',
        '5 team members',
        '1 dedicated pod',
        'API access',
        '90-day data retention'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=professional',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$399',
      period: '/month',
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
      answer: 'We use advanced Whisper AI technology, one of the most accurate speech-to-text systems available, delivering industry-leading accuracy across multiple languages and accents. The transcription process is fully automated and typically completes within minutes of upload.'
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
      answer: 'Yes! We use industry-standard encryption for data at rest and in transit. We implement role-based access controls, secure authentication, and follow security best practices to protect your sensitive call data.'
    },
    {
      question: 'Can I integrate with my existing systems?',
      answer: 'We provide a REST API for integration with your systems. Contact us to discuss your specific integration needs.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support all common audio formats including WAV, MP3, M4A, FLAC, OGG, and more. Files can be uploaded via web interface.'
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
    { text: 'Secure & Encrypted', icon: Shield },
    { text: 'Privacy Focused', icon: Lock },
    { text: '99.9% Uptime', icon: Award },
    { text: 'Email Support', icon: HeadphonesIcon }
  ];

  const clientLogos = [
    'NextelBPO'
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 py-2">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-xl shadow-lg shadow-blue-200 object-cover" />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">QualityPulse</h1>
                <p className="text-xs text-slate-500 font-medium">AI-Powered Quality Assurance</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Testimonials</a>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link to="/signup" className="btn-enhanced btn-primary-enhanced px-5 py-2 text-sm">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-400/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-400/30 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 shadow-sm animate-bounce-slow">
              <Star size={14} className="fill-blue-700" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">#1 AI-Powered Call Quality Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
              Transform Call Center 
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent pb-2">Quality with AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Automate quality assurance, ensure compliance, and boost performance with <span className="font-semibold text-slate-900">intelligent call analysis</span> powered by next-gen AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/signup" className="btn-enhanced btn-primary-enhanced px-8 py-4 text-lg group shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30">
                Start 14-Day Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 mb-12">
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> 14-day free trial</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Cancel anytime</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-emerald-500" /> Setup in 5 minutes</span>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 mb-16 pt-8 border-t border-slate-200/60">
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-600 bg-white/50 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                  <badge.icon size={18} className="text-blue-600" />
                  <span className="text-sm font-semibold">{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Hero Image/Illustration */}
            <div className="mt-12 relative mx-auto max-w-5xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2rem] blur opacity-30"></div>
              <div className="relative bg-slate-900 rounded-[1.75rem] shadow-2xl overflow-hidden border border-slate-800">
                {/* Dashboard Preview */}
                <div className="p-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2 px-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-block bg-slate-900/50 rounded-md px-3 py-1 text-xs text-slate-400 font-mono">
                      app.qualitypulse.ai/dashboard
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-slate-900">
                  {/* Dashboard Content Mockup */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Calls', value: '2,847', trend: '+12%', color: 'blue' },
                      { label: 'Avg Quality', value: '87.5%', trend: '+5%', color: 'emerald' },
                      { label: 'Compliance', value: '94.2%', trend: '+3%', color: 'purple' },
                      { label: 'Violations', value: '23', trend: '-18%', color: 'red' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="text-xs font-medium text-slate-400 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className={`text-xs font-semibold ${stat.color === 'red' ? 'text-red-400' : 'text-emerald-400'} mt-1`}>
                          {stat.trend}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* Chart Visualization */}
                    <div className="col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white">Quality Score Trend</h3>
                        <div className="flex gap-2">
                          <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Last 7 Days</span>
                        </div>
                      </div>
                      {/* Simple Chart Bars */}
                      <div className="flex items-end justify-between gap-3 h-40">
                        {[65, 72, 68, 85, 82, 89, 87].map((height, idx) => (
                          <div key={idx} className="flex-1 flex flex-col justify-end group">
                            <div 
                              className="bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all group-hover:from-blue-500 group-hover:to-indigo-400 relative"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {height}%
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 text-center mt-3 font-medium">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Call List Preview */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Analysis</div>
                      <div className="space-y-3">
                        {[
                          { agent: 'John Smith', score: 92, status: 'success', time: '2m ago' },
                          { agent: 'Sarah Lee', score: 88, status: 'success', time: '15m ago' },
                          { agent: 'Mike Davis', score: 76, status: 'warning', time: '1h ago' },
                          { agent: 'Emma Wilson', score: 95, status: 'success', time: '2h ago' }
                        ].map((call, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-lg transition-colors cursor-default">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-900/20">
                                {call.agent.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-white">{call.agent}</div>
                                <div className="text-[10px] text-slate-500">{call.time}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs font-bold ${call.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {call.score}%
                              </span>
                              <div className={`w-1.5 h-1.5 rounded-full ${call.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">High</p>
              <p className="text-sm font-medium text-slate-600 mt-2 uppercase tracking-wide">Transcription Accuracy</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">10x</p>
              <p className="text-sm font-medium text-slate-600 mt-2 uppercase tracking-wide">Faster QA Process</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">40%</p>
              <p className="text-sm font-medium text-slate-600 mt-2 uppercase tracking-wide">Quality Improvement</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">24/7</p>
              <p className="text-sm font-medium text-slate-600 mt-2 uppercase tracking-wide">Automated Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Powerful Features for Modern Call Centers
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to elevate your quality assurance and deliver exceptional customer experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card-enhanced p-8 hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-slate-600">
              Simple three-step process from upload to actionable insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 border-t border-dashed border-slate-300"></div>
            
            <div className="text-center relative group">
              <div className="w-16 h-16 bg-white border-4 border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-lg relative z-10 group-hover:scale-110 group-hover:border-blue-200 transition-all duration-300">
                1
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 mb-8 mx-auto max-w-xs transform group-hover:-translate-y-2 transition-transform duration-300 border border-slate-100">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center">
                    <Phone className="w-10 h-10 text-blue-500 mb-2" />
                    <div className="text-xs font-semibold text-slate-500">Drop audio files here</div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Calls</h3>
              <p className="text-slate-600 leading-relaxed px-4">Upload call recordings in any format. Drag & drop or browse files.</p>
            </div>

            <div className="text-center relative group">
              <div className="w-16 h-16 bg-white border-4 border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-lg relative z-10 group-hover:scale-110 group-hover:border-indigo-200 transition-all duration-300">
                2
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 mb-8 mx-auto max-w-xs transform group-hover:-translate-y-2 transition-transform duration-300 border border-slate-100">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center overflow-hidden relative">
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-200/50 via-transparent to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600 leading-relaxed px-4">AI transcribes, scores quality, and checks compliance automatically.</p>
            </div>

            <div className="text-center relative group">
              <div className="w-16 h-16 bg-white border-4 border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-lg relative z-10 group-hover:scale-110 group-hover:border-emerald-200 transition-all duration-300">
                3
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 mb-8 mx-auto max-w-xs transform group-hover:-translate-y-2 transition-transform duration-300 border border-slate-100">
                <div className="relative">
                  <div className="w-full h-32 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-500">Quality Score</span>
                      <span className="text-lg font-bold text-emerald-600">89%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-emerald-100/50 rounded px-1.5 py-1 flex items-center justify-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700">Compliant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Get Insights</h3>
              <p className="text-slate-600 leading-relaxed px-4">View detailed reports, scores, and actionable recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Choose the plan that fits your needs. All plans include a free trial.
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full text-sm font-bold shadow-sm border border-emerald-100">
              <Check size={18} />
              14-30 day free trial • No credit card required • Cancel anytime
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`card-enhanced p-8 relative transition-all duration-300 hover:translate-y-[-8px] ${
                  plan.popular 
                    ? 'border-2 border-blue-600 shadow-2xl shadow-blue-900/10 ring-4 ring-blue-50' 
                    : 'hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-blue-600/30">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{plan.name}</h3>
                  <div className="mb-4 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-slate-500 text-lg font-medium">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{plan.description}</p>
                </div>
                <div className="border-t border-slate-100 my-8"></div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-green-600" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaLink}
                  className={`btn-enhanced w-full flex justify-center items-center ${
                    plan.popular ? 'btn-primary-enhanced' : 'btn-secondary-enhanced'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <p className="text-slate-500 mb-4 font-medium uppercase tracking-wide text-xs">All plans include</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> AI Transcription</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Quality Scoring</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Compliance Monitoring</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Analytics Dashboard</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Generous Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Loved by Call Centers Worldwide
            </h2>
            <p className="text-xl text-slate-600">
              Join thousands of quality assurance professionals who trust QualityPulse
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="card-enhanced p-8 hover:shadow-xl transition-all duration-300 bg-white">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-8 italic leading-relaxed text-lg">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{testimonial.role}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Why Call Centers Choose QualityPulse
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Join call centers using AI to deliver exceptional customer experiences
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl mx-auto">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Clock size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Save 10+ Hours Per Week</h3>
                <p className="text-slate-600 leading-relaxed">
                  Eliminate manual call reviews. Our AI analyzes 100% of calls automatically, freeing your QA team to focus on coaching and improvement.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <TrendingUp size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">40% Quality Improvement</h3>
                <p className="text-slate-600 leading-relaxed">
                  Real data from our customers shows significant improvements in call quality scores within the first 3 months of deployment.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                  <Shield size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">100% Compliance Coverage</h3>
                <p className="text-slate-600 leading-relaxed">
                  Never miss a compliance violation. Our AI monitors every call for regulatory requirements and company policies automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                  <Globe size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Language Support</h3>
                <p className="text-slate-600 leading-relaxed">
                  Support for 50+ languages and accents. Perfect for global teams and diverse customer bases with accurate transcription worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about QualityPulse
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-lg">{faq.question}</span>
                  {openFaq === idx ? (
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 ml-4">
                      <Minus size={18} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 ml-4">
                      <Plus size={18} />
                    </div>
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-8 pt-0 text-slate-600 leading-relaxed animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-2 group">
              Contact our sales team 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute top-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-purple-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[30rem] h-[30rem] bg-blue-400 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-8 tracking-tight">
            Ready to Transform Your Call Center Quality?
          </h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join call centers using AI to deliver exceptional customer experiences. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link to="/signup" className="btn-enhanced bg-white text-blue-600 hover:bg-blue-50 border-white shadow-xl shadow-blue-900/20 px-8 py-4 text-lg font-bold group">
              Start 14-Day Free Trial
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-2 inline-block" />
            </Link>
            <Link to="/contact" className="btn-enhanced bg-transparent text-white border-2 border-white/30 hover:bg-white/10 hover:border-white shadow-xl px-8 py-4 text-lg font-bold backdrop-blur-sm">
              Contact Sales
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-blue-100 text-sm font-medium">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Check size={16} className="text-emerald-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Check size={16} className="text-emerald-300" />
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Check size={16} className="text-emerald-300" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-lg object-cover shadow-lg shadow-blue-900/20" />
                <span className="text-lg font-bold text-white">QualityPulse</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                AI-powered quality assurance platform for modern call centers. Elevate performance and ensure compliance.
              </p>
              <div className="flex gap-4">
                {/* Social icons placeholders */}
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Globe size={14} />
                </div>
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <Mail size={14} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
                <li><Link to="/signup" className="hover:text-blue-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:support@qualitypulse.com" className="hover:text-blue-400 transition-colors flex items-center gap-2"><Mail size={14} /> support@qualitypulse.com</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center text-slate-500">
            <p>&copy; {new Date().getFullYear()} QualityPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
