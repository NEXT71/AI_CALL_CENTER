import { useState, useEffect } from 'react';
import { ruleService } from '../services/apiService';
import { Plus, Edit2, Trash2, Check, X, Shield, AlertTriangle, Search, Filter } from 'lucide-react';

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
      {/* Page Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Compliance Rules</h1>
          <p className="page-subtitle">Manage mandatory and forbidden phrases for quality assurance</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Add Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-container icon-container-blue">
              <Shield size={20} />
            </div>
            <span className="badge badge-info">Active</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {rules.filter(r => r.ruleType === 'mandatory' && r.isActive).length}
          </div>
          <div className="caption-text">Mandatory Phrases</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-container icon-container-red">
              <AlertTriangle size={20} />
            </div>
            <span className="badge badge-danger">Blocked</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {rules.filter(r => r.ruleType === 'forbidden' && r.isActive).length}
          </div>
          <div className="caption-text">Forbidden Phrases</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="icon-container icon-container-slate">
              <Filter size={20} />
            </div>
            <span className="badge badge-neutral">{campaigns.length}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {rules.length}
          </div>
          <div className="caption-text">Total Rules</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="icon-container icon-container-blue">
            <Filter size={18} />
          </div>
          <h2 className="heading-4">Filter Rules</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Campaign</label>
            <select
              className="select"
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
            <label className="input-label">Rule Type</label>
            <select
              className="select"
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
      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner h-12 w-12"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16">
            <div className="icon-container icon-container-slate mx-auto mb-4">
              <Shield size={32} />
            </div>
            <p className="heading-4 mb-2">No rules found</p>
            <p className="body-text text-slate-600">Create your first compliance rule to get started</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Type</th>
                <th>Phrase</th>
                <th>Description</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id}>
                  <td>
                    <span className="font-medium text-slate-900">{rule.campaign}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      rule.ruleType === 'mandatory' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {rule.ruleType === 'mandatory' ? (
                        <><Shield size={12} /> Mandatory</>
                      ) : (
                        <><X size={12} /> Forbidden</>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-slate-900">{rule.phrase}</span>
                  </td>
                  <td>
                    <span className="body-text text-slate-600">
                      {rule.description || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{rule.weight}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      rule.isActive ? 'badge-success' : 'badge-warning'
                    }`}>
                      {rule.isActive ? (
                        <><Check size={12} /> Active</>
                      ) : (
                        <>Inactive</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="btn btn-ghost text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="btn btn-ghost text-red-600 hover:text-red-700"
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">
                    {editingRule ? 'Edit Compliance Rule' : 'Add New Compliance Rule'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-ghost p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="input-label">
                      Campaign <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.campaign}
                      onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                      placeholder="Sales, Customer Service, etc."
                    />
                    <p className="input-hint">The campaign this rule applies to</p>
                  </div>

                  <div>
                    <label className="input-label">
                      Rule Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="select"
                      value={formData.ruleType}
                      onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                    >
                      <option value="mandatory">Mandatory - Must be present in call</option>
                      <option value="forbidden">Forbidden - Must not be present in call</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">
                      Phrase <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.phrase}
                      onChange={(e) => setFormData({ ...formData, phrase: e.target.value })}
                      placeholder="thank you for calling"
                    />
                    <p className="input-hint">The phrase to detect in transcriptions</p>
                  </div>

                  <div>
                    <label className="input-label">Description</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description explaining this rule..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Weight (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      />
                      <p className="input-hint">Impact on quality score</p>
                    </div>

                    <div>
                      <label className="input-label">Fuzzy Tolerance (0-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        className="input"
                        value={formData.fuzzyTolerance}
                        onChange={(e) => setFormData({ ...formData, fuzzyTolerance: parseInt(e.target.value) })}
                      />
                      <p className="input-hint">Allowed word variations</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button type="submit" className="flex-1 btn btn-primary">
                      {editingRule ? (
                        <><Check size={18} /> Update Rule</>
                      ) : (
                        <><Plus size={18} /> Create Rule</>
                      )}
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
        </div>
      )}
    </div>
  );
};

export default ComplianceRules;
