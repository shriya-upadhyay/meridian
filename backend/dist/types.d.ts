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
    recipientName: string;
    recipientBic: string;
    compliance: {
        purposeOfPayment: string;
        sourceOfFunds: string;
        riskScore: number;
        sanctionsChecked: boolean;
        pep_check: boolean;
        amlNotes: string;
    };
    amount: string;
    currency: string;
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
