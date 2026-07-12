import rateLimit from 'express-rate-limit';

const make = (max, windowMs = 60 * 1000) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });

export const loginLimiter = make(5);
// Signup is now two requests (send-otp + register) plus possible resends
export const registerLimiter = make(8);
export const refreshLimiter = make(10);
export const readLimiter = make(100);
export const writeLimiter = make(20);
