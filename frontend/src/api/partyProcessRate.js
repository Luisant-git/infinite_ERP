import apiClient from './index';

export const getPartyProcessRates = async (partyId) => {
  const response = await apiClient.get(`/party-process-rate`, { params: { partyId } });
  return response.data;
};

export const createPartyProcessRate = async (data) => {
  const response = await apiClient.post('/party-process-rate', data);
  return response.data;
};

export const updatePartyProcessRate = async (id, data) => {
  const response = await apiClient.put(`/party-process-rate/${id}`, data);
  return response.data;
};

export const deletePartyProcessRate = async (id) => {
  const response = await apiClient.delete(`/party-process-rate/${id}`);
  return response.data;
};

export const copyPartyProcessRates = async (fromPartyId, toPartyId) => {
  const response = await apiClient.post('/party-process-rate/copy', { fromPartyId, toPartyId });
  return response.data;
};
