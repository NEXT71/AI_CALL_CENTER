import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ViewSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    startDate: '',
    endDate: '',
    campaign: '',
    agentId: '',
    status: '',
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getSalesRecords(filters);
      setSales(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await salesService.exportSalesData(filters);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sales record?')) return;
    try {
      await salesService.deleteSalesRecord(id);
      fetchSales();
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      verified: 'badge-success',
      flagged: 'badge-error',
    };
    return badges[status] || 'badge-neutral';
  };

  // Check permissions
  const canAddSales = ['Admin', 'QA'].includes(user?.role);
  const canDelete = user?.role === 'Admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Data</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and view sales records</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          {canAddSales && (
            <Link to="/sales-data/add" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Sales
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            className="input"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
            className="input"
            placeholder="End Date"
          />
          <input
            type="text"
            value={filters.campaign}
            onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
            className="input"
            placeholder="Campaign"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="input"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
          </select>
          <button
            onClick={() => setFilters({ page: 1, limit: 20, startDate: '', endDate: '', campaign: '', agentId: '', status: '' })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No sales records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(record.salesDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.agentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{record.campaign}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{record.totalCalls}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{record.successfulSales}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{record.failedSales}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${record.successRate >= 70 ? 'bg-green-100 text-green-800' : record.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {record.successRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link to={`/sales-data/${record._id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canDelete && (
                          <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords} records
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={pagination.currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSales;
