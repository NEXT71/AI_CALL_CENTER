import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as salesService from '../services/salesService';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, ArrowRight, Award } from 'lucide-react';

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
      <div className="card-enhanced h-full flex flex-col justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-12 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { totalSales = 0, totalCalls = 0, avgSuccessRate = 0, topAgent = null } = stats.summary || {};
  const trend = avgSuccessRate >= 70 ? 'up' : avgSuccessRate >= 50 ? 'neutral' : 'down';

  return (
    <div className="card-enhanced h-full flex flex-col bg-gradient-to-br from-white to-blue-50/50 border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="section-header-enhanced mb-0">Today's Sales</h3>
        </div>
        <Link 
          to="/app/sales-data" 
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-medium">
            <Target className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            Total Sales
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalSales}</div>
          <div className="text-xs text-slate-400 mt-1">from {totalCalls} calls</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 font-medium">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            )}
            Success Rate
          </div>
          <div className={`text-2xl font-bold ${
            trend === 'up' ? 'text-emerald-600' : 
            trend === 'neutral' ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {avgSuccessRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">average today</div>
        </div>
      </div>

      {topAgent && (
        <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-3 border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 block">Top Performer</span>
                <span className="text-sm font-bold text-slate-900">{topAgent.agentName}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="badge-compact badge-success">
                {topAgent.successRate}% success
              </div>
            </div>
          </div>
        </div>
      )}

      <Link 
        to="/app/sales-data/add" 
        className="btn-enhanced btn-primary-enhanced w-full justify-center mt-auto"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Add Sales Record
      </Link>
    </div>
  );
};

export default SalesWidget;
