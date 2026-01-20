import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getPartyTypes = async (search = '', page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/party-types`, {
    params: { search, page, limit }
  });
  return response.data;
};

export const createPartyType = async (partyTypeData) => {
  const response = await axios.post(`${API_BASE_URL}/party-types`, partyTypeData);
  return response.data;
};

export const updatePartyType = async (id, partyTypeData) => {
  const response = await axios.patch(`${API_BASE_URL}/party-types/${id}`, partyTypeData);
  return response.data;
};

export const deletePartyType = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/party-types/${id}`);
  return response.data;
};