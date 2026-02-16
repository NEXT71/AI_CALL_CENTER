// Example: Refactored AddSales.jsx using new components
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as salesService from '../services/salesService';
import api from '../services/api';
import { Save, X, Calendar, User, Briefcase, BarChart2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

// Import new UI components
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, Textarea } from '../components/ui';

const AddSalesRefactored = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [agents, setAgents] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOfficeData, setIsOfficeData] = useState(false);
  const [formData, setFormData] = useState({
    agentName: '',
    campaign: '',
    salesDate: new Date().toISOString().split('T')[0],
    totalCalls: '',
    successfulSales: '',
    failedSales: '',
    notes: '',
  });

  useEffect(() => {
    // Fetch agents and campaigns
    api.get('/auth/users?role=Agent')
      .then((response) => setAgents(response.data.data || []))
      .catch(() => setAgents([]));
    
    salesService.getCampaigns()
      .then((response) => setCampaigns(response.data || []))
      .catch(() => setCampaigns([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const salesData = {
        recordType: 'agent',
        agentName: formData.agentName.trim(),
        campaign: formData.campaign,
        salesDate: formData.salesDate,
        totalCalls: parseInt(formData.totalCalls),
        successfulSales: parseInt(formData.successfulSales),
        failedSales: parseInt(formData.failedSales),
        notes: formData.notes,
      };

      await salesService.createSalesRecord(salesData);
      success('Sales record created successfully!');
      setTimeout(() => navigate('/app/sales-data'), 1500);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create sales record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle>Add Sales Record</CardTitle>
              <CardDescription>Enter daily sales data for an agent</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Agent Name"
                icon={User}
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                placeholder="e.g., John Smith"
                required
              />

              <Input
                label="Campaign"
                icon={Briefcase}
                list="campaigns"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                placeholder="e.g., Inbound Sales"
                required
              />
              <datalist id="campaigns">
                {campaigns.map((campaign, idx) => (
                  <option key={idx} value={campaign} />
                ))}
              </datalist>

              <Input
                label="Date"
                icon={Calendar}
                type="date"
                value={formData.salesDate}
                onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Total Calls"
                type="number"
                value={formData.totalCalls}
                onChange={(e) => setFormData({ ...formData, totalCalls: e.target.value })}
                min="0"
                placeholder="0"
                required
              />

              <Input
                label="Successful Sales"
                type="number"
                value={formData.successfulSales}
                onChange={(e) => setFormData({ ...formData, successfulSales: e.target.value })}
                min="0"
                placeholder="0"
                required
              />

              <Input
                label="Failed Sales"
                type="number"
                value={formData.failedSales}
                onChange={(e) => setFormData({ ...formData, failedSales: e.target.value })}
                min="0"
                placeholder="0"
                required
              />
            </div>

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              maxLength={1000}
              showCount
              placeholder="Additional notes..."
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/app/sales-data')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
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

export default AddSalesRefactored;
