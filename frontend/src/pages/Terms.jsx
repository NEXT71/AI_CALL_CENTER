import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <h1 className="heading-1 mb-4">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: December 12, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="heading-3 mb-3">1. Acceptance of Terms</h2>
              <p className="body-text mb-3">
                By accessing and using QualityPulse ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">2. Description of Service</h2>
              <p className="body-text mb-3">
                QualityPulse provides AI-powered call center quality assurance and compliance monitoring services, including:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Automated call transcription using AI technology</li>
                <li>Quality scoring and analysis</li>
                <li>Compliance monitoring and rule management</li>
                <li>Analytics and reporting dashboards</li>
                <li>Team management and role-based access control</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">3. User Accounts</h2>
              <p className="body-text mb-3">
                You are responsible for maintaining the confidentiality of your account and password. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">4. Acceptable Use Policy</h2>
              <p className="body-text mb-3">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Upload malicious code, viruses, or harmful software</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for illegal call recording without proper consent</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">5. Data and Privacy</h2>
              <p className="body-text mb-3">
                Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Collection and processing of call recordings and metadata</li>
                <li>Use of AI/ML models to analyze your data</li>
                <li>Storage of data on secure cloud infrastructure</li>
                <li>Data retention according to your subscription plan</li>
              </ul>
              <p className="body-text mt-3">
                We implement industry-standard security measures to protect your data. However, you are responsible for ensuring you have proper consent and legal authorization to record and analyze calls in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">6. Subscription and Payment</h2>
              <p className="body-text mb-3">
                Subscription terms:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Subscriptions are billed monthly or annually in advance</li>
                <li>14-day free trial available for new customers</li>
                <li>Automatic renewal unless cancelled before renewal date</li>
                <li>Refunds available within 30 days of initial purchase</li>
                <li>Usage overages may incur additional charges</li>
                <li>Price changes require 30-day advance notice</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">7. Intellectual Property</h2>
              <p className="body-text mb-3">
                The Service and its original content, features, and functionality are owned by QualityPulse and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="body-text">
                You retain all rights to your uploaded call recordings and data. By using the Service, you grant us a limited license to process and analyze your data to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">8. Service Level and Availability</h2>
              <p className="body-text mb-3">
                We strive to maintain 99.9% uptime for paid Enterprise plans. However:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>We do not guarantee uninterrupted service availability</li>
                <li>Scheduled maintenance will be announced in advance</li>
                <li>We reserve the right to modify or discontinue features</li>
                <li>Service credits may be available for extended outages (Enterprise plans)</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">9. Limitation of Liability</h2>
              <p className="body-text mb-3">
                QualityPulse shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages exceeding the amount paid for the Service in the past 12 months</li>
                <li>Issues arising from third-party integrations or services</li>
                <li>Accuracy of AI-generated transcriptions or analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">10. Termination</h2>
              <p className="body-text mb-3">
                We may terminate or suspend your account immediately if you:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Breach these Terms of Service</li>
                <li>Fail to pay subscription fees</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Violate our Acceptable Use Policy</li>
              </ul>
              <p className="body-text mt-3">
                You may cancel your subscription at any time through your account settings. Upon termination, your data will be retained for 30 days before permanent deletion.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">11. AI and Automated Decision Making</h2>
              <p className="body-text mb-3">
                Our Service uses AI and machine learning to:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Transcribe audio recordings</li>
                <li>Score call quality and compliance</li>
                <li>Generate insights and recommendations</li>
              </ul>
              <p className="body-text mt-3">
                While we strive for accuracy, AI-generated results should be reviewed by qualified personnel before making critical business decisions. We are not liable for decisions made based solely on automated analysis.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">12. Compliance and Legal Recording</h2>
              <p className="body-text mb-3">
                You are solely responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Obtaining proper consent for call recording in your jurisdiction</li>
                <li>Complying with local, state, and federal recording laws</li>
                <li>Adhering to GDPR, CCPA, and other privacy regulations</li>
                <li>Implementing proper data retention and deletion policies</li>
                <li>Ensuring compliance with industry-specific regulations (PCI-DSS, HIPAA, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">13. Changes to Terms</h2>
              <p className="body-text mb-3">
                We reserve the right to modify these terms at any time. We will notify users of material changes via:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>Email notification to registered users</li>
                <li>In-app notification banner</li>
                <li>Updates to this page with revision date</li>
              </ul>
              <p className="body-text mt-3">
                Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">14. Governing Law</h2>
              <p className="body-text">
                These Terms shall be governed by the laws of the United States and the State of California, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">15. Contact Information</h2>
              <p className="body-text mb-3">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="body-text ml-4 space-y-1">
                <p>Email: legal@qualitypulse.com</p>
                <p>Phone: +1 (234) 567-890</p>
                <p>Address: 123 Tech Street, San Francisco, CA 94105</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
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
