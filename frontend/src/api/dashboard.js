import apiClient from './index';

export const getApprovalsPending = async () => {
  const response = await apiClient.get('/dashboard/approvals');
  return response.data;
};
