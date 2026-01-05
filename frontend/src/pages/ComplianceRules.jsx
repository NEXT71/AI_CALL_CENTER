import { useState, useEffect } from 'react';
import { ruleService } from '../services/apiService';
import { Plus, Edit2, Trash2, Check, X, Shield, AlertTriangle, Search, Filter, Scale, FileText } from 'lucide-react';

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
        // alert('Rule updated successfully!'); // Replaced with toast ideally, but keeping simple for now
      } else {
        await ruleService.createRule(formData);
        // alert('Rule created successfully!');
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Rules</h1>
          <p className="text-slate-600 mt-1">Manage mandatory and forbidden phrases for quality assurance</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-enhanced btn-primary-enhanced flex items-center gap-2"
        >
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Shield size={24} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Active
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {rules.filter(r => r.ruleType === 'mandatory' && r.isActive).length}
          </div>
          <div className="text-sm font-medium text-slate-500">Mandatory Phrases</div>
        </div>

        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle size={24} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
              Blocked
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {rules.filter(r => r.ruleType === 'forbidden' && r.isActive).length}
          </div>
          <div className="text-sm font-medium text-slate-500">Forbidden Phrases</div>
        </div>

        <div className="kpi-card-enhanced group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform duration-300">
              <Filter size={24} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              {campaigns.length} Campaigns
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {rules.length}
          </div>
          <div className="text-sm font-medium text-slate-500">Total Rules</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-enhanced p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Filter size={18} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Filter Rules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign</label>
            <select
              className="input-enhanced w-full"
              value={filter.campaign}
              onChange={(e) => setFilter({ ...filter, campaign: e.target.value })}
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rule Type</label>
            <select
              className="input-enhanced w-full"
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

      {/* Rules Table */}
      <div className="table-container-enhanced">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-slate-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No rules found</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Create your first compliance rule to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-enhanced btn-primary-enhanced"
            >
              <Plus size={18} className="mr-2" />
              Add Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-enhanced w-full">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Type</th>
                  <th>Phrase</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} className="group hover:bg-blue-50/50 transition-colors">
                    <td>
                      <span className="font-medium text-slate-900">{rule.campaign}</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        rule.ruleType === 'mandatory' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {rule.ruleType === 'mandatory' ? (
                          <><Shield size={12} /> Mandatory</>
                        ) : (
                          <><X size={12} /> Forbidden</>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-sm">
                        {rule.phrase}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 text-sm max-w-xs truncate block" title={rule.description}>
                        {rule.description || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Scale size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-900">{rule.weight}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        rule.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {rule.isActive ? (
                          <><Check size={12} /> Active</>
                        ) : (
                          <>Inactive</>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => { setShowModal(false); resetForm(); }}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full animate-scale-in">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900" id="modal-title">
                    {editingRule ? 'Edit Compliance Rule' : 'Add New Compliance Rule'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Campaign <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="input-enhanced w-full pl-10"
                        value={formData.campaign}
                        onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                        placeholder="Sales, Customer Service, etc."
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">The campaign this rule applies to</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Rule Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ruleType: 'mandatory' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          formData.ruleType === 'mandatory'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Shield size={18} />
                        <span className="font-medium text-sm">Mandatory</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ruleType: 'forbidden' })}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          formData.ruleType === 'forbidden'
                            ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <AlertTriangle size={18} />
                        <span className="font-medium text-sm">Forbidden</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phrase <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        className="input-enhanced w-full pl-10"
                        value={formData.phrase}
                        onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                        placeholder="e.g., thank you for calling"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">The exact phrase to detect in transcriptions</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      className="input-enhanced w-full min-h-[80px]"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description explaining this rule..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input-enhanced w-full"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-slate-500 mt-1">Impact on score</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Fuzzy Tolerance (0-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        className="input-enhanced w-full"
                        value={formData.fuzzyTolerance}
                        onChange={(e) => setFormData({ ...formData, fuzzyTolerance: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-slate-500 mt-1">Word variations</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="btn-enhanced btn-secondary-enhanced flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-enhanced btn-primary-enhanced flex-1 flex justify-center items-center gap-2">
                      {editingRule ? (
                        <><Check size={18} /> Update Rule</>
                      ) : (
                        <><Plus size={18} /> Create Rule</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceRules;
