import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createAuthService } from '../services/authService.js';

function makeQuery(doc) {
  return { select() { return Promise.resolve(doc); } };
}

function buildMocks({ user, groups = [], auditRecords = [] } = {}) {
  const userModel = {
    findOne: ({ _id }) => makeQuery(_id === user?._id ? user : null),
    updateOne: async (filter, update) => {
      userModel._lastUpdate = { filter, update };
      return { modifiedCount: 1 };
    },
  };
  const refreshTokenModel = {
    updateMany: async (filter, update) => {
      refreshTokenModel._lastUpdate = { filter, update };
      return { modifiedCount: 1 };
    },
  };
  const groupModel = {
    find: async () => groups,
  };
  const auditLogService = {
    record: async (entry) => {
      auditRecords.push(entry);
      return entry;
    },
  };
  const service = createAuthService({
    userModel,
    refreshTokenModel,
    passwordResetTokenModel: {},
    emailOtpModel: {},
    auditLogService,
    groupModel,
  });
  return { service, userModel, refreshTokenModel, groupModel, auditLogService, auditRecords };
}

test('throws when password account omits password', async () => {
  const user = { _id: 'u1', email: 'a@b.com', passwordHash: bcrypt.hashSync('secret12', 8) };
  const { service } = buildMocks({ user });
  await assert.rejects(
    () => service.softDeleteUser('u1', {}),
    /Current password is incorrect/,
  );
});

test('throws on wrong password', async () => {
  const user = { _id: 'u1', email: 'a@b.com', passwordHash: bcrypt.hashSync('secret12', 8) };
  const { service } = buildMocks({ user });
  await assert.rejects(
    () => service.softDeleteUser('u1', { password: 'wrongpass' }),
    /Current password is incorrect/,
  );
});

test('anonymizes, revokes tokens and audits for password account', async () => {
  const user = { _id: 'u1', email: 'a@b.com', passwordHash: bcrypt.hashSync('secret12', 8) };
  const { service, userModel, refreshTokenModel, auditRecords } = buildMocks({ user });

  const result = await service.softDeleteUser('u1', { password: 'secret12' });

  assert.equal(result.success, true);
  const set = userModel._lastUpdate.update.$set;
  assert.equal(set.name, 'Deleted User');
  assert.match(set.email, /@deleted\.local$/);
  assert.equal(set.avatarUrl, null);
  assert.ok(set.deletedAt instanceof Date);
  assert.deepEqual(refreshTokenModel._lastUpdate.filter, { userId: 'u1' });
  assert.equal(auditRecords[0].action, 'user.deleted');
  assert.equal(auditRecords[0].targetId, 'u1');
});

test('reassigns group creator and audits the reassignment', async () => {
  const user = { _id: 'u1', email: 'a@b.com', passwordHash: bcrypt.hashSync('secret12', 8) };
  const group = {
    _id: 'g1',
    createdBy: 'u1',
    members: [{ userId: 'u1', role: 'admin' }, { userId: 'u2', role: 'admin' }],
    save: async function () { group._saved = true; },
  };
  const { service, auditRecords } = buildMocks({ user, groups: [group] });

  await service.softDeleteUser('u1', { password: 'secret12' });

  assert.equal(String(group.createdBy), 'u2');
  assert.ok(group._saved);
  const reassigned = auditRecords.find((r) => r.action === 'group.creator.reassigned');
  assert.ok(reassigned);
  assert.equal(String(reassigned.metadata.from), 'u1');
  assert.equal(String(reassigned.metadata.to), 'u2');
});

test('allows google-only (passwordless) accounts without a password', async () => {
  const user = { _id: 'u1', email: 'a@b.com', passwordHash: null };
  const { service, userModel } = buildMocks({ user });

  const result = await service.softDeleteUser('u1', {});

  assert.equal(result.success, true);
  assert.equal(userModel._lastUpdate.update.$set.name, 'Deleted User');
});

test('throws when user not found', async () => {
  const { service } = buildMocks({ user: null });
  await assert.rejects(() => service.softDeleteUser('missing', { password: 'x' }), /User not found/);
});
