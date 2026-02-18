import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Scale, Lock, AlertCircle, HelpCircle } from 'lucide-react';
import SEO from '../components/SEO';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <SEO
        title="Terms of Service - QualityPulse"
        description="Read QualityPulse's Terms of Service. Understand your rights and obligations when using our AI-powered call center quality assurance platform."
        keywords="terms of service, QualityPulse terms, user agreement, service terms"
        url="/terms"
        noindex={false}
      />
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-lg shadow-lg shadow-blue-500/20 object-cover" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                QualityPulse
              </span>
            </div>
            <Link 
              to="/" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20 shadow-xl">
            <Scale className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Terms of Service</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using our services. They govern your relationship with QualityPulse.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm font-medium">
            <FileText size={16} />
            Last Updated: December 12, 2025
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 md:p-12 shadow-xl">
          <div className="space-y-12">
            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                By accessing and using QualityPulse ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                QualityPulse provides AI-powered call center quality assurance and compliance monitoring services, including:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Automated call transcription using AI technology',
                  'Quality scoring and analysis',
                  'Compliance monitoring and rule management',
                  'Analytics and reporting dashboards',
                  'Team management and role-based access control'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account and password. You agree to:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Provide accurate and complete registration information',
                  'Keep your password secure and confidential',
                  'Notify us immediately of any unauthorized use of your account',
                  'Be responsible for all activities under your account'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Acceptable Use Policy</h2>
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Prohibited Activities</h3>
                    <p className="text-red-800 text-sm">
                      Violation of these policies may result in immediate account termination.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Upload malicious code, viruses, or harmful software',
                  'Violate any applicable laws or regulations',
                  'Infringe on intellectual property rights of others',
                  'Harass, abuse, or harm other users',
                  'Attempt to gain unauthorized access to our systems',
                  'Use the service for illegal call recording without proper consent'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data and Privacy</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to:
              </p>
              <ul className="space-y-3 mt-4 mb-6">
                {[
                  'Collection and processing of call recordings and metadata',
                  'Use of AI/ML models to analyze your data',
                  'Storage of data on secure cloud infrastructure',
                  'Data retention according to your subscription plan'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-600 mt-1" size={20} />
                  <p className="text-blue-900 text-sm leading-relaxed">
                    We implement industry-standard security measures to protect your data. However, you are responsible for ensuring you have proper consent and legal authorization to record and analyze calls in your jurisdiction.
                  </p>
                </div>
              </div>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Subscription and Payment</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Subscription terms:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Subscriptions are billed monthly or annually in advance',
                  '14-day free trial available for new customers',
                  'Automatic renewal unless cancelled before renewal date',
                  'Refunds available within 30 days of initial purchase',
                  'Usage overages may incur additional charges',
                  'Price changes require 30-day advance notice'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Intellectual Property</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by QualityPulse and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You retain all rights to your uploaded call recordings and data. By using the Service, you grant us a limited license to process and analyze your data to provide the Service.
              </p>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Service Level and Availability</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We strive to maintain 99.9% uptime for paid Enterprise plans. However:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'We do not guarantee uninterrupted service availability',
                  'Scheduled maintenance will be announced in advance',
                  'We reserve the right to modify or discontinue features',
                  'Service credits may be available for extended outages (Enterprise plans)'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                QualityPulse shall not be liable for:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Indirect, incidental, or consequential damages',
                  'Loss of profits, data, or business opportunities',
                  'Damages exceeding the amount paid for the Service in the past 12 months',
                  'Issues arising from third-party integrations or services',
                  'Accuracy of AI-generated transcriptions or analysis'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Termination</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We may terminate or suspend your account immediately if you:
              </p>
              <ul className="space-y-3 mt-4 mb-6">
                {[
                  'Breach these Terms of Service',
                  'Fail to pay subscription fees',
                  'Engage in fraudulent or illegal activities',
                  'Violate our Acceptable Use Policy'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-600 leading-relaxed">
                You may cancel your subscription at any time through your account settings. Upon termination, your data will be retained for 30 days before permanent deletion.
              </p>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. AI and Automated Decision Making</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our Service uses AI and machine learning to:
              </p>
              <ul className="space-y-3 mt-4 mb-6">
                {[
                  'Transcribe audio recordings',
                  'Score call quality and compliance',
                  'Generate insights and recommendations'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 mt-1" size={20} />
                  <p className="text-amber-900 text-sm leading-relaxed">
                    While we strive for accuracy, AI-generated results should be reviewed by qualified personnel before making critical business decisions. We are not liable for decisions made based solely on automated analysis.
                  </p>
                </div>
              </div>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Compliance and Legal Recording</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You are solely responsible for:
              </p>
              <ul className="space-y-3 mt-4">
                {[
                  'Obtaining proper consent for call recording in your jurisdiction',
                  'Complying with local, state, and federal recording laws',
                  'Understanding applicable privacy regulations in your region',
                  'Implementing proper data retention and deletion policies',
                  'Ensuring compliance with industry-specific regulations as applicable'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. We will notify users of material changes via:
              </p>
              <ul className="space-y-3 mt-4 mb-6">
                {[
                  'Email notification to registered users',
                  'In-app notification banner',
                  'Updates to this page with revision date'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2.5 flex-shrink-0"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed">
                These Terms shall be governed by the laws of the United States and the State of California, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="relative pl-8 border-l-2 border-blue-100">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Contact Information</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <HelpCircle className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium mb-2">For questions about these Terms of Service, please contact us:</p>
                    <div className="space-y-2 text-slate-600">
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Email:</span>
                        <a href="mailto:legal@qualitypulse.com" className="text-blue-600 hover:underline">legal@qualitypulse.com</a>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Phone:</span>
                        <span>+1 (234) 567-890</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">Address:</span>
                        <span>123 Tech Street, San Francisco, CA 94105</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              By using QualityPulse, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
