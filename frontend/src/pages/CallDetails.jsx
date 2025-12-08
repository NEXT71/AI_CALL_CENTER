import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callService, reportService } from '../services/apiService';
import { ArrowLeft, Download, Play, Pause, AlertTriangle, CheckCircle, X } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Call not found</p>
        <button onClick={() => navigate('/calls')} className="btn btn-primary mt-4">
          Back to Calls
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/calls')}
            className="btn btn-secondary mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{call.callId}</h1>
            <p className="text-gray-600 mt-1">Call Details & Analysis</p>
          </div>
        </div>
        {report && (
          <button onClick={downloadReport} className="btn btn-primary">
            <Download size={20} className="mr-2" />
            Download Report
          </button>
        )}
      </div>

      {/* Call Info */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Call Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Agent</p>
            <p className="text-lg font-medium">{call.agentName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Customer</p>
            <p className="text-lg font-medium">{call.customerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Campaign</p>
            <p className="text-lg font-medium">{call.campaign}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-lg font-medium">
              {new Date(call.callDate).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-lg font-medium">
              {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`badge ${
              call.status === 'completed' ? 'badge-success' :
              call.status === 'processing' ? 'badge-info' :
              call.status === 'failed' ? 'badge-danger' :
              'badge-warning'
            }`}>
              {call.status}
            </span>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Quality Score</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{call.qualityScore}</p>
          <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
            {getScoreRating(call.qualityScore)}
          </span>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Compliance Score</p>
          <p className="text-4xl font-bold text-gray-900 mb-2">{call.complianceScore}</p>
          <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
            {getScoreRating(call.complianceScore)}
          </span>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-2">Sentiment</p>
          <p className="text-2xl font-bold text-gray-900 mb-2 capitalize">{call.sentiment}</p>
          <span className={`badge ${
            call.sentiment === 'positive' ? 'badge-success' :
            call.sentiment === 'negative' ? 'badge-danger' :
            'badge-info'
          }`}>
            {call.sentimentScore ? `${(call.sentimentScore * 100).toFixed(0)}% confidence` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Audio Player */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Audio Recording</h2>
        <audio
          controls
          className="w-full"
          src={callService.getCallAudio(call._id)}
        >
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Compliance Issues */}
      {(call.missingMandatoryPhrases.length > 0 || call.detectedForbiddenPhrases.length > 0) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance Issues</h2>
          
          {call.missingMandatoryPhrases.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <AlertTriangle size={20} className="text-yellow-600 mr-2" />
                Missing Mandatory Phrases ({call.missingMandatoryPhrases.length})
              </h3>
              <div className="space-y-2">
                {call.missingMandatoryPhrases.map((phrase, idx) => (
                  <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{phrase}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {call.detectedForbiddenPhrases.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <X size={20} className="text-red-600 mr-2" />
                Forbidden Phrases Detected ({call.detectedForbiddenPhrases.length})
              </h3>
              <div className="space-y-2">
                {call.detectedForbiddenPhrases.map((phrase, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{phrase}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quality Metrics */}
      {call.qualityMetrics && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Has Greeting</span>
              {call.qualityMetrics.hasGreeting ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <X className="text-red-600" size={20} />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Has Proper Closing</span>
              {call.qualityMetrics.hasProperClosing ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <X className="text-red-600" size={20} />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Agent Interruptions</span>
              <span className="font-medium">{call.qualityMetrics.agentInterruptionCount || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Avg Speech Rate</span>
              <span className="font-medium">{call.qualityMetrics.avgSpeechRate || 0} wpm</span>
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      {call.transcript && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transcript</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap">{call.transcript}</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
          <div className="space-y-3">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className={`border-l-4 p-4 rounded-r-lg ${
                rec.priority === 'Critical' ? 'border-red-500 bg-red-50' :
                rec.priority === 'High' ? 'border-orange-500 bg-orange-50' :
                rec.priority === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-gray-600 mr-2">{rec.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.priority === 'Critical' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'High' ? 'bg-orange-200 text-orange-800' :
                        rec.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{rec.issue}</p>
                    <p className="text-sm text-gray-700">{rec.suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDetails;
