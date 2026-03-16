import api from './index';

// E-invoice Settings API
export const createEinvoiceSettings = async (data) => {
  const response = await api.post('/bill-einvoice/settings', data);
  return response.data;
};

export const getEinvoiceSettings = async () => {
  const response = await api.get('/bill-einvoice/settings');
  return response.data;
};

export const updateEinvoiceSettings = async (data) => {
  const response = await api.patch('/bill-einvoice/settings', data);
  return response.data;
};

export const deleteEinvoiceSettings = async () => {
  const response = await api.delete('/bill-einvoice/settings');
  return response.data;
};

// Bill E-invoice API
export const getBillsForEinvoice = async (search = '', page = 1, limit = 10) => {
  const response = await api.get('/bill-einvoice/bills', {
    params: { search, page, limit }
  });
  return response.data;
};

export const generateEinvoice = async (billId) => {
  const response = await api.post('/bill-einvoice/generate', { billId });
  return response.data;
};

export const getEinvoiceStatus = async (billId) => {
  const response = await api.get(`/bill-einvoice/status/${billId}`);
  return response.data;
};

export const cancelEinvoice = async (billId, reason) => {
  const response = await api.post(`/bill-einvoice/cancel/${billId}`, { reason });
  return response.data;
};