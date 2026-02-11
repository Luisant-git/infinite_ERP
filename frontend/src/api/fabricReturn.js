import api from './index';

export const getNextDcNo = async () => {
  const response = await api.get('/fabric-return/next-dc-no');
  return response.data;
};

export const getFabricReturns = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/fabric-return', {
    params: { search, page, limit }
  });
  return response.data;
};

export const createFabricReturn = async (data) => {
  const response = await api.post('/fabric-return', data);
  return response.data;
};

export const updateFabricReturn = async (id, data) => {
  const response = await api.put(`/fabric-return/${id}`, data);
  return response.data;
};

export const deleteFabricReturn = async (id) => {
  const response = await api.delete(`/fabric-return/${id}`);
  return response.data;
};
