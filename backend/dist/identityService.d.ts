/**
 * Off-chain Identity Resolution Service
 *
 * Resolves a BIC (Bank Identifier Code) to full recipient bank details.
 * In production this would call SWIFT GPI, a KYC registry, or an
 * internal enterprise directory. For demo purposes we use a static map.
 */
export interface ResolvedRecipientDetails {
    recipientName: string;
    recipientAccount: string;
    recipientBankSwift: string;
    recipientCountry: string;
    recipientTaxId: string;
}
/**
 * Resolve full recipient bank details from a BIC code.
 * Returns null if the BIC is not found in the directory.
 */
export declare function resolveByBic(bic: string): ResolvedRecipientDetails | null;
/**
 * List all known BIC codes (for frontend dropdown/autocomplete).
 */
export declare function listKnownBics(): {
    bic: string;
    name: string;
    country: string;
}[];
