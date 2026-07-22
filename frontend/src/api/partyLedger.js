import apiClient from './index';

export const getPartyLedger = async (partyId, fromDate, toDate) => {
  const url = partyId ? `/party-ledger/${partyId}` : `/party-ledger`;
  const response = await apiClient.get(url, {
    params: { fromDate, toDate }
  });
  return response.data;
};

export const getPartyAgeing = async (partyIds, toDate, partyType) => {
  const response = await apiClient.get(`/party-ledger/ageing/report`, {
    params: { partyIds, toDate, partyType }
  });
  return response.data;
};
