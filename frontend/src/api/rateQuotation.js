import api from './index';

export const getNextQuotNo = async () => {
  const response = await api.get('/rate-quotations/next-quot-no');
  return response.data;
};

export const getRateQuotations = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/rate-quotations', {
    params: { search, page, limit }
  });
  return response.data;
};

export const createRateQuotation = async (data) => {
  const response = await api.post('/rate-quotations', data);
  return response.data;
};

export const updateRateQuotation = async (id, data) => {
  const response = await api.put(`/rate-quotations/${id}`, data);
  return response.data;
};

export const deleteRateQuotation = async (id) => {
  const response = await api.delete(`/rate-quotations/${id}`);
  return response.data;
};
