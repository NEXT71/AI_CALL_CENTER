import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callService, reportService, coachingService } from '../services/apiService';
import { 
  ArrowLeft, Download, Play, Pause, AlertTriangle, CheckCircle, 
  X, Phone, User, Calendar, Clock, Hash, TrendingUp, TrendingDown,
  Shield, Award, MessageSquare, Volume2, FileText, BrainCircuit,
  Brain, Languages, Briefcase, MessageCircle, PhoneOff, Scissors,
  Lightbulb, Target, BookOpen, Edit2, Save, Sparkles, TrendingDown as ArrowDown,
  CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import AudioTrimmer from '../components/AudioTrimmer';

const CallDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrimmer, setShowTrimmer] = useState(false);
  
  // Coaching states
  const [coaching, setCoaching] = useState(null);
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [generatingCoaching, setGeneratingCoaching] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchCallDetails();
  }, [id]);

  const fetchCallDetails = async () => {
    try {
      const [callResponse, reportResponse] = await Promise.all([
        callService.getCallById(id),
        reportService.getCallReport(id).catch(() => ({ data: null })),
      ]);

      setCall(callResponse.data);
      setReport(reportResponse?.data);
      
      // Debug: Log quality metrics structure
      console.log('Call Quality Metrics:', callResponse.data.qualityMetrics);
      console.log('Has aiFactors?', !!callResponse.data.qualityMetrics?.aiFactors);
      console.log('aiFactors:', callResponse.data.qualityMetrics?.aiFactors);
      
      // Load coaching if exists
      if (callResponse.data.coaching) {
        setCoaching(callResponse.data.coaching);
        setManagerNotes(callResponse.data.coaching.managerNotes || '');
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateCoaching = async () => {
    try {
      setGeneratingCoaching(true);
      const response = await coachingService.generateCoaching(id);
      setCoaching(response.data);
      setManagerNotes(response.data.managerNotes || '');
      
      // Show success message
      alert('Coaching recommendations generated successfully!');
    } catch (error) {
      console.error('Error generating coaching:', error);
      alert(error.response?.data?.message || 'Failed to generate coaching recommendations');
    } finally {
      setGeneratingCoaching(false);
    }
  };
  
  const handleSaveManagerNotes = async () => {
    try {
      setSavingNotes(true);
      const response = await coachingService.updateManagerNotes(id, managerNotes);
      setCoaching(response.data);
      setEditingNotes(false);
      alert('Manager notes saved successfully!');
    } catch (error) {
      console.error('Error saving manager notes:', error);
      alert('Failed to save manager notes');
    } finally {
      setSavingNotes(false);
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return 'badge-score-high';
    if (score >= 70) return 'badge-score-medium';
    if (score >= 50) return 'badge-score-low';
    return 'badge-score-critical';
  };

  const getScoreRating = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const downloadReport = () => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${call.callId}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-900 font-bold">Loading call details...</p>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="text-slate-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Call Not Found</h2>
        <p className="text-slate-900 font-semibold mb-6">The call record you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/app/calls')} className="btn-enhanced btn-primary-enhanced">
          Back to Calls
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/calls')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Call Details
              <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md font-mono border border-slate-300">
                {call.callId}
              </span>
            </h1>
            <p className="text-slate-800 font-semibold flex items-center gap-2 text-sm mt-1">
              <Calendar size={14} />
              {new Date(call.callDate).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {report && (
            <button onClick={downloadReport} className="btn-enhanced btn-secondary-enhanced flex items-center gap-2">
              <Download size={18} />
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* Processing Error Banner */}
      {call.status === 'failed' && call.processingError && (
        <div className="card-enhanced p-6 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <X className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Processing Failed
              </h3>
              <p className="text-red-800 font-medium mb-3">{call.processingError}</p>
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <p className="text-sm text-slate-900 font-semibold">
                  <strong>What to do:</strong> This call could not be processed automatically. 
                  {call.processingError.includes('timeout') && ' Try uploading a shorter audio file or check if the AI service is running.'}
                  {call.processingError.includes('unavailable') && ' The AI service is currently unavailable. Please try again later or contact support.'}
                  {call.processingError.includes('format') && ' Check that the audio file is in a supported format (MP3, WAV, M4A).'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status Banner */}
      {(call.status === 'processing' || call.status === 'queued') && (
        <div className="card-enhanced p-6 border-l-4 border-l-blue-500 bg-blue-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                {call.status === 'queued' ? 'Queued for Processing' : 'Processing in Progress'}
              </h3>
              <p className="text-blue-800 mb-3">
                {call.status === 'queued' 
                  ? 'This call is in the processing queue. It will be analyzed shortly.' 
                  : 'AI analysis is currently running. This may take 2-10 minutes depending on call length.'}
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock size={16} />
                <span>Started: {call.processingStartedAt ? new Date(call.processingStartedAt).toLocaleTimeString() : 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Error Banner */}
      {call.status === 'failed' && call.processingError && (
        <div className="card-enhanced p-6 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <X className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Processing Failed
              </h3>
              <p className="text-red-800 font-medium mb-3">{call.processingError}</p>
              <div className="bg-white border border-red-200 rounded-lg p-3">
                <p className="text-sm text-slate-900 font-semibold">
                  <strong>What to do:</strong> This call could not be processed automatically. 
                  {call.processingError.includes('timeout') && ' Try uploading a shorter audio file or check if the AI service is running.'}
                  {call.processingError.includes('unavailable') && ' The AI service is currently unavailable. Please try again later or contact support.'}
                  {call.processingError.includes('format') && ' Check that the audio file is in a supported format (MP3, WAV, M4A).'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare size={24} />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              call.qualityScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
              call.qualityScore >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {call.qualityScore >= 80 ? 'positive' : call.qualityScore >= 60 ? 'neutral' : 'negative'}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1 capitalize">
            {call.qualityScore >= 80 ? 'Positive' : call.qualityScore >= 60 ? 'Neutral' : 'Negative'}
          </div>
          <div className="text-sm font-bold text-slate-900">Overall Sentiment</div>
          <div className="text-xs text-slate-800 mt-1 font-semibold">Based on quality score</div>
        </div>

        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              call.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
              call.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              call.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
              {call.status}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1 font-mono">
            {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '0:00'}
          </div>
          <div className="text-sm font-bold text-slate-900">Duration</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Call Info & Audio */}
        <div className="lg:col-span-1 space-y-6">
          {/* Call Information */}
          <div className="card-enhanced p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Call Information
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 bg-blue-50 px-2 py-0.5 rounded">Agent</div>
                  <div className="font-semibold text-slate-900">{call.agentName}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 bg-green-50 px-2 py-0.5 rounded">Customer</div>
                  <div className="font-semibold text-slate-900">{call.customerName || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Hash size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 bg-purple-50 px-2 py-0.5 rounded">Campaign</div>
                  <div className="font-semibold text-slate-900">{call.campaign}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5 bg-amber-50 px-2 py-0.5 rounded">Date & Time</div>
                  <div className="font-semibold text-slate-900">
                    {new Date(call.callDate).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <AudioPlayer callId={call._id} callName={call.callId} />
          
          {/* Audio Trimmer Button */}
          <div className="card-enhanced p-4">
            <button
              onClick={() => setShowTrimmer(true)}
              className="w-full btn-enhanced btn-secondary-enhanced flex items-center justify-center gap-2"
            >
              <Scissors size={18} />
              Trim Audio
            </button>
            <p className="text-xs text-slate-800 font-semibold text-center mt-2">
              Extract specific segments from the recording
            </p>
          </div>
        </div>

        {/* Right Column - Transcript & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Issues */}
          {(call.missingMandatoryPhrases.length > 0 || call.detectedForbiddenPhrases.length > 0) && (
            <div className="card-enhanced p-6 border-l-4 border-l-amber-500">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={24} />
                Compliance Issues Detected
              </h2>
              
              {call.missingMandatoryPhrases.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Missing Mandatory Phrases ({call.missingMandatoryPhrases.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {call.missingMandatoryPhrases.map((phrase, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-amber-900">{phrase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {call.detectedForbiddenPhrases.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Forbidden Phrases Detected ({call.detectedForbiddenPhrases.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {call.detectedForbiddenPhrases.map((phrase, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                        <X size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-red-900">{phrase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Quality Analysis - New Format */}
          {call.qualityMetrics?.aiFactors && Object.keys(call.qualityMetrics.aiFactors).length > 0 && (
            <div className="card-enhanced p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Brain size={20} className="text-purple-600" />
                  AI Quality Analysis
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                    {call.qualityScore}/100 Score
                  </span>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>About AI Scoring:</strong> This call is analyzed using 6 AI-powered factors that evaluate customer satisfaction, 
                  communication quality, and compliance. Maximum score is 80 points (rescaled to 100 for display). 
                  Penalties can reduce the score. Hover over each factor below to learn what it measures.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Tone Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 group relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Customer Tone
                        <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">{call.qualityMetrics.aiDetails?.customer_tone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{call.qualityMetrics.aiFactors.customer_tone_score || 0}/25</div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                      <strong>Customer Tone (25 pts max):</strong> Measures customer sentiment during the call. 
                      Positive = 25pts, Neutral = 18pts, Frustrated = 10pts. Based on AI sentiment analysis.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                </div>

                {/* Language Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 group relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Languages size={18} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Language Quality
                        <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">{call.qualityMetrics.aiDetails?.detected_language || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{call.qualityMetrics.aiFactors.language_score || 0}/10</div>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                      <strong>Language (10 pts max):</strong> Rewards clear language use. 
                      English = 10pts, Spanish/French/German = 8pts, Other = 5pts. Detected automatically.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                </div>

                {/* Agent Professionalism Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 group relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Briefcase size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Agent Professionalism
                        <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">
                        {call.qualityMetrics.aiDetails?.agent_casual_phrases?.length > 0 
                          ? `${call.qualityMetrics.aiDetails.agent_casual_phrases.length} casual phrases`
                          : 'Professional tone'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{call.qualityMetrics.aiFactors.agent_professionalism_score || 0}/25</div>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                      <strong>Agent Professionalism (25 pts max):</strong> Penalizes casual language like &quot;yeah&quot;, &quot;gonna&quot;, &quot;umm&quot;. 
                      Starts at 25pts, -2pts per casual phrase (max -15pts). Encourages professional communication.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                </div>

                {/* Customer Communication Score */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 group relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <MessageCircle size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Customer Communication
                        <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">{call.qualityMetrics.aiDetails?.customer_style || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{call.qualityMetrics.aiFactors.customer_communication_score || 0}/20</div>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                      <strong>Customer Communication (20 pts max):</strong> Analyzes customer communication style. 
                      Polite = 20pts, Neutral = 16pts, Assertive = 12pts, Aggressive = 8pts. Based on tone indicators.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                </div>

                {/* Abusive Language Penalty */}
                {call.qualityMetrics.aiFactors.abusive_language_penalty < 0 && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 group relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <X size={18} className="text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                          Abusive Language
                          <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full cursor-help">!</span>
                        </div>
                        <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">
                          {call.qualityMetrics.aiDetails?.abusive_words_found?.length || 0} words detected
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{call.qualityMetrics.aiFactors.abusive_language_penalty}/0</div>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                        <strong>Abusive Language Penalty (-30 pts max):</strong> Detects profanity and offensive language. 
                        -10pts per abusive word detected (max -30pts total). Ensures respectful communication.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DNC Penalty */}
                {call.qualityMetrics.aiFlags?.is_dnc_customer && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 group relative">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <PhoneOff size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                          Do Not Call Request
                          <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full cursor-help">!</span>
                        </div>
                        <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">Customer opted out</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">{call.qualityMetrics.aiFactors.dnc_penalty || -20}/0</div>
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-xl">
                        <strong>Do Not Call Penalty (-20 pts):</strong> Detects when customer requests not to be called again. 
                        Phrases like &quot;don&apos;t call me&quot;, &quot;remove from list&quot;, etc. trigger this penalty.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quality Overview - Legacy Format (for old calls) */}
          {call.qualityScore > 0 && (!call.qualityMetrics?.aiFactors || Object.keys(call.qualityMetrics.aiFactors).length === 0) && (
            <div className="card-enhanced p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award size={20} className="text-purple-600" />
                  Quality Score
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                    {call.qualityScore}/100
                  </span>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> This call was processed with the legacy scoring system. 
                  New calls will show detailed AI-powered quality factors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overall Quality */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Award size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-sm inline-block">Overall Quality</div>
                      <div className="text-sm text-slate-900 font-bold bg-white px-2 py-1 rounded-md inline-block mt-1">
                        {call.qualityScore >= 90 ? 'Excellent' :
                         call.qualityScore >= 70 ? 'Good' :
                         call.qualityScore >= 50 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{call.qualityScore}/100</div>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Sentiment</div>
                      <div className="text-sm text-slate-900 capitalize font-bold">{call.sentiment || 'neutral'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      call.sentiment === 'positive' ? 'bg-green-100 text-green-800 border-green-200' :
                      call.sentiment === 'negative' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {call.sentiment || 'neutral'}
                    </span>
                  </div>
                </div>

                {/* Traditional Metrics */}
                {call.qualityMetrics?.hasGreeting !== undefined && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        {call.qualityMetrics.hasGreeting ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : (
                          <XCircle size={18} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Greeting</div>
                        <div className="text-sm text-slate-900 font-bold">
                          {call.qualityMetrics.hasGreeting ? 'Present' : 'Missing'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {call.qualityMetrics?.hasProperClosing !== undefined && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        {call.qualityMetrics.hasProperClosing ? (
                          <CheckCircle size={18} className="text-orange-600" />
                        ) : (
                          <XCircle size={18} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Proper Closing</div>
                        <div className="text-sm text-slate-900 font-bold">
                          {call.qualityMetrics.hasProperClosing ? 'Present' : 'Missing'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transcript */}
          {(call.speakerLabeledTranscript || call.transcript) && (
            <div className="card-enhanced p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                Call Transcript
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-normal text-base">
                  {call.speakerLabeledTranscript || call.transcript}
                </p>
              </div>
            </div>
          )}

          {/* AI Coaching Recommendations */}
          {call.status === 'completed' && (
            <div className="card-enhanced p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lightbulb size={20} className="text-blue-600" />
                  AI Coaching Recommendations
                </h2>
                {!coaching ? (
                  <button
                    onClick={handleGenerateCoaching}
                    disabled={generatingCoaching}
                    className="btn-enhanced btn-primary-enhanced flex items-center gap-2"
                  >
                    {generatingCoaching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate Coaching
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateCoaching}
                    disabled={generatingCoaching}
                    className="btn-enhanced btn-secondary-enhanced flex items-center gap-2 text-sm"
                  >
                    {generatingCoaching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Regenerate
                      </>
                    )}
                  </button>
                )}
              </div>

              {coaching ? (
                <div className="space-y-6">
                  {/* Priority Badge */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Target size={20} className="text-slate-700" />
                      </div>
                      <span className="font-bold text-slate-900">Priority Level</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPriorityColor(coaching.priorityScore)}`}>
                      {coaching.priorityScore}
                    </span>
                  </div>

                  {/* Strengths */}
                  {coaching.strengths && coaching.strengths.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <h3 className="text-md font-bold text-green-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-green-600" />
                        What Went Well ({coaching.strengths.length})
                      </h3>
                      <div className="space-y-2">
                        {coaching.strengths.map((strength, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-green-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-slate-900 font-semibold">{strength}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Areas */}
                  {coaching.improvementAreas && coaching.improvementAreas.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <h3 className="text-md font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-amber-600" />
                        Areas for Improvement ({coaching.improvementAreas.length})
                      </h3>
                      <div className="space-y-2">
                        {coaching.improvementAreas.map((area, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-amber-100 shadow-sm">
                            <ArrowDown size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-slate-900 font-semibold">{area}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specific Recommendations */}
                  {coaching.recommendations && coaching.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h3 className="text-md font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-600" />
                        Specific Coaching Actions ({coaching.recommendations.length})
                      </h3>
                      <div className="space-y-4">
                        {coaching.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
                                  {rec.category}
                                </span>
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                                  {rec.priority} Priority
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-red-100 px-2 py-1 rounded inline-block">⚠️ Issue:</span>
                                <p className="text-sm text-slate-900 font-bold mt-2 leading-relaxed">{rec.issue}</p>
                              </div>
                              
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide bg-green-100 px-2 py-1 rounded inline-block">✅ Recommendation:</span>
                                <p className="text-sm text-slate-900 font-bold mt-2 leading-relaxed">{rec.suggestion}</p>
                              </div>
                              
                              {rec.suggestedScript && (
                                <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mt-3 shadow-sm">
                                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-2 flex items-center gap-1">
                                    💬 Suggested Script:
                                  </span>
                                  <p className="text-base text-slate-900 font-bold leading-relaxed">"{rec.suggestedScript}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Training Tags */}
                  {coaching.trainingTags && coaching.trainingTags.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                      <h3 className="text-md font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-purple-600" />
                        Training Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {coaching.trainingTags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-white text-slate-900 rounded-full text-sm font-bold border-2 border-purple-300 shadow-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manager Notes */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                        <Edit2 size={18} className="text-slate-600" />
                        Manager Coaching Notes
                      </h3>
                      {!editingNotes ? (
                        <button
                          onClick={() => setEditingNotes(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingNotes(false);
                              setManagerNotes(coaching.managerNotes || '');
                            }}
                            className="text-sm text-slate-600 hover:text-slate-700 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveManagerNotes}
                            disabled={savingNotes}
                            className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                          >
                            <Save size={14} />
                            {savingNotes ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingNotes ? (
                      <textarea
                        value={managerNotes}
                        onChange={(e) => setManagerNotes(e.target.value)}
                        rows={4}
                        placeholder="Add your coaching notes for this agent..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    ) : (
                      <div className="bg-white border-2 border-slate-300 rounded-lg p-4 min-h-[80px]">
                        <p className="text-sm text-slate-900 font-semibold whitespace-pre-wrap">
                          {coaching.managerNotes || 'No manager notes added yet. Click Edit to add notes.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-900 font-semibold text-center">
                      🕒 Generated on {new Date(coaching.generatedAt).toLocaleString()}
                      {coaching.lastModified && coaching.lastModified !== coaching.generatedAt && (
                        <> • Last modified {new Date(coaching.lastModified).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb size={40} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Coaching Recommendations Yet</h3>
                  <p className="text-slate-900 font-semibold mb-6 max-w-md mx-auto">
                    Click "Generate Coaching" to analyze this call and get AI-powered coaching recommendations for the agent.
                  </p>
                  <button
                    onClick={handleGenerateCoaching}
                    disabled={generatingCoaching}
                    className="btn-enhanced btn-primary-enhanced inline-flex items-center gap-2"
                  >
                    {generatingCoaching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing Call...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Generate AI Coaching
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Trimmer Modal */}
      {showTrimmer && (
        <AudioTrimmer 
          callId={call._id} 
          callName={call.callId} 
          onClose={() => setShowTrimmer(false)} 
        />
      )}
    </div>
  );
};

export default CallDetails;
