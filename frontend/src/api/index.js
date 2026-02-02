import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// List of endpoints that don't need tenant-id
const noTenantEndpoints = ['/concern', '/party', '/party-types', '/auth', '/design', '/upload'];

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Only add tenant-id for endpoints that need it
  const needsTenant = !noTenantEndpoints.some(endpoint => config.url?.startsWith(endpoint));
  if (tenantId && needsTenant) {
    config.headers['tenant-id'] = tenantId;
  }
  
  return config;
});

export default apiClient;