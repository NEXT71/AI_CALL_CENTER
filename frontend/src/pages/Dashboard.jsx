import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callService, reportService } from '../services/apiService';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import SalesWidget from '../components/SalesWidget';
import { Phone, TrendingUp, AlertTriangle, CheckCircle, DollarSign, ShoppingCart, Eye, ArrowUp, ArrowDown, Users, Award, Upload, BarChart3, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [dateRange, campaign, user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [callsResponse, analyticsResponse, salesResponse] = await Promise.all([
        callService.getCalls({ limit: 10, status: 'completed', campaign }),
        reportService.getAnalyticsSummary(dateRange, campaign).catch(() => ({ data: null })),
        reportService.getSalesSummary(dateRange, campaign).catch(() => ({ data: null })),
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlanDisplayName = (plan) => {
    const planNames = {
      'starter': 'Starter Plan',
      'professional': 'Professional Plan',
      'enterprise': 'Enterprise Plan'
    };
    return planNames[plan] || 'Free Trial';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trial': return 'Trial';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
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

      {/* Current Plan Display */}
      {user?.subscription && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {getPlanDisplayName(user.subscription.plan)}
                </h3>
                <p className="text-sm text-slate-600">
                  Current subscription plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.subscription.status)}`}>
                {getStatusText(user.subscription.status)}
              </span>
              {user.subscription.status === 'trial' && user.subscription.trialEndsAt && (
                <div className="text-right">
                  <p className="text-sm text-slate-600">Trial ends</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(user.subscription.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              <Link
                to="/subscription"
                className="btn btn-primary text-sm px-4 py-2"
              >
                Manage Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Page Header with Date Filter */}
      <div className="page-header-enhanced animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Monitor performance and quality metrics across your organization
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
          <div className="filter-panel-enhanced">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input-enhanced"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input-enhanced"
                />
              </div>
              <select
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="select-enhanced"
              >
                <option value="">All Campaigns</option>
                <option value="ACA">ACA</option>
                <option value="Medicare">Medicare</option>
                <option value="Final Expense">Final Expense</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/app/upload"
            className="quick-action-btn group"
          >
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-200">
              <Upload size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Upload Call</span>
          </Link>
          
          <Link
            to="/app/sales-data"
            className="quick-action-btn group"
          >
            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors duration-200">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Add Sales</span>
          </Link>
          
          <Link
            to="/app/calls"
            className="quick-action-btn group"
          >
            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors duration-200">
              <Phone size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">View Calls</span>
          </Link>
          
          <Link
            to="/app/analytics"
            className="quick-action-btn group"
          >
            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors duration-200">
              <BarChart3 size={20} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Calls Card */}
          <div className="kpi-card-enhanced group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label-enhanced">Total Calls</p>
                <p className="kpi-value-enhanced">{stats.overview?.totalCalls?.toLocaleString() || 0}</p>
                <div className="kpi-change-enhanced kpi-change-positive flex items-center gap-1.5 mt-3">
                  <ArrowUp size={14} className="animate-bounce" />
                  <span>12.5% from last period</span>
                </div>
              </div>
              <div className="kpi-icon-enhanced kpi-icon-blue group-hover:scale-110 transition-transform duration-300">
                <Phone size={24} />
              </div>
            </div>
            <div className="kpi-progress-bar mt-4">
              <div className="kpi-progress-fill kpi-progress-blue" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Sales Conversion Card */}
          <div className="kpi-card-enhanced group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="kpi-label-enhanced">Sales Conversion</p>
                <p className="kpi-value-enhanced">{salesData?.totalSales || 0}</p>
                <div className="kpi-change-enhanced kpi-change-neutral flex items-center gap-1.5 mt-3">
                  <ShoppingCart size={14} />
                  <span>{salesData?.conversionRate?.toFixed(1) || 0}% conversion</span>
                </div>
              </div>
              <div className="kpi-icon-enhanced kpi-icon-orange group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart size={24} />
              </div>
            </div>
            <div className="kpi-progress-bar mt-4">
              <div className="kpi-progress-fill kpi-progress-orange" style={{ width: `${Math.min((salesData?.conversionRate || 0) * 10, 100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Performance & Agent Leaderboard & Sales Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Widget - Today's Performance */}
        {['Admin', 'Manager', 'QA'].includes(user?.role) && (
          <div className="h-full">
            <SalesWidget />
          </div>
        )}

        {salesData && salesData.totalSales > 0 && (
          <>
            {/* Sales Metrics */}
            <div className={`${['Admin', 'Manager', 'QA'].includes(user?.role) ? 'lg:col-span-2' : 'lg:col-span-3'} card-enhanced`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h3 className="section-header-enhanced mb-0">Sales Performance</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${salesData.totalRevenue?.toLocaleString() || 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                    <ArrowUp size={12} />
                    <span>8.2% vs last week</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-sm font-medium text-slate-500 mb-1">Avg Sale Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${salesData.avgSaleAmount?.toFixed(2) || 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                    <ArrowUp size={12} />
                    <span>5.1% vs last week</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <p className="text-sm font-medium text-slate-500 mb-1">Quality Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {salesData.avgQualityScore?.toFixed(1) || 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
                    <span>Sale calls avg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card-enhanced">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
                  <Activity size={20} className="text-white" />
                </div>
                <h3 className="section-header-enhanced mb-0">Quick Stats</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    <span className="text-sm font-medium text-slate-700">Completed Calls</span>
                  </div>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">{stats?.overview?.totalCalls || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                    <span className="text-sm font-medium text-slate-700">Compliance Violations</span>
                  </div>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">{stats?.compliance?.totalViolations || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700">Processing</span>
                  </div>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">0</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Calls Table */}
      <div className="card-enhanced animate-fade-in">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Phone size={20} className="text-white" />
            </div>
            <div>
              <h3 className="section-header-enhanced">Recent Calls</h3>
              <p className="text-sm text-slate-500">Latest call analysis results</p>
            </div>
          </div>
          <Link to="/app/calls" className="btn-enhanced btn-primary-enhanced flex items-center gap-2 group">
            <span>View All Calls</span>
            <ArrowUp size={16} className="group-hover:translate-x-1 transition-transform duration-200 rotate-90" />
          </Link>
        </div>

        {recentCalls.length === 0 ? (
          <div className="empty-state-enhanced">
            <div className="empty-state-icon">
              <Phone className="w-16 h-16 text-slate-300" />
            </div>
            <h4 className="empty-state-title">No calls found</h4>
            <p className="empty-state-description">
              Upload your first call recording to get started with AI-powered analysis.
            </p>
            <Link to="/app/upload" className="btn-enhanced btn-primary-enhanced mt-4">
              Upload Call Recording
            </Link>
          </div>
        ) : (
          <div className="table-container-enhanced-compact">
            <div className="overflow-x-auto">
              <table className="table-enhanced-compact">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th>Call ID</th>
                    <th>Agent</th>
                    <th>Customer</th>
                    <th>Campaign</th>
                    <th>Date & Time</th>
                    <th>Quality</th>
                    <th>Compliance</th>
                    <th>Status</th>
                    <th className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.slice(0, 5).map((call, index) => (
                    <tr key={call._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-all duration-200`}>
                      <td className="font-mono text-xs font-semibold text-slate-900">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                          {call.callId}
                        </span>
                      </td>
                      <td className="font-medium text-slate-900">{call.agentName}</td>
                      <td className="text-slate-600">{call.customerName || 'Unknown'}</td>
                      <td className="text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {call.campaign}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs">
                        <div className="font-medium">{formatDate(call.callDate)}</div>
                        <div className="text-slate-400">{formatTime(call.callDate)}</div>
                      </td>
                      <td>
                        {call.qualityScore !== null && call.qualityScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              call.qualityScore >= 80 ? 'bg-green-500' :
                              call.qualityScore >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className={`badge-compact ${
                              call.qualityScore >= 80 ? 'badge-success' :
                              call.qualityScore >= 60 ? 'badge-warning' :
                              'badge-danger'
                            }`}>
                              {call.qualityScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td>
                        {call.complianceScore !== null && call.complianceScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              call.complianceScore >= 80 ? 'bg-green-500' :
                              call.complianceScore >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <span className={`badge-compact ${
                              call.complianceScore >= 80 ? 'badge-success' :
                              call.complianceScore >= 60 ? 'badge-warning' :
                              'badge-danger'
                            }`}>
                              {call.complianceScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          call.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            call.status === 'completed' ? 'bg-green-500' :
                            call.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                            call.status === 'failed' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          {call.status}
                        </span>
                      </td>
                      <td className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent pl-4">
                        <Link
                          to={`/app/calls/${call._id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                        >
                          <Eye size={14} className="group-hover:scale-110 transition-transform" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
