import apiClient from './index';

export const getCompanies = async () => {
  const response = await apiClient.get('/auth/companies');
  return response.data;
};

export const getTenants = async () => {
  const response = await apiClient.get('/auth/tenants');
  return response.data;
};