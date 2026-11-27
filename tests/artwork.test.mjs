import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateArtworkManifest } from '../tools/check-artwork.mjs';
const inventory = () => JSON.parse(readFileSync('compliance/artwork-manifest.json', 'utf8'));
const context = {
  files: readdirSync('assets').map((name) => 'assets/' + name),
  read: (path) => readFileSync(path),
};
test('All packed atlases have recorded licenses and pass the strict check', () => {
  const result = validateArtworkManifest(inventory(), { ...context, requireLicensed: true });
  assert.equal(result.total, context.files.length);
  assert.equal(result.unresolved.length, 0);
  validateArtworkManifest(inventory(), { ...context, requireCleared: true });
});
test('Owner licensing requires the explicit declaration and unchanged legal files', () => {
  const changed = inventory();
  assert.equal(changed.ownerDeclaration.declaredBy, '0w1Max');
  assert.ok(
    changed.assets.every(
      (item) => item.rightsStatus === 'owner-licensed' && item.license === 'CC0-1.0',
    ),
  );
  delete changed.ownerDeclaration;
  assert.throws(() => validateArtworkManifest(changed, context), /Missing owner declaration/);
  assert.throws(
    () =>
      validateArtworkManifest(inventory(), {
        ...context,
        read: (path) => (path === 'LICENSE-ASSETS' ? Buffer.from('changed') : context.read(path)),
      }),
    /License text changed/,
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
    /changed without review|License text changed/,
  );
  const changed = inventory();
  changed.assets[0].path = '../outside';
  assert.throws(() => validateArtworkManifest(changed, context));
});
test('Licensed derivatives cannot hide missing permission or unresolved inputs', () => {
  const changed = inventory();
  const derived = changed.assets.find((item) => item.path.includes('-optimized.'));
  derived.license = null;
  assert.throws(() => validateArtworkManifest(changed, context), /Missing license/);
  derived.license = 'CC0-1.0';
  derived.permissionEvidence = [];
  assert.throws(() => validateArtworkManifest(changed, context), /Missing permission evidence/);
  derived.permissionEvidence = [
    'https://github.com/0w1Max/commando-activity/blob/main/LICENSE-ASSETS',
  ];
  const source = changed.assets.find((item) => derived.technicalOrigin.inputs.includes(item.path));
  source.rightsStatus = 'review-required';
  source.license = null;
  assert.throws(() => validateArtworkManifest(changed, context), /Unresolved source artwork/);
  const archive = inventory();
  archive.evidence.find((item) => item.kind === 'archived-image').rightsStatus = 'review-required';
  assert.throws(() => validateArtworkManifest(archive, context), /Unresolved input rights/);
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
