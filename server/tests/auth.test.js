import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, isValidEmail, normalizeEmail, validatePassword, verifyPassword } from '../src/services/authService.js';

test('normalizes and validates email addresses', () => {
  assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com');
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
});
test('enforces a password length range and verifies salted password hashes', async () => {
  assert.match(validatePassword('short'), /12 and 128/);
  assert.equal(validatePassword('a-safe-long-password'), null);
  const hash = await hashPassword('a-safe-long-password');
  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword('a-safe-long-password', hash), true);
  assert.equal(await verifyPassword('a-different-password', hash), false);
});
