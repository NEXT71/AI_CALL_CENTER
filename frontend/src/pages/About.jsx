import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Users, Zap, Shield, Heart, Globe, CheckCircle2 } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="QualityPulse" className="w-20 h-20 rounded-xl shadow-lg shadow-blue-200 object-cover" />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  QualityPulse
                </h1>
              </div>
            </div>
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            About <span className="text-blue-600">QualityPulse</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to revolutionize quality assurance with the power of AI, 
            helping teams deliver exceptional customer experiences.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Our Story */}
        <section className="card-enhanced p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-enhanced p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">
                To empower organizations with AI-driven insights that elevate quality, ensure compliance, 
                and improve customer satisfaction at scale.
              </p>
            </div>
          </div>

          <div className="card-enhanced p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">
                A world where every customer interaction is analyzed, understood, and optimized to create 
                exceptional experiences for both customers and agents.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <section className="card-enhanced p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Trust & Security</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We treat your data with the highest security standards and complete transparency.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Innovation</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We continuously push the boundaries of what's possible with AI technology.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Customer Success</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Your success is our success. We're committed to helping you achieve your goals.
                </p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Heart size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Empathy</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We understand the challenges of quality operations and build solutions that truly help.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="card-enhanced p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Technology</h2>
          <div className="space-y-6">
            <p className="text-slate-600">
              QualityPulse leverages state-of-the-art artificial intelligence and machine learning to deliver 
              industry-leading accuracy and insights:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Advanced Speech Recognition (99%+ accuracy)",
                "Natural Language Processing & Sentiment Analysis",
                "Custom ML Models for Quality Scoring",
                "Real-time Analysis & Processing",
                "Scalable Cloud Infrastructure",
                "Enterprise-grade Security (SOC 2, GDPR)"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="card-enhanced p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <h2 className="text-2xl font-bold mb-8 text-center">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-blue-100 text-sm font-medium">Calls Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100 text-sm font-medium">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.2%</div>
              <div className="text-blue-100 text-sm font-medium">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100 text-sm font-medium">Support</div>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="card-enhanced p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Industries We Serve</h2>
          <p className="text-slate-600 mb-6">
            QualityPulse is trusted by organizations across diverse industries:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Customer Support",
              "Sales & Telemarketing",
              "Healthcare",
              "Financial Services",
              "E-commerce",
              "Insurance"
            ].map((industry, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border border-slate-200 text-center hover:border-blue-300 hover:shadow-md transition-all cursor-default">
                <p className="font-medium text-slate-900">{industry}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="card-enhanced p-12 text-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Globe size={32} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Join the Quality Revolution</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Discover how QualityPulse can transform your operations with AI-powered quality assurance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/" className="btn-enhanced bg-white text-slate-900 hover:bg-blue-50 border-none">
              Start Free Trial
            </Link>
            <Link to="/contact" className="btn-enhanced bg-blue-600 text-white hover:bg-blue-700 border-none">
              Contact Sales
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
