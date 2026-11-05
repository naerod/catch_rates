const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { hashPassword, verifyPassword, needsRehash } = require('../lib/passwords');

test('scrypt : sel aleatoire et verification', () => {
  const a = hashPassword('s3cret!'), b = hashPassword('s3cret!');
  assert.notStrictEqual(a, b);
  assert.match(a, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(verifyPassword('s3cret!', a));
  assert.ok(!verifyPassword('S3cret!', a));
  assert.ok(!needsRehash(a));
});

test('ancien SHA-256 accepte et marque a reecrire', () => {
  const legacy = crypto.createHash('sha256').update('old').digest('hex');
  assert.ok(verifyPassword('old', legacy));
  assert.ok(!verifyPassword('nope', legacy));
  assert.ok(needsRehash(legacy));
});

test('valeurs invalides refusees', () => {
  assert.ok(!verifyPassword('x', ''));
  assert.ok(!verifyPassword('x', 'scrypt$'));
  assert.ok(!verifyPassword('x', 'scrypt$aa$zz'));
  assert.ok(!verifyPassword(undefined, hashPassword('x')));
  assert.ok(!verifyPassword({}, 'abc'));
});
