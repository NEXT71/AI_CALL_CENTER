import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callService, reportService } from '../services/apiService';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { Phone, TrendingUp, AlertTriangle, CheckCircle, DollarSign, ShoppingCart, Eye, ArrowUp, ArrowDown, Users, Award } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [dateRange, user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [callsResponse, analyticsResponse, salesResponse] = await Promise.all([
        callService.getCalls({ limit: 10, status: 'completed' }),
        reportService.getAnalyticsSummary(dateRange).catch(() => ({ data: null })),
        reportService.getSalesSummary(dateRange).catch(() => ({ data: null })),
      ]);

      setRecentCalls(callsResponse.data);
      setStats(analyticsResponse.data);
      setSalesData(salesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score) => {
    if (!score) return 'badge-neutral';
    if (score >= 90) return 'badge-score-high';
    if (score >= 75) return 'badge-score-medium';
    if (score >= 60) return 'badge-score-low';
    return 'badge-score-critical';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      {/* Page Header with Date Filter */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Monitor performance and quality metrics across your organization</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input"
              style={{ width: '150px' }}
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input"
              style={{ width: '150px' }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label">Total Calls</p>
                <p className="kpi-value">{stats.overview?.totalCalls?.toLocaleString() || 0}</p>
                <p className="kpi-change kpi-change-positive flex items-center gap-1 mt-2">
                  <ArrowUp size={12} />
                  <span>12.5% from last period</span>
                </p>
              </div>
              <div className="icon-container icon-container-blue">
                <Phone size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label">Avg Quality Score</p>
                <p className="kpi-value">{stats.overview?.avgQualityScore?.toFixed(1) || '0.0'}</p>
                <p className="kpi-change kpi-change-positive flex items-center gap-1 mt-2">
                  <ArrowUp size={12} />
                  <span>3.2% improvement</span>
                </p>
              </div>
              <div className="icon-container icon-container-green">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label">Compliance Score</p>
                <p className="kpi-value">{stats.overview?.avgComplianceScore?.toFixed(1) || '0.0'}</p>
                <p className="kpi-change kpi-change-positive flex items-center gap-1 mt-2">
                  <ArrowUp size={12} />
                  <span>98% adherence</span>
                </p>
              </div>
              <div className="icon-container icon-container-blue">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label">Sales Conversion</p>
                <p className="kpi-value">{salesData?.totalSales || 0}</p>
                <p className="kpi-change kpi-change-neutral flex items-center gap-1 mt-2 text-slate-600">
                  <span>{salesData?.conversionRate?.toFixed(1) || 0}% conversion</span>
                </p>
              </div>
              <div className="icon-container icon-container-green">
                <ShoppingCart size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Performance & Agent Leaderboard */}
      {salesData && salesData.totalSales > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sales Metrics */}
          <div className="lg:col-span-2 card">
            <h3 className="section-header">Sales Performance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="caption-text">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${salesData.totalRevenue?.toLocaleString() || 0}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <ArrowUp size={12} />
                  <span>8.2%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="caption-text">Avg Sale Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${salesData.avgSaleAmount?.toFixed(2) || 0}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <ArrowUp size={12} />
                  <span>5.1%</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="caption-text">Quality Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {salesData.avgQualityScore?.toFixed(1) || 0}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Sale calls avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="section-header">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="status-dot status-dot-success"></div>
                  <span className="body-text">Completed</span>
                </div>
                <span className="font-semibold text-slate-900">{stats?.overview?.totalCalls || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="status-dot status-dot-warning"></div>
                  <span className="body-text">Violations</span>
                </div>
                <span className="font-semibold text-slate-900">{stats?.compliance?.totalViolations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="status-dot status-dot-info"></div>
                  <span className="body-text">Processing</span>
                </div>
                <span className="font-semibold text-slate-900">0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls Table */}
      <div className="card-compact">
        <div className="flex items-center justify-between mb-5 px-2">
          <h3 className="section-header mb-0">Recent Calls</h3>
          <Link to="/calls" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View all calls
            <ArrowUp size={14} className="rotate-90" />
          </Link>
        </div>
        
        {recentCalls.length === 0 ? (
          <div className="text-center py-16">
            <Phone className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="body-text">No calls found</p>
          </div>
        ) : (
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Agent</th>
                  <th>Customer</th>
                  <th>Campaign</th>
                  <th>Date</th>
                  <th>Quality</th>
                  <th>Compliance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call._id}>
                    <td className="font-mono text-xs font-semibold text-slate-900">{call.callId}</td>
                    <td className="font-medium text-slate-900">{call.agentName}</td>
                    <td className="text-slate-600">{call.customerName || '-'}</td>
                    <td className="text-slate-600">{call.campaign}</td>
                    <td className="text-slate-500 text-xs">{formatDate(call.callDate)}</td>
                    <td>
                      <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
                        {call.qualityScore || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
                        {call.complianceScore || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        call.status === 'completed' ? 'badge-success' :
                        call.status === 'processing' ? 'badge-info' :
                        call.status === 'failed' ? 'badge-danger' :
                        'badge-neutral'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/calls/${call._id}`}
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 text-sm font-medium"
                      >
                        <Eye size={16} />
                        View
                      </Link>
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
