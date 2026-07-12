import mongoose from 'mongoose';

export function isReplicaSet() {
  const type = mongoose.connection.client?.topology?.description?.type;
  return type?.includes('ReplicaSet') ?? false;
}

/**
 * Run the callback inside an optional MongoDB transaction.
 * If the database is a replica set → uses a real session+transaction.
 * If standalone → runs the callback directly without a session.
 *
 * The callback receives a `session` parameter (Mongoose ClientSession or null).
 */
export async function withOptionalSession(fn) {
  const useTxn = isReplicaSet();
  let session = null;

  if (useTxn) {
    session = await mongoose.startSession();
    try {
      await session.withTransaction(() => fn(session));
    } finally {
      await session.endSession();
    }
  } else {
    await fn(null);
  }
}

export function docOptions(session) {
  return session ? { session } : {};
}
