import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callService } from '../services/apiService';
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  User,
  Building2,
  RefreshCw,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const CallsList = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState('callDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    campaign: '',
    agentName: '',
    status: '',
    minQuality: '',
    maxQuality: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [filters, user, sortField, sortDirection]);

  const fetchCalls = async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await callService.getCalls({
        ...filters,
        sort: sortField,
        order: sortDirection
      });

      setCalls(response.data);
      setPagination({
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
      });
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setFilters({ ...filters, page: 1 });
  };

  const handleRefresh = () => {
    fetchCalls(true);
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

  const resetFilters = () => {
    setFilters({
      campaign: '',
      agentName: '',
      status: '',
      minQuality: '',
      maxQuality: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Records</h1>
          <p className="text-slate-600 mt-1">
            {pagination.total} total calls • {calls.filter(c => c.status === 'completed').length} completed
          </p>
        </div>
        <button className="btn-enhanced btn-secondary-enhanced flex items-center gap-2">
          <Download size={18} />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Filters */}
        <div className={`col-span-12 lg:col-span-3 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="card-enhanced p-5 sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Filter size={18} className="text-blue-600" />
                Filters
              </h3>
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Reset All
              </button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Search
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Call ID, customer..."
                    className="input-enhanced w-full pl-9 py-2 text-sm"
                    value={filters.campaign}
                    onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
                  />
                </div>
              </div>

              {/* Agent Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Agent
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Agent name..."
                    className="input-enhanced w-full pl-9 py-2 text-sm"
                    value={filters.agentName}
                    onChange={(e) => setFilters({ ...filters, agentName: e.target.value, page: 1 })}
                  />
                </div>
              </div>

              {/* Campaign Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Campaign
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    className="input-enhanced w-full pl-9 py-2 text-sm appearance-none bg-white"
                    value={filters.campaign}
                    onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
                  >
                    <option value="">All Campaigns</option>
                    <option value="ACA">ACA</option>
                    <option value="Medicare">Medicare</option>
                    <option value="Final Expense">Final Expense</option>
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  className="input-enhanced w-full py-2 text-sm bg-white"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="queued">Queued</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Quality Score Range */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Quality Score</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="input-enhanced w-full py-2 text-sm"
                    min="0"
                    max="100"
                    value={filters.minQuality}
                    onChange={(e) => setFilters({ ...filters, minQuality: e.target.value, page: 1 })}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="input-enhanced w-full py-2 text-sm"
                    min="0"
                    max="100"
                    value={filters.maxQuality}
                    onChange={(e) => setFilters({ ...filters, maxQuality: e.target.value, page: 1 })}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    className="input-enhanced w-full py-2 text-sm"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                  />
                  <input
                    type="date"
                    className="input-enhanced w-full py-2 text-sm"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                  />
                </div>
              </div>

              {/* Results per page */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Rows per page</label>
                <select
                  className="input-enhanced w-full py-2 text-sm bg-white"
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9">
          {loading ? (
            <div className="card-enhanced p-12 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Loading calls...</p>
              <p className="text-slate-400 text-sm mt-1">Please wait while we fetch your data</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="card-enhanced p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No calls found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {Object.values(filters).some(v => v && v !== '') 
                  ? 'We couldn\'t find any calls matching your current filters. Try adjusting them or search for something else.' 
                  : 'No calls have been uploaded yet. Get started by uploading your first call recording.'
                }
              </p>
              <div className="flex gap-3 justify-center">
                {Object.values(filters).some(v => v && v !== '') && (
                  <button onClick={resetFilters} className="btn-enhanced btn-secondary-enhanced">
                    Clear Filters
                  </button>
                )}
                <Link to="/app/upload" className="btn-enhanced btn-primary-enhanced">
                  Upload First Call
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden btn-enhanced btn-secondary-enhanced p-2"
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                  <div className="relative flex-1 sm:flex-none">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Quick search..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                      className="input-enhanced pl-10 pr-10 py-2 w-full sm:w-64"
                    />
                    {filters.search && (
                      <button
                        onClick={() => setFilters({ ...filters, search: '', page: 1 })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-enhanced btn-secondary-enhanced p-2"
                    title="Refresh list"
                  >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="text-sm font-medium text-slate-600">
                  Showing {calls.length} of {pagination.total} calls
                </div>
              </div>

              {/* Enhanced Table Container */}
              <div className="table-container-enhanced">
                <div className="overflow-x-auto">
                  <table className="table-enhanced min-w-full">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('callId')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            Call ID
                            {sortField === 'callId' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'callId' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('agentName')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            Agent
                            {sortField === 'agentName' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'agentName' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th>Customer</th>
                        <th onClick={() => handleSort('campaign')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400" />
                            Campaign
                            {sortField === 'campaign' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'campaign' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('callDate')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            Date & Time
                            {sortField === 'callDate' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'callDate' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th>Duration</th>
                        <th onClick={() => handleSort('qualityScore')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            Quality Score
                            {sortField === 'qualityScore' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'qualityScore' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('complianceScore')} className="cursor-pointer group">
                          <div className="flex items-center gap-2">
                            Compliance
                            {sortField === 'complianceScore' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                            )}
                            {sortField !== 'complianceScore' && <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-30 transition-opacity" />}
                          </div>
                        </th>
                        <th>Status</th>
                        <th className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call, index) => (
                        <tr key={call._id} className="group hover:bg-blue-50/50 transition-colors">
                          <td className="font-mono text-xs font-semibold text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition-colors">
                              {call.callId}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {call.agentName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-slate-900">{call.agentName}</span>
                            </div>
                          </td>
                          <td className="text-slate-600">
                            {call.customerName || 'Unknown'}
                          </td>
                          <td>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {call.campaign}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">{formatDate(call.callDate)}</span>
                              <span className="text-xs text-slate-500">{formatTime(call.callDate)}</span>
                            </div>
                          </td>
                          <td>
                            {call.duration !== null && call.duration !== undefined ? (
                              <span className="font-mono text-sm text-slate-600">
                                {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td>
                            {call.qualityScore !== null && call.qualityScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  call.qualityScore >= 80 ? 'bg-emerald-500' :
                                  call.qualityScore >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="font-semibold text-slate-900">{call.qualityScore}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Pending</span>
                            )}
                          </td>
                          <td>
                            {call.complianceScore !== null && call.complianceScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  call.complianceScore >= 80 ? 'bg-emerald-500' :
                                  call.complianceScore >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className="font-semibold text-slate-900">{call.complianceScore}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Pending</span>
                            )}
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              call.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              call.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              call.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-slate-50 text-slate-700 border-slate-100'
                            }`}>
                              {call.status === 'processing' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-1.5"></div>}
                              {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                            </span>
                          </td>
                          <td className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent pl-4">
                            <Link
                              to={`${call._id}`}
                              className="btn-enhanced btn-secondary-enhanced py-1.5 px-3 text-xs flex items-center gap-1.5"
                            >
                              <Eye size={14} />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        {calls.length} calls displayed
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 italic">
                      Scroll horizontally to see all columns →
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{(pagination.currentPage - 1) * filters.limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(pagination.currentPage * filters.limit, pagination.total)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{pagination.total}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={pagination.currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(pagination.totalPages, 5))].map((_, idx) => {
                        const page = idx + 1;
                        // Simple pagination logic for display
                        return (
                          <button
                            key={page}
                            onClick={() => setFilters({ ...filters, page })}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                              page === pagination.currentPage
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallsList;
