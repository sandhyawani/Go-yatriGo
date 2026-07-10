import axios from 'axios';

const isProduction = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
let baseURL =
  process.env.REACT_APP_API_URL ||
  (isProduction ? 'https://go-yatrigo.onrender.com/api' : 'http://localhost:5000/api');

// Auto-correct any configuration errors or typos in the environment variables
if (baseURL) {
  // 1. Correct the two-hyphen typo if present
  baseURL = baseURL.replace('go-yatri-go.onrender.com', 'go-yatrigo.onrender.com');
  
  // 2. Override localhost in production
  if (isProduction && baseURL.includes('localhost')) {
    baseURL = 'https://go-yatrigo.onrender.com/api';
  }
  
  // 3. Ensure trailing slashes are removed
  baseURL = baseURL.replace(/\/+$/, '');
  
  // 4. Ensure it ends with /api (only if it doesn't already)
  if (!baseURL.endsWith('/api')) {
    baseURL = `${baseURL}/api`;
  }
}

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 120000, // Increased to 2 minutes to prevent upload timeouts
});

// Request interceptor: attach token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      console.warn("Unauthorized request. Clearing local session.");
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

