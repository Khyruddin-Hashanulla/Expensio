import mongoose from 'mongoose';

export const SUPPORTED_CURRENCIES = ['INR', 'USD'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Not required: Google OAuth users may have no password until they set one.
    passwordHash: { type: String, default: null, select: false },
    // Partial index: sparse indexes still include explicit nulls, so unique
    // must only apply when googleId is an actual string.
    googleId: { type: String, default: undefined },
    avatarUrl: { type: String, default: null },
    defaultCurrency: { type: String, enum: SUPPORTED_CURRENCIES, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    defaultCurrency: this.defaultCurrency,
    timezone: this.timezone,
    hasPassword: Boolean(this.passwordHash),
    hasGoogle: Boolean(this.googleId),
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
