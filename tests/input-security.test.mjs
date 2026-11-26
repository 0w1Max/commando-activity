import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWeeks } from '../src/calendar/calendar.mjs';
import { fetchCalendar } from '../src/calendar/github-client.mjs';
import { validateSvgContent } from '../src/publication/validate.mjs';
import { candidateBatches } from '../src/domain/target-selection.mjs';
const day = (date) => ({ date, contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' });
test('Calendar rejects rolled-over dates, duplicate days, duplicate weekdays and out-of-order input', () => {
  for (const days of [
    [day('2026-02-30')],
    [day('2026-11-22'), day('2026-11-22')],
    [day('2026-11-22'), day('2026-11-29')],
    [day('2026-11-22'), day('2026-11-30')],
    [day('2026-11-23'), day('2026-11-22')],
    Array.from({ length: 8 }, () => day('2026-11-22')),
  ])
    assert.throws(() => normalizeWeeks([{ contributionDays: days }]));
  assert.equal(
    normalizeWeeks([{ contributionDays: [day('2026-11-22'), day('2026-11-23')] }])
      .flat()
      .filter(Boolean).length,
    2,
  );
});
test('Calendar timeout covers reading the response body, not just response headers', async () => {
  let signal;
  const fetchImpl = async (_url, options) => {
    signal = options.signal;
    assert.equal(options.redirect, 'error');
    return {
      ok: true,
      headers: new Headers({ 'x-oauth-scopes': 'read:user' }),
      json: () =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () => reject(Error('Body read aborted')), {
            once: true,
          }),
        ),
    };
  };
  await assert.rejects(
    fetchCalendar('owner', 'not-a-real-token', { fetchImpl, timeoutMs: 10 }),
    /Body read aborted/,
  );
  assert.ok(signal.aborted);
});
test('Generated SVG contract rejects active content and external references in either quote style', () => {
  validateSvgContent(
    '<svg><defs><g id="local"/></defs><use href="#local"/><g filter="url(#shadow)"/></svg>',
  );
  for (const body of [
    '<svg onload="alert(1)"/>',
    "<use href='https://example.test/a'/>",
    '<use href="javascript:alert(1)"/>',
    '<g style="fill:url(https://example.test/a)"/>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>',
    '<?xml-stylesheet href="https://example.test/a"?><svg/>',
    '<foreignObject/>',
    '<script/>',
  ])
    assert.throws(() => validateSvgContent(body));
});
test('Fallback target batches cover every candidate exactly once after the distant lottery', () => {
  const ranked = Array.from({ length: 20 }, (_, i) => ({
    target: { key: String(i) },
    lottery: 20 - i,
  }));
  const { preferred, remaining } = candidateBatches(ranked);
  assert.deepEqual(
    preferred.slice(-4).map((t) => t.key),
    ['19', '18', '17', '16'],
  );
  assert.ok(
    remaining.some((t) => t.key === '10'),
    'The previous fallback skipped nearby unselected distant candidates',
  );
  const keys = [...preferred, ...remaining].map((t) => t.key);
  assert.equal(new Set(keys).size, 20);
  assert.equal(keys.length, 20);
});
