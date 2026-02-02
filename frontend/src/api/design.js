import api from './index';

export const getDesigns = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/design', { params: { search, page, limit } });
  return response.data;
};

export const getDesignById = async (id) => {
  const response = await api.get(`/design/${id}`);
  return response.data;
};

export const createDesign = async (data) => {
  const response = await api.post('/design', data);
  return response.data;
};

export const updateDesign = async (id, data) => {
  const response = await api.patch(`/design/${id}`, data);
  return response.data;
};

export const deleteDesign = async (id) => {
  const response = await api.delete(`/design/${id}`);
  return response.data;
};
