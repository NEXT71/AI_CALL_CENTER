import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as salesService from '../services/salesService';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, ArrowRight } from 'lucide-react';

const SalesWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysStats();
  }, []);

  const fetchTodaysStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await salesService.getSalesAnalytics({
        startDate: today,
        endDate: today,
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { totalSales = 0, totalCalls = 0, avgSuccessRate = 0, topAgent = null } = stats.summary || {};
  const trend = avgSuccessRate >= 70 ? 'up' : avgSuccessRate >= 50 ? 'neutral' : 'down';

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          Today's Sales
        </h3>
        <Link 
          to="/app/sales-data" 
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2 font-medium">
            <Target className="w-4 h-4 text-blue-600" />
            Total Sales
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalSales}</div>
          <div className="text-xs text-slate-500 mt-2">from {totalCalls} calls</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            Success Rate
          </div>
          <div className={`text-2xl font-bold ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'neutral' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {avgSuccessRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">average today</div>
        </div>
      </div>

      {topAgent && (
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Top Performer</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{topAgent.agentName}</div>
              <div className="text-xs text-green-600">{topAgent.successRate}% success</div>
            </div>
          </div>
        </div>
      )}

      <Link 
        to="/app/sales-data/add" 
        className="mt-4 w-full btn-primary text-center block"
      >
        <DollarSign className="w-4 h-4 inline mr-2" />
        Add Sales Record
      </Link>
    </div>
  );
};

export default SalesWidget;
