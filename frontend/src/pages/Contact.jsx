import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageSquare, Clock, Users, Shield, Zap, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import SEO from '../components/SEO';

const Contact = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact QualityPulse",
    "description": "Get in touch with QualityPulse for sales inquiries, support, or partnership opportunities.",
    "url": "https://ai-call-center-o7d7.vercel.app/contact"
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to backend
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SEO
        title="Contact QualityPulse - Get in Touch for Call Center QA Solutions"
        description="Get in touch with QualityPulse for sales inquiries, support, or partnership opportunities. We're here to help you transform your call center quality assurance."
        keywords="contact QualityPulse, call center QA support, sales inquiry, customer support, partnership opportunities"
        url="/contact"
        structuredData={structuredData}
      />
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-xl shadow-lg shadow-blue-200 object-cover" />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">QualityPulse</h1>
                <p className="text-xs text-slate-500 font-medium">AI-Powered Quality Assurance</p>
              </div>
            </div>
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Touch</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Ready to elevate your call center performance? Let's discuss how our AI-powered quality assurance can transform your operations.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                <Mail size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Email Support</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Our team responds within 24 hours for technical inquiries and demos
              </p>
              <a href="mailto:support@qualitypulse.com" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group">
                support@qualitypulse.com
                <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Documentation</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Access guides, tutorials, and resources to help you get started
              </p>
              <Link to="/about" className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-2 group">
                View Docs
                <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:translate-y-[-2px] transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Business Hours</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium">Monday - Friday:</span>
                  <span>8:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Saturday:</span>
                  <span>9:00 AM - 2:00 PM EST</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="font-medium">Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg p-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Why Choose QualityPulse?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Shield size={14} />
                  </div>
                  <span>Advanced AI technology</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="p-1 rounded-full bg-blue-500/20 text-blue-400">
                    <Zap size={14} />
                  </div>
                  <span>Real-time quality monitoring</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="p-1 rounded-full bg-purple-500/20 text-purple-400">
                    <Users size={14} />
                  </div>
                  <span>Expert support team</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Send size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Send us a Message</h2>
              </div>

              {submitted && (
                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-fade-in">
                  <CheckCircle2 className="text-emerald-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-emerald-900">Message Sent Successfully!</h4>
                    <p className="text-sm text-emerald-700 mt-1">We've received your inquiry and will get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input-enhanced w-full"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="input-enhanced w-full"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company/Organization</label>
                    <input
                      type="text"
                      className="input-enhanced w-full"
                      placeholder="ABC Insurance Services"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      className="input-enhanced w-full"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input-enhanced w-full"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request Product Demo</option>
                    <option value="pricing">Pricing & Plans</option>
                    <option value="integration">System Integration</option>
                    <option value="support">Technical Support</option>
                    <option value="compliance">Compliance Questions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    className="input-enhanced w-full min-h-[150px]"
                    placeholder="Tell us about your call center needs, current challenges, or how we can help improve your quality assurance process..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn-enhanced btn-primary-enhanced px-8 py-3 flex items-center gap-2 w-full md:w-auto justify-center">
                    <Send size={18} />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Common questions about our platform, pricing, and implementation process.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: "How does AI quality monitoring work?",
                a: "Our AI analyzes call recordings in real-time, scoring quality metrics, detecting sentiment, and identifying areas for improvement."
              },
              {
                q: "Can you integrate with my dialer?",
                a: "Yes, we support integration with most popular dialers and call center platforms through APIs and custom connectors."
              },
              {
                q: "What's the setup process like?",
                a: "Setup typically takes 1-2 days. We'll configure your quality rules, integrate with your systems, and provide training for your team."
              },
              {
                q: "Do you support custom integrations?",
                a: "We provide API access for integration. Contact us to discuss your specific platform and requirements."
              },
              {
                q: "What about data security?",
                a: "We maintain industry-standard security certifications. All data is encrypted, and we offer custom security agreements for enterprise clients."
              },
              {
                q: "Do you offer custom solutions?",
                a: "Yes, we can discuss custom solutions for enterprise clients with specific needs."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <HelpCircle size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-center text-white shadow-2xl shadow-blue-900/20">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-400 blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Call Center?</h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Join leading call centers who trust QualityPulse for AI-powered quality assurance and performance monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                Start Free Trial
              </Link>
              <button className="px-8 py-4 bg-blue-700/50 backdrop-blur-sm border border-blue-400/30 text-white hover:bg-blue-700/70 rounded-xl font-bold transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
