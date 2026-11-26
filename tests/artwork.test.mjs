import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateArtworkManifest } from '../tools/check-artwork.mjs';
const inventory = () => JSON.parse(readFileSync('compliance/artwork-manifest.json', 'utf8'));
const context = {
  files: readdirSync('assets').map((name) => 'assets/' + name),
  read: (path) => readFileSync(path),
};
test('Inventory covers every packed atlas and distinguishes provenance from rights clearance', () => {
  const result = validateArtworkManifest(inventory(), context);
  assert.equal(result.total, context.files.length);
  assert.ok(result.unresolved.length > 0);
  assert.throws(
    () => validateArtworkManifest(inventory(), { ...context, requireCleared: true }),
    /need rights review/,
  );
});
test('Untracked, changed or renamed artwork cannot silently pass inventory checks', () => {
  assert.throws(
    () =>
      validateArtworkManifest(inventory(), {
        ...context,
        files: [...context.files, 'assets/new.png'],
      }),
    /coverage/,
  );
  assert.throws(
    () => validateArtworkManifest(inventory(), { ...context, read: () => Buffer.from('changed') }),
    /changed without review/,
  );
  const changed = inventory();
  changed.assets[0].path = '../outside';
  assert.throws(() => validateArtworkManifest(changed, context));
});
test('Verified labels need evidence and cannot hide an unresolved derivation', () => {
  const changed = inventory();
  const derived = changed.assets.find((item) => item.path.includes('-optimized.'));
  derived.rightsStatus = 'verified';
  assert.throws(() => validateArtworkManifest(changed, context), /Missing license/);
  derived.license = 'CC-BY-4.0';
  derived.creator = 'Example';
  assert.throws(() => validateArtworkManifest(changed, context), /Missing permission evidence/);
  derived.permissionEvidence = ['https://example.com/permission'];
  assert.throws(() => validateArtworkManifest(changed, context), /Unresolved source artwork/);
});
test('Ruleset drafts preserve automatic output publication and creation of release tags', () => {
  const read = (name) => JSON.parse(readFileSync('examples/rulesets/' + name + '.json', 'utf8'));
  for (const name of ['product-main', 'product-tags', 'profile-main', 'profile-output'])
    assert.equal(read(name).enforcement, 'disabled', 'Import must not silently enable a draft');
  assert.deepEqual(
    read('profile-output')
      .rules.map((rule) => rule.type)
      .sort(),
    ['deletion', 'non_fast_forward'],
  );
  assert.deepEqual(
    read('product-tags')
      .rules.map((rule) => rule.type)
      .sort(),
    ['deletion', 'update'],
  );
  const rules = read('product-main').rules;
  assert.equal(
    rules.find((rule) => rule.type === 'pull_request').parameters.required_approving_review_count,
    0,
  );
  assert.deepEqual(
    rules
      .find((rule) => rule.type === 'required_status_checks')
      .parameters.required_status_checks.map((check) => check.context),
    ['test', 'visual'],
  );
});
