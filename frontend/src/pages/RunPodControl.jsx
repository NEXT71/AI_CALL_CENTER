import { useState, useEffect } from 'react';
import { Power, PowerOff, RefreshCw, Loader2, Server, DollarSign, Clock, Cpu, HardDrive, Activity } from 'lucide-react';
import apiService from '../services/apiService';

const RunPodControl = () => {
  const [podStatus, setPodStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPodStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPodStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPodStatus = async () => {
    try {
      setError(null);
      const response = await apiService.getRunPodStatus();
      if (response.success) {
        setPodStatus(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pod status');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!confirm('Start the GPU pod? This will begin incurring costs.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.startRunPod();
      if (response.success) {
        alert('✅ ' + response.message);
        // Wait 2 seconds then refresh status
        setTimeout(fetchPodStatus, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to start pod'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop the GPU pod? Active transcriptions may fail.')) return;
    
    try {
      setActionLoading(true);
      const response = await apiService.stopRunPod();
      if (response.success) {
        alert('✅ ' + response.message);
        setTimeout(fetchPodStatus, 2000);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to stop pod'));
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
            onClick={fetchPodStatus}
            disabled={loading}
            className="btn-enhanced flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status Card */}
        <div className="card-enhanced bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">{podStatus?.name || 'GPU Pod'}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(podStatus?.status)}`}>
              {podStatus?.status || 'Unknown'}
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
            {podStatus?.status?.toLowerCase() === 'running' ? (
              <button
                onClick={handleStop}
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
                onClick={handleStart}
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

        {/* Info Card */}
        <div className="card-enhanced bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">💡 Cost Optimization:</span> Stop the pod when not processing calls to save costs. 
            Starting takes 1-2 minutes. You'll only be charged for running time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RunPodControl;
