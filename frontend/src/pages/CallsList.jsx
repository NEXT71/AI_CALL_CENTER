import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useDebounce } from '../hooks/usePerformance';
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
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { SearchBar } from '../components/common/SearchBar';

const CallsList = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
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

  // Debounce filter inputs to reduce API calls
  const debouncedCampaign = useDebounce(filters.campaign, 500);
  const debouncedAgentName = useDebounce(filters.agentName, 500);

  // Memoize utility functions
  const getScoreBadge = useCallback((score) => {
    if (!score) return 'badge-neutral';
    if (score >= 90) return 'badge-score-high';
    if (score >= 75) return 'badge-score-medium';
    if (score >= 60) return 'badge-score-low';
    return 'badge-score-critical';
  }, []);

  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatTime = useCallback((date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Memoized call row component
  const CallRow = memo(({ call }) => (
    <tr className="hover:bg-slate-blue-light/20 transition-colors">
      <td className="px-6 py-4">
        <div className="font-medium text-cool-white">{call.agentName || 'Unknown'}</div>
        <div className="text-xs text-cool-white/60">{call.campaign || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 text-cool-white/80">
        {formatDate(call.callDate)}
      </td>
      <td className="px-6 py-4">
        <span className={`badge-compact ${getScoreBadge(call.qualityScore)}`}>
          {call.qualityScore ? `${call.qualityScore}%` : 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`badge-compact ${
          call.status === 'completed' ? 'badge-success' : 
          call.status === 'processing' ? 'badge-warning' : 
          'badge-danger'
        }`}>
          {call.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <Link 
          to={`/app/calls/${call._id}`} 
          className="text-electric-blue hover:text-electric-blue-light inline-flex items-center gap-1 transition-colors"
        >
          <Eye size={16} />
          View
        </Link>
      </td>
    </tr>
  ));

  const fetchCalls = useCallback(async (isRefresh = false) => {
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

      const params = new URLSearchParams({
        campaign: filters.campaign,
        agentName: filters.agentName,
        status: filters.status,
        minQuality: filters.minQuality,
        maxQuality: filters.maxQuality,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sortBy: sortField,
        sortOrder: sortDirection,
      });

      const response = await api.get(`/calls?${params}`);
      
      if (response.data.success) {
        setCalls(response.data.data.calls);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching calls:', err);
      setError(err.response?.data?.message || 'Failed to load calls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filters, sortField, sortDirection]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [sortField, sortDirection]);

  const handleRefresh = useCallback(() => {
    fetchCalls(true);
  }, [fetchCalls]);

  const resetFilters = useCallback(() => {
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
  }, []);

  // Fetch calls when component mounts or filters/sorting changes
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Records</h1>
          <p className="text-slate-600 mt-1">
            {pagination?.total || 0} total calls • {calls.filter(c => c.status === 'completed').length} completed
          </p>
        </div>
        <Button variant="secondary">
          <Download size={18} />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Filters */}
        <div className={`col-span-12 lg:col-span-3 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card className="sticky top-6">
            <CardContent>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600" />
                  Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset All
                </Button>
              </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Call ID, customer..."
                  value={filters.campaign}
                  onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
                  icon={<Search size={14} />}
                />
              </div>

              {/* Agent Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Agent
                </label>
                <Input
                  type="text"
                  placeholder="Agent name..."
                  value={filters.agentName}
                  onChange={(e) => setFilters({ ...filters, agentName: e.target.value, page: 1 })}
                  icon={<User size={14} />}
                />
              </div>

              {/* Campaign Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Campaign
                </label>
                <Select
                  value={filters.campaign}
                  onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
                >
                  <option value="">All Campaigns</option>
                  <option value="ACA">ACA</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Final Expense">Final Expense</option>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="queued">Queued</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>

              {/* Quality Score Range */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Quality Score</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="100"
                    value={filters.minQuality}
                    onChange={(e) => setFilters({ ...filters, minQuality: e.target.value, page: 1 })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
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
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                  />
                </div>
              </div>

              {/* Results per page */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Rows per page</label>
                <Select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9">
          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-slate-600 font-medium">Loading calls...</p>
                <p className="text-slate-400 text-sm mt-1">Please wait while we fetch your data</p>
              </div>
            </Card>
          ) : calls.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No calls found"
              description={
                Object.values(filters).some(v => v && v !== '') 
                  ? 'We couldn\'t find any calls matching your current filters. Try adjusting them or search for something else.' 
                  : 'No calls have been uploaded yet. Get started by uploading your first call recording.'
              }
              action={(
                <div className="flex gap-3 justify-center">
                  {Object.values(filters).some(v => v && v !== '') && (
                    <Button variant="secondary" onClick={resetFilters}>
                      Clear Filters
                    </Button>
                  )}
                  <Link to="/app/upload">
                    <Button>Upload First Call</Button>
                  </Link>
                </div>
              )}
            />
          ) : (
            <div className="space-y-4">
              {/* Table Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="secondary" 
                    size="sm"
                    className="lg:hidden"
                  >
                    <SlidersHorizontal size={20} />
                  </Button>
                  <SearchBar
                    value={filters.search || ''}
                    onChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
                    placeholder="Quick search..."
                    className="w-full sm:w-64"
                  />
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="secondary"
                    size="sm"
                    title="Refresh list"
                  >
                    <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                  </Button>
                </div>
                <div className="text-sm font-medium text-slate-600">
                  Showing {calls.length} of {pagination?.total || 0} calls
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
                      {loading ? (
                        <tr>
                          <td colSpan="10" className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                              <p className="text-slate-600">Loading calls...</p>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="10" className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <X size={24} className="text-red-600" />
                              </div>
                              <p className="text-red-600 font-medium">{error}</p>
                              <Button onClick={() => fetchCalls()} size="sm">
                                Try Again
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : calls.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <Phone size={24} className="text-slate-400" />
                              </div>
                              <p className="text-slate-600 font-medium">No calls found</p>
                              <p className="text-slate-500 text-sm">Try adjusting your filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        calls.map((call, index) => (
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
                            <Badge variant={call.campaign === 'ACA' ? 'primary' : call.campaign === 'Medicare' ? 'success' : 'info'}>
                              {call.campaign}
                            </Badge>
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
                            <Badge variant={
                              call.status === 'completed' ? 'success' :
                              call.status === 'processing' ? 'info' :
                              call.status === 'queued' ? 'warning' :
                              call.status === 'failed' ? 'error' :
                              'secondary'
                            } title={call.status === 'failed' ? call.processingError : ''}>
                              {(call.status === 'processing' || call.status === 'queued') && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-1.5"></div>
                              )}
                              {call.status === 'failed' && '❌ '}
                              {call.status === 'queued' ? 'Queued' : call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="sticky right-0 bg-gradient-to-l from-white via-white to-transparent pl-4">
                            <Link to={`${call._id}`}>
                              <Button variant="secondary" size="sm">
                                <Eye size={14} />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                        ))
                      )}
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
              {pagination?.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{(pagination.currentPage - 1) * filters.limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min((pagination?.currentPage || 1) * filters.limit, pagination?.total || 0)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{pagination?.total || 0}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                      disabled={pagination.currentPage === 1}
                      variant="secondary"
                      size="sm"
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(pagination?.totalPages || 1, 5))].map((_, idx) => {
                        const page = idx + 1;
                        return (
                          <Button
                            key={page}
                            onClick={() => setFilters({ ...filters, page })}
                            variant={page === (pagination?.currentPage || 1) ? 'primary' : 'secondary'}
                            size="sm"
                            className="w-8 h-8"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                      disabled={(pagination?.currentPage || 1) === (pagination?.totalPages || 1)}
                      variant="secondary"
                      size="sm"
                    >
                      <ChevronRight size={18} />
                    </Button>
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
