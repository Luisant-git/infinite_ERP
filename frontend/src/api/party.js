import apiClient from './index';

export const getParties = async (search, page = 1, limit = 10) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/party?${params}`);
  return response.data;
};

export const createParty = async (data) => {
  const response = await apiClient.post('/party', data);
  return response.data;
};

export const updateParty = async (id, data) => {
  const response = await apiClient.put(`/party/${id}`, data);
  return response.data;
};

export const deleteParty = async (id) => {
  const response = await apiClient.delete(`/party/${id}`);
  return response.data;
};