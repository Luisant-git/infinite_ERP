import apiClient from './index';

export const getSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await apiClient.put('/settings', data);
  return response.data;
};
