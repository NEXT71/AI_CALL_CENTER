import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { callService } from '../services/apiService';
import { Search, Filter, Eye } from 'lucide-react';

const CallsList = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    campaign: '',
    status: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  useEffect(() => {
    fetchCalls();
  }, [filters]);

  const fetchCalls = async () => {
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
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-info';
    if (score >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Call Records</h1>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign
            </label>
            <input
              type="text"
              placeholder="Filter by campaign..."
              className="input"
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
            />
          </div>

          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Statuses</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : calls.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No calls found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Call ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Quality</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Compliance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono">{call.callId}</td>
                      <td className="py-3 px-4 text-sm">{call.agentName}</td>
                      <td className="py-3 px-4 text-sm">{call.customerName || '-'}</td>
                      <td className="py-3 px-4 text-sm">{call.campaign}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(call.callDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getScoreBadge(call.qualityScore)}`}>
                          {call.qualityScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getScoreBadge(call.complianceScore)}`}>
                          {call.complianceScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${
                          call.status === 'completed' ? 'badge-success' :
                          call.status === 'processing' ? 'badge-info' :
                          call.status === 'failed' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/calls/${call._id}`}
                          className="text-primary-600 hover:text-primary-700 inline-flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
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
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={pagination.currentPage === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CallsList;
