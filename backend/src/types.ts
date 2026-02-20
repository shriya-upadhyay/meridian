export interface PartyInfo {
  id: string;
  name: string;
  role: 'sender' | 'recipient' | 'regulator';
}

export interface ContractWrapper {
  contractId: string;
  templateId: string;
  payload: Record<string, any>;
}

export interface CreateProposalRequest {
  recipient: string;
  regulator: string;
  txId: string;
  senderInfo: {
    senderName: string;
    senderAccount: string;
    senderBankSwift: string;
    senderCountry: string;
    senderTaxId: string;
  };
  recipientInfo: {
    recipientName: string;
    recipientAccount: string;
    recipientBankSwift: string;
    recipientCountry: string;
    recipientTaxId: string;
  };
  declaration: {             // What the sender declares (they know this)
    purposeOfPayment: string;
    sourceOfFunds: string;
  };
  amount: string;
  currency: string;
}

// Produced by the regulator's compliance screening service — never self-reported
export interface ComplianceScreening {
  riskScore: number;          // 0-100
  sanctionsChecked: boolean;
  pep_check: boolean;         // Politically Exposed Person
  amlNotes: string;
}

export interface ApproveRequest {
  senderViewCid: string;
  recipientViewCid: string;
}

export interface RejectRequest {
  reason: string;
}

export interface FlagRequest {
  notes: string;
}
