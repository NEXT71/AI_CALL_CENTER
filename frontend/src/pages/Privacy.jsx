import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, Server, Globe, Mail } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-lg shadow-lg shadow-blue-200 object-cover" />
              <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">QualityPulse</h1>
              </div>
            </div>
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card-enhanced p-8 md:p-12 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Last Updated: December 12, 2025</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">1</span>
                Introduction
              </h2>
              <p className="text-slate-600 leading-relaxed">
                QualityPulse ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered call center quality assurance platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">2</span>
                Information We Collect
              </h2>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" />
                  2.1 Information You Provide
                </h3>
                <ul className="space-y-2 text-slate-600 ml-6 list-disc">
                  <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title</li>
                  <li><strong>Payment Information:</strong> Billing address, credit card details (processed securely via third-party payment processors)</li>
                  <li><strong>Call Data:</strong> Audio recordings, transcriptions, metadata (agent names, customer information, timestamps)</li>
                  <li><strong>Compliance Rules:</strong> Custom phrases, campaigns, rule configurations</li>
                  <li><strong>Communications:</strong> Customer support inquiries, feedback, survey responses</li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Server size={18} className="text-indigo-500" />
                  2.2 Automatically Collected Information
                </h3>
                <ul className="space-y-2 text-slate-600 ml-6 list-disc">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, clicks</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
                  <li><strong>Log Data:</strong> Access times, error logs, performance metrics</li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye size={18} className="text-purple-500" />
                  2.3 AI Processing Data
                </h3>
                <ul className="space-y-2 text-slate-600 ml-6 list-disc">
                  <li><strong>Transcriptions:</strong> AI-generated text from audio files</li>
                  <li><strong>Quality Scores:</strong> Automated analysis results</li>
                  <li><strong>Compliance Flags:</strong> Detected violations and matches</li>
                  <li><strong>AI Feedback:</strong> Generated insights and recommendations</li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">3</span>
                How We Use Your Information
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Service Delivery', 'Account Management', 'AI Model Training', 'Analytics',
                  'Communication', 'Security', 'Legal Compliance', 'Product Improvement'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-600 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">4</span>
                Data Sharing and Disclosure
              </h2>
              
              <div className="space-y-6 text-slate-600">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">4.1 Service Providers</h4>
                  <p className="mb-2">We use trusted third-party service providers for:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Cloud hosting and infrastructure</li>
                    <li>AI/ML processing (Open-source models)</li>
                    <li>Payment processing (Stripe)</li>
                    <li>Email delivery services</li>
                    <li>System monitoring and analytics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">4.2 Legal Requirements</h4>
                  <p>We may disclose information if required by law, court order, or government request, or to protect our rights and safety.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">4.3 Business Transfers</h4>
                  <p>In case of merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm font-medium flex items-center gap-2">
                  <Lock size={16} />
                  We do NOT sell your personal data to third parties.
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">5</span>
                Data Security
              </h2>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-600 mb-4">We implement industry-standard security measures including:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Encryption', desc: 'TLS 1.3 & AES-256' },
                    { title: 'Access Controls', desc: 'Role-based & MFA' },
                    { title: 'Network Security', desc: 'Firewalls & DDoS protection' },
                    { title: 'Regular Audits', desc: 'Penetration testing' },
                    { title: 'Data Isolation', desc: 'Secure databases' },
                    { title: 'Backup & Recovery', desc: 'Disaster recovery' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="text-xs text-slate-500">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">6</span>
                Data Retention
              </h2>
              <ul className="space-y-2 text-slate-600 ml-6 list-disc">
                <li><strong>Active Accounts:</strong> Data retained while subscription is active</li>
                <li><strong>Cancelled Accounts:</strong> Data retained for 30 days, then permanently deleted</li>
                <li><strong>Backup Data:</strong> Removed from backups within 90 days</li>
                <li><strong>Legal Hold:</strong> Data may be retained longer if required by law or litigation</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">7</span>
                Your Privacy Rights
              </h2>
              <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                <p className="text-indigo-900 font-medium mb-4">Depending on your location, you may have the following rights:</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-indigo-800">
                  <ul className="list-disc ml-4 space-y-2">
                    <li>Access</li>
                    <li>Correction</li>
                    <li>Deletion</li>
                    <li>Portability</li>
                  </ul>
                  <ul className="list-disc ml-4 space-y-2">
                    <li>Restriction</li>
                    <li>Objection</li>
                    <li>Opt-Out</li>
                    <li>Withdraw Consent</li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-indigo-200 text-sm text-indigo-700">
                  To exercise these rights, contact us at <a href="mailto:privacy@qualitypulse.com" className="font-bold hover:underline">privacy@qualitypulse.com</a>.
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">8</span>
                Contact Us
              </h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <Mail className="text-blue-500 mb-3" size={24} />
                  <h3 className="font-bold text-slate-900 mb-1">Email Us</h3>
                  <p className="text-sm text-slate-500 mb-2">For privacy inquiries</p>
                  <a href="mailto:privacy@qualitypulse.com" className="text-blue-600 font-medium hover:underline">privacy@qualitypulse.com</a>
                </div>
                <div className="flex-1 bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <Globe className="text-purple-500 mb-3" size={24} />
                  <h3 className="font-bold text-slate-900 mb-1">Mailing Address</h3>
                  <p className="text-sm text-slate-500">
                    QualityPulse Privacy Team<br />
                    123 Tech Street<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Your privacy matters to us. We are committed to protecting your personal information and being transparent about our practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
