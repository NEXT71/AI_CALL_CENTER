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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Call Records</h1>
            <p className="page-subtitle">
              {pagination.total} total calls • {calls.filter(c => c.status === 'completed').length} completed
            </p>
          </div>
          <button className="btn btn-secondary">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Filters */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          <div className="filter-panel">
            <div className="flex items-center justify-between mb-5">
              <h3 className="filter-title flex items-center gap-2">
                <Filter size={16} />
                Filters
              </h3>
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Reset
              </button>
            </div>

            {/* Search */}
            <div className="filter-section">
              <label className="input-label">
                <Search size={14} className="inline mr-1.5" />
                Search
              </label>
              <input
                type="text"
                placeholder="Call ID, customer..."
                className="input"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
              />
            </div>

            {/* Agent Filter */}
            <div className="filter-section">
              <label className="input-label">
                <User size={14} className="inline mr-1.5" />
                Agent
              </label>
              <input
                type="text"
                placeholder="Agent name..."
                className="input"
                value={filters.agentName}
                onChange={(e) => setFilters({ ...filters, agentName: e.target.value, page: 1 })}
              />
            </div>

            {/* Campaign Filter */}
            <div className="filter-section">
              <label className="input-label">
                <Building2 size={14} className="inline mr-1.5" />
                Campaign
              </label>
              <select
                className="select"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
              >
                <option value="">All Campaigns</option>
                <option value="ACA">ACA</option>
                <option value="Medicare">Medicare</option>
                <option value="Final Expense">Final Expense</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-section">
              <label className="input-label">Status</label>
              <select
                className="select"
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
            <div className="filter-section">
              <label className="input-label">Quality Score Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="input"
                  min="0"
                  max="100"
                  value={filters.minQuality}
                  onChange={(e) => setFilters({ ...filters, minQuality: e.target.value, page: 1 })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="input"
                  min="0"
                  max="100"
                  value={filters.maxQuality}
                  onChange={(e) => setFilters({ ...filters, maxQuality: e.target.value, page: 1 })}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="filter-section">
              <label className="input-label">
                <Calendar size={14} className="inline mr-1.5" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  className="input"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                />
                <input
                  type="date"
                  className="input"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                />
              </div>
            </div>

            {/* Results per page */}
            <div className="filter-section">
              <label className="input-label">Results per page</label>
              <select
                className="select"
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

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9">
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-20">
                <div className="spinner w-12 h-12"></div>
              </div>
            </div>
          ) : calls.length === 0 ? (
            <div className="card text-center py-20">
              <Search className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="body-text text-slate-500">No calls found matching your filters</p>
              <button onClick={resetFilters} className="btn btn-secondary mt-4">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-secondary lg:hidden flex items-center gap-2"
                  >
                    <SlidersHorizontal size={16} />
                    Filters
                  </button>
                </div>
                <div className="text-sm text-slate-600">
                  {pagination.total} calls found
                </div>
              </div>

              {/* Enhanced Table Container */}
              <div className="table-container-enhanced">
                <div className="overflow-x-auto">
                  <table className="table-enhanced min-w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th onClick={() => handleSort('callId')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            Call ID
                            {sortField === 'callId' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'callId' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('agentName')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            Agent
                            {sortField === 'agentName' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'agentName' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th>Customer</th>
                        <th onClick={() => handleSort('campaign')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} />
                            Campaign
                            {sortField === 'campaign' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'campaign' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('callDate')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            Date & Time
                            {sortField === 'callDate' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'callDate' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th>Duration</th>
                        <th onClick={() => handleSort('qualityScore')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            Quality Score
                            {sortField === 'qualityScore' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'qualityScore' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th onClick={() => handleSort('complianceScore')} className="cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2">
                            Compliance
                            {sortField === 'complianceScore' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                            {sortField !== 'complianceScore' && <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th>Status</th>
                        <th className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call, index) => (
                        <tr key={call._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-all duration-200`}>
                          <td className="font-mono text-xs font-semibold text-slate-900 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                                {call.callId}
                              </span>
                            </div>
                          </td>
                          <td className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {call.agentName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span>{call.agentName}</span>
                            </div>
                          </td>
                          <td className="text-slate-600">
                            <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">
                              {call.customerName || 'Unknown'}
                            </span>
                          </td>
                          <td className="text-slate-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {call.campaign}
                            </span>
                          </td>
                          <td className="text-slate-500 text-xs">
                            <div className="space-y-1">
                              <div className="font-medium">{formatDate(call.callDate)}</div>
                              <div className="text-slate-400">{formatTime(call.callDate)}</div>
                            </div>
                          </td>
                          <td className="text-slate-600">
                            {call.duration ? (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td>
                            {call.qualityScore !== null && call.qualityScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  call.qualityScore >= 80 ? 'bg-green-500' :
                                  call.qualityScore >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className={`badge ${
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
                                <div className={`w-3 h-3 rounded-full ${
                                  call.complianceScore >= 80 ? 'bg-green-500' :
                                  call.complianceScore >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}></div>
                                <span className={`badge ${
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              call.status === 'completed' ? 'bg-green-100 text-green-800' :
                              call.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              call.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-1.5 ${
                                call.status === 'completed' ? 'bg-green-500' :
                                call.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                                call.status === 'failed' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}></div>
                              {call.status}
                            </span>
                          </td>
                          <td className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent pl-6">
                            <Link
                              to={`/calls/${call._id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                            >
                              <Eye size={16} className="group-hover:scale-110 transition-transform" />
                              <span>View Details</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Summary */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-6">
                      <span>📊 {calls.length} calls displayed</span>
                      <span>📅 {formatDate(new Date())}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Scroll horizontally to see all columns →
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <p className="pagination-info">
                    Showing <span className="font-semibold">{(pagination.currentPage - 1) * filters.limit + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(pagination.currentPage * filters.limit, pagination.total)}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> calls
                  </p>
                  <div className="pagination-buttons">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={pagination.currentPage === 1}
                      className="pagination-button pagination-button-inactive disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(pagination.totalPages, 5))].map((_, idx) => {
                        const page = idx + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setFilters({ ...filters, page })}
                            className={`pagination-button ${
                              page === pagination.currentPage
                                ? 'pagination-button-active'
                                : 'pagination-button-inactive'
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
                      className="pagination-button pagination-button-inactive disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} />
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
