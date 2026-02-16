import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import api from '../services/api';
import { Save, X, Calendar, User, Briefcase, Phone, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Alert } from '../components/ui';

const AddSales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [agents, setAgents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOfficeData, setIsOfficeData] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    agentName: '',
    campaign: '',
    salesDate: new Date().toISOString().split('T')[0],
    totalCalls: '',
    successfulSales: '',
    failedSales: '',
    officeRevenue: '',
    officeTargets: '',
    officeNotes: '',
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

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Real-time validation for specific fields
    if (name === 'totalCalls' || name === 'successfulSales' || name === 'failedSales') {
      const totalCalls = name === 'totalCalls' ? parseInt(value) || 0 : parseInt(formData.totalCalls) || 0;
      const successfulSales = name === 'successfulSales' ? parseInt(value) || 0 : parseInt(formData.successfulSales) || 0;
      const failedSales = name === 'failedSales' ? parseInt(value) || 0 : parseInt(formData.failedSales) || 0;

      if (totalCalls > 0 && (successfulSales + failedSales) > totalCalls) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: 'Successful + Failed sales cannot exceed total calls',
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!isOfficeData && !formData.agentName?.trim()) {
        throw new Error('Please enter an agent name');
      }
      if (!formData.campaign) {
        throw new Error('Please select a campaign');
      }
      if (!formData.salesDate) {
        throw new Error('Please select a sales date');
      }

      const totalCalls = parseInt(formData.totalCalls) || 0;
      const successfulSales = parseInt(formData.successfulSales) || 0;
      const failedSales = parseInt(formData.failedSales) || 0;

      // Enhanced validation for agent data
      if (!isOfficeData) {
        if (totalCalls < (successfulSales + failedSales)) {
          throw new Error('Total calls must be greater than or equal to successful + failed sales');
        }
        if (successfulSales + failedSales > totalCalls) {
          throw new Error('Successful + Failed sales cannot exceed total calls');
        }
      }

      const salesData = isOfficeData ? {
        recordType: 'office',
        campaign: formData.campaign,
        salesDate: formData.salesDate,
        officeRevenue: parseFloat(formData.officeRevenue) || 0,
        officeTargets: parseInt(formData.officeTargets) || 0,
        officeNotes: formData.officeNotes,
      } : {
        recordType: 'agent',
        agentName: formData.agentName.trim(),
        campaign: formData.campaign,
        salesDate: formData.salesDate,
        totalCalls,
        successfulSales,
        failedSales,
        notes: formData.notes,
      };

      await salesService.createSalesRecord(salesData);
      
      // Success feedback
      success(isOfficeData ? 'Office sales data added successfully!' : 'Sales record created successfully!');
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
    <div className="max-w-4xl mx-auto animate-fade-in">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BarChart2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle>
                  {isOfficeData ? 'Add Office Sales Data' : 'Add Sales Record'}
                </CardTitle>
                <CardDescription>
                  {isOfficeData ? 'Enter office-wide sales metrics and performance data' : 'Enter daily sales data for an agent'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsOfficeData(!isOfficeData)}
                className={isOfficeData ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
              >
                {isOfficeData ? '📊 Office Data' : '👤 Agent Data'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/app/sales-data')}
                icon={X}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="error" className="mb-6" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Agent & Campaign Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isOfficeData && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <User className="w-4 h-4 inline mr-1.5 text-blue-600" />
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleChange}
                    list="agents"
                    required
                    placeholder="e.g., John Smith"
                    className="input-enhanced w-full"
                  />
                  <datalist id="agents">
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent.name}>
                        {agent.email}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1.5 text-blue-600" />
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
                  className="input-enhanced w-full"
                />
                <datalist id="campaigns">
                  {campaigns.map((campaign, idx) => (
                    <option key={idx} value={campaign} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5 text-blue-600" />
                  Date *
                </label>
                <input
                  type="date"
                  name="salesDate"
                  value={formData.salesDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="input-enhanced w-full"
                />
              </div>
            </div>

            {/* Sales Metrics */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="section-header-enhanced mb-6">Sales Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Total Calls"
                  type="number"
                  name="totalCalls"
                  value={formData.totalCalls}
                  onChange={handleChange}
                  min="0"
                  required
                  error={fieldErrors.totalCalls}
                  placeholder="0"
                />

                <Input
                  label="Successful Sales"
                  type="number"
                  name="successfulSales"
                  value={formData.successfulSales}
                  onChange={handleChange}
                  min="0"
                  required
                  error={fieldErrors.successfulSales}
                  placeholder="0"
                />

                <Input
                  label="Failed Sales"
                  type="number"
                  name="failedSales"
                  value={formData.failedSales}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="0"
                />

                {/* Success Rate Display */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Success Rate
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">
                      {successRate}%
                    </div>
                    <div className="text-xs text-blue-600/80 mt-1 font-medium">Auto-calculated</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                maxLength="1000"
                className="input-enhanced w-full"
                placeholder="Any additional comments or observations..."
              />
              <div className="text-xs text-slate-400 mt-1 text-right">
                {formData.notes.length}/1000 characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/app/sales-data')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={Save}
              >
                Save Sales Record
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSales;
