import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const getHeaders = () => ({
  'tenant-id': '1', // This should come from user context/store
  'user-id': '1'   // This should come from user context/store
});

export const getPartyTypes = async (search = '', page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/party-types`, {
    params: { search, page, limit },
    headers: getHeaders()
  });
  return response.data;
};

export const createPartyType = async (partyTypeData) => {
  const response = await axios.post(`${API_BASE_URL}/party-types`, partyTypeData, {
    headers: getHeaders()
  });
  return response.data;
};

export const updatePartyType = async (id, partyTypeData) => {
  const response = await axios.patch(`${API_BASE_URL}/party-types/${id}`, partyTypeData, {
    headers: getHeaders()
  });
  return response.data;
};

export const deletePartyType = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/party-types/${id}`, {
    headers: getHeaders()
  });
  return response.data;
};