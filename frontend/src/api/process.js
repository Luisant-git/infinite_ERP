import apiClient from './index';

export const getProcesses = async (search, page, limit) => {
  const response = await apiClient.get(`/process`, { params: { search, page, limit } });
  return response.data;
};

export const createProcess = async (data) => {
  const response = await apiClient.post('/process', data);
  return response.data;
};

export const updateProcess = async (id, data) => {
  const response = await apiClient.put(`/process/${id}`, data);
  return response.data;
};

export const deleteProcess = async (id) => {
  const response = await apiClient.delete(`/process/${id}`);
  return response.data;
};
