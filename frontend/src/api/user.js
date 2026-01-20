import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getUsers = async (search = '', page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/auth/users`, {
    params: { search, page, limit }
  });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/auth/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await axios.patch(`${API_BASE_URL}/auth/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/auth/users/${id}`);
  return response.data;
};