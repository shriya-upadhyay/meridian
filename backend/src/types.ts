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
    recipientAccountHash: string;
  };
  declaration: {             
    purposeOfPayment: string;
    sourceOfFunds: string;
  };
  amount: string;
  sendCurrency: string;
  receiveCurrency: string;
}

// Produced by the regulator's compliance screening service — never self-reported
export interface ComplianceScreening {
  riskScore: number;          // 0-100
  sanctionsChecked: boolean;
  pep_check: boolean;         // Politically Exposed Person
  amlNotes: string;
}

export interface FlagRequest {
  notes: string;
}
