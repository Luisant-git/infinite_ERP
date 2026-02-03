import api from './index';

export const getNextGrnNo = async () => {
  const response = await api.get('/fabric-inward/next-grn');
  return response.data;
};

export const getFabricInwards = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/fabric-inward', { params: { search, page, limit } });
  return response.data;
};

export const getFabricInward = async (id) => {
  const response = await api.get(`/fabric-inward/${id}`);
  return response.data;
};

export const createFabricInward = async (data) => {
  const response = await api.post('/fabric-inward', data);
  return response.data;
};

export const updateFabricInward = async (id, data) => {
  const response = await api.put(`/fabric-inward/${id}`, data);
  return response.data;
};

export const deleteFabricInward = async (id) => {
  const response = await api.delete(`/fabric-inward/${id}`);
  return response.data;
};

export const getMastersByType = async (type) => {
  const response = await api.get(`/master/${type}`);
  return response.data;
};

export const createMaster = async (data) => {
  const response = await api.post('/master', data);
  return response.data;
};
