"use strict";
/**
 * Off-chain Identity Resolution Service
 *
 * Resolves a BIC (Bank Identifier Code) to full recipient bank details.
 * In production this would call SWIFT GPI, a KYC registry, or an
 * internal enterprise directory. For demo purposes we use a static map.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveByBic = resolveByBic;
exports.listKnownBics = listKnownBics;
// Simulated BIC directory — maps BIC code → full bank details
const bicDirectory = {
    WESTGB2L: {
        recipientName: 'Bob Ltd',
        recipientAccount: 'GB82-WEST-1234-5698-7654-32',
        recipientBankSwift: 'WESTGB2L',
        recipientCountry: 'United Kingdom',
        recipientTaxId: 'GB-987654321',
    },
    CITIUS33: {
        recipientName: 'Citi Corp',
        recipientAccount: 'US-4455-6677-8899',
        recipientBankSwift: 'CITIUS33',
        recipientCountry: 'United States',
        recipientTaxId: 'US-123456789',
    },
    DEUTDEFF: {
        recipientName: 'Deutsche AG',
        recipientAccount: 'DE89-3704-0044-0532-0130-00',
        recipientBankSwift: 'DEUTDEFF',
        recipientCountry: 'Germany',
        recipientTaxId: 'DE-112233445',
    },
};
/**
 * Resolve full recipient bank details from a BIC code.
 * Returns null if the BIC is not found in the directory.
 */
function resolveByBic(bic) {
    return bicDirectory[bic.toUpperCase()] ?? null;
}
/**
 * List all known BIC codes (for frontend dropdown/autocomplete).
 */
function listKnownBics() {
    return Object.entries(bicDirectory).map(([bic, details]) => ({
        bic,
        name: details.recipientName,
        country: details.recipientCountry,
    }));
}
