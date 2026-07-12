import { verifyAccessToken } from '../utils/tokens.js';
import { unauthorized } from '../utils/AppError.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(unauthorized('Missing access token'));

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(unauthorized('Invalid or expired access token'));
    }

    // +passwordHash so toSafeJSON can report hasPassword (never serialized itself)
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('+passwordHash');
    if (!user) return next(unauthorized('User not found'));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
