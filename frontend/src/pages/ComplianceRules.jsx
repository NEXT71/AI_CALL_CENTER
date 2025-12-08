import { useState, useEffect } from 'react';
import { ruleService } from '../services/apiService';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const ComplianceRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    campaign: '',
    ruleType: 'mandatory',
    phrase: '',
    description: '',
    fuzzyTolerance: 0,
    weight: 1,
  });
  const [filter, setFilter] = useState({ campaign: '', ruleType: '' });

  useEffect(() => {
    fetchRules();
  }, [filter]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await ruleService.getRules(filter);
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await ruleService.updateRule(editingRule._id, formData);
        alert('Rule updated successfully!');
      } else {
        await ruleService.createRule(formData);
        alert('Rule created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert(error.response?.data?.message || 'Error saving rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      campaign: rule.campaign,
      ruleType: rule.ruleType,
      phrase: rule.phrase,
      description: rule.description || '',
      fuzzyTolerance: rule.fuzzyTolerance,
      weight: rule.weight,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await ruleService.deleteRule(id);
      alert('Rule deleted successfully!');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert(error.response?.data?.message || 'Error deleting rule');
    }
  };

  const resetForm = () => {
    setFormData({
      campaign: '',
      ruleType: 'mandatory',
      phrase: '',
      description: '',
      fuzzyTolerance: 0,
      weight: 1,
    });
    setEditingRule(null);
  };

  const campaigns = [...new Set(rules.map(r => r.campaign))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Rules</h1>
          <p className="text-gray-600 mt-1">Manage mandatory and forbidden phrases</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Add Rule
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign
            </label>
            <select
              className="input"
              value={filter.campaign}
              onChange={(e) => setFilter({ ...filter, campaign: e.target.value })}
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Type
            </label>
            <select
              className="input"
              value={filter.ruleType}
              onChange={(e) => setFilter({ ...filter, ruleType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="mandatory">Mandatory</option>
              <option value="forbidden">Forbidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : rules.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No rules found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phrase</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Weight</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{rule.campaign}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        rule.ruleType === 'mandatory' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {rule.ruleType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{rule.phrase}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {rule.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{rule.weight}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        rule.isActive ? 'badge-success' : 'badge-warning'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRule ? 'Edit Rule' : 'Add New Rule'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    placeholder="e.g., Sales, Customer Service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input"
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="forbidden">Forbidden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phrase <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.phrase}
                    onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                    placeholder="e.g., thank you for calling"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of this rule"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuzzy Tolerance (0-5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="input"
                      value={formData.fuzzyTolerance}
                      onChange={(e) => setFormData({ ...formData, fuzzyTolerance: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 btn btn-primary">
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceRules;
