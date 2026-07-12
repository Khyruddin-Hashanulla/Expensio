/**
 * All money math is done in integer cents/paise to avoid floating point drift.
 */

export const toCents = (amount) => Math.round(amount * 100);
export const fromCents = (cents) => Math.round(cents) / 100;

/** Round a float amount to 2 decimal places safely. */
export const round2 = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;
