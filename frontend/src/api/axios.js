import axios from 'axios';

// Use environment variable if available, but ignore localhost when running on Vercel production
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app');
let baseURL = process.env.REACT_APP_API_URL;
if (!baseURL || (isProduction && baseURL.includes('localhost'))) {
  baseURL = 'https://go-yatrigo.onrender.com/api';
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
