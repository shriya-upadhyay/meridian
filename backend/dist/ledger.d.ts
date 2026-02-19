import { ContractWrapper } from './types';
/**
 * Canton JSON API client wrapper.
 *
 * `daml start` runs the JSON API on port 7575.
 * The sandbox accepts the party display name as a Bearer token for auth.
 */
declare class LedgerClient {
    private packageId;
    private moduleName;
    private getClient;
    /**
     * Discover the package ID for our module by querying the ledger.
     */
    getPackageId(): Promise<string>;
    private templateId;
    /**
     * Query active contracts of a given template type.
     */
    queryContracts(party: string, templateName: string): Promise<ContractWrapper[]>;
    /**
     * Create a new contract on the ledger.
     */
    createContract(parties: string[], templateName: string, payload: Record<string, any>): Promise<any>;
    /**
     * Exercise a choice on an existing contract.
     */
    exerciseChoice(party: string, templateName: string, contractId: string, choice: string, args?: Record<string, any>): Promise<any>;
}
export declare const ledger: LedgerClient;
export {};
