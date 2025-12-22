import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import api from '../services/api';
import { Save, X, Calendar, User, Briefcase, Phone, CheckCircle, XCircle, ArrowUpCircle, PhoneCall } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const AddSales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [agents, setAgents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    agentId: '',
    campaign: '',
    salesDate: new Date().toISOString().split('T')[0],
    totalCalls: '',
    successfulSales: '',
    failedSales: '',
    warmTransfers: '',
    callbacksScheduled: '',
    notes: '',
  });

  useEffect(() => {
    // Fetch agents list
    api.get('/auth/users?role=Agent')
      .then((response) => setAgents(response.data.data || []))
      .catch(() => setAgents([]));
    
    // Fetch campaigns list
    salesService.getCampaigns()
      .then((response) => setCampaigns(response.data || []))
      .catch(() => setCampaigns([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      const totalCalls = parseInt(formData.totalCalls) || 0;
      const successfulSales = parseInt(formData.successfulSales) || 0;
      const failedSales = parseInt(formData.failedSales) || 0;
      const warmTransfers = parseInt(formData.warmTransfers) || 0;
      const callbacksScheduled = parseInt(formData.callbacksScheduled) || 0;

      // Enhanced validation
      if (totalCalls < (successfulSales + failedSales)) {
        throw new Error('Total calls must be greater than or equal to successful + failed sales');
      }

      if (warmTransfers > totalCalls) {
        throw new Error('Warm transfers cannot exceed total calls');
      }

      if (callbacksScheduled > totalCalls) {
        throw new Error('Callbacks scheduled cannot exceed total calls');
      }

      if (successfulSales + failedSales > totalCalls) {
        throw new Error('Successful + Failed sales cannot exceed total calls');
      }

      const salesData = {
        agentId: formData.agentId,
        campaign: formData.campaign,
        salesDate: formData.salesDate,
        totalCalls,
        successfulSales,
        failedSales,
        warmTransfers,
        callbacksScheduled,
        notes: formData.notes,
      };

      await salesService.createSalesRecord(salesData);
      
      // Success feedback
      success('Sales record created successfully!');
      setTimeout(() => navigate('/app/sales-data'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create sales record';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const successRate = formData.totalCalls > 0 
    ? ((parseInt(formData.successfulSales) || 0) / (parseInt(formData.totalCalls) || 1) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Sales Record</h1>
            <p className="text-sm text-gray-600 mt-1">Enter daily sales data for an agent</p>
          </div>
          <button
            onClick={() => navigate('/sales-data')}
            className="btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent & Campaign Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Agent *
              </label>
              <select
                name="agentId"
                value={formData.agentId}
                onChange={handleChange}
                required
                className="input w-full"
              >
                <option value="">Select Agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} - {agent.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Campaign *
              </label>
              <input
                type="text"
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                list="campaigns"
                required
                placeholder="e.g., Inbound Sales"
                className="input w-full"
              />
              <datalist id="campaigns">
                {campaigns.map((campaign, idx) => (
                  <option key={idx} value={campaign} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                name="salesDate"
                value={formData.salesDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
                className="input w-full"
              />
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Total Calls *
                </label>
                <input
                  type="number"
                  name="totalCalls"
                  value={formData.totalCalls}
                  onChange={handleChange}
                  min="0"
                  required
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                  Successful Sales *
                </label>
                <input
                  type="number"
                  name="successfulSales"
                  value={formData.successfulSales}
                  onChange={handleChange}
                  min="0"
                  required
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <XCircle className="w-4 h-4 inline mr-1 text-red-600" />
                  Failed Sales *
                </label>
                <input
                  type="number"
                  name="failedSales"
                  value={formData.failedSales}
                  onChange={handleChange}
                  min="0"
                  required
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ArrowUpCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  Warm Transfers
                </label>
                <input
                  type="number"
                  name="warmTransfers"
                  value={formData.warmTransfers}
                  onChange={handleChange}
                  min="0"
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneCall className="w-4 h-4 inline mr-1 text-purple-600" />
                  Callbacks Scheduled
                </label>
                <input
                  type="number"
                  name="callbacksScheduled"
                  value={formData.callbacksScheduled}
                  onChange={handleChange}
                  min="0"
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              {/* Success Rate Display */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Success Rate
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {successRate}%
                  </div>
                  <div className="text-xs text-blue-800 mt-1">Auto-calculated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              maxLength="1000"
              className="input w-full"
              placeholder="Any additional comments or observations..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.notes.length}/1000 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/sales-data')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Sales Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSales;
