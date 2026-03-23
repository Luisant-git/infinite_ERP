import apiClient from './index';

export const getCollections = async () => {
  const response = await apiClient.get('/collection');
  return response.data;
};

export const createCollection = async (data) => {
  const response = await apiClient.post('/collection', data);
  return response.data;
};

export const updateCollection = async (id, data) => {
  const response = await apiClient.put(`/collection/${id}`, data);
  return response.data;
};

export const deleteCollection = async (id) => {
  const response = await apiClient.delete(`/collection/${id}`);
  return response.data;
};

export const getPartyBalance = async (partyId) => {
  const response = await apiClient.get(`/collection/party-balance/${partyId}`);
  return response.data;
};
