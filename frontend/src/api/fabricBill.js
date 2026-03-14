import apiClient from './index';

export const getNextBillNo = async () => {
  const response = await apiClient.get('/fabric-bill/next-bill-no');
  return response.data;
};

export const getFabricBills = async (search = '', page = 1, limit = 100) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await apiClient.get(`/fabric-bill?${params}`);
  return response.data;
};

export const getFabricBill = async (id) => {
  const response = await apiClient.get(`/fabric-bill/${id}`);
  return response.data;
};

export const getAvailableDcs = async (partyId, excludeBillId = null) => {
  const params = new URLSearchParams();
  if (excludeBillId) {
    params.append('excludeBillId', excludeBillId.toString());
  }
  
  const queryString = params.toString();
  const url = `/fabric-bill/available-dcs/${partyId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response.data;
};

export const createFabricBill = async (data) => {
  const response = await apiClient.post('/fabric-bill', data);
  return response.data;
};

export const updateFabricBill = async (id, data) => {
  const response = await apiClient.patch(`/fabric-bill/${id}`, data);
  return response.data;
};

export const deleteFabricBill = async (id) => {
  const response = await apiClient.delete(`/fabric-bill/${id}`);
  return response.data;
};
