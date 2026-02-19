import { PartyInfo, ContractWrapper, CreateProposalRequest, ApproveRequest, RejectRequest, FlagRequest } from '../../backend/src/types';

const API_BASE_URL = '/api';

/**
 * Fetch-based HTTP client for Canton JSON API
 * All endpoints use ?party query parameter for authorization
 */

// Helper function to make requests
async function apiCall<T>(
  method: string,
  endpoint: string,
  party: string,
  body?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}?party=${encodeURIComponent(party)}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// API methods grouped by resource
export const api = {
  // Parties
  async fetchParties(): Promise<PartyInfo[]> {
    const response = await fetch(`${API_BASE_URL}/parties`);
    if (!response.ok) {
      throw new Error('Failed to fetch parties');
    }
    return response.json();
  },

  // Proposals
  async createProposal(party: string, data: CreateProposalRequest): Promise<ContractWrapper> {
    return apiCall('POST', '/proposals', party, data);
  },

  async listProposals(party: string): Promise<ContractWrapper[]> {
    return apiCall('GET', '/proposals', party);
  },

  async acceptProposal(party: string, contractId: string): Promise<ContractWrapper[]> {
    return apiCall('POST', `/proposals/${contractId}/accept`, party);
  },

  async withdrawProposal(party: string, contractId: string): Promise<void> {
    return apiCall('POST', `/proposals/${contractId}/withdraw`, party);
  },

  // Transactions
  async listTransactions(party: string): Promise<ContractWrapper[]> {
    return apiCall('GET', '/transactions', party);
  },

  async approveTransaction(
    party: string,
    contractId: string,
    data: ApproveRequest
  ): Promise<ContractWrapper> {
    return apiCall('POST', `/transactions/${contractId}/approve`, party, data);
  },

  async rejectTransaction(
    party: string,
    contractId: string,
    data: RejectRequest
  ): Promise<void> {
    return apiCall('POST', `/transactions/${contractId}/reject`, party, data);
  },

  async settleTransaction(party: string, contractId: string): Promise<void> {
    return apiCall('POST', `/transactions/${contractId}/settle`, party);
  },

  // Views
  async listSenderViews(party: string): Promise<ContractWrapper[]> {
    return apiCall('GET', '/sender-views', party);
  },

  async listRecipientViews(party: string): Promise<ContractWrapper[]> {
    return apiCall('GET', '/recipient-views', party);
  },

  async listRegulatorViews(party: string): Promise<ContractWrapper[]> {
    return apiCall('GET', '/regulator-views', party);
  },

  async flagSuspicious(
    party: string,
    contractId: string,
    data: FlagRequest
  ): Promise<void> {
    return apiCall('POST', `/regulator-views/${contractId}/flag`, party, data);
  },
};

export default api;
