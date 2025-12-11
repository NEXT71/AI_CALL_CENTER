import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
          <h1 className="heading-1 mb-4">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: December 12, 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="heading-3 mb-3">1. Introduction</h2>
              <p className="body-text">
                QualityPulse ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered call center quality assurance platform.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">2. Information We Collect</h2>
              
              <h3 className="heading-4 mb-2 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title</li>
                <li><strong>Payment Information:</strong> Billing address, credit card details (processed securely via third-party payment processors)</li>
                <li><strong>Call Data:</strong> Audio recordings, transcriptions, metadata (agent names, customer information, timestamps)</li>
                <li><strong>Compliance Rules:</strong> Custom phrases, campaigns, rule configurations</li>
                <li><strong>Communications:</strong> Customer support inquiries, feedback, survey responses</li>
              </ul>

              <h3 className="heading-4 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent, clicks</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, analytics cookies</li>
                <li><strong>Log Data:</strong> Access times, error logs, performance metrics</li>
              </ul>

              <h3 className="heading-4 mb-2 mt-4">2.3 AI Processing Data</h3>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Transcriptions:</strong> AI-generated text from audio files</li>
                <li><strong>Quality Scores:</strong> Automated analysis results</li>
                <li><strong>Compliance Flags:</strong> Detected violations and matches</li>
                <li><strong>AI Feedback:</strong> Generated insights and recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Service Delivery:</strong> Process audio files, generate transcriptions, provide quality scores</li>
                <li><strong>Account Management:</strong> Create and maintain your account, process payments</li>
                <li><strong>AI Model Training:</strong> Improve transcription accuracy and analysis quality (with explicit consent)</li>
                <li><strong>Analytics:</strong> Generate dashboards, reports, and performance insights</li>
                <li><strong>Communication:</strong> Send service updates, security alerts, marketing communications (opt-out available)</li>
                <li><strong>Security:</strong> Detect fraud, prevent abuse, ensure platform security</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
                <li><strong>Product Improvement:</strong> Enhance features, fix bugs, develop new functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">4. Data Sharing and Disclosure</h2>
              
              <h3 className="heading-4 mb-2 mt-4">We share your information only in these circumstances:</h3>
              
              <h4 className="font-semibold text-slate-900 mb-2 mt-3">4.1 Service Providers</h4>
              <p className="body-text mb-2">
                We use trusted third-party service providers for:
              </p>
              <ul className="list-disc list-inside space-y-1 body-text ml-4">
                <li>Cloud hosting (AWS, Google Cloud)</li>
                <li>AI/ML processing (OpenAI API)</li>
                <li>Payment processing (Stripe)</li>
                <li>Email delivery (SendGrid)</li>
                <li>Analytics (Google Analytics)</li>
              </ul>

              <h4 className="font-semibold text-slate-900 mb-2 mt-3">4.2 Legal Requirements</h4>
              <p className="body-text">
                We may disclose information if required by law, court order, or government request, or to protect our rights and safety.
              </p>

              <h4 className="font-semibold text-slate-900 mb-2 mt-3">4.3 Business Transfers</h4>
              <p className="body-text">
                In case of merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.
              </p>

              <h4 className="font-semibold text-slate-900 mb-2 mt-3">4.4 With Your Consent</h4>
              <p className="body-text">
                We may share data with other parties when you explicitly authorize us to do so.
              </p>

              <p className="body-text mt-3 font-medium text-slate-900">
                We do NOT sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">5. Data Security</h2>
              <p className="body-text mb-3">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Role-based permissions, multi-factor authentication</li>
                <li><strong>Network Security:</strong> Firewalls, intrusion detection, DDoS protection</li>
                <li><strong>Regular Audits:</strong> Security assessments, penetration testing, vulnerability scans</li>
                <li><strong>Data Isolation:</strong> Customer data segregated in secure databases</li>
                <li><strong>Backup & Recovery:</strong> Regular backups, disaster recovery procedures</li>
                <li><strong>Employee Training:</strong> Security awareness and privacy training for all staff</li>
              </ul>
              <p className="body-text mt-3 text-sm text-slate-600">
                Despite our best efforts, no security system is impenetrable. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">6. Data Retention</h2>
              <p className="body-text mb-3">
                We retain your data for as long as necessary to provide services and comply with legal obligations:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Active Accounts:</strong> Data retained while subscription is active</li>
                <li><strong>Cancelled Accounts:</strong> Data retained for 30 days, then permanently deleted</li>
                <li><strong>Backup Data:</strong> Removed from backups within 90 days</li>
                <li><strong>Legal Hold:</strong> Data may be retained longer if required by law or litigation</li>
                <li><strong>Anonymized Analytics:</strong> Aggregated, non-identifiable data may be retained indefinitely</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">7. Your Privacy Rights</h2>
              
              <h3 className="heading-4 mb-2 mt-4">Depending on your location, you may have the following rights:</h3>
              
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Withdraw Consent:</strong> Revoke previously given consent</li>
              </ul>

              <p className="body-text mt-4">
                To exercise these rights, contact us at privacy@qualitypulse.com. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">8. Cookie Policy</h2>
              <p className="body-text mb-3">
                We use cookies and similar tracking technologies:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>Essential Cookies:</strong> Required for authentication and security (cannot be disabled)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Understand how users interact with our platform</li>
                <li><strong>Marketing Cookies:</strong> Track campaign effectiveness (opt-out available)</li>
              </ul>
              <p className="body-text mt-3">
                You can manage cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">9. International Data Transfers</h2>
              <p className="body-text mb-3">
                Your data may be transferred to and processed in countries other than your own. We ensure adequate protection through:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li>EU-U.S. Data Privacy Framework compliance</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Adequacy decisions by relevant authorities</li>
                <li>Data localization options for Enterprise customers</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">10. Children's Privacy</h2>
              <p className="body-text">
                Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a minor, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">11. AI and Automated Processing</h2>
              <p className="body-text mb-3">
                We use AI and machine learning to process your data:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>OpenAI API:</strong> Transcription and analysis (data not used for model training unless you opt-in)</li>
                <li><strong>Automated Scoring:</strong> Quality and compliance algorithms</li>
                <li><strong>Pattern Recognition:</strong> Identifying trends and anomalies</li>
              </ul>
              <p className="body-text mt-3">
                You have the right to request human review of automated decisions that significantly affect you.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">12. Compliance with Regulations</h2>
              <p className="body-text mb-3">
                QualityPulse complies with:
              </p>
              <ul className="list-disc list-inside space-y-2 body-text ml-4">
                <li><strong>GDPR:</strong> EU General Data Protection Regulation</li>
                <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
                <li><strong>SOC 2 Type II:</strong> Security and availability standards (in progress)</li>
                <li><strong>ISO 27001:</strong> Information security management (planned certification)</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-3 mb-3">13. Changes to This Policy</h2>
              <p className="body-text">
                We may update this Privacy Policy periodically. We will notify you of material changes via email and in-app notification. The "Last Updated" date at the top indicates when the policy was last revised. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="heading-3 mb-3">14. Contact Us</h2>
              <p className="body-text mb-3">
                For privacy-related questions, concerns, or requests:
              </p>
              <div className="body-text ml-4 space-y-1">
                <p><strong>Email:</strong> privacy@qualitypulse.com</p>
                <p><strong>Phone:</strong> +1 (234) 567-890</p>
                <p><strong>Mail:</strong> QualityPulse Privacy Team<br />123 Tech Street, San Francisco, CA 94105</p>
                <p className="mt-3"><strong>Data Protection Officer:</strong> dpo@qualitypulse.com</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              Your privacy matters to us. We are committed to protecting your personal information and being transparent about our practices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
