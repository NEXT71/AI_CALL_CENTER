import { useState, useEffect } from 'react';
import { reportService } from '../services/apiService';
import { 
  TrendingUp, TrendingDown, Activity, Calendar, Filter, 
  Phone, Award, Shield, Clock, BarChart2, PieChart, AlertTriangle,
  CheckCircle, XCircle, MinusCircle
} from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, campaign]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await reportService.getAnalyticsSummary(dateRange, campaign);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">Loading analytics data...</p>
      </div>
    );
  }

  if (!analytics || analytics.totalCalls === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 mt-1">Performance insights and trends across all campaigns</p>
          </div>
        </div>
        
        {/* Filters even when empty */}
        <div className="card-enhanced p-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  className="input-enhanced pl-10"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  className="input-enhanced pl-10"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Campaign
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  className="input-enhanced pl-10 pr-10 appearance-none bg-white"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
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

        <div className="card-enhanced p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart2 className="text-slate-400" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Data Available</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            There are no analytics records for the selected period. Try adjusting your date range or campaign filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600 mt-1">Performance insights and trends across all campaigns</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-enhanced p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                className="input-enhanced pl-10"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                className="input-enhanced pl-10"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Campaign
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="input-enhanced pl-10 pr-10 appearance-none bg-white"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-enhanced p-6 group hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Phone size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              <span>+12%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{analytics.overview.totalCalls}</div>
          <div className="text-sm font-medium text-slate-500">Total Calls Processed</div>
        </div>

        <div className="card-enhanced p-6 group hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <Award size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              <span>+5%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{analytics.overview.avgQualityScore}%</div>
          <div className="text-sm font-medium text-slate-500">Avg Quality Score</div>
        </div>

        <div className="card-enhanced p-6 group hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <Shield size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              <span>+8%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{analytics.overview.avgComplianceScore}%</div>
          <div className="text-sm font-medium text-slate-500">Avg Compliance Score</div>
        </div>

        <div className="card-enhanced p-6 group hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} />
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium bg-slate-50 px-2 py-1 rounded-lg">
              <MinusCircle size={14} />
              <span>0%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {Math.floor(analytics.overview.totalDuration / 60)}m
          </div>
          <div className="text-sm font-medium text-slate-500">Total Duration</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <div className="card-enhanced p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-600" />
            Quality Score Distribution
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-emerald-800">Excellent (90+)</span>
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-700 mb-1">
                {analytics.qualityDistribution.counts.excellent}
              </p>
              <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-emerald-600 h-1.5 rounded-full" 
                  style={{ width: `${analytics.qualityDistribution.percentages.excellent}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-emerald-600 mt-2 text-right">
                {analytics.qualityDistribution.percentages.excellent}% of calls
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-800">Good (70-89)</span>
                <CheckCircle size={18} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-700 mb-1">
                {analytics.qualityDistribution.counts.good}
              </p>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${analytics.qualityDistribution.percentages.good}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-blue-600 mt-2 text-right">
                {analytics.qualityDistribution.percentages.good}% of calls
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-800">Fair (50-69)</span>
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-amber-700 mb-1">
                {analytics.qualityDistribution.counts.fair}
              </p>
              <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-amber-600 h-1.5 rounded-full" 
                  style={{ width: `${analytics.qualityDistribution.percentages.fair}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-amber-600 mt-2 text-right">
                {analytics.qualityDistribution.percentages.fair}% of calls
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-800">Poor (&lt;50)</span>
                <XCircle size={18} className="text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-700 mb-1">
                {analytics.qualityDistribution.counts.poor}
              </p>
              <div className="w-full bg-red-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-red-600 h-1.5 rounded-full" 
                  style={{ width: `${analytics.qualityDistribution.percentages.poor}%` }}
                ></div>
              </div>
              <p className="text-xs font-medium text-red-600 mt-2 text-right">
                {analytics.qualityDistribution.percentages.poor}% of calls
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="card-enhanced p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-purple-600" />
            Sentiment Analysis
          </h2>
          <div className="space-y-4">
            {Object.entries(analytics.sentiment.distribution).map(([sentiment, count]) => (
              <div
                key={sentiment}
                className={`border rounded-xl p-5 flex items-center justify-between transition-all hover:shadow-md ${
                  sentiment === 'positive' ? 'bg-emerald-50/50 border-emerald-100' :
                  sentiment === 'negative' ? 'bg-red-50/50 border-red-100' :
                  'bg-blue-50/50 border-blue-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' :
                    sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {sentiment === 'positive' ? <TrendingUp size={20} /> :
                     sentiment === 'negative' ? <TrendingDown size={20} /> :
                     <MinusCircle size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-0.5">{sentiment}</p>
                    <p className="text-2xl font-bold text-slate-900">{count} Calls</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    sentiment === 'positive' ? 'text-emerald-600' :
                    sentiment === 'negative' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {analytics.sentiment.percentages[sentiment]}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Issues */}
      <div className="card-enhanced p-6 border-l-4 border-l-red-500">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          Compliance Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm font-medium text-red-800 mb-1">Total Violations</p>
            <p className="text-3xl font-bold text-red-600">
              {analytics.compliance.totalViolations}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-sm font-medium text-orange-800 mb-1">Calls with Violations</p>
            <p className="text-3xl font-bold text-orange-600">
              {analytics.compliance.callsWithViolations}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm font-medium text-slate-600 mb-1">Violation Rate</p>
            <p className="text-3xl font-bold text-slate-900">
              {analytics.compliance.violationRate}%
            </p>
          </div>
        </div>

        {analytics.compliance.topMissingPhrases.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Top Missing Mandatory Phrases
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analytics.compliance.topMissingPhrases.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-red-200 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.phrase}</span>
                  </div>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {item.count} times
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
