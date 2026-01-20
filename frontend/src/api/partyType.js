import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const getHeaders = () => {
  // Get tenant and user info from localStorage or Redux store
  const authState = JSON.parse(localStorage.getItem('persist:auth') || '{}');
  const selectedTenant = authState.selectedTenant ? JSON.parse(authState.selectedTenant) : null;
  const user = authState.user ? JSON.parse(authState.user) : null;
  
  if (!selectedTenant?.id) {
    throw new Error('No tenant selected. Please select a tenant first.');
  }
  
  if (!user?.id) {
    throw new Error('User not found. Please login again.');
  }
  
  return {
    'tenant-id': selectedTenant.id.toString(),
    'user-id': user.id.toString()
  };
};

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