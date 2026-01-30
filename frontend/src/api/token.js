import apiClient from './index';

export const validateToken = async () => {
  const response = await apiClient.post('/auth/validate-token');
  return response.data;
};