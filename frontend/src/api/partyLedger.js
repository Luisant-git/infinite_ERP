import apiClient from './index';

export const getPartyLedger = async (partyId, fromDate, toDate) => {
  const url = partyId ? `/party-ledger/${partyId}` : `/party-ledger`;
  const response = await apiClient.get(url, {
    params: { fromDate, toDate }
  });
  return response.data;
};
