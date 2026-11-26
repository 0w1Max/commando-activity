import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { workflow, installArtifacts } from '../site/setup.mjs';
test('Setup assistant exactly matches the released workflow and only encodes non-secret data', () => {
  assert.equal(workflow, readFileSync('examples/profile-workflow.yml', 'utf8'));
  const result = installArtifacts('another-user', 'feature/profile');
  assert.equal(
    result.markdown,
    '![Commando Activity](https://raw.githubusercontent.com/another-user/another-user/output/commando-activity.svg)',
  );
  const link = new URL(result.workflowUrl);
  assert.equal(link.hostname, 'github.com');
  assert.equal(link.searchParams.get('value'), workflow);
  assert.equal(link.searchParams.get('filename'), '.github/workflows/commando.yml');
  assert.doesNotMatch(workflow, /0w1Max\/0w1Max|inherit/);
  for (const bad of ['', '-user', 'a--b', 'user/evil', '"><script>', 'x'.repeat(40)])
    assert.throws(() => installArtifacts(bad));
  for (const bad of ['../main', 'main?token=x', 'main/'])
    assert.throws(() => installArtifacts('user', bad));
});

test('Language navigation has matching translation keys, URL priority and safe fallbacks', async () => {
  const { translations, preferredLanguage } = await import('../site/i18n.mjs');
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.ru).sort());
  assert.equal(preferredLanguage({ search: '?lang=en', saved: 'ru', browser: 'ru-RU' }), 'en');
  assert.equal(preferredLanguage({ saved: 'ru', browser: 'en-US' }), 'ru');
  assert.equal(preferredLanguage({ search: '?lang=unknown', browser: 'ru-RU' }), 'ru');
  assert.equal(preferredLanguage({ saved: 'unknown' }), 'en');
});
