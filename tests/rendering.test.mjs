import { fixture, sprites, grid, mission, active, totalHp } from './helpers/fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWeeks, renderSvg } from '../scripts/generate.mjs';
import { LOCATION_POOL } from '../src/art/locations.mjs';
import {
  buildLevel,
  createMission,
  WORLD,
  OBSTACLE_POOL,
  PLATFORM_POOL,
  validateLayout,
} from '../src/domain/mission.mjs';
import { allocateShotPools } from '../src/render/shot-pool.mjs';
import { levelMarkup } from '../src/art/level-art.mjs';
import { BIOMES, biomeFor, soldierColor } from '../src/art/biomes.mjs';

const emittedShots = (svg) =>
  [...svg.matchAll(/data-shots="([^"]+)"/g)].flatMap((m) => m[1].split(' ')).length;

test('Календарь с 54 неделями сохраняет и отрисовывает обе крайние недели', () => {
  const weeks = Array.from({ length: 54 }, (_, i) => ({
    contributionDays: [
      {
        date: new Date(Date.UTC(2024, 11, 29 + i * 7)).toISOString().slice(0, 10),
        contributionCount: i === 0 || i === 53 ? 1 : 0,
        contributionLevel: i === 0 || i === 53 ? 'FIRST_QUARTILE' : 'NONE',
      },
    ],
  }));
  const extendedGrid = normalizeWeeks(weeks);
  assert.equal(extendedGrid.length, 54);
  const map = buildLevel(extendedGrid, '0w1Max', 3);
  const mission = createMission(extendedGrid, map);
  assert.deepEqual(mission.shots.map((shot) => shot.key).sort(), ['0:0', '53:0']);
  const svg = renderSvg({ weeks, sprites, username: '0w1Max', seedOverride: 3 });
  for (const week of [weeks[0], weeks.at(-1)]) {
    assert.ok(svg.includes(week.contributionDays[0].date + ': 1 contributions'));
  }
});

test('SVG не рисует металлический ящик с диагональным крестом', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.match(svg, /id="procedural-level"/);
  assert.doesNotMatch(svg, /stroke="#b7c4cd"|fill="#485b69"/);
});

test('SVG включает карты, преграды, прицельные пули и финальную зачистку', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  for (const token of [
    'blue-commando',
    'soldier-shoot-stand',
    'repeatCount="indefinite"',
    'DEMO / TEST DATA',
    'Pooled aimed shots',
    'procedural-level',
    'mission-complete',
  ]) {
    assert.ok(svg.includes(token), `Не найден SVG-маркер ${token}`);
  }
  assert.equal(emittedShots(svg), totalHp);
  assert.equal(
    (svg.match(/<rect x="[0-9]+" y="[0-9]+" width="18" height="18"/g) || []).length,
    grid.flat().filter(Boolean).length,
  );
});

test('SVG не содержит внешних адресов, скриптов, foreignObject и небезопасных источников', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\s(?:href|src)=["']https?:\/\//i);
  assert.match(svg, /id="contribution-grid"/);
  assert.match(svg, /id="blue-commando"/);
});

test('Настоящий режим не маскирует тестовые данные под реальные', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: false });
  assert.doesNotMatch(svg, /DEMO \/ TEST DATA/);
  assert.match(svg, /GitHub calendar fetched from the GitHub API/);
});

test('SVG содержит промежуточное потускнение и восстановление по завершении цикла', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.match(svg, /attributeName="fill"/);
  assert.match(svg, /attributeName="opacity"/);
  assert.equal(emittedShots(svg), totalHp);
});

test('Вспышка создаётся в точке дула и не задваивается кадром shoot-stand', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.equal(
    (svg.match(/class="muzzle-flash"/g) || []).length,
    allocateShotPools(mission.shots).length,
  );
  assert.equal(
    (svg.match(/class="bullet"/g) || []).length,
    allocateShotPools(mission.shots).length,
  );
  assert.match(svg, /href="#fx-muzzle"/);
  assert.doesNotMatch(svg, /<use href="#soldier-shoot-stand"/);
  assert.match(svg, /id="aim-upper"/);
  assert.match(svg, /type="rotate" calcMode="discrete"/);
  assert.match(svg, /type="translate" calcMode="linear"/);
});

test('Различаются короткие попадания и полноценные пиксельные взрывы', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  const destroyed = mission.shots.filter((s) => s.finalHit).length;
  assert.equal(destroyed, active);
  assert.equal(
    (svg.match(/href="#fx-impact-break"/g) || []).length,
    allocateShotPools(mission.shots).filter((p) => p.finalHit).length,
  );
  assert.equal(
    (svg.match(/href="#fx-impact-damage"/g) || []).length,
    allocateShotPools(mission.shots).filter((p) => !p.finalHit).length,
  );
  assert.match(svg, /id="fx-impact-break"/);
  assert.match(svg, /type="scale" calcMode="linear"/);
});

test('SVG плавно восстанавливает клетки и не телепортирует игрока', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.match(svg, /id="mission-complete"/);
  // Надпись появляется только после завершения миссии, затем плавно исчезает.
  assert.match(svg, /attributeName="opacity" calcMode="linear"/);
  // Отказ от принудительной замены последней позиции в рендере.
  assert.match(svg, /id="blue-commando"/);
  assert.equal(emittedShots(svg), totalHp);
});

test('Пустая сцена без препятствий и платформ корректна, негодные карты отклоняются', () => {
  const empty = buildLevel(grid, '0w1Max', 7);
  assert.equal(empty.obstacles.length, 0);
  assert.equal(empty.platforms.length, 0);
  assert.equal(levelMarkup(empty).includes('obstacle-0'), false);
  assert.equal(levelMarkup(empty).includes('platform-0'), false);
  const plan = createMission(grid, empty);
  assert.equal(plan.shots.length, totalHp);
  const corrupt = {
    ...empty,
    platforms: [{ kind: 'metal-catwalk', x: 450, width: 125, y: 320 }],
    obstacles: [{ kind: 'jungle-rock', x: 452, width: 34, height: 27 }],
  };
  assert.equal(validateLayout(corrupt).valid, false);
});

test('Каждый вид новой платформы и препятствия рендерится в SVG без внешних ассетов', () => {
  const preview = {
    seed: 123,
    obstacles: OBSTACLE_POOL.map((kind, i) => ({ kind, x: 175 + i * 70, width: 34, height: 27 })),
    platforms: PLATFORM_POOL.map((kind, i) => ({ kind, x: 200 + i * 50, width: 130, y: 322 })),
  };
  const svg = levelMarkup(preview);
  for (const kind of OBSTACLE_POOL) assert.match(svg, new RegExp(`data-kind="${kind}"`));
  for (const kind of PLATFORM_POOL) assert.match(svg, new RegExp(`data-kind="${kind}"`));
  assert.doesNotMatch(svg, /<image\b|https?:\/\//);
});

test('Неактивные дни почти прозрачные, активные клетки остаются непрозрачными', () => {
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 6,
  });
  const cells = svg.split('<g id="contribution-grid">')[1]?.split('</g>')[0];
  assert.ok(cells, 'SVG должен содержать поле активности');
  const empty = [...cells.matchAll(/<rect\b[^>]*fill="#a8bcc4"[^>]*>/g)].map((m) => m[0]);
  const active = [
    ...cells.matchAll(/<rect\b[^>]*fill="#(?:166f43|22a857|3dd96b|b7ff63)"[^>]*>/g),
  ].map((m) => m[0]);
  assert.ok(empty.length > 0, 'В демо должны быть пустые дни');
  assert.ok(active.length > 0, 'В демо должны быть активные дни');
  assert.ok(
    empty.every((tag) => tag.includes('fill-opacity="0.22"')),
    'Пустые клетки должны быть прозрачными на 78%',
  );
  assert.ok(
    active.every((tag) => tag.includes('fill-opacity="1"')),
    'Активные клетки сохраняют непрозрачность',
  );
});

test('Миссия и геометрия GitHub не зависят от выбранного окружения', () => {
  const map = buildLevel(grid, '0w1Max', 303);
  assert.ok(LOCATION_POOL.includes(map.location));
  const plan = createMission(grid, map);
  assert.equal(plan.shots.length, totalHp);
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 303,
  });
  assert.ok(svg.includes('data-location="' + map.location + '"'));
  assert.match(svg, /id="contribution-grid"/);
  assert.match(svg, /id="blue-commando"/);
});

test('В каждой локации собственные платформы, препятствия и цвет формы', () => {
  assert.equal(soldierColor('#1747be', 'desert'), '#1747be');
  assert.equal(soldierColor('#0442e8', 'snow'), '#0442e8');
  assert.equal(soldierColor('#f9b377', 'volcano'), '#f9b377');
  assert.equal(soldierColor('#857f39', 'jungle'), '#857f39');
  for (const location of Object.keys(BIOMES)) {
    if (location !== 'jungle') assert.notEqual(soldierColor('#857f39', location), '#857f39');
    const theme = biomeFor(location);
    const sample = {
      seed: 1,
      location,
      platforms: [{ kind: theme.platforms[0], x: 330, y: 321, width: 130 }],
      obstacles: [{ kind: theme.obstacles[0], x: 700, width: 34, height: 27 }],
    };
    const svg = levelMarkup(sample);
    assert.ok(svg.includes('data-biome="' + location + '"'));
    assert.equal((svg.match(/data-theme-detail=/g) || []).length, 2);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\s(?:src|href)=["']https?:\/\//i);
  }
  assert.throws(() => biomeFor('unknown'));
});

test('SVG содержит согласованные биом, бойца и график', () => {
  const seed = 49,
    level = buildLevel(grid, '0w1Max', seed);
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: seed,
  });
  assert.ok(svg.includes('data-biome="' + level.location + '"'));
  assert.ok(svg.includes('data-location="' + level.location + '"'));
  assert.ok(svg.includes('id="blue-commando"'));
  assert.ok(
    svg.includes(level.location === 'desert' ? 'fill-opacity="0.08"' : 'fill-opacity="0.22"'),
  );
});

test('Пустые клетки видны на приглушённом дневном фоне без тяжёлой рамки', () => {
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 3,
  });
  const cells = svg.split('<g id="contribution-grid">')[1]?.split('</g>')[0];
  assert.ok(cells);
  assert.ok(
    [...cells.matchAll(/<rect\b[^>]*fill="#2a5261"[^>]*>/g)].every((m) =>
      m[0].includes('fill-opacity="0.08"'),
    ),
  );
  assert.match(cells, /stroke="#254a58" stroke-opacity="\.32"/);
  for (const color of ['#704a38', '#9d5c3c', '#c77c49', '#e3ac68']) {
    assert.ok(cells.includes('fill="' + color + '" fill-opacity="1"'));
  }
  assert.match(cells, /<animate attributeName="fill"[^>]*values="#(?:704a38|9d5c3c|c77c49|e3ac68)/);
  assert.match(svg, /<text id="hud-username"[^>]*fill="#38291f"/);
  assert.doesNotMatch(svg, /<text[^>]*stroke=/);
  assert.match(svg, /<g id="fx-impact-break"[^>]*>\s*<rect[^>]*fill="#d69a65"/);
  assert.doesNotMatch(svg, /<rect x="65" y="27" width="1070" height="190"/);
});

test('Календарь V5: клетка 18px при шаге 20px и одинаковая физика попаданий', () => {
  assert.equal(WORLD.cell, 18);
  assert.equal(WORLD.step, 20);
  assert.equal(WORLD.groundY, 374);
  assert.equal(WORLD.gridX + 52 * WORLD.step + WORLD.cell, 1130);
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', fixture: true });
  assert.match(svg, /width="18" height="18"/);
  assert.match(svg, /font-size="21" font-weight="bold"/);
  assert.match(svg, /font-size="15" font-weight="bold"/);
});

test('Storm Coast V2: 54- и 55-недельные календари не теряют крайние дни', () => {
  for (const weekCount of [54, 55]) {
    const weeks = Array.from({ length: weekCount }, (_, i) => ({
      contributionDays: [
        {
          date: new Date(Date.UTC(2024, 11, 29 + i * 7)).toISOString().slice(0, 10),
          contributionCount: i === 0 || i === weekCount - 1 ? 1 : 0,
          contributionLevel: i === 0 || i === weekCount - 1 ? 'FIRST_QUARTILE' : 'NONE',
        },
      ],
    }));
    const svg = renderSvg({
      weeks,
      sprites,
      username: '0w1Max',
      seedOverride: 5,
      locationOverride: 'coast',
    });
    assert.doesNotMatch(svg, /id="storm-coast-profile-scale"/);
    assert.match(svg, /id="storm-coast-victory"/);
    assert.match(svg, /height="469" viewBox="0 -32 1200 469"/);
    assert.match(svg, /width="18" height="18" rx="3"/);
    for (const week of [weeks[0], weeks.at(-1)])
      assert.ok(svg.includes(week.contributionDays[0].date + ': 1 contributions'));
    const rightEdge = 72 + (weekCount - 1) * 20 + 18;
    assert.ok(rightEdge <= 1200, 'Последняя неделя обрезана: ' + weekCount);
  }
});
