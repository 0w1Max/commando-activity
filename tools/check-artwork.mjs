/** Inventory integrity only: this cannot determine ownership or validate permission. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function validateArtworkManifest(
  manifest,
  { files, read, requireCleared = false, requireLicensed = false },
) {
  assert.equal(manifest.schemaVersion, 1, 'Unknown artwork inventory schema');
  assert.match(manifest.baselineCommit, /^[a-f0-9]{40}$/);
  const licensed = (item) => ['verified', 'owner-licensed'].includes(item.rightsStatus);
  const declaration = manifest.artworkLicense;
  assert.equal(declaration.spdxId, 'CC0-1.0');
  for (const [pathKey, hashKey, expected] of [
    ['scopeFile', 'scopeSha256', 'LICENSE-ASSETS'],
    ['legalCode', 'legalCodeSha256', 'LICENSES/CC0-1.0.txt'],
  ]) {
    assert.equal(declaration[pathKey], expected, 'Unexpected license file');
    assert.equal(
      digest(read(expected)),
      declaration[hashKey],
      'License text changed without review',
    );
  }
  function checkLicense(item) {
    assert.ok(typeof item.license === 'string' && item.license.trim(), 'Missing license');
    assert.ok(typeof item.creator === 'string' && item.creator.trim(), 'Missing creator');
    assert.ok(item.permissionEvidence?.length, 'Missing permission evidence');
    for (const url of item.permissionEvidence)
      assert.match(url, /^https:\/\//, 'Evidence must be a reviewable HTTPS reference');
    if (item.rightsStatus === 'owner-licensed') {
      assert.ok(manifest.ownerDeclaration?.id, 'Missing owner declaration');
      assert.equal(
        item.originDeclaration,
        manifest.ownerDeclaration.id,
        'Missing owner declaration',
      );
      assert.ok(manifest.ownerDeclaration.statement, 'Empty owner declaration');
      assert.equal(manifest.ownerDeclaration.publicArtworkLicense, 'CC0-1.0');
      assert.equal(item.license, 'CC0-1.0');
      assert.ok(
        item.permissionEvidence.includes(
          'https://github.com/0w1Max/commando-activity/blob/main/LICENSE-ASSETS',
        ),
        'Missing owner license reference',
      );
    }
  }
  const evidence = new Map();
  for (const item of manifest.evidence) {
    assert.ok(!evidence.has(item.id), 'Duplicate evidence ID');
    assert.match(item.url, /^https:\/\/github\.com\/0w1Max\/0w1Max\/blob\/[a-f0-9]{40}\//);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.match(item.gitBlobSha, /^[a-f0-9]{40}$/);
    if (licensed(item)) checkLicense(item);
    evidence.set(item.id, item);
  }
  const assets = new Map();
  const unresolved = [];
  for (const item of manifest.assets) {
    assert.match(item.path, /^assets\/[a-z0-9-]+\.json\.gz\.b64$/);
    assert.ok(!assets.has(item.path), 'Duplicate asset path');
    const bytes = read(item.path);
    assert.equal(digest(bytes), item.sha256, 'Artwork changed without review: ' + item.path);
    const blob = createHash('sha1')
      .update('blob ' + bytes.length + '\0')
      .update(bytes)
      .digest('hex');
    assert.equal(blob, item.gitBlobSha, 'Git blob mismatch: ' + item.path);
    assert.ok(
      ['review-required', 'license-pending', 'verified', 'owner-licensed'].includes(
        item.rightsStatus,
      ),
    );
    assert.ok(Array.isArray(item.permissionEvidence));
    if (licensed(item)) {
      checkLicense(item);
    } else {
      if (item.rightsStatus === 'license-pending') {
        assert.equal(
          item.originDeclaration,
          manifest.ownerDeclaration?.id,
          'Missing owner declaration',
        );
        assert.ok(manifest.ownerDeclaration?.statement, 'Empty owner declaration');
      }
      assert.equal(item.license, null, 'Do not assign a license to unresolved artwork');
      unresolved.push(item.path);
    }
    assets.set(item.path, item);
  }
  assert.deepEqual([...assets.keys()].sort(), [...files].sort(), 'Artwork inventory coverage');
  const active = new Set(),
    visited = new Set();
  function visit(path) {
    assert.ok(!active.has(path), 'Circular artwork derivation');
    if (visited.has(path)) return;
    active.add(path);
    const item = assets.get(path);
    for (const input of item.technicalOrigin.inputs) {
      if (assets.has(input)) {
        const source = assets.get(input);
        if (licensed(item)) assert.ok(licensed(source), 'Unresolved source artwork');
        visit(input);
      } else {
        assert.ok(evidence.has(input), 'Missing source evidence: ' + input);
        if (licensed(item) && evidence.get(input).kind === 'archived-image')
          assert.ok(licensed(evidence.get(input)), 'Unresolved input rights');
      }
    }
    active.delete(path);
    visited.add(path);
  }
  for (const path of assets.keys()) visit(path);
  if (requireCleared || requireLicensed)
    assert.equal(
      unresolved.length,
      0,
      `${unresolved.length} artwork files still need a recorded license`,
    );
  return { total: assets.size, unresolved };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const manifest = JSON.parse(readFileSync('compliance/artwork-manifest.json', 'utf8'));
    const result = validateArtworkManifest(manifest, {
      files: readdirSync('assets').map((name) => 'assets/' + name),
      read: (path) => readFileSync(path),
      requireCleared: process.argv.includes('--require-cleared'),
      requireLicensed: process.argv.includes('--require-licensed'),
    });
    console.log(`PASS: inventory and hashes match ${result.total} artwork files`);
    if (result.unresolved.length)
      console.warn(
        `WARN: ${result.unresolved.length} artwork files have unresolved rights; no clearance claim`,
      );
  } catch (error) {
    console.error('FAIL: ' + error.message);
    process.exitCode = 1;
  }
}
