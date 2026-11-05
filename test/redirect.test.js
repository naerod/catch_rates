const test = require('node:test');
const assert = require('node:assert');
process.env.CATCHR_DB_PATH = process.env.CATCHR_DB_PATH || require('path').join(__dirname, '..', 'db', 'catchrates.db');
const { safeRedirect } = require('../server.js');

test('safeRedirect accepte les chemins du site', () => {
  assert.strictEqual(safeRedirect('/admin'), '/admin');
  assert.strictEqual(safeRedirect('/#events'), '/#events');
  assert.strictEqual(safeRedirect('/changelog?x=1'), '/changelog?x=1');
});

test('safeRedirect refuse les redirections externes', () => {
  for (const rd of ['https://evil.example', '//evil.example', '/\\evil.example', '\\\\evil', 'javascript:alert(1)', '/\tevil', '', undefined, ['/a', '/b'], { a: 1 }])
    assert.strictEqual(safeRedirect(rd), '/', JSON.stringify(rd));
});
