import apiClient from './index';

export const register = async (username, password) => {
  const response = await apiClient.post('/auth/register', { username, password });
  return response.data;
};

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
  }
  return response.data;
};

export const createTenant = async (companyName, financialYear) => {
  const response = await apiClient.post('/auth/tenant', { companyName, financialYear });
  return response.data;
};