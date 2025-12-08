import { useState, useEffect } from 'react';
import { reportService } from '../services/apiService';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await reportService.getAnalyticsSummary(dateRange);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics || analytics.totalCalls === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="card text-center py-12">
          <p className="text-gray-600">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and trends</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.overview.totalCalls}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600">Avg Quality Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.overview.avgQualityScore}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600">Avg Compliance Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.overview.avgComplianceScore}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600">Total Duration</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {Math.floor(analytics.overview.totalDuration / 60)} min
          </p>
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quality Score Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Excellent (90+)</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {analytics.qualityDistribution.counts.excellent}
            </p>
            <p className="text-sm text-green-600">
              {analytics.qualityDistribution.percentages.excellent}%
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Good (70-89)</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {analytics.qualityDistribution.counts.good}
            </p>
            <p className="text-sm text-blue-600">
              {analytics.qualityDistribution.percentages.good}%
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Fair (50-69)</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">
              {analytics.qualityDistribution.counts.fair}
            </p>
            <p className="text-sm text-yellow-600">
              {analytics.qualityDistribution.percentages.fair}%
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Poor (&lt;50)</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {analytics.qualityDistribution.counts.poor}
            </p>
            <p className="text-sm text-red-600">
              {analytics.qualityDistribution.percentages.poor}%
            </p>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sentiment Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.sentiment.distribution).map(([sentiment, count]) => (
            <div
              key={sentiment}
              className={`border rounded-lg p-4 ${
                sentiment === 'positive' ? 'bg-green-50 border-green-200' :
                sentiment === 'negative' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <p className="text-sm text-gray-600 capitalize">{sentiment}</p>
              <p className={`text-3xl font-bold mt-1 ${
                sentiment === 'positive' ? 'text-green-700' :
                sentiment === 'negative' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {count}
              </p>
              <p className={`text-sm ${
                sentiment === 'positive' ? 'text-green-600' :
                sentiment === 'negative' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {analytics.sentiment.percentages[sentiment]}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Issues */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600">Total Violations</p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              {analytics.compliance.totalViolations}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Calls with Violations</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {analytics.compliance.callsWithViolations}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Violation Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {analytics.compliance.violationRate}%
            </p>
          </div>
        </div>

        {analytics.compliance.topMissingPhrases.length > 0 && (
          <>
            <h3 className="font-medium text-gray-900 mb-3">
              Top Missing Mandatory Phrases
            </h3>
            <div className="space-y-2">
              {analytics.compliance.topMissingPhrases.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.phrase}</span>
                  <span className="badge badge-danger">{item.count} times</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
