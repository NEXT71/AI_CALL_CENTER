import api from './api';

// Create sales record
export const createSalesRecord = async (salesData) => {
  const response = await api.post('/sales', salesData);
  return response.data;
};

// Get all sales records (with filters)
export const getSalesRecords = async (filters = {}) => {
  const response = await api.get('/sales', { params: filters });
  return response.data;
};

// Get single sales record
export const getSalesRecordById = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

// Update sales record
export const updateSalesRecord = async (id, salesData) => {
  const response = await api.put(`/sales/${id}`, salesData);
  return response.data;
};

// Add QA review
export const addQAReview = async (id, reviewData) => {
  const response = await api.post(`/sales/${id}/review`, reviewData);
  return response.data;
};

// Delete sales record
export const deleteSalesRecord = async (id) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data;
};

// Get sales analytics
export const getSalesAnalytics = async (filters = {}) => {
  const response = await api.get('/sales/analytics', { params: filters });
  return response.data;
};

// Get campaigns list
export const getCampaigns = async () => {
  const response = await api.get('/sales/campaigns');
  return response.data;
};

// Export sales data
export const exportSalesData = async (filters = {}) => {
  const response = await api.get('/sales/export', {
    params: filters,
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sales-data-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, message: 'Export successful' };
};
