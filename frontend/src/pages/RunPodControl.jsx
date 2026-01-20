import { useState, useEffect } from 'react';
import { Power, PowerOff, RefreshCw, Loader2, Server, DollarSign, Clock, Cpu, HardDrive, Activity, PlayCircle, StopCircle } from 'lucide-react';
import apiService from '../services/apiService';

const RunPodControl = () => {
  const [podStatus, setPodStatus] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [availablePods, setAvailablePods] = useState([]);
  const [selectedPodId, setSelectedPodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatuses();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatuses = async () => {
    try {
      setError(null);
      const [podResponse, serviceResponse, podsResponse, bestPodResponse] = await Promise.all([
        apiService.getRunPodStatus().catch(() => null),
        apiService.getServiceStatus().catch(() => null),
        apiService.listRunPods().catch(() => null),
        apiService.getBestPod().catch(() => null)
      ]);
      
      if (podResponse?.success) {
        setPodStatus(podResponse.data);
        setSelectedPodId(podResponse.data?.id);
      } else if (bestPodResponse?.success) {
        // If no current pod status, use the best available pod
        setSelectedPodId(bestPodResponse.data?.id);
      }
      
      if (serviceResponse?.success) {
        setServiceStatus(serviceResponse.data);
      }
      
      if (podsResponse?.success) {
        setAvailablePods(podsResponse.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPod = async () => {
    const podToStart = selectedPodId || 'best available pod';
    if (!confirm(`Start the GPU pod (${podToStart})? This will begin incurring costs (~$0.27/hr).`)) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.startRunPod(selectedPodId);
      if (response.success) {
        alert('✅ ' + response.message);
        setTimeout(fetchStatuses, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to start pod'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopPod = async () => {
    if (!confirm('Stop the GPU pod? The AI service will stop and active transcriptions may fail.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.stopRunPod();
      if (response.success) {
        alert('✅ ' + response.message);
        setTimeout(fetchStatuses, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to stop pod'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async () => {
    if (!confirm('Start the AI service? This will automatically clone the repository, install required libraries, and start the service if missing (may take 5-10 minutes). Make sure the pod is running first.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.startService();
      if (response.success) {
        alert('✅ ' + response.message);
        setTimeout(fetchStatuses, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to start service'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopService = async () => {
    if (!confirm('Stop the AI service? Active transcriptions will fail.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.stopService();
      if (response.success) {
        alert('✅ ' + response.message);
        setTimeout(fetchStatuses, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to stop service'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'text-green-600 bg-green-50';
      case 'stopped': return 'text-slate-600 bg-slate-50';
      case 'starting': return 'text-yellow-600 bg-yellow-50';
      case 'stopping': return 'text-orange-600 bg-orange-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-enhanced bg-white rounded-xl shadow-sm p-6 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Server className="w-6 h-6" />
              <h2 className="text-xl font-bold">RunPod Configuration Error</h2>
            </div>
            <p className="text-slate-600 mb-4">{error}</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">To enable RunPod control:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Get your RunPod API key from: https://www.runpod.io/console/user/settings</li>
                <li>Add to backend .env: RUNPOD_API_KEY=your_api_key</li>
                <li>Add to backend .env: RUNPOD_POD_ID=your_pod_id</li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GPU Pod Control</h1>
              <p className="text-slate-600 text-sm">Manage your AI service compute resources</p>
            </div>
          </div>
          <button
            onClick={fetchStatuses}
            disabled={loading}
            className="btn-enhanced flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Pod Selector */}
        <div className="card-enhanced bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pod Selection</h2>
                <p className="text-slate-600 text-sm">Choose which GPU pod to control</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPodId || ''}
                onChange={(e) => setSelectedPodId(e.target.value || null)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select a pod...</option>
                {availablePods.map((pod) => (
                  <option key={pod.id} value={pod.id}>
                    {pod.name || `Pod ${pod.id.slice(-8)}`} - {pod.gpu?.count}x {pod.gpu?.name} (${pod.costPerHr?.toFixed(2)}/hr)
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500">
                {availablePods.length} pod{availablePods.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        </div>

        {/* Pod Status Card */}
        <div className="card-enhanced bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">GPU Pod Status</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(podStatus?.desiredStatus)}`}>
              {podStatus?.desiredStatus || 'Unknown'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-medium">GPU</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {podStatus?.gpu?.count}x {podStatus?.gpu?.name || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Cost</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                ${podStatus?.costPerHr ? podStatus.costPerHr.toFixed(2) : '0.00'}/hr
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Uptime</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {formatUptime(podStatus?.uptimeSeconds)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-medium">Storage</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {podStatus?.resources?.storage || 'N/A'} GB
              </p>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Resources</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Memory:</span>
                <span className="ml-2 font-semibold text-slate-900">{podStatus?.resources?.memory || 'N/A'} GB</span>
              </div>
              <div>
                <span className="text-slate-600">vCPU:</span>
                <span className="ml-2 font-semibold text-slate-900">{podStatus?.resources?.vcpu || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-600">Runtime:</span>
                <span className="ml-2 font-semibold text-slate-900">{podStatus?.runtime || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {podStatus?.desiredStatus?.toLowerCase() === 'running' ? (
              <button
                onClick={handleStopPod}
                disabled={actionLoading}
                className="btn-enhanced flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PowerOff className="w-5 h-5" />
                    Stop Pod
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStartPod}
                disabled={actionLoading}
                className="btn-enhanced flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Power className="w-5 h-5" />
                    Start Pod
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* AI Service Status Card */}
        <div className="card-enhanced bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">AI Service Status</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              serviceStatus?.running ? 'text-green-600 bg-green-50' : 'text-slate-600 bg-slate-50'
            }`}>
              {serviceStatus?.running ? 'Running' : 'Stopped'}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">
                {serviceStatus?.running ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-semibold">Service is running with auto-restart</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div>🔄 Monitor: {serviceStatus?.monitor ? 'Active' : 'Inactive'}</div>
                      <div>🤖 AI Service: {serviceStatus?.service ? 'Running' : 'Stopped'}</div>
                      <div>📝 Auto-restart enabled (max 10 attempts)</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                      <span className="font-semibold">Service is stopped</span>
                    </div>
                    <div className="text-xs">Start the service to enable auto-restart protection</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Service Control Buttons */}
          <div className="flex gap-3">
            {serviceStatus?.running ? (
              <button
                onClick={handleStopService}
                disabled={actionLoading || podStatus?.desiredStatus?.toLowerCase() !== 'running'}
                className="btn-enhanced flex-1 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <StopCircle className="w-5 h-5" />
                    Stop Service
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStartService}
                disabled={actionLoading || podStatus?.desiredStatus?.toLowerCase() !== 'running'}
                className="btn-enhanced flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start Service
                  </>
                )}
              </button>
            )}
          </div>
          {podStatus?.desiredStatus?.toLowerCase() !== 'running' && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              ⚠️ Pod must be running to control the service
            </p>
          )}
        </div>

        {/* Info Card */}
        <div className="card-enhanced bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">🎯 How it works:</span>
            </p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li><strong>Select Pod:</strong> Choose from available running pods or let the system auto-select the best one</li>
              <li><strong>Start Pod:</strong> Powers on the GPU instance (~1-2 min)</li>
              <li><strong>Start Service:</strong> Automatically clones repository, installs dependencies, and launches the AI transcription service with auto-restart protection (~5-10 min first time)</li>
              <li><strong>Auto-Restart:</strong> Service automatically restarts if it crashes (up to 10 attempts)</li>
              <li><strong>Stop Service:</strong> Stops the transcription service and monitor (pod keeps running)</li>
              <li><strong>Stop Pod:</strong> Powers off the GPU (stops billing)</li>
            </ol>
            <p className="text-xs text-blue-900 mt-2">
              <span className="font-semibold">💡 Tip:</span> The service now runs with 24/7 monitoring. It will automatically restart if it crashes, ensuring continuous operation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunPodControl;
