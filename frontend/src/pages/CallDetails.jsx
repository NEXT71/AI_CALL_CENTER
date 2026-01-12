import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callService, reportService } from '../services/apiService';
import { 
  ArrowLeft, Download, Play, Pause, AlertTriangle, CheckCircle, 
  X, Phone, User, Calendar, Clock, Hash, TrendingUp, TrendingDown,
  Shield, Award, MessageSquare, Volume2, FileText, BrainCircuit
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

      {/* Quality Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Award size={24} />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreBadge(call.qualityScore)}`}>
              {getScoreRating(call.qualityScore)}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{call.qualityScore}%</div>
          <div className="text-sm font-medium text-slate-500">Quality Score</div>
        </div>

        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform duration-300">
              <Shield size={24} />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreBadge(call.complianceScore)}`}>
              {getScoreRating(call.complianceScore)}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{call.complianceScore}%</div>
          <div className="text-sm font-medium text-slate-500">Compliance Score</div>
        </div>

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
            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
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

          {/* Quality Metrics */}
          {call.qualityMetrics && (
            <div className="card-enhanced p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award size={20} className="text-blue-600" />
                Quality Metrics
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <span className="font-medium text-slate-700">Has Greeting</span>
                  {call.qualityMetrics.hasGreeting ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle size={16} />
                      <span>Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                      <X size={16} />
                      <span>No</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <span className="font-medium text-slate-700">Proper Closing</span>
                  {call.qualityMetrics.hasProperClosing ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle size={16} />
                      <span>Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                      <X size={16} />
                      <span>No</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <span className="font-medium text-slate-700">Interruptions</span>
                  <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-200">
                    {call.qualityMetrics.agentInterruptionCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <span className="font-medium text-slate-700">Speech Rate</span>
                  <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-200">
                    {call.qualityMetrics.avgSpeechRate || 0} wpm
                  </span>
                </div>
              </div>
            </div>
          )}
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

          {/* AI Recommendations */}
          {report?.recommendations && report.recommendations.length > 0 && (
            <div className="card-enhanced p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BrainCircuit size={20} className="text-purple-600" />
                AI Coaching Recommendations
              </h2>
              <div className="space-y-4">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className={`border-l-4 p-5 rounded-r-xl shadow-sm transition-all hover:shadow-md ${
                    rec.priority === 'Critical' ? 'border-red-500 bg-red-50/50' :
                    rec.priority === 'High' ? 'border-orange-500 bg-orange-50/50' :
                    rec.priority === 'Medium' ? 'border-amber-500 bg-amber-50/50' :
                    'border-blue-500 bg-blue-50/50'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                          {rec.category}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          rec.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          rec.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 mb-2 text-lg">{rec.issue}</p>
                    <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5">
                        <CheckCircle size={14} />
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{rec.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDetails;
