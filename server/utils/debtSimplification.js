import { toCents, fromCents } from './rounding.js';

/**
 * Greedy min-cash-flow debt simplification.
 *
 * Input:  balances — [{ userId, netBalance }] where positive = is owed money,
 *         negative = owes money. Balances should sum to ~0.
 * Output: [{ fromUser, toUser, amount }] — minimal set of suggested settlements.
 *
 * Algorithm: repeatedly match the largest debtor with the largest creditor,
 * settle min(|debt|, credit), repeat until everyone is (near) zero.
 */
export function simplifyDebts(balances) {
  // Work in integer cents; ignore dust below 1 cent
  const creditors = []; // { userId, cents } cents > 0
  const debtors = []; // { userId, cents } cents > 0 (magnitude of debt)

  for (const b of balances) {
    const cents = toCents(b.netBalance);
    if (cents > 0) creditors.push({ userId: b.userId, cents });
    else if (cents < 0) debtors.push({ userId: b.userId, cents: -cents });
  }

  const settlements = [];

  // Sorted arrays used as max-heaps (small N per group — sort is fine)
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const settled = Math.min(creditor.cents, debtor.cents);
    if (settled > 0) {
      settlements.push({
        fromUser: debtor.userId,
        toUser: creditor.userId,
        amount: fromCents(settled),
      });
    }

    creditor.cents -= settled;
    debtor.cents -= settled;

    if (creditor.cents === 0) creditors.shift();
    if (debtor.cents === 0) debtors.shift();

    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);
  }

  return settlements;
}
