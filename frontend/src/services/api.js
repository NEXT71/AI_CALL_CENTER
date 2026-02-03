import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor - cookies are sent automatically, no need to add token
api.interceptors.request.use(
  (config) => {
    // Cookies with tokens are automatically sent by browser
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 402 Payment Required (subscription expired/trial ended)
    if (error.response?.status === 402) {
      const errorData = error.response.data;
      
      // Show user-friendly message
      if (errorData?.subscriptionExpired || errorData?.trialExpired) {
        const message = errorData.message || 'Your subscription has expired. Please renew to continue.';
        
        // Only show alert once per session
        if (!sessionStorage.getItem('subscription_expired_alert_shown')) {
          alert(`⚠️ Subscription Expired\n\n${message}`);
          sessionStorage.setItem('subscription_expired_alert_shown', 'true');
        }
        
        // Don't redirect, just reject so the component can handle it
        return Promise.reject(error);
      }
    }

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (cookies sent automatically)
        await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        // Retry original request (new token cookie should be set)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear user data and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
