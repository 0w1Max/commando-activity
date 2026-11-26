/** Repository contracts: layers, acyclic imports, versions and translated links. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
const root = process.cwd();
const repoPath = (path) => relative(root, path).split(sep).join('/');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)],
  );
}
const modules = files(resolve(root, 'src')).filter((p) => p.endsWith('.mjs'));
const graph = new Map();
for (const path of modules) {
  const layer = repoPath(path).split('/')[1];
  const program = parse(readFileSync(path, 'utf8'), {
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
  const imports = program.body.filter((n) => n.source).map((n) => n.source.value);
  const local = [];
  for (const spec of imports) {
    if (spec.startsWith('node:')) {
      assert.notEqual(layer, 'domain', 'Domain must not access Node I/O');
      continue;
    }
    assert.ok(spec.startsWith('.'), 'Runtime imports must be dependency-free');
    const target = resolve(dirname(path), spec);
    assert.ok(existsSync(target), 'Missing module ' + target);
    const targetLayer = repoPath(target).split('/')[1];
    assert.ok(
      repoPath(target).startsWith('src/'),
      'Runtime must not import a CLI, test or site module',
    );
    if (layer === 'domain')
      assert.equal(
        targetLayer,
        'domain',
        'Domain must not depend on art, rendering or publication',
      );
    if (layer === 'art')
      assert.ok(
        ['art', 'domain'].includes(targetLayer),
        'Artwork must not depend on orchestration',
      );
    if (layer === 'render')
      assert.notEqual(targetLayer, 'publication', 'Rendering must not publish data');
    local.push(target);
  }
  graph.set(path, local);
}
const visited = new Set(),
  active = new Set();
function visit(path) {
  assert.ok(!active.has(path), 'Circular import: ' + path);
  if (visited.has(path)) return;
  active.add(path);
  for (const next of graph.get(path) || []) visit(next);
  active.delete(path);
  visited.add(path);
}
for (const path of modules) visit(path);
const version = json('package.json').version;
assert.match(version, /^\d+\.\d+\.\d+$/);
for (const path of ['commando-settings.json', 'commando-release.json'])
  assert.equal(json(path).version, version, 'Version drift in ' + path);
for (const path of [
  'site/setup.mjs',
  'examples/profile-workflow.yml',
  '.github/workflows/generate.yml',
])
  assert.ok(read(path).includes('v' + version), 'Pinned release drift in ' + path);
assert.ok(read('site/index.html').includes(' · ' + version), 'Setup version drift');
assert.equal(json('commando-release.json').source_repository, '0w1Max/commando-activity');
assert.ok(
  read('README.md').includes(`**Current version: ${version}.**`),
  'English README version drift',
);
assert.ok(
  read('README.ru.md').includes(`**Текущая версия: ${version}.**`),
  'Russian README version drift',
);
const docs = files(resolve(root, 'docs')).filter((p) => p.endsWith('.md'));
for (const path of [
  ...docs,
  ...readdirSync(root)
    .filter((name) => name.endsWith('.md'))
    .map((name) => resolve(root, name)),
]) {
  const source = readFileSync(path, 'utf8');
  assert.match(source, /English/, 'Missing language navigation: ' + path);
  assert.match(source, /Русский/, 'Missing language navigation: ' + path);
  for (const [, target] of source.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    assert.ok(
      existsSync(resolve(dirname(path), target.split('#')[0])),
      'Broken documentation link: ' + path + ' -> ' + target,
    );
  }
}
console.log(
  `PASS: ${modules.length} modules, no circular imports, layer boundaries, version ${version}, documentation links`,
);
