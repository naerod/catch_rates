// Mots de passe des comptes locaux : scrypt sale (module crypto natif).
// Format stocke : scrypt$<sel hex>$<hash hex>. Les anciens SHA-256 (64 hex, sans sel)
// restent acceptes a la connexion puis sont reecrits en scrypt (needsRehash).
const crypto = require('crypto');

const KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  let expected, actual;
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash || !/^[0-9a-f]+$/i.test(hash)) return false;
    expected = Buffer.from(hash, 'hex');
    actual = crypto.scryptSync(password, salt, expected.length);
  } else if (/^[0-9a-f]{64}$/i.test(stored)) {
    expected = Buffer.from(stored, 'hex');
    actual = crypto.createHash('sha256').update(password).digest();
  } else return false;
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const needsRehash = stored => typeof stored !== 'string' || !stored.startsWith('scrypt$');

module.exports = { hashPassword, verifyPassword, needsRehash };
