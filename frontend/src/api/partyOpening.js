import apiClient from './index';

export const getPartyOpenings = async () => {
  const response = await apiClient.get('/party-opening');
  return response.data;
};

export const createPartyOpening = async (data) => {
  const response = await apiClient.post('/party-opening', data);
  return response.data;
};

export const updatePartyOpening = async (id, data) => {
  const response = await apiClient.put(`/party-opening/${id}`, data);
  return response.data;
};

export const deletePartyOpening = async (id) => {
  const response = await apiClient.delete(`/party-opening/${id}`);
  return response.data;
};
