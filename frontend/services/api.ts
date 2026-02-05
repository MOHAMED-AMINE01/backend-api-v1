
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * BASE URL POINTS TO THE MICROK8S CLUSTER VIA NGINX INGRESS
 * IP: 172.26.80.134
 * Ingress handles routing to /users, /devices, /monitoring
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://172.26.80.134',
  timeout: 60000, // Increased to 60s for cluster stability and thick data handling
});

// Request Interceptor: Inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle Global Errors (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Using window.location to force a clean reload to login
      if (window.location.pathname !== '/login') {
        window.location.href = '#/login';
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Connection timeout to K8s cluster.');
    } else {
      toast.error(error.response?.data?.message || 'An API error occurred');
    }
    return Promise.reject(error);
  }
);

export default api;
