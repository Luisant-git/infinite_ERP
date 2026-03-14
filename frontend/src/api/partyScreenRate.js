import api from './index';

export const getPartyScreenRates = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/party-screen-rate', {
    params: { search, page, limit }
  });
  return response.data;
};

export const getPartyScreenRateById = async (id) => {
  const response = await api.get(`/party-screen-rate/${id}`);
  return response.data;
};

export const getPartyScreenRateByParty = async (partyId) => {
  const response = await api.get(`/party-screen-rate/party/${partyId}`);
  return response.data;
};

export const createPartyScreenRate = async (data) => {
  const response = await api.post('/party-screen-rate', data);
  return response.data;
};

export const updatePartyScreenRate = async (id, data) => {
  const response = await api.patch(`/party-screen-rate/${id}`, data);
  return response.data;
};

export const deletePartyScreenRate = async (id) => {
  const response = await api.delete(`/party-screen-rate/${id}`);
  return response.data;
};