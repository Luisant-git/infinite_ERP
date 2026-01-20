import apiClient from './index';

export const getPartyTypes = async (search = '', page = 1, limit = 10) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/party-types?${params}`);
  return response.data;
};

export const createPartyType = async (partyTypeData) => {
  const response = await apiClient.post('/party-types', partyTypeData);
  return response.data;
};

export const updatePartyType = async (id, partyTypeData) => {
  const response = await apiClient.patch(`/party-types/${id}`, partyTypeData);
  return response.data;
};

export const deletePartyType = async (id) => {
  const response = await apiClient.delete(`/party-types/${id}`);
  return response.data;
};