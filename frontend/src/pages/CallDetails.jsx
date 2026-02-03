import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callService, reportService } from '../services/apiService';
import { 
  ArrowLeft, Download, Play, Pause, AlertTriangle, CheckCircle, 
  X, Phone, User, Calendar, Clock, Hash, TrendingUp, TrendingDown,
  Shield, Award, MessageSquare, Volume2, FileText, BrainCircuit,
  Brain, Languages, Briefcase, MessageCircle, PhoneOff
} from 'lucide-react';

const CallDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);

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
    } catch (error) {
      console.error('Error fetching call details:', error);
    } finally {
      setLoading(false);
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
        <p className="text-slate-600 font-medium">Loading call details...</p>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="text-slate-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Call Not Found</h2>
        <p className="text-slate-600 mb-6">The call record you're looking for doesn't exist or has been removed.</p>
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
              <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-mono">
                {call.callId}
              </span>
            </h1>
            <p className="text-slate-600 flex items-center gap-2 text-sm mt-1">
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
                <p className="text-sm text-slate-600">
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
                <p className="text-sm text-slate-600">
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

      {/* Quality Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare size={24} />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              call.sentiment === 'positive' ? 'bg-green-100 text-green-800 border-green-200' :
              call.sentiment === 'negative' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {call.sentiment}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1 capitalize">{call.sentiment}</div>
          <div className="text-sm font-medium text-slate-500">Overall Sentiment</div>
        </div>

        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform duration-300">
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
          <div className="text-sm font-medium text-slate-500">Duration</div>
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
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Agent</div>
                  <div className="font-semibold text-slate-900">{call.agentName}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Customer</div>
                  <div className="font-semibold text-slate-900">{call.customerName || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Hash size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Campaign</div>
                  <div className="font-semibold text-slate-900">{call.campaign}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Date & Time</div>
                  <div className="font-semibold text-slate-900">
                    {new Date(call.callDate).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="card-enhanced p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Volume2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Audio Recording</h2>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <audio
                controls
                className="w-full"
                src={callService.getCallAudio(call._id)}
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
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

          {/* AI Quality Analysis */}
          {call.qualityMetrics?.aiFactors && (
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
                  communication quality, and compliance. Hover over each factor below to learn what it measures.
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
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        Customer Tone
                        <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-600">{call.qualityMetrics.aiDetails?.customer_tone || 'N/A'}</div>
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
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        Language Quality
                        <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-600">{call.qualityMetrics.aiDetails?.detected_language || 'N/A'}</div>
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
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        Agent Professionalism
                        <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-600">
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
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        Customer Communication
                        <span className="text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full cursor-help">?</span>
                      </div>
                      <div className="text-sm text-slate-600">{call.qualityMetrics.aiDetails?.customer_style || 'N/A'}</div>
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
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          Abusive Language
                          <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full cursor-help">!</span>
                        </div>
                        <div className="text-sm text-slate-600">
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
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          Do Not Call Request
                          <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full cursor-help">!</span>
                        </div>
                        <div className="text-sm text-slate-600">Customer opted out</div>
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
        </div>
      </div>
    </div>
  );
};

export default CallDetails;
