import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import { Plus, Search, Download, Eye, Trash2, ArrowUpDown, Filter, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { Button, Card, CardContent, Badge, Input, EmptyState } from '../components/ui';
import { SearchBar } from '../components/common';

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
      flagged: 'badge-danger',
    };
    return badges[status] || 'badge-neutral';
  };

  // Check permissions
  const canAddSales = ['Admin', 'User'].includes(user?.role);
  const canDelete = user?.role === 'Admin';

  return (
    <div className="animate-fade-in">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Data</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and view sales records</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport} icon={Download}>
            Export
          </Button>
          {canAddSales && (
            <Link to="/app/sales-data/add">
              <Button variant="primary" icon={Plus}>
                Add Sales
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-6" padding="sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by agent name or campaign..."
        />
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              placeholder="End Date"
            />
            <Input
              type="text"
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value, page: 1 })}
              placeholder="Campaign"
            />
            <select
              value={filters.recordType || ''}
              onChange={(e) => setFilters({ ...filters, recordType: e.target.value, page: 1 })}
              className="input-enhanced"
            >
              <option value="">All Record Types</option>
              <option value="agent">Agent Data</option>
              <option value="office">Office Data</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => setFilters({ startDate: '', endDate: '', agentName: '', campaign: '', recordType: '', page: 1 })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && canDelete && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">{selectedRecords.length}</span>
            </div>
            <span className="text-sm font-semibold text-slate-700">
              record(s) selected
            </span>
          </div>
          <Button variant="danger" onClick={handleBulkDelete} icon={Trash2}>
            Delete Selected
          </Button>
        </div>
      )}


      {/* Sales Table */}
      <div className="table-container-enhanced">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-semibold text-slate-700">Loading sales data...</p>
              <p className="text-sm text-slate-500 mt-2">Please wait while we fetch the records</p>
            </CardContent>
          </Card>
        ) : filteredSales.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="No sales records found"
                description="Get started by adding your first sales record to track agent performance"
                action={
                  canAddSales && (
                    <Link to="/app/sales-data/add">
                      <Button variant="primary" icon={Plus}>Add Sales Record</Button>
                    </Link>
                  )
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-enhanced">
              <thead>
                <tr>
                  {canDelete && (
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === filteredSales.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th 
                    className="cursor-pointer group"
                    onClick={() => handleSort('salesDate')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </th>
                  <th>Type</th>
                  <th 
                    className="cursor-pointer group"
                    onClick={() => handleSort('agentName')}
                  >
                    <div className="flex items-center gap-2">
                      Agent/Office
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </th>
                  <th>Campaign</th>
                  <th>Metrics</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((record) => (
                  <tr key={record._id}>
                    {canDelete && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record._id)}
                          onChange={() => handleSelectRecord(record._id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="text-sm text-slate-600 font-medium">
                      {new Date(record.salesDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        record.recordType === 'agent' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {record.recordType === 'agent' ? 'Agent' : 'Office'}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900">
                      {record.recordType === 'agent' ? record.agentName : 'Office Data'}
                    </td>
                    <td className="text-slate-600">{record.campaign}</td>
                    <td>
                      {record.recordType === 'agent' ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Calls:</span>
                            <span className="font-medium text-slate-900">{record.totalCalls}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-600 font-medium">Success:</span>
                            <span className="font-bold text-emerald-600">{record.successfulSales}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-rose-600 font-medium">Failed:</span>
                            <span className="font-bold text-rose-600">{record.failedSales}</span>
                          </div>
                          <div className="flex justify-between gap-4 items-center pt-1 border-t border-slate-100 mt-1">
                            <span className="text-slate-500">Rate:</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                              record.successRate >= 70 ? 'bg-emerald-100 text-emerald-700' : 
                              record.successRate >= 50 ? 'bg-amber-100 text-amber-700' : 
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {record.successRate}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Revenue:</span>
                            <span className="font-bold text-emerald-600">${(record.officeRevenue ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Target:</span>
                            <span className="font-medium text-slate-900">${(record.officeTargets ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-100 mt-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-500">Achievement:</span>
                              <span className="font-bold text-blue-600">{record.officeTargets > 0 ? (((record.officeRevenue ?? 0) / record.officeTargets) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(record.officeTargets > 0 ? ((record.officeRevenue / record.officeTargets) * 100) : 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={getStatusBadge(record.status)}>
                        {record.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record._id)}
                            icon={Trash2}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete"
                          />
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
          <Button
            variant="secondary"
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
          >
            Previous
          </Button>
          <div className="px-6 py-2.5 bg-white text-slate-900 rounded-lg border border-slate-200 font-bold shadow-sm flex items-center">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <Button
            variant="secondary"
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ViewSales;
