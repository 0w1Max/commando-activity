/** Inventory integrity only: this cannot determine ownership or validate permission. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function validateArtworkManifest(manifest, { files, read, requireCleared = false }) {
  assert.equal(manifest.schemaVersion, 1, 'Unknown artwork inventory schema');
  assert.match(manifest.baselineCommit, /^[a-f0-9]{40}$/);
  const evidence = new Map();
  for (const item of manifest.evidence) {
    assert.ok(!evidence.has(item.id), 'Duplicate evidence ID');
    assert.match(item.url, /^https:\/\/github\.com\/0w1Max\/0w1Max\/blob\/[a-f0-9]{40}\//);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.match(item.gitBlobSha, /^[a-f0-9]{40}$/);
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
    assert.ok(['review-required', 'license-pending', 'verified'].includes(item.rightsStatus));
    assert.ok(Array.isArray(item.permissionEvidence));
    if (item.rightsStatus === 'verified') {
      assert.ok(typeof item.license === 'string' && item.license.trim(), 'Missing license');
      assert.ok(typeof item.creator === 'string' && item.creator.trim(), 'Missing creator');
      assert.ok(item.permissionEvidence.length, 'Missing permission evidence');
      for (const url of item.permissionEvidence)
        assert.match(url, /^https:\/\//, 'Evidence must be a reviewable HTTPS reference');
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
        if (item.rightsStatus === 'verified')
          assert.equal(source.rightsStatus, 'verified', 'Unresolved source artwork');
        visit(input);
      } else {
        assert.ok(evidence.has(input), 'Missing source evidence: ' + input);
        if (item.rightsStatus === 'verified' && evidence.get(input).kind === 'archived-image')
          assert.equal(evidence.get(input).rightsStatus, 'verified', 'Unresolved input rights');
      }
    }
    active.delete(path);
    visited.add(path);
  }
  for (const path of assets.keys()) visit(path);
  if (requireCleared)
    assert.equal(
      unresolved.length,
      0,
      `${unresolved.length} artwork files still need rights review`,
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
