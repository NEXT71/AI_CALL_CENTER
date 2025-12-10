import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callService, ruleService } from '../services/apiService';
import { Upload as UploadIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UploadCall = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    agentId: '',
    agentName: '',
    customerId: '',
    customerName: '',
    campaign: '',
    duration: '',
    callDate: new Date().toISOString().slice(0, 16),
    isSale: false,
    saleAmount: '',
    productSold: '',
  });
  const [audioFile, setAudioFile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await ruleService.getCampaigns();
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|ogg)$/i)) {
        setError('Please select a valid audio file (WAV, MP3, M4A, OGG)');
        return;
      }

      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    // Validate sale data
    if (formData.isSale && (!formData.saleAmount || parseFloat(formData.saleAmount) <= 0)) {
      setError('Sale amount is required for sale calls');
      return;
    }

    try {
      setUploading(true);

      const data = new FormData();
      data.append('audio', audioFile);
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      await callService.uploadCall(data, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      alert('Call uploaded successfully! Processing has started.');
      navigate('/calls');
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Call Recording</h1>
        <p className="text-gray-600 mt-1">Upload a call for automated quality and compliance analysis</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {audioFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <UploadIcon className="text-primary-600" size={24} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">{audioFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <UploadIcon className="mx-auto text-gray-400" size={48} />
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop or click to select audio file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  WAV, MP3, M4A, OGG (Max 100MB)
                </p>
              </div>
            )}
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.ogg"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            {!audioFile && (
              <label
                htmlFor="audio-upload"
                className="mt-4 inline-block btn btn-secondary cursor-pointer"
              >
                Select File
              </label>
            )}
          </div>
        </div>

        {/* Call Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              placeholder="e.g., EMP001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.agentName}
              onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID
            </label>
            <input
              type="text"
              className="input"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              placeholder="e.g., CUST001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              className="input"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g., Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input"
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
            >
              <option value="">Select Campaign</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (seconds) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              className="input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 180"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              className="input"
              value={formData.callDate}
              onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
            />
          </div>

          {/* Sale Status */}
          <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                checked={formData.isSale}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isSale: e.target.checked,
                  saleAmount: e.target.checked ? formData.saleAmount : '',
                  productSold: e.target.checked ? formData.productSold : '',
                })}
              />
              <span className="ml-2 font-medium text-gray-900">
                ✅ This call resulted in a SALE
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-6">
              Only sale calls will be processed and scored
            </p>
          </div>

          {formData.isSale && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  value={formData.saleAmount}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    saleAmount: e.target.value 
                  })}
                  placeholder="e.g., 299.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product/Service Sold
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.productSold}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    productSold: e.target.value 
                  })}
                  placeholder="e.g., Premium Package, Monthly Plan"
                />
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 btn btn-primary py-3 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/calls')}
            className="btn btn-secondary py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadCall;
