import api from './index';

export const getNextDcNo = async () => {
  const response = await api.get('/fabric-dc/next-dc-no');
  return response.data;
};

export const getFabricDcs = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/fabric-dc', {
    params: { search, page, limit }
  });
  return response.data;
};

export const createFabricDc = async (data) => {
  const response = await api.post('/fabric-dc', data);
  return response.data;
};

export const updateFabricDc = async (id, data) => {
  const response = await api.put(`/fabric-dc/${id}`, data);
  return response.data;
};

export const deleteFabricDc = async (id) => {
  const response = await api.delete(`/fabric-dc/${id}`);
  return response.data;
};
