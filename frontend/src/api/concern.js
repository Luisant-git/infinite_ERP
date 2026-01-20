import apiClient from './index';

export const getConcerns = async (search, page = 1, limit = 1) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/concern?${params}`);
  return response.data;
};

export const createConcern = async (data) => {
  const response = await apiClient.post('/concern', data);
  return response.data;
};

export const updateConcern = async (id, data) => {
  const response = await apiClient.put(`/concern/${id}`, data);
  return response.data;
};

export const deleteConcern = async (id) => {
  const response = await apiClient.delete(`/concern/${id}`);
  return response.data;
};