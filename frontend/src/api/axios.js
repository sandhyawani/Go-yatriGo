import axios from 'axios';

const STORAGE_KEY = 'user';
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

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
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.tokenExpiry && Date.now() > user.tokenExpiry) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
        return config;
      }
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
    if (error.response && error.response.status === 401 && !error.config?.skipAuthRedirect) {
      console.warn("Unauthorized request. Clearing local session.");
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));

      const isPublicAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname.startsWith('/reset-password');

      if (!isPublicAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

axiosInstance.isCancel = axios.isCancel;
axiosInstance.CancelToken = axios.CancelToken;
axiosInstance.AxiosError = axios.AxiosError;

export const isCancel = axios.isCancel;
export { axios };
export default axiosInstance;
