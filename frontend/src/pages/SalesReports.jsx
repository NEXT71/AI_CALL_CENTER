import { useState, useEffect } from 'react';
import * as salesService from '../services/salesService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Award, Download, Calendar, Filter } from 'lucide-react';

const SalesReports = () => {
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
      const response = await salesService.getSalesAnalytics(dateRange, campaign);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!analytics) return (
    <div className="text-center py-12">
      <p className="text-slate-500">No data available for the selected period.</p>
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Track performance and sales metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input-enhanced py-1.5 text-sm w-auto"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-enhanced py-1.5 text-sm w-auto"
          />
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="input-enhanced py-1.5 text-sm w-auto border-none bg-transparent focus:ring-0"
            >
              <option value="">All Campaigns</option>
              <option value="ACA">ACA</option>
              <option value="Medicare">Medicare</option>
              <option value="Final Expense">Final Expense</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-enhanced p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Sales</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.summary.totalSuccessfulSales}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card-enhanced p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Calls</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.summary.totalCalls}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="card-enhanced p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Success Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.summary.avgSuccessRate?.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card-enhanced p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Records</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.summary.totalRecords}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.salesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Campaign */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Sales by Campaign</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.salesByCampaign}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="totalSales" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div className="card-enhanced overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Top Performing Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.topAgents.map((agent, index) => (
                <tr key={agent._id} className={`hover:bg-slate-50 transition-colors ${index < 3 ? 'bg-yellow-50/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-slate-100 text-slate-500'}`}>
                      #{index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{agent.agentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-emerald-600 font-bold">{agent.totalSales}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{agent.totalCalls}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                      ${agent.avgSuccessRate >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        agent.avgSuccessRate >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                        'bg-red-50 text-red-700 border-red-100'}`}>
                      {agent.avgSuccessRate?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
