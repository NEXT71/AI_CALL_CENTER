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

  logout: async () => {
    const response = await api.post('/auth/logout');
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

  // User management (Admin only)
  getUsers: async (params = {}) => {
    const response = await api.get('/auth/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.post(`/auth/users/${userId}/reset-password`, { newPassword });
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

  // System reports
  getSystemSummary: async () => {
    const response = await api.get('/reports/system/summary');
    return response.data;
  },

  getUserActivityReport: async (params = {}) => {
    const response = await api.get('/reports/system/user-activity', { params });
    return response.data;
  },

  getSubscriptionAnalytics: async () => {
    const response = await api.get('/reports/system/subscription-analytics');
    return response.data;
  },
};

export const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  createCheckoutSession: async (planType) => {
    const response = await api.post('/subscriptions/create-checkout-session', { planType });
    return response.data;
  },

  verifySubscriptionSession: async (sessionId) => {
    const response = await api.get(`/subscriptions/verify-session/${sessionId}`);
    return response.data;
  },

  activateSubscription: async (planType) => {
    const response = await api.post('/subscriptions/activate', { planType });
    return response.data;
  },

  createBillingPortalSession: async () => {
    const response = await api.post('/subscriptions/create-portal-session');
    return response.data;
  },

  getCurrentSubscription: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  reactivateSubscription: async () => {
    const response = await api.post('/subscriptions/reactivate');
    return response.data;
  },

  getInvoices: async () => {
    const response = await api.get('/subscriptions/invoices');
    return response.data;
  },

  // Admin functions - Requires payment proof FILE UPLOAD
  adminActivateSubscription: async (userId, planType, billingCycle, paymentAmount, paymentMethod, paymentReference, paymentProofFiles, transactionId = null, notes = '') => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('planType', planType);
    formData.append('billingCycle', billingCycle);
    formData.append('paymentAmount', paymentAmount);
    formData.append('paymentMethod', paymentMethod);
    formData.append('paymentReference', paymentReference);
    if (transactionId) formData.append('transactionId', transactionId);
    if (notes) formData.append('notes', notes);
    
    // Append payment proof files (MANDATORY)
    for (let i = 0; i < paymentProofFiles.length; i++) {
      formData.append('paymentProofs', paymentProofFiles[i]);
    }
    
    const response = await api.post('/subscriptions/admin-activate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPendingPayments: async () => {
    const response = await api.get('/subscriptions/pending-payments');
    return response.data;
  },

  approvePayment: async (paymentId, notes = '') => {
    const response = await api.post(`/subscriptions/admin-approve-payment/${paymentId}`, {
      notes,
    });
    return response.data;
  },

  rejectPayment: async (paymentId, reason) => {
    const response = await api.post(`/subscriptions/admin-reject-payment/${paymentId}`, {
      reason,
    });
    return response.data;
  },

  requestSubscription: async (planType, billingCycle, paymentDetails = {}) => {
    const response = await api.post('/subscriptions/request', {
      planType,
      billingCycle,
      paymentMethod: paymentDetails.paymentMethod || null,
      paymentAmount: paymentDetails.paymentAmount || null,
      paymentReference: paymentDetails.paymentReference || null,
      transactionId: paymentDetails.transactionId || null,
      notes: paymentDetails.notes || null,
    });
    return response.data;
  },
};

export const coachingService = {
  generateCoaching: async (callId) => {
    const response = await api.post(`/coaching/generate/${callId}`);
    return response.data;
  },

  getCoaching: async (callId) => {
    const response = await api.get(`/coaching/${callId}`);
    return response.data;
  },

  updateManagerNotes: async (callId, managerNotes) => {
    const response = await api.put(`/coaching/${callId}/manager-notes`, { managerNotes });
    return response.data;
  },

  getAgentCoachingStats: async (agentId, params) => {
    const response = await api.get(`/coaching/stats/agent/${agentId}`, { params });
    return response.data;
  },

  getCompanyCoachingStats: async (params) => {
    const response = await api.get('/coaching/stats/company', { params });
    return response.data;
  },

  deleteCoaching: async (callId) => {
    const response = await api.delete(`/coaching/${callId}`);
    return response.data;
  },
};

const apiService = {
  ...authService,
  ...callService,
  ...ruleService,
  ...reportService,
  ...subscriptionService,
  ...coachingService,
};

export default apiService;
