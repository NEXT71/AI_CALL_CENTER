import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callService } from '../services/apiService';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Download, Calendar, User, Building2 } from 'lucide-react';

const CallsList = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [filters, user]);

  const fetchCalls = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await callService.getCalls(filters);
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
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Call ID</th>
                      <th>Agent</th>
                      <th>Customer</th>
                      <th>Campaign</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Quality</th>
                      <th>Compliance</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call._id}>
                        <td className="font-mono text-xs font-semibold text-slate-900">{call.callId}</td>
                        <td className="font-medium text-slate-900">{call.agentName}</td>
                        <td className="text-slate-600">{call.customerName || '-'}</td>
                        <td className="text-slate-600">{call.campaign}</td>
                        <td className="text-slate-500 text-xs">{formatDate(call.callDate)}</td>
                        <td className="text-slate-600 text-xs">
                          {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
                            {call.qualityScore || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
                            {call.complianceScore || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            call.status === 'completed' ? 'badge-success' :
                            call.status === 'processing' ? 'badge-info' :
                            call.status === 'failed' ? 'badge-danger' :
                            'badge-neutral'
                          }`}>
                            {call.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/calls/${call._id}`}
                            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 text-sm font-medium"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
