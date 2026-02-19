/**
 * Off-chain Compliance Screening Service
 *
 * Performs automated AML/KYC screening when a proposal is accepted.
 * In production this would call a sanctions-screening API (e.g. Dow Jones,
 * Refinitiv World-Check), a PEP database, and an ML-based risk model.
 * For demo purposes we use simple heuristic rules.
 */

import { ComplianceScreening } from './types';

interface ScreeningInput {
  senderName: string;
  senderCountry: string;
  recipientName: string;
  recipientBic: string;
  amount: string;
  currency: string;
  purposeOfPayment: string;
  sourceOfFunds: string;
}

/**
 * Run automated compliance screening on a transaction.
 * Returns a ComplianceScreening result with risk score, check results, and notes.
 *
 * In production: calls external AML/sanctions APIs.
 * For demo: uses simple amount-based heuristics.
 */
export function screenTransaction(input: ScreeningInput): ComplianceScreening {
  const amount = parseFloat(input.amount) || 0;
  const notes: string[] = [];
  let riskScore = 10; // Base risk score

  // Amount-based risk adjustment
  if (amount > 1_000_000) {
    riskScore += 30;
    notes.push('High-value transaction (>1M) — enhanced due diligence required');
  } else if (amount > 100_000) {
    riskScore += 15;
    notes.push('Elevated value transaction (>100K)');
  }

  // Sanctions check (simulated — always passes in demo)
  const sanctionsChecked = true;
  notes.push('Sanctions screening: CLEAR');

  // PEP check (simulated — always passes in demo)
  const pep_check = true;
  notes.push('PEP screening: CLEAR');

  // Source of funds risk
  const riskySourcePatterns = ['cash', 'crypto', 'anonymous', 'unknown'];
  if (riskySourcePatterns.some(p => input.sourceOfFunds.toLowerCase().includes(p))) {
    riskScore += 25;
    notes.push(`Elevated risk source of funds: "${input.sourceOfFunds}"`);
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  const summary = riskScore > 70
    ? 'HIGH RISK — manual review required'
    : riskScore > 40
    ? 'MEDIUM RISK — standard due diligence'
    : 'LOW RISK — automated approval eligible';

  return {
    riskScore,
    sanctionsChecked,
    pep_check,
    amlNotes: `${summary}. ${notes.join('. ')}`,
  };
}
