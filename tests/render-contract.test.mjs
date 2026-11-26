import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { renderSvg } from '../src/render/render-svg.mjs';
const unpack = (path) =>
  JSON.parse(gunzipSync(Buffer.from(readFileSync(path, 'utf8').trim(), 'base64')));
const { weeks } = unpack('fixtures/demo-calendar.json.gz.b64');
const sprites = unpack('assets/sprites.json.gz.b64');
const contract = JSON.parse(readFileSync('fixtures/render-contract.json', 'utf8'));
for (const item of contract.cases)
  test(`Exact ${contract.baseline} SVG contract: ${item.variant}/${item.location}`, () => {
    const input = structuredClone(weeks);
    if (item.variant !== 'demo')
      for (const week of input)
        for (const day of week.contributionDays) {
          day.contributionCount = item.variant === 'dense' ? 10 : 0;
          day.contributionLevel = item.variant === 'dense' ? 'FOURTH_QUARTILE' : 'NONE';
        }
    const svg = renderSvg({
      weeks: input,
      sprites,
      username: '0w1Max',
      locationOverride: item.location,
      seedOverride: item.seed,
    });
    assert.equal(createHash('sha256').update(svg).digest('hex'), item.sha256);
    assert.equal((svg.match(/<(?:animate|animateTransform)\b/g) || []).length, item.animations);
  });
