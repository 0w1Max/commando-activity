#!/usr/bin/env node
/**
 * Автономный SVG-генератор графика GitHub в стиле 8-bit run-and-gun.
 * Не использует сторонние npm-пакеты, отправляет запрос только к GitHub API.
 * Ошибки API приводят к ненулевому коду выхода: фиктивные данные не публикуются.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USERNAME = process.env.GITHUB_USER || '0w1Max';
import { fetchCalendar } from '../src/calendar/github-client.mjs';
import { normalizeWeeks } from '../src/calendar/calendar.mjs';
import { renderSvg } from '../src/render/render-svg.mjs';
export { fetchCalendar, normalizeWeeks, renderSvg };
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, defaultValue) => {
    const index = args.indexOf(flag);
    return index === -1 ? defaultValue : args[index + 1];
  };
  const demo = args.includes('--demo');
  const out = resolve(getArg('--output', resolve(ROOT, 'generated', 'commando-activity.svg')));
  const sprites = JSON.parse(
    gunzipSync(
      Buffer.from(
        (await readFile(resolve(ROOT, 'assets', 'sprites.json.gz.b64'), 'utf8')).trim(),
        'base64',
      ),
    ).toString('utf8'),
  );
  const weeks = demo
    ? JSON.parse(
        gunzipSync(
          Buffer.from(
            (await readFile(resolve(ROOT, 'fixtures', 'demo-calendar.json.gz.b64'), 'utf8')).trim(),
            'base64',
          ),
        ).toString('utf8'),
      ).weeks
    : await fetchCalendar(USERNAME, process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  // В CI каждый новый запуск создаёт новую карту. COMMANDO_MAP_SEED позволяет воспроизвести её.
  const rawSeed = process.env.COMMANDO_MAP_SEED ?? process.env.GITHUB_RUN_ID;
  let seedOverride;
  if (rawSeed !== undefined) {
    if (!/^\d+$/.test(rawSeed))
      throw new Error('COMMANDO_MAP_SEED должен быть неотрицательным целым числом');
    seedOverride = Number(BigInt(rawSeed) & 0xffffffffn);
  } else {
    const { randomInt } = await import('node:crypto');
    seedOverride = randomInt(0, 4294967296);
  }
  const svg = renderSvg({
    weeks,
    sprites,
    username: USERNAME,
    fixture: demo,
    seedOverride,
    locationOverride: process.env.COMMANDO_LOCATION,
  });
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, svg, 'utf8');
  console.log(
    `SVG создан: ${out} (${Buffer.byteLength(svg)} байт, ${demo ? 'демо' : 'реальные данные'})`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`ОШИБКА: ${error.message}`);
    process.exitCode = 1;
  });
}
