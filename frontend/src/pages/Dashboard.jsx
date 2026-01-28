import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import SalesWidget from '../components/SalesWidget';
import { Phone, TrendingUp, AlertTriangle, CheckCircle, DollarSign, ShoppingCart, Eye, ArrowUp, ArrowDown, Users, Award, Upload, BarChart3, Activity, CreditCard, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
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
      const promises = [];

      // Only fetch call data for non-admin users
      if (user.role !== 'Admin') {
        promises.push(
          apiService.callService.getCalls({ limit: 10, status: 'completed', campaign })
        );
      } else {
        promises.push(Promise.resolve({ data: [] })); // Empty array for admin
      }

      promises.push(
      apiService.getAnalyticsSummary({ ...dateRange, campaign }).catch(() => ({ data: null })),
      apiService.getSalesSummary({ ...dateRange, campaign }).catch(() => ({ data: null })),
      }

      const [callsResponse, analyticsResponse, salesResponse, subscriptionResponse, pendingResponse] = await Promise.all(promises);

      setRecentCalls(callsResponse.data);
      setStats(analyticsResponse.data);
      setSalesData(salesResponse.data);
      setCurrentSubscription(subscriptionResponse.success ? subscriptionResponse.data : null);
      
      // Set pending payments for admin
      if (user.role === 'Admin' && pendingResponse) {
        setPendingPayments(pendingResponse.success ? pendingResponse.data : []);
      }
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

  const handleActivateSubscription = async (payment) => {
    const paymentMethod = prompt('Enter payment method (e.g., Bank Transfer, PayPal, Payoneer):', 'Bank Transfer');
    if (!paymentMethod) return;

    const notes = prompt('Add any notes about this payment (optional):', '');

    try {
      const response = await apiService.adminActivateSubscription(
        payment.userId,
        payment.requestedPlan,
        paymentMethod,
        notes
      );

      if (response.success) {
        alert(`✅ Subscription activated successfully!\n\nUser: ${response.data.userName}\nEmail: ${response.data.userEmail}\nPlan: ${response.data.plan}\nStatus: ${response.data.status}`);

        // Refresh pending payments
        const refreshResponse = await apiService.getPendingPayments();
        if (refreshResponse.success) {
          setPendingPayments(refreshResponse.data);
        }
      } else {
        alert('Error activating subscription: ' + response.message);
      }
    } catch (error) {
      alert('Error activating subscription. Please try again.');
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
      {currentSubscription && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {getPlanDisplayName(currentSubscription.plan)}
                </h3>
                <p className="text-sm text-slate-600">
                  Current subscription plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSubscription.status)}`}>
                {getStatusText(currentSubscription.status)}
              </span>
              {currentSubscription.status === 'trial' && currentSubscription.trialEndsAt && (
                <div className="text-right">
                  <p className="text-sm text-slate-600">Trial ends</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(currentSubscription.trialEndsAt).toLocaleDateString()}
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
          {user?.role === 'Admin' ? (
            <>
              <Link
                to="/app/users"
                className="quick-action-btn group"
              >
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-200">
                  <Users size={20} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">User Management</span>
              </Link>
              
              <div className="quick-action-btn group cursor-not-allowed opacity-50">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CreditCard size={20} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Payment Processing</span>
                <span className="text-xs text-slate-500 block">See Below</span>
              </div>
              
              <Link
                to="/app/reports"
                className="quick-action-btn group"
              >
                <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors duration-200">
                  <BarChart3 size={20} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">System Reports</span>
              </Link>
              
              <Link
                to="/subscription"
                className="quick-action-btn group"
              >
                <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors duration-200">
                  <Award size={20} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Manage Plan</span>
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Admin System Overview */}
      {user?.role === 'Admin' && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users Card */}
            <div className="kpi-card-enhanced group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="kpi-label-enhanced">Total Users</p>
                  <p className="kpi-value-enhanced">--</p>
                  <div className="kpi-change-enhanced kpi-change-neutral flex items-center gap-1.5 mt-3">
                    <Users size={14} />
                    <span>System users</span>
                  </div>
                </div>
                <div className="kpi-icon-enhanced kpi-icon-blue group-hover:scale-110 transition-transform duration-300">
                  <Users size={24} />
                </div>
              </div>
              <div className="kpi-progress-bar mt-4">
                <div className="kpi-progress-fill kpi-progress-blue" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Active Subscriptions Card */}
            <div className="kpi-card-enhanced group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="kpi-label-enhanced">Active Subscriptions</p>
                  <p className="kpi-value-enhanced">--</p>
                  <div className="kpi-change-enhanced kpi-change-positive flex items-center gap-1.5 mt-3">
                    <Award size={14} />
                    <span>Paid plans</span>
                  </div>
                </div>
                <div className="kpi-icon-enhanced kpi-icon-green group-hover:scale-110 transition-transform duration-300">
                  <Award size={24} />
                </div>
              </div>
              <div className="kpi-progress-bar mt-4">
                <div className="kpi-progress-fill kpi-progress-green" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Monthly Revenue Card */}
            <div className="kpi-card-enhanced group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="kpi-label-enhanced">Monthly Revenue</p>
                  <p className="kpi-value-enhanced">$--</p>
                  <div className="kpi-change-enhanced kpi-change-positive flex items-center gap-1.5 mt-3">
                    <TrendingUp size={14} />
                    <span>MRR</span>
                  </div>
                </div>
                <div className="kpi-icon-enhanced kpi-icon-purple group-hover:scale-110 transition-transform duration-300">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="kpi-progress-bar mt-4">
                <div className="kpi-progress-fill kpi-progress-purple" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Pending Payments Card */}
            <div className="kpi-card-enhanced group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="kpi-label-enhanced">Pending Payments</p>
                  <p className="kpi-value-enhanced">{pendingPayments.length}</p>
                  <div className="kpi-change-enhanced kpi-change-neutral flex items-center gap-1.5 mt-3">
                    <CreditCard size={14} />
                    <span>Awaiting activation</span>
                  </div>
                </div>
                <div className="kpi-icon-enhanced kpi-icon-orange group-hover:scale-110 transition-transform duration-300">
                  <CreditCard size={24} />
                </div>
              </div>
              <div className="kpi-progress-bar mt-4">
                <div className="kpi-progress-fill kpi-progress-orange" style={{ width: `${Math.min((pendingPayments.length / 10) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {stats && user?.role !== 'Admin' && (
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
      {user?.role !== 'Admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Widget - Today's Performance */}
          {['Manager', 'QA'].includes(user?.role) && (
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
      )}

      {/* Admin: Pending Payments Management */}
      {user?.role === 'Admin' && (
        <div className="card-enhanced animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md">
              <CreditCard size={20} className="text-white" />
            </div>
            <h3 className="section-header-enhanced mb-0">Subscription Management</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Manual Payment Mode Active</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Users requesting paid plans need manual activation after payment is received.
                    Use the tools below to manage subscription activations.
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Payments Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Pending Activation Requests</h4>
                  <p className="text-sm text-slate-600">Users waiting for subscription activation</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const response = await apiService.getPendingPayments();
                      if (response.success) {
                        setPendingPayments(response.data);
                      }
                    } catch (error) {
                      alert('Error loading pending payments.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="p-4">
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-slate-600">No pending payments to process</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPayments.map((payment) => (
                      <div key={payment.auditLogId} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-slate-900">{payment.userName}</h5>
                            <p className="text-sm text-slate-600">{payment.userEmail}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {payment.requestedPlan.toUpperCase()}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(payment.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActivateSubscription(payment)}
                            className="btn btn-primary text-sm flex items-center gap-2"
                          >
                            <CheckCircle size={14} />
                            Activate
                          </button>
                          <button
                            onClick={() => {
                              const details = `User: ${payment.userName} (${payment.userEmail})\nPlan: ${payment.requestedPlan}\nRequested: ${new Date(payment.requestedAt).toLocaleDateString()}`;
                              navigator.clipboard.writeText(details);
                              alert('User details copied to clipboard');
                            }}
                            className="btn btn-secondary text-sm"
                          >
                            Copy Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Calls Table */}
      {user?.role !== 'Admin' && (
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
      )}
    </div>
  );
};

export default Dashboard;
