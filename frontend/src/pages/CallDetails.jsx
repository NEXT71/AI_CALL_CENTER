import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callService, reportService } from '../services/apiService';
import { 
  ArrowLeft, Download, Play, Pause, AlertTriangle, CheckCircle, 
  X, Phone, User, Calendar, Clock, Hash, TrendingUp, TrendingDown,
  Shield, Award, MessageSquare, Volume2
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
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
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
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <p className="body-text text-slate-600">Call not found</p>
        <button onClick={() => navigate('/app/calls')} className="btn btn-primary mt-4">
          Back to Calls
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/calls')}
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="page-title">Call Details</h1>
            <p className="page-subtitle">{call.callId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {report && (
            <button onClick={downloadReport} className="btn btn-secondary">
              <Download size={18} />
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* Quality Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-container icon-container-blue">
              <Award size={20} />
            </div>
            <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
              {getScoreRating(call.qualityScore)}
            </span>
          </div>
          <div className="kpi-value">{call.qualityScore}</div>
          <div className="kpi-label">Quality Score</div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-container icon-container-green">
              <Shield size={20} />
            </div>
            <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
              {getScoreRating(call.complianceScore)}
            </span>
          </div>
          <div className="kpi-value">{call.complianceScore}</div>
          <div className="kpi-label">Compliance</div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-container icon-container-purple">
              <MessageSquare size={20} />
            </div>
            <span className={`badge ${
              call.sentiment === 'positive' ? 'badge-success' :
              call.sentiment === 'negative' ? 'badge-danger' :
              'badge-info'
            }`}>
              {call.sentiment}
            </span>
          </div>
          <div className="kpi-value text-2xl capitalize">{call.sentiment}</div>
          <div className="kpi-label">Sentiment</div>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <div className="icon-container icon-container-slate">
              <Clock size={20} />
            </div>
            <span className={`badge ${
              call.status === 'completed' ? 'badge-success' :
              call.status === 'processing' ? 'badge-info' :
              call.status === 'failed' ? 'badge-danger' :
              'badge-warning'
            }`}>
              {call.status}
            </span>
          </div>
          <div className="kpi-value text-2xl">
            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
          </div>
          <div className="kpi-label">Duration</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Call Info & Audio */}
        <div className="lg:col-span-1 space-y-6">
          {/* Call Information */}
          <div className="card">
            <h2 className="heading-3 mb-4">Call Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="icon-container icon-container-blue flex-shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <div className="caption-text">Agent</div>
                  <div className="font-medium text-slate-900">{call.agentName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="icon-container icon-container-green flex-shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="caption-text">Customer</div>
                  <div className="font-medium text-slate-900">{call.customerName || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="icon-container icon-container-purple flex-shrink-0">
                  <Hash size={18} />
                </div>
                <div>
                  <div className="caption-text">Campaign</div>
                  <div className="font-medium text-slate-900">{call.campaign}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="icon-container icon-container-amber flex-shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="caption-text">Date & Time</div>
                  <div className="font-medium text-slate-900">
                    {new Date(call.callDate).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="icon-container icon-container-blue">
                <Volume2 size={18} />
              </div>
              <h2 className="heading-4">Audio Recording</h2>
            </div>
            <audio
              controls
              className="w-full"
              src={callService.getCallAudio(call._id)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Quality Metrics */}
          {call.qualityMetrics && (
            <div className="card">
              <h2 className="heading-3 mb-4">Quality Metrics</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="body-text">Has Greeting</span>
                  {call.qualityMetrics.hasGreeting ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <X className="text-red-600" size={20} />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="body-text">Proper Closing</span>
                  {call.qualityMetrics.hasProperClosing ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <X className="text-red-600" size={20} />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="body-text">Interruptions</span>
                  <span className="font-semibold text-slate-900">{call.qualityMetrics.agentInterruptionCount || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="body-text">Speech Rate</span>
                  <span className="font-semibold text-slate-900">{call.qualityMetrics.avgSpeechRate || 0} wpm</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Transcript & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Issues */}
          {(call.missingMandatoryPhrases.length > 0 || call.detectedForbiddenPhrases.length > 0) && (
            <div className="card">
              <h2 className="heading-3 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-600" size={24} />
                Compliance Issues
              </h2>
              
              {call.missingMandatoryPhrases.length > 0 && (
                <div className="mb-4">
                  <h3 className="heading-4 mb-3 text-amber-700">
                    Missing Mandatory Phrases ({call.missingMandatoryPhrases.length})
                  </h3>
                  <div className="space-y-2">
                    {call.missingMandatoryPhrases.map((phrase, idx) => (
                      <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="body-text text-amber-900">{phrase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {call.detectedForbiddenPhrases.length > 0 && (
                <div>
                  <h3 className="heading-4 mb-3 text-red-700">
                    Forbidden Phrases Detected ({call.detectedForbiddenPhrases.length})
                  </h3>
                  <div className="space-y-2">
                    {call.detectedForbiddenPhrases.map((phrase, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <X size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="body-text text-red-900">{phrase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transcript */}
          {call.transcript && (
            <div className="card">
              <h2 className="heading-3 mb-4">Transcript</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 max-h-96 overflow-y-auto">
                <p className="body-text text-slate-700 whitespace-pre-wrap leading-relaxed">{call.transcript}</p>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {report?.recommendations && report.recommendations.length > 0 && (
            <div className="card">
              <h2 className="heading-3 mb-4">AI Recommendations</h2>
              <div className="space-y-3">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className={`border-l-4 p-4 rounded-r-lg ${
                    rec.priority === 'Critical' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'High' ? 'border-orange-500 bg-orange-50' :
                    rec.priority === 'Medium' ? 'border-amber-500 bg-amber-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="caption-text font-semibold uppercase">{rec.category}</span>
                        <span className={`badge badge-sm ${
                          rec.priority === 'Critical' ? 'badge-danger' :
                          rec.priority === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          rec.priority === 'Medium' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900 mb-1.5">{rec.issue}</p>
                    <p className="body-text text-slate-700">{rec.suggestion}</p>
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
