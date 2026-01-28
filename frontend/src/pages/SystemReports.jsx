import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Activity,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportService } from '../services/apiService';

const SystemReports = () => {
  const [systemSummary, setSystemSummary] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const [summaryRes, activityRes, subscriptionRes] = await Promise.all([
        reportService.getSystemSummary(),
        reportService.getUserActivityReport(),
        reportService.getSubscriptionAnalytics()
      ]);

      setSystemSummary(summaryRes.data);
      setUserActivity(activityRes.data);
      setSubscriptionAnalytics(subscriptionRes.data);
    } catch (error) {
      toast.error('Failed to load system reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">System Reports</h1>
        </div>
        <p className="text-slate-600">Comprehensive analytics and system insights</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              User Activity
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Subscriptions
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchAllReports}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => exportReport({
                systemSummary,
                userActivity,
                subscriptionAnalytics,
                generatedAt: new Date()
              }, 'system-reports')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && systemSummary && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{systemSummary.users.total}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {systemSummary.users.active} active
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Calls</p>
                  <p className="text-3xl font-bold text-slate-900">{systemSummary.calls.total}</p>
                  <p className="text-sm text-blue-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {systemSummary.calls.completionRate}% completed
                  </p>
                </div>
                <Phone className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Sales Records</p>
                  <p className="text-3xl font-bold text-slate-900">{systemSummary.sales.totalRecords}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${systemSummary.sales.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Recent Activity</p>
                  <p className="text-3xl font-bold text-slate-900">{systemSummary.activity.recentLogins}</p>
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Last 30 days
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* User Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">User Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{systemSummary.users.byRole.admin}</p>
                <p className="text-sm text-slate-600">Administrators</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{systemSummary.users.byRole.user}</p>
                <p className="text-sm text-slate-600">Regular Users</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{systemSummary.users.inactive}</p>
                <p className="text-sm text-slate-600">Inactive Users</p>
              </div>
            </div>
          </div>

          {/* Subscription Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription Overview</h3>
            <div className="space-y-4">
              {systemSummary.subscriptions.byPlan.map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{plan._id}</p>
                    <p className="text-sm text-slate-600">{plan.count} users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{plan.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Activity Tab */}
      {activeTab === 'users' && userActivity && (
        <div className="space-y-6">
          {/* Most Active Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Most Active Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Activity Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {userActivity.mostActiveUsers.map((user, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{user.userName}</p>
                          <p className="text-sm text-slate-500">{user.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.userRole === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.userRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">{user.activityCount}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Activity Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Activity Summary</h3>
            <div className="space-y-3">
              {userActivity.dailyActivity.slice(0, 14).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{activity._id.action}</p>
                    <p className="text-sm text-slate-600">{activity._id.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{activity.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && subscriptionAnalytics && (
        <div className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-slate-900">${subscriptionAnalytics.revenue.totalMonthly}</p>
                  <p className="text-sm text-green-600">USD</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{subscriptionAnalytics.conversionMetrics.conversionRate}%</p>
                  <p className="text-sm text-blue-600">Trial to Paid</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Churn Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{subscriptionAnalytics.churn.churnRate}%</p>
                  <p className="text-sm text-red-600">Cancelled/Expired</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription Plans</h3>
            <div className="space-y-4">
              {subscriptionAnalytics.revenue.byPlan.map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 capitalize">{plan.plan}</p>
                    <p className="text-sm text-slate-600">${plan.amount}/month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{plan.users}</p>
                    <p className="text-sm text-slate-600">active users</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Subscriptions</h3>
            <div className="space-y-3">
              {subscriptionAnalytics.recentSubscriptions.slice(0, 10).map((subscription, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{subscription.name}</p>
                    <p className="text-sm text-slate-600">{subscription.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 capitalize">{subscription.subscription.plan}</p>
                    <p className="text-sm text-green-600">{new Date(subscription.subscription.currentPeriodStart).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>Report generated on {new Date().toLocaleString()}</p>
        <p>Data covers the last 30 days where applicable</p>
      </div>
    </div>
  );
};

export default SystemReports;