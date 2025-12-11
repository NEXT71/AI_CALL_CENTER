import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Users, Zap, Shield, Heart, Globe } from 'lucide-react';

const About = () => {
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

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="heading-1 mb-4">About QualityPulse</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We're on a mission to revolutionize quality assurance with the power of AI, 
            helping teams deliver exceptional customer experiences.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Our Story */}
        <section className="card mb-8">
          <h2 className="heading-2 mb-4">Our Story</h2>
          <div className="space-y-4 body-text text-slate-700">
            <p>
              QualityPulse was founded in 2023 by a team of quality assurance professionals and AI engineers who 
              experienced firsthand the challenges of manual quality assurance. Traditional QA processes were 
              time-consuming, inconsistent, and could only sample a small fraction of calls.
            </p>
            <p>
              We knew there had to be a better way. By combining cutting-edge AI technology with deep industry 
              expertise, we created a platform that analyzes 100% of calls with unprecedented accuracy and speed.
            </p>
            <p>
              Today, QualityPulse serves organizations across industries, from customer support to sales teams, 
              helping them improve quality, ensure compliance, and drive better business outcomes.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="icon-container icon-container-blue mb-4">
              <Target size={28} />
            </div>
            <h3 className="heading-3 mb-3">Our Mission</h3>
            <p className="body-text text-slate-700">
              To empower organizations with AI-driven insights that elevate quality, ensure compliance, 
              and improve customer satisfaction at scale.
            </p>
          </div>

          <div className="card">
            <div className="icon-container icon-container-green mb-4">
              <Zap size={28} />
            </div>
            <h3 className="heading-3 mb-3">Our Vision</h3>
            <p className="body-text text-slate-700">
              A world where every customer interaction is analyzed, understood, and optimized to create 
              exceptional experiences for both customers and agents.
            </p>
          </div>
        </div>

        {/* Values */}
        <section className="card mb-8">
          <h2 className="heading-2 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="icon-container icon-container-blue flex-shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="heading-4 mb-2">Trust & Security</h4>
                <p className="body-text text-slate-600">
                  We treat your data with the highest security standards and complete transparency.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="icon-container icon-container-green flex-shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="heading-4 mb-2">Innovation</h4>
                <p className="body-text text-slate-600">
                  We continuously push the boundaries of what's possible with AI technology.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="icon-container icon-container-purple flex-shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h4 className="heading-4 mb-2">Customer Success</h4>
                <p className="body-text text-slate-600">
                  Your success is our success. We're committed to helping you achieve your goals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="icon-container icon-container-orange flex-shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <h4 className="heading-4 mb-2">Empathy</h4>
                <p className="body-text text-slate-600">
                  We understand the challenges of quality operations and build solutions that truly help.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="card mb-8">
          <h2 className="heading-2 mb-4">Our Technology</h2>
          <div className="space-y-4 body-text text-slate-700">
            <p>
              QualityPulse leverages state-of-the-art artificial intelligence and machine learning to deliver 
              industry-leading accuracy and insights:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Advanced Speech Recognition:</strong> Powered by OpenAI's Whisper model for 99%+ transcription accuracy</li>
              <li><strong>Natural Language Processing:</strong> Deep understanding of context, sentiment, and intent</li>
              <li><strong>Custom ML Models:</strong> Trained specifically for quality scoring and compliance detection</li>
              <li><strong>Real-time Analysis:</strong> Process calls in seconds, not hours or days</li>
              <li><strong>Scalable Infrastructure:</strong> Built on enterprise-grade cloud platforms (AWS, Google Cloud)</li>
              <li><strong>Security First:</strong> End-to-end encryption, SOC 2 compliance, GDPR ready</li>
            </ul>
          </div>
        </section>

        {/* Stats */}
        <section className="card mb-8 bg-gradient-to-br from-blue-50 to-white">
          <h2 className="heading-2 mb-6 text-center">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="heading-1 text-blue-600 mb-2">10M+</div>
              <div className="body-text text-slate-600">Calls Analyzed</div>
            </div>
            <div className="text-center">
              <div className="heading-1 text-blue-600 mb-2">500+</div>
              <div className="body-text text-slate-600">Companies</div>
            </div>
            <div className="text-center">
              <div className="heading-1 text-blue-600 mb-2">99.2%</div>
              <div className="body-text text-slate-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="heading-1 text-blue-600 mb-2">24/7</div>
              <div className="body-text text-slate-600">Support</div>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="card mb-8">
          <h2 className="heading-2 mb-4">Industries We Serve</h2>
          <p className="body-text text-slate-700 mb-4">
            QualityPulse is trusted by organizations across diverse industries:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">Customer Support</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">Sales & Telemarketing</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">Healthcare</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">Financial Services</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">E-commerce</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="font-medium text-slate-900">Insurance</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="card bg-blue-600 text-white text-center">
          <Globe size={48} className="mx-auto mb-4 opacity-90" />
          <h2 className="heading-2 text-white mb-3">Join the Quality Revolution</h2>
          <p className="text-lg text-blue-50 mb-6 max-w-2xl mx-auto">
            Discover how QualityPulse can transform your operations with AI-powered quality assurance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/" className="btn bg-white text-blue-600 hover:bg-blue-50">
              Start Free Trial
            </Link>
            <Link to="/contact" className="btn bg-blue-700 text-white hover:bg-blue-800">
              Contact Sales
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
