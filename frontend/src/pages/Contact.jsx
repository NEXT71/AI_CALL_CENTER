import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageSquare, Clock, Users, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    campaign: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="NextelBPO" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-blue-600">NextelBPO</h1>
                <p className="text-xs text-slate-500 -mt-0.5">AI-Powered Call Center Solutions</p>
              </div>
            </div>
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Ready to elevate your call center performance? Let's discuss how our AI-powered quality assurance can transform your ACA, Medicare, and Final Expense campaigns.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            <div className="card">
              <div className="icon-container icon-container-blue mb-4">
                <Mail size={24} />
              </div>
              <h3 className="heading-4 mb-2">Email Support</h3>
              <p className="body-text text-slate-600 mb-3">
                Our team responds within 24 hours for technical inquiries and demos
              </p>
              <a href="mailto:support@nextelbpo.com" className="text-blue-600 hover:text-blue-700 font-medium">
                support@nextelbpo.com
              </a>
            </div>

            <div className="card">
              <div className="icon-container icon-container-green mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="heading-4 mb-2">Live Chat</h3>
              <p className="body-text text-slate-600 mb-3">
                Available Monday - Friday, 8am - 6pm EST for immediate assistance
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium underline">
                Start Live Chat
              </button>
            </div>

            <div className="card">
              <div className="icon-container icon-container-purple mb-4">
                <Clock size={24} />
              </div>
              <h3 className="heading-4 mb-2">Business Hours</h3>
              <p className="body-text text-slate-600">
                <strong>Monday - Friday:</strong> 8:00 AM - 6:00 PM EST<br />
                <strong>Saturday:</strong> 9:00 AM - 2:00 PM EST<br />
                <strong>Sunday:</strong> Closed
              </p>
            </div>

            <div className="card">
              <div className="icon-container icon-container-slate mb-4">
                <Users size={24} />
              </div>
              <h3 className="heading-4 mb-2">Why Choose NextelBPO?</h3>
              <ul className="body-text text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <Shield size={16} className="text-green-600" />
                  <span>Specialized in insurance campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-600" />
                  <span>AI-powered quality assurance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} className="text-purple-600" />
                  <span>Experienced compliance team</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="heading-3 mb-6">Send us a Message</h2>

              {submitted && (
                <div className="alert alert-success mb-6">
                  <p className="font-medium">Message Sent!</p>
                  <p className="text-sm mt-1">We'll get back to you within 24 hours.</p>
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
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="input"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="input-label">Company/Organization</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="ABC Insurance Services"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Campaign Type</label>
                  <select
                    className="select"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                  >
                    <option value="">Select campaign type (optional)</option>
                    <option value="aca">ACA (Affordable Care Act)</option>
                    <option value="medicare">Medicare</option>
                    <option value="final-expense">Final Expense</option>
                    <option value="other">Other Insurance</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="select"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request Product Demo</option>
                    <option value="pricing">Pricing & Plans</option>
                    <option value="integration">Vicidial Integration</option>
                    <option value="support">Technical Support</option>
                    <option value="compliance">Compliance Questions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    className="input"
                    placeholder="Tell us about your call center needs, current challenges, or how we can help improve your quality assurance process..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full md:w-auto">
                  <Send size={18} />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="heading-2 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="card">
              <h3 className="heading-4 mb-2">Do you specialize in insurance campaigns?</h3>
              <p className="body-text text-slate-600">
                Yes, we specialize in ACA, Medicare, and Final Expense campaigns. Our AI is trained on insurance-specific compliance requirements and sales best practices.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">Can you integrate with Vicidial?</h3>
              <p className="body-text text-slate-600">
                Absolutely. We offer seamless integration with Vicidial dialers, automatically importing call recordings and providing real-time quality analysis.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">How does compliance monitoring work?</h3>
              <p className="body-text text-slate-600">
                Our AI scans every call for mandatory phrases, forbidden language, and regulatory compliance. You'll get instant alerts for any violations.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">What's the setup process like?</h3>
              <p className="body-text text-slate-600">
                Setup typically takes 1-2 days. We'll configure campaign-specific rules, integrate with your dialer, and provide training for your QA team.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">Do you offer white-label solutions?</h3>
              <p className="body-text text-slate-600">
                Yes, we offer white-label options for agencies and BPOs who want to provide quality assurance as part of their service offering.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">What about data security and HIPAA?</h3>
              <p className="body-text text-slate-600">
                We maintain HIPAA compliance and SOC 2 certification. All call data is encrypted, and we offer custom security agreements for enterprise clients.
              </p>
            </div>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Call Center?</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
            Join leading insurance BPOs who trust NextelBPO for AI-powered quality assurance and compliance monitoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold">
              Start Free Trial
            </Link>
            <button className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
