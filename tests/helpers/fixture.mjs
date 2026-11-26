import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { normalizeWeeks } from '../../src/calendar/calendar.mjs';
import { buildLevel, createMission, hpForLevel } from '../../src/domain/mission.mjs';
export async function compressedJson(path) {
  return JSON.parse(gunzipSync(Buffer.from((await readFile(path, 'utf8')).trim(), 'base64')));
}
export const fixture = await compressedJson('fixtures/demo-calendar.json.gz.b64');
export const sprites = await compressedJson('assets/sprites.json.gz.b64');
export const grid = normalizeWeeks(fixture.weeks);
export const level = buildLevel(grid, '0w1Max');
export const mission = createMission(grid, level);
export const active = grid.flat().filter((day) => day && day.level > 0).length;
export const totalHp = grid.flat().reduce((sum, day) => sum + hpForLevel(day?.level ?? 0), 0);
