import apiClient from './index';

export const getInwardSummary = async (params) => {
  const response = await apiClient.get('/inward-summary', { params });
  return response.data;
};
