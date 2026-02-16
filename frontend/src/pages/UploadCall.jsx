import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { callService, ruleService } from '../services/apiService';
import { 
  Upload as UploadIcon, X, File, Check, Clock, 
  FileAudio, User, Hash, Calendar, Tag,
  AlertCircle, CheckCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DOMPurify from 'dompurify';

const UploadCall = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    agentName: '',
    campaign: '',
    callDate: new Date().toISOString().slice(0, 16),
  });
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Predefined campaigns
  const CAMPAIGNS = ['ACA', 'Medicare', 'Final Expense'];

  // Agent names list
  const [agents, setAgents] = useState([
    'John Smith',
    'Sarah Johnson',
    'Michael Brown',
    'Emily Davis',
    'Robert Wilson',
    'Jessica Martinez',
    'David Anderson',
    'Lisa Taylor'
  ]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');

  const handleAddAgent = () => {
    if (newAgentName.trim() && !agents.includes(newAgentName.trim())) {
      setAgents([...agents, newAgentName.trim()]);
      setFormData({ ...formData, agentName: newAgentName.trim() });
      setNewAgentName('');
      setShowAddAgent(false);
      // Save to localStorage for persistence
      localStorage.setItem('agentNames', JSON.stringify([...agents, newAgentName.trim()]));
    }
  };

  const handleRemoveAgent = (agentToRemove) => {
    const updatedAgents = agents.filter(a => a !== agentToRemove);
    setAgents(updatedAgents);
    localStorage.setItem('agentNames', JSON.stringify(updatedAgents));
    if (formData.agentName === agentToRemove) {
      setFormData({ ...formData, agentName: '' });
    }
  };

  // Load saved agents from localStorage
  useEffect(() => {
    const savedAgents = localStorage.getItem('agentNames');
    if (savedAgents) {
      try {
        setAgents(JSON.parse(savedAgents));
      } catch (e) {
        console.error('Error loading saved agents:', e);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Strict file type validation
    const allowedExtensions = ['wav', 'mp3', 'm4a', 'ogg'];
    const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/ogg'];
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Only ${allowedExtensions.join(', ').toUpperCase()} files are allowed.`);
      return;
    }
    
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      setError('Invalid file MIME type. Please upload a valid audio file.');
      return;
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    // Check minimum file size (1KB to prevent empty files)
    if (file.size < 1024) {
      setError('File is too small. Please upload a valid audio file.');
      return;
    }

    setAudioFile(file);
    setError('');

    // Try to get audio duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setFormData(prev => ({ ...prev, duration: Math.floor(audio.duration) }));
    };
    audio.onerror = () => {
      setError('Unable to read audio file. Please ensure it is a valid audio file.');
      setAudioFile(null);
    };
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    if (!formData.agentName) {
      setError('Please select an agent');
      return;
    }

    if (!formData.campaign) {
      setError('Please select a campaign');
      return;
    }

    try {
      setUploading(true);

      // Sanitize text inputs before sending
      const sanitizedData = {
        agentName: DOMPurify.sanitize(formData.agentName, { ALLOWED_TAGS: [] }),
        campaign: DOMPurify.sanitize(formData.campaign, { ALLOWED_TAGS: [] }),
        callDate: formData.callDate,
      };

      const data = new FormData();
      data.append('audio', audioFile);
      Object.keys(sanitizedData).forEach(key => {
        data.append(key, sanitizedData[key]);
      });

      await callService.uploadCall(data, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      alert('Call uploaded successfully! Processing has started.');
      navigate('/app/calls');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Call Recording</h1>
          <p className="text-slate-600 mt-1">Upload and process call recordings with AI-powered quality analysis</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 animate-slide-in-right">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        <div className="card-enhanced p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileAudio size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Audio File</h2>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : audioFile 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {audioFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-bounce-small">
                    <Check size={32} />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{audioFile.name}</p>
                  <p className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-2">
                    <File size={14} />
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    {formData.duration && (
                      <>
                        <span className="mx-1">•</span>
                        <Clock size={14} />
                        {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toString().padStart(2, '0')}
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAudioFile(null);
                    setFormData(prev => ({ ...prev, duration: '' }));
                  }}
                  className="btn-enhanced btn-secondary-enhanced py-2 px-4 text-sm"
                >
                  <X size={16} className="mr-2" />
                  Remove File
                </button>
              </div>
            ) : (
              <div>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                  <UploadIcon size={32} />
                </div>
                <p className="text-lg font-bold text-slate-900 mb-2">
                  Drag & drop audio file here
                </p>
                <p className="text-slate-500 mb-6">
                  or click the button below to browse
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-6">
                  Supported formats: WAV, MP3, M4A, OGG • Max size: 100MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.ogg"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            
            {!audioFile && (
              <label
                htmlFor="audio-upload"
                className="inline-flex items-center justify-center btn-enhanced btn-primary-enhanced cursor-pointer"
              >
                <UploadIcon size={18} className="mr-2" />
                Select Audio File
              </label>
            )}
          </div>
        </div>

        {/* Call Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent & Campaign */}
          <div className="card-enhanced p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Agent & Campaign</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Agent Name <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    required
                    className="input-enhanced w-full"
                    value={formData.agentName}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAddAgent(true);
                      } else {
                        setFormData({ ...formData, agentName: e.target.value });
                      }
                    }}
                  >
                    <option value="">Select Agent...</option>
                    {agents.map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                    <option value="__add_new__">+ Add New Agent</option>
                  </select>

                  {/* Quick agent management */}
                  {formData.agentName && formData.agentName !== '__add_new__' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove ${formData.agentName} from the list?`)) {
                          handleRemoveAgent(formData.agentName);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove this agent from list
                    </button>
                  )}

                  {/* Add new agent inline */}
                  {showAddAgent && (
                    <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="text"
                        placeholder="Enter agent name..."
                        className="input-enhanced flex-1 text-sm"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAgent()}
                      />
                      <button
                        type="button"
                        onClick={handleAddAgent}
                        className="btn-enhanced bg-blue-600 text-white px-3 py-1 text-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAgent(false);
                          setNewAgentName('');
                        }}
                        className="btn-enhanced bg-slate-200 text-slate-700 px-3 py-1 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Campaign <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="input-enhanced w-full"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                >
                  <option value="">Select Campaign...</option>
                  {CAMPAIGNS.map(campaign => (
                    <option key={campaign} value={campaign}>{campaign}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Call Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-enhanced w-full"
                  value={formData.callDate}
                  onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="card-enhanced p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="font-bold text-slate-900">Uploading...</span>
              </div>
              <span className="font-bold text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 mt-3 font-medium">
              Please wait while your call is being uploaded and queued for processing
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={uploading || !audioFile}
            className="flex-1 btn-enhanced btn-primary-enhanced py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            {uploading ? (
              <>
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <UploadIcon size={24} />
                Upload & Process Call
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/calls')}
            disabled={uploading}
            className="btn-enhanced btn-secondary-enhanced px-8 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadCall;
