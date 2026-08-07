import axios from 'axios';

const isProduction = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
let baseURL =
process.env.REACT_APP_API_URL || (
isProduction ? 'https://go-yatrigo.onrender.com/api' : 'http://localhost:5000/api');

if (baseURL) {
  baseURL = baseURL.replace('go-yatri-go.onrender.com', 'go-yatrigo.onrender.com');

  if (isProduction && baseURL.includes('localhost')) {
    baseURL = 'https://go-yatrigo.onrender.com/api';
  }

  baseURL = baseURL.replace(/\/+$/, '');

  if (!baseURL.endsWith('/api')) {
    baseURL = `${baseURL}/api`;
  }
}

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 120000
});

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

axiosInstance.interceptors.response.use(
(response) => response,
(error) => {
  if (error.response && error.response.status === 401) {
    console.warn("Unauthorized request. Clearing local session.");
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
}
);

export default axiosInstance;