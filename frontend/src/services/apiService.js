import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

export const callService = {
  uploadCall: async (formData, onProgress) => {
    const response = await api.post('/calls/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  getCalls: async (params = {}) => {
    const response = await api.get('/calls', { params });
    return response.data;
  },

  getCallById: async (id) => {
    const response = await api.get(`/calls/${id}`);
    return response.data;
  },

  getCallAudio: async (id) => {
    return `${api.defaults.baseURL}/calls/${id}/audio`;
  },

  deleteCall: async (id) => {
    const response = await api.delete(`/calls/${id}`);
    return response.data;
  },
};

export const ruleService = {
  createRule: async (ruleData) => {
    const response = await api.post('/rules', ruleData);
    return response.data;
  },

  getRules: async (params = {}) => {
    const response = await api.get('/rules', { params });
    return response.data;
  },

  getRuleById: async (id) => {
    const response = await api.get(`/rules/${id}`);
    return response.data;
  },

  updateRule: async (id, ruleData) => {
    const response = await api.put(`/rules/${id}`, ruleData);
    return response.data;
  },

  deleteRule: async (id) => {
    const response = await api.delete(`/rules/${id}`);
    return response.data;
  },

  getCampaigns: async () => {
    const response = await api.get('/rules/campaigns/list');
    return response.data;
  },
};

export const reportService = {
  getCallReport: async (callId) => {
    const response = await api.get(`/reports/${callId}`);
    return response.data;
  },

  getAnalyticsSummary: async (params = {}) => {
    const response = await api.get('/reports/analytics/summary', { params });
    return response.data;
  },

  getSalesSummary: async (params = {}) => {
    const response = await api.get('/reports/sales/summary', { params });
    return response.data;
  },

  getSalesByAgent: async (params = {}) => {
    const response = await api.get('/reports/sales/by-agent', { params });
    return response.data;
  },

  getSalesByProduct: async (params = {}) => {
    const response = await api.get('/reports/sales/by-product', { params });
    return response.data;
  },

  getBestSaleCalls: async (params = {}) => {
    const response = await api.get('/reports/sales/best-calls', { params });
    return response.data;
  },
};
