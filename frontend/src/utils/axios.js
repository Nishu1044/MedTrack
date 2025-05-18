import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://medtrack-dwd1.onrender.com/api',
  baseURL: 'http://localhost:8181/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 
