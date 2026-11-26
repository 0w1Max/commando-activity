import test from 'node:test';
import assert from 'node:assert/strict';
import { changelogEntry, publishRelease } from '../src/publication/release.mjs';
const notes =
  '# Changes\n\n## [Unreleased]\n\n## [2.8.2] - 2026-11-26\n\n### Fixed\n\n- Useful fix.\n\n## [2.8.1] - 2026-11-26\n\nOld.';
test('Release notes select only the requested version and reject missing or empty entries', () => {
  assert.equal(changelogEntry(notes, '2.8.2'), '### Fixed\n\n- Useful fix.');
  assert.throws(() => changelogEntry(notes, '2.9.0'));
  assert.throws(() =>
    changelogEntry('## [2.8.2] - 2026-11-26\n\n## [2.8.1] - 2026-11-26', '2.8.2'),
  );
});
test('Release publication creates a bilingual release once, never moves tags and propagates access errors', async () => {
  const tags = new Set(),
    releases = new Set(),
    writes = [];
  const missing = () => {
    throw Object.assign(Error('Missing'), { status: 404 });
  };
  const github = {
    rest: {
      git: {
        getRef: async ({ ref }) => (tags.has(ref) ? {} : missing()),
        createRef: async (args) => {
          tags.add(args.ref.replace('refs/', ''));
          writes.push(args);
        },
      },
      repos: {
        getReleaseByTag: async ({ tag }) => (releases.has(tag) ? {} : missing()),
        createRelease: async (args) => {
          releases.add(args.tag_name);
          writes.push(args);
        },
      },
    },
  };
  const input = {
    github,
    owner: 'owner',
    repo: 'repo',
    sha: 'commit',
    version: '2.8.2',
    english: notes,
    russian: notes,
  };
  await publishRelease(input);
  await publishRelease({ ...input, sha: 'later-docs-commit' });
  assert.equal(writes.length, 2);
  assert.equal(writes[0].sha, 'commit');
  assert.match(writes[1].body, /## English/);
  assert.match(writes[1].body, /## Русский/);
  github.rest.git.getRef = async () => {
    throw Object.assign(Error('Forbidden'), { status: 403 });
  };
  await assert.rejects(publishRelease(input), /Forbidden/);
  assert.equal(writes.length, 2);
});
