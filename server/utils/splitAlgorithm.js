import { toCents, fromCents } from './rounding.js';
import { badRequest } from './AppError.js';

/**
 * Compute the authoritative split for a group expense. All math in integer
 * cents. Returns [{ userId, share, percentage, amountOwed }].
 *
 * @param {Object} params
 * @param {number} params.amount        Total amount (e.g. 100.00)
 * @param {'equal'|'percentage'|'custom'} params.splitType
 * @param {string} params.paidBy        userId of the payer (receives remainder cents on equal split)
 * @param {Array}  params.participants  [{ userId, percentage?, share? }]
 */
export function calculateSplit({ amount, splitType, paidBy, participants }) {
  if (!participants || participants.length === 0) {
    throw badRequest('At least one participant is required for a split');
  }

  const totalCents = toCents(amount);
  if (totalCents <= 0) throw badRequest('Amount must be positive');

  switch (splitType) {
    case 'equal':
      return equalSplit(totalCents, paidBy, participants);
    case 'percentage':
      return percentageSplit(totalCents, participants);
    case 'custom':
      return customSplit(totalCents, participants);
    default:
      throw badRequest(`Unknown split type: ${splitType}`);
  }
}

/**
 * Equal split: divide by N; remainder cents go to the PAYER.
 * Example: 100.00 / 3 with A as payer -> A: 33.34, B: 33.33, C: 33.33
 */
function equalSplit(totalCents, paidBy, participants) {
  const n = participants.length;
  const base = Math.floor(totalCents / n);
  let remainder = totalCents - base * n;

  const payerIncluded = participants.some((p) => String(p.userId) === String(paidBy));

  return participants.map((p, index) => {
    let cents = base;
    const isPayer = String(p.userId) === String(paidBy);
    // Remainder goes to payer if present, otherwise to the first participant
    if ((payerIncluded && isPayer) || (!payerIncluded && index === 0)) {
      cents += remainder;
      remainder = 0;
    }
    return {
      userId: p.userId,
      share: fromCents(cents),
      percentage: null,
      amountOwed: fromCents(cents),
    };
  });
}

/**
 * Percentage split: percentages must sum to 100 (+/- 0.01 tolerance).
 * Rounding remainder cents are assigned to the largest share.
 */
function percentageSplit(totalCents, participants) {
  const totalPct = participants.reduce((sum, p) => sum + (p.percentage ?? 0), 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw badRequest(`Percentages must sum to 100 (got ${totalPct})`);
  }

  const entries = participants.map((p) => ({
    userId: p.userId,
    percentage: p.percentage,
    cents: Math.floor((totalCents * p.percentage) / 100),
  }));

  let assigned = entries.reduce((sum, e) => sum + e.cents, 0);
  let remainder = totalCents - assigned;

  // Distribute leftover cents to largest shares first (deterministic)
  const byLargest = [...entries].sort((a, b) => b.cents - a.cents);
  for (let i = 0; remainder > 0; i = (i + 1) % byLargest.length) {
    byLargest[i].cents += 1;
    remainder -= 1;
  }

  return entries.map((e) => ({
    userId: e.userId,
    share: fromCents(e.cents),
    percentage: e.percentage,
    amountOwed: fromCents(e.cents),
  }));
}

/**
 * Custom split: shares must sum EXACTLY to the total amount.
 */
function customSplit(totalCents, participants) {
  const sumCents = participants.reduce((sum, p) => sum + toCents(p.share ?? 0), 0);
  if (sumCents !== totalCents) {
    throw badRequest(
      `Custom shares must sum exactly to the total amount (expected ${fromCents(totalCents)}, got ${fromCents(sumCents)})`
    );
  }

  return participants.map((p) => ({
    userId: p.userId,
    share: p.share,
    percentage: null,
    amountOwed: p.share,
  }));
}
