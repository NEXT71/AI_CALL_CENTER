import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
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
              <img src="/logo.jpg" alt="QualityPulse" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-blue-600">QualityPulse</h1>
              </div>
            </div>
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Contact Us</h1>
          <p className="text-xl text-slate-600">
            Get in touch with our team. We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="card">
              <div className="icon-container icon-container-blue mb-4">
                <Mail size={24} />
              </div>
              <h3 className="heading-4 mb-2">Email Us</h3>
              <p className="body-text text-slate-600 mb-3">
                Our team typically responds within 24 hours
              </p>
              <a href="mailto:support@qualitypulse.com" className="text-blue-600 hover:text-blue-700 font-medium">
                support@qualitypulse.com
              </a>
            </div>

            <div className="card">
              <div className="icon-container icon-container-green mb-4">
                <Phone size={24} />
              </div>
              <h3 className="heading-4 mb-2">Call Us</h3>
              <p className="body-text text-slate-600 mb-3">
                Monday - Friday, 9am - 6pm PST
              </p>
              <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700 font-medium">
                +1 (234) 567-890
              </a>
            </div>

            <div className="card">
              <div className="icon-container icon-container-slate mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="heading-4 mb-2">Visit Us</h3>
              <p className="body-text text-slate-600">
                123 Tech Street<br />
                San Francisco, CA 94105<br />
                United States
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="heading-3 mb-6">Send us a Message</h2>
              
              {submitted && (
                <div className="alert alert-success mb-6">
                  <p className="font-medium">Message Sent!</p>
                  <p className="text-sm mt-1">We'll get back to you as soon as possible.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="input-label">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">
                      Email <span className="text-red-500">*</span>
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
                    <label className="input-label">Company</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Your Company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+1 (234) 567-890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
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
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership Opportunity</option>
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
                    placeholder="Tell us how we can help..."
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
              <h3 className="heading-4 mb-2">How quickly can I get started?</h3>
              <p className="body-text text-slate-600">
                You can sign up and start uploading calls within minutes. Our 14-day free trial gives you full access to all features.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">What file formats do you support?</h3>
              <p className="body-text text-slate-600">
                We support WAV, MP3, M4A, and OGG audio formats. Files up to 100MB can be uploaded directly.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">Is there a setup fee?</h3>
              <p className="body-text text-slate-600">
                No setup fees. You only pay for your monthly or annual subscription with no hidden costs.
              </p>
            </div>

            <div className="card">
              <h3 className="heading-4 mb-2">Can I cancel anytime?</h3>
              <p className="body-text text-slate-600">
                Yes, you can cancel your subscription at any time. Your data will be available for 30 days after cancellation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
