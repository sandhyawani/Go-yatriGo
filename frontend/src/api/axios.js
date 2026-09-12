import axios from 'axios';
import { sanitizeCloudinaryUrls } from '../utils/toHttps';

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
      let token = null;
      let tokenExpiry = null;

      const userStr = localStorage.getItem(STORAGE_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        tokenExpiry = user?.tokenExpiry || user?.tokenExpiresAt;
        token =
          user?.token ||
          user?.accessToken ||
          user?.access_token ||
          user?.details?.token ||
          user?.data?.token;

        if (tokenExpiry && Date.now() > tokenExpiry) {
          localStorage.removeItem(STORAGE_KEY);
          window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
          return config;
        }
      }

      if (!token) {
        token =
          localStorage.getItem('token') ||
          localStorage.getItem('accessToken') ||
          localStorage.getItem('access_token');
      }

      if (token && token !== 'null' && token !== 'undefined') {
        const bearerString = `Bearer ${token}`;
        if (!config.headers) {
          config.headers = {};
        }

        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', bearerString);
        } else {
          config.headers.Authorization = bearerString;
          config.headers['authorization'] = bearerString;
        }
      }
    } catch (error) {
      console.error("[Axios] Error parsing auth state from localStorage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      response.data = sanitizeCloudinaryUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401 && !error.config?.skipAuthRedirect) {
      const errorMsg = error.response?.data?.message || error.message;
      console.warn(`[Axios 401 Unauthorized] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, errorMsg);

      let hadToken = false;
      try {
        const userStr = localStorage.getItem(STORAGE_KEY);
        if (userStr) {
          const user = JSON.parse(userStr);
          hadToken = Boolean(
            user?.token ||
            user?.accessToken ||
            user?.access_token ||
            user?.details?.token
          );
        }
        if (!hadToken) {
          hadToken = Boolean(
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken')
          );
        }
      } catch (_) {}

      if (hadToken) {
        console.warn("[Axios] Session invalid on backend. Clearing local session.");
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
