import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { callService, reportService } from '../services/apiService';
import { Phone, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [callsResponse, analyticsResponse] = await Promise.all([
        callService.getCalls({ limit: 5, status: 'completed' }),
        reportService.getAnalyticsSummary({}).catch(() => ({ data: null })),
      ]);

      setRecentCalls(callsResponse.data);
      setStats(analyticsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.overview?.totalCalls || 0}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <Phone className="text-primary-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Quality Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.overview?.avgQualityScore?.toFixed(1) || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Compliance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.overview?.avgComplianceScore?.toFixed(1) || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CheckCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Violations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.compliance?.totalViolations || 0}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Calls</h2>
        
        {recentCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No calls found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Call ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Quality</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Compliance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{call.callId}</td>
                    <td className="py-3 px-4 text-sm">{call.agentName}</td>
                    <td className="py-3 px-4 text-sm">{call.campaign}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
                        {call.qualityScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
                        {call.complianceScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        call.status === 'completed' ? 'badge-success' :
                        call.status === 'processing' ? 'badge-info' :
                        call.status === 'failed' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
