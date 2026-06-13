import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let accessToken = null;
let refreshSubscribers = [];
let isRefreshing = false;

export const setAccessTokenInMemo = (token) => {
  accessToken = token;
};

export const getAccessTokenFromMemo = () => accessToken;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject bearer token from memory
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFromMemo();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically refresh on 401 expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request has not been retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on auth endpoints
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue original request if refresh is already in progress
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Hit refresh endpoint to trigger Token Rotation
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.data.token;
        setAccessTokenInMemo(newAccessToken);
        
        // Notify subscribers and flush queue
        isRefreshing = false;
        refreshSubscribers.forEach((callback) => callback(newAccessToken));
        refreshSubscribers = [];

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        setAccessTokenInMemo(null);
        
        // Dispatch custom event to force auth logout trigger
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:force-logout'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
