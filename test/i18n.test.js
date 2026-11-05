// i18n : toute cle litterale utilisee (i18n.t('x'), t('x'), data-i18n="x") existe en anglais ET en francais,
// et le chargement survit a un stockage bloque.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUB = path.join(__dirname, '..', 'public');
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8');

function load(storage) {
  const ctx = { localStorage: storage, document: { addEventListener() {}, querySelectorAll: () => [], documentElement: {}, dispatchEvent() {} }, CustomEvent: class {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n.js') + ';this.T = translations; this.I = i18n;', ctx);
  return ctx;
}

test('cles utilisees presentes en EN et FR', () => {
  const { T } = load({ getItem: () => null, setItem() {} });
  const used = new Set();
  for (const f of ['js/app.js', 'js/money.js', 'js/warnings.js', 'js/tooltip.js'])
    for (const m of read(f).matchAll(/\b(?:i18n\.)?t\(\s*'([a-z0-9_]+)'\s*\)/g)) used.add(m[1]);
  for (const f of ['index.html', 'changelog.html'])
    for (const m of read(f).matchAll(/data-i18n(?:-placeholder)?="([a-z0-9_]+)"/g)) used.add(m[1]);
  assert.ok(used.size > 50, `seulement ${used.size} cles trouvees`);
  const missing = l => [...used].filter(k => !(k in T[l]));
  assert.deepStrictEqual(missing('en'), [], 'manquantes en anglais');
  assert.deepStrictEqual(missing('fr'), [], 'manquantes en francais');
});

test('aucune langue ne definit de cle inconnue de l\'anglais', () => {
  const { T } = load({ getItem: () => null, setItem() {} });
  for (const [lang, dict] of Object.entries(T))
    assert.deepStrictEqual(Object.keys(dict).filter(k => !(k in T.en)), [], lang);
});

test('stockage bloque (navigation privee stricte) : i18n se charge en anglais', () => {
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };
  const { I } = load(blocked);
  assert.strictEqual(I.lang, 'en');
  assert.doesNotThrow(() => I.setLang('fr'));
  assert.strictEqual(I.t('turns_label'), 'tours');
});
