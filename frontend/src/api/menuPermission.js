import apiClient from './index';

export const getUsers = async () => {
  const response = await apiClient.get('/menu-permission/users');
  return response.data;
};

export const getMenus = async () => {
  const response = await apiClient.get('/menu-permission/menus');
  return response.data;
};

export const getUserPermissions = async (userId) => {
  const response = await apiClient.get(`/menu-permission/${userId}`);
  return response.data;
};

export const updatePermissions = async (permissions) => {
  const response = await apiClient.post('/menu-permission', permissions);
  return response.data;
};