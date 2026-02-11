import apiClient from './index';

export const getGstMasters = async (search = '', page = 1, limit = 100) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/gst-master?${params}`);
  return response.data;
};

export const createGstMaster = async (data) => {
  const response = await apiClient.post('/gst-master', data);
  return response.data;
};

export const updateGstMaster = async (id, data) => {
  const response = await apiClient.patch(`/gst-master/${id}`, data);
  return response.data;
};

export const deleteGstMaster = async (id) => {
  const response = await apiClient.delete(`/gst-master/${id}`);
  return response.data;
};
