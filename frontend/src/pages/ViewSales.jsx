import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import { Plus, Search, Download, Eye, Trash2, ArrowUpDown } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const ViewSales = () => {
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('salesDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRecords, setSelectedRecords] = useState([]);
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
  }, [filters, sortField, sortOrder]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await salesService.getSalesRecords({
        ...filters,
        sortBy: sortField,
        sortOrder: sortOrder,
      });
      setSales(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredSales = sales.filter((record) =>
    searchTerm === '' ||
    record.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecords(filteredSales.map(r => r._id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRecords.length} selected records?`)) return;
    try {
      await Promise.all(selectedRecords.map(id => salesService.deleteSalesRecord(id)));
      success(`Successfully deleted ${selectedRecords.length} records`);
      setSelectedRecords([]);
      fetchSales();
    } catch (error) {
      showError('Bulk delete failed: ' + error.message);
    }
  };

  const handleExport = async () => {
    try {
      const response = await salesService.getSalesRecords(filters);
      const csvContent = convertToCSV(response.data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      success('Sales data exported successfully');
    } catch (error) {
      showError('Export failed: ' + error.message);
    }
  };

  const convertToCSV = (data) => {
    const headers = ['Date', 'Agent', 'Campaign', 'Total Calls', 'Successful', 'Failed', 'Success Rate', 'Status'];
    const rows = data.map(r => [
      new Date(r.salesDate).toLocaleDateString(),
      r.agentName,
      r.campaign,
      r.totalCalls,
      r.successfulSales,
      r.failedSales,
      `${r.successRate}%`,
      r.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sales record?')) return;
    try {
      await salesService.deleteSalesRecord(id);
      success('Sales record deleted successfully');
      fetchSales();
    } catch (error) {
      showError('Delete failed: ' + error.message);
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
  const canAddSales = ['Admin', 'Manager', 'QA'].includes(user?.role);
  const canDelete = user?.role === 'Admin';
  const canViewReports = ['Admin', 'Manager', 'QA'].includes(user?.role);

  return (
    <div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}

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
          {canViewReports && (
            <Link to="/app/sales-reports" className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </Link>
          )}
          {canAddSales && (
            <Link to="/app/sales-data/add" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Sales
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by agent name or campaign..."
            className="input w-full pl-10"
          />
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
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', agentName: '', campaign: '', page: 1 })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && canDelete && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedRecords.length} record(s) selected
          </span>
          <button onClick={handleBulkDelete} className="btn-error">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading sales data...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales records found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first sales record</p>
            {canAddSales && (
              <Link to="/app/sales-data/add" className="btn-primary inline-flex">
                <Plus className="w-4 h-4 mr-2" />
                Add Sales Record
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canDelete && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === filteredSales.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('salesDate')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('agentName')}
                  >
                    <div className="flex items-center gap-1">
                      Agent
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalCalls')}
                  >
                    <div className="flex items-center gap-1">
                      Calls
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('successRate')}
                  >
                    <div className="flex items-center gap-1">
                      Rate
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    {canDelete && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={() => handleSelectRecord(record._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
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
                        <Link to={`/app/sales-data/${record._id}`} className="text-blue-600 hover:text-blue-800">
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
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewSales;
