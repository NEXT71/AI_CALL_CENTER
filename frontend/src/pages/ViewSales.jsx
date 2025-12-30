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
    (record.recordType === 'agent' && (
      record.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.campaign.toLowerCase().includes(searchTerm.toLowerCase())
    )) ||
    (record.recordType === 'office' && (
      record.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      'office data'.includes(searchTerm.toLowerCase())
    ))
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
    const headers = ['Date', 'Type', 'Agent/Office', 'Campaign', 'Total Calls', 'Successful', 'Failed', 'Success Rate', 'Office Revenue', 'Office Targets', 'Achievement %', 'Status'];
    const rows = data.map(r => [
      new Date(r.salesDate).toLocaleDateString(),
      r.recordType === 'agent' ? 'Agent' : 'Office',
      r.recordType === 'agent' ? r.agentName : 'Office Data',
      r.campaign,
      r.recordType === 'agent' ? r.totalCalls : '',
      r.recordType === 'agent' ? r.successfulSales : '',
      r.recordType === 'agent' ? r.failedSales : '',
      r.recordType === 'agent' ? `${r.successRate}%` : '',
      r.recordType === 'office' ? r.officeRevenue : '',
      r.recordType === 'office' ? r.officeTargets : '',
      r.recordType === 'office' && r.officeTargets > 0 ? `${((r.officeRevenue / r.officeTargets) * 100).toFixed(1)}%` : '',
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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Data</h1>
          <p className="text-sm text-slate-600 mt-2">Manage and view sales records</p>
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
            <Link 
              to="/app/sales-data/add" 
              className="relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)] hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 active:shadow-[0_2px_8px_rgba(37,99,235,0.4)] inline-flex items-center justify-center gap-2 border border-blue-700 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10">Add Sales</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 mb-6 hover:shadow-lg transition-shadow duration-300">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by agent name or campaign..."
            className="w-full pl-12 pr-4 py-3 text-sm border-0 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">{selectedRecords.length}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              record(s) selected
            </span>
          </div>
          <button onClick={handleBulkDelete} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 inline-flex items-center justify-center font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </button>
        </div>
      )}


      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-slate-700">Loading sales data...</p>
            <p className="text-sm text-slate-500 mt-2">Please wait while we fetch the records</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-slate-300 mb-6">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">No sales records found</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Get started by adding your first sales record to track agent performance</p>
            {canAddSales && (
              <Link to="/app/sales-data/add" className="btn-primary inline-flex shadow-lg hover:shadow-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add Sales Record
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
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
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors duration-200 group"
                    onClick={() => handleSort('salesDate')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors duration-200 group"
                    onClick={() => handleSort('agentName')}
                  >
                    <div className="flex items-center gap-2">
                      Agent/Office
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Metrics</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredSales.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors duration-150">
                    {canDelete && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={() => handleSelectRecord(record._id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(record.salesDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.recordType === 'agent' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {record.recordType === 'agent' ? 'Agent' : 'Office'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {record.recordType === 'agent' ? record.agentName : 'Office Data'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{record.campaign}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.recordType === 'agent' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Calls:</span>
                            <span className="font-medium">{record.totalCalls}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-green-600">Success:</span>
                            <span className="font-medium text-green-600">{record.successfulSales}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-red-600">Failed:</span>
                            <span className="font-medium text-red-600">{record.failedSales}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Rate:</span>
                            <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                              record.successRate >= 70 ? 'bg-green-100 text-green-700' : 
                              record.successRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {record.successRate}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Revenue:</span>
                            <span className="font-medium text-green-600">${record.officeRevenue?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Target:</span>
                            <span className="font-medium">${record.officeTargets?.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Achievement: {record.officeTargets > 0 ? ((record.officeRevenue / record.officeTargets) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {canDelete && (
                          <button onClick={() => handleDelete(record._id)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200">
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
        <div className="flex justify-center mt-8 space-x-3">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-5 py-2.5 bg-white text-slate-700 border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            Previous
          </button>
          <div className="px-6 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 rounded-lg border-2 border-blue-200 font-bold shadow-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.totalPages}
            className="px-5 py-2.5 bg-white text-slate-700 border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewSales;
