import { readFile } from 'node:fs/promises';
import { fixture, sprites, grid } from './helpers/fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSvg } from '../scripts/generate.mjs';
import { LOCATION_POOL, selectLocation, renderLocation } from '../src/art/locations.mjs';
import { buildLevel, createMission, WORLD, validateLayout } from '../src/domain/mission.mjs';

import { levelMarkup } from '../src/art/level-art.mjs';

const emittedShots = (svg) =>
  [...svg.matchAll(/data-shots="([^"]+)"/g)].flatMap((m) => m[1].split(' ')).length;

test('Локации: пять уникальных стилей, выбор воспроизводим и разнообразен', () => {
  assert.equal(LOCATION_POOL.length, 5);
  const found = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const place = selectLocation(seed);
    assert.ok(LOCATION_POOL.includes(place));
    assert.equal(selectLocation(seed), place);
    assert.equal(buildLevel(grid, '0w1Max', seed).location, place);
    found.add(place);
  }
  assert.deepEqual([...found].sort(), [...LOCATION_POOL].sort());
  assert.throws(() => selectLocation(-1));
  assert.throws(() => renderLocation('unknown', 12));
});

test('Каждая локация содержит уникальный SVG-пейзаж без внешних ресурсов', () => {
  const scenes = LOCATION_POOL.map((location) => {
    const scene = renderLocation(location, 1729);
    assert.ok(scene.includes('data-location="' + location + '"'));
    assert.ok(scene.includes('height="430"'));
    assert.match(scene, /(?:y|data-ground-baseline)="374"/);
    assert.doesNotMatch(scene, /<script\b|<foreignObject\b|\s(?:href|src)=["']https?:\/\//i);
    return scene;
  });
  assert.equal(new Set(scenes).size, LOCATION_POOL.length);
});

test('Детализированный пиксельный каньон включён в SVG без внешних ресурсов', () => {
  const desertSeed = Array.from({ length: 80 }, (_, i) => i).find(
    (s) => buildLevel(grid, '0w1Max', s).location === 'desert',
  );
  assert.ok(Number.isInteger(desertSeed));
  const result = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: desertSeed,
  });
  assert.match(result, /id="desert-canyon-v6"/);
  assert.match(result, /data-ground-baseline="374"/);
  assert.match(result, /<path fill="#[a-f0-9]{6}" d="M/);
  assert.doesNotMatch(result, /<image\b|data:image\/png|<foreignObject\b|<script\b/i);
  assert.ok(result.length < 3000000, 'Превышен бюджет размера автономного SVG (3 МБ)');
  assert.match(result, /id="blue-commando"/);
  assert.match(result, /id="contribution-grid"/);
  assert.doesNotMatch(result, /<script\b|href="https?:\/\//i);
  const jungleSeed = Array.from({ length: 80 }, (_, i) => i).find(
    (s) => buildLevel(grid, '0w1Max', s).location === 'jungle',
  );
  assert.ok(Number.isInteger(jungleSeed));
  const jungle = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: jungleSeed,
  });
  assert.doesNotMatch(jungle, /id="desert-canyon-v6"/);
});

test('Каньон: квадратное поле интегрировано в сцену без тяжёлой рамки HUD', () => {
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 3,
  });
  assert.match(svg, /id="desert-canyon-v6"/);
  assert.match(svg, /id="contribution-overlay"/);
  assert.match(svg, /id="contribution-scrim"/);
  assert.doesNotMatch(svg, /id="contribution-shade"/);
  assert.match(svg, /id="contribution-grid"/);
  assert.match(svg, /id="hud-username"[^>]*aria-label="0w1Max \/"/);
  assert.doesNotMatch(svg, /<rect x="65" y="27" width="1070" height="190"/);
  assert.doesNotMatch(svg, /stroke="#294c45" stroke-width="2"/);
  assert.match(svg, /fill-opacity="0.08"/);
  assert.match(svg, /id="blue-commando"/);
  assert.match(svg, /id="mission-complete"/);
});

test('Каньон: линия грунта, статичный кадр бойца и полный размер', () => {
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 3,
  });
  assert.match(svg, /width="1200" height="469" viewBox="0 -32 1200 469"/);
  assert.doesNotMatch(svg.split('>', 2)[1], /preserveAspectRatio="none"/);
  assert.match(svg, /data-ground-baseline="374"/);
  const floor = [
    ...svg.matchAll(/href="#desert-sprite-ground-\d+" x="(\d+)" y="374" width="150" height="96"/g),
  ];
  assert.deepEqual(
    floor.map(([, x]) => Number(x)),
    [0, 150, 300, 450, 600, 750, 900, 1050],
  );
  const player = svg.match(/id="blue-commando" transform="translate\([^ ]+ ([^)]+)\)"/);
  assert.equal(Number(player?.[1]) + WORLD.spriteSize, WORLD.groundY);
  assert.match(svg, /id="procedural-level"/);
  assert.doesNotMatch(svg, /<image\b|data:image\/png/i);
});

test('Каньон: независимые слои и все тематические спрайты', () => {
  const backdrop = renderLocation('desert', 3);
  for (const name of ['west-mesa', 'distant-mesas', 'east-ridge']) {
    assert.match(backdrop, new RegExp('href="#desert-sprite-' + name + '"'));
  }
  assert.doesNotMatch(backdrop, /<image\b|data:image|https?:\/\//);
  const seen = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const level = buildLevel(grid, '0w1Max', seed);
    if (level.location !== 'desert') continue;
    assert.ok(validateLayout(level).valid);
    const art = levelMarkup(level);
    const objects = [...art.matchAll(/data-sprite="([^"]+)"><use href="#desert-kit-sprite-\1"/g)];
    assert.equal(objects.length, level.obstacles.length + level.platforms.length);
    assert.equal(
      (art.match(/filter="url\(#canyon-platform-shade\)"/g) || []).length,
      level.platforms.length,
    );
    const shadowMarkup = art.match(/id="desert-object-shadows"[^>]*>(.*?)<\/g>/)?.[1];
    assert.notEqual(shadowMarkup, undefined);
    assert.equal((shadowMarkup.match(/<path\b/g) || []).length, objects.length);
    for (const [, name] of objects) seen.add(name);
  }
  assert.deepEqual([...seen].sort(), [
    'obstacle-0',
    'obstacle-1',
    'obstacle-2',
    'obstacle-3',
    'platform-0',
    'platform-1',
    'platform-2',
  ]);
});

test('Вулкан: сборка сцены из локальных спрайтов и линия настила', async () => {
  const { volcanoScene } = await import('../src/art/volcano-scene.mjs');
  for (const seed of [0, 1, 6, 10, 17, 111, 999]) {
    const scene = volcanoScene(seed);
    assert.equal(scene, volcanoScene(seed));
    for (const name of ['lavafall', 'cavern', 'furnace', 'bridge', 'lava-a', 'lava-b']) {
      assert.ok(scene.includes('id="volcano-sprite-' + name + '"'));
    }
    const bridge = [
      ...scene.matchAll(/href="#volcano-sprite-bridge" x="(\d+)" y="(\d+)" width="(\d+)"/g),
    ];
    assert.ok(bridge.length > 1);
    let edge = 0;
    for (const [, x, y, width] of bridge) {
      assert.equal(Number(x), edge);
      assert.equal(Number(y), WORLD.groundY);
      edge += Number(width);
    }
    assert.equal(edge, WORLD.width);
    assert.doesNotMatch(scene, /<script\b|<image\b|data:image\/|<foreignObject\b|https?:\/\//i);
  }
  assert.notEqual(volcanoScene(0), volcanoScene(1));
  assert.throws(() => volcanoScene(-1));
});

test('Вулкан: генератор выбирает все спрайты, а отрисовка совпадает с игровой геометрией', () => {
  const obstacles = new Set(),
    platforms = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const map = buildLevel(grid, '0w1Max', seed);
    if (map.location !== 'volcano') continue;
    assert.ok(validateLayout(map).valid);
    const art = levelMarkup(map);
    const rendered = [
      ...art.matchAll(
        /data-sprite="([^"]+)"><use href="#volcano-sprite-\1" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g,
      ),
    ];
    assert.equal(rendered.length, map.platforms.length + map.obstacles.length);
    rendered.forEach(([, name, x, y, width, height], index) => {
      const platform = index < map.platforms.length;
      const item = platform ? map.platforms[index] : map.obstacles[index - map.platforms.length];
      assert.equal(Number(x), item.x);
      assert.equal(Number(width), item.width);
      assert.equal(Number(y), platform ? item.y : WORLD.groundY - item.height);
      if (!platform) assert.equal(Number(height), item.height);
      (platform ? platforms : obstacles).add(name);
    });
  }
  assert.deepEqual([...obstacles].sort(), [
    'basalt-boulder',
    'furnace-vent',
    'power-terminal',
    'ruptured-pipe',
    'slag-pile',
    'steel-barricade',
  ]);
  assert.deepEqual([...platforms].sort(), ['armored-gangway', 'basalt-ledge', 'truss-catwalk']);
});

test('Вулкан: автономный SVG сохраняет цикл бойца и выстрелы', () => {
  const seed = 6;
  const map = buildLevel(grid, '0w1Max', seed);
  assert.equal(map.location, 'volcano');
  const plan = createMission(grid, map);
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: seed,
  });
  assert.match(svg, /id="volcano-stage-v4"/);
  assert.match(svg, /id="volcano-bridge-and-lava"/);
  assert.match(
    svg,
    /width="1200" height="432" viewBox="0 -32 1200 517" preserveAspectRatio="none"/,
  );
  assert.doesNotMatch(svg, /id="contribution-shade"/);
  const player = svg.match(
    /id="blue-commando" transform="translate\(([^)]+)\)"[^>]*><animateTransform[^>]* values="([^;]+);/,
  );
  assert.ok(player);
  assert.equal(player[1], player[2]);
  assert.doesNotMatch(svg, /desert-end-zone|desert-victory-flag|STAGE CLEAR|<image\b|data:image\//);
  assert.equal(emittedShots(svg), plan.totalHp);
  assert.equal(plan.segments.at(-1).x1, plan.initial.x);
  assert.equal(plan.segments.at(-1).y1, plan.initial.footY);
  for (const another of [0, 1, 3, 7]) {
    const other = renderSvg({
      weeks: fixture.weeks,
      sprites,
      username: '0w1Max',
      fixture: true,
      seedOverride: another,
    });
    assert.doesNotMatch(other, /id="volcano-stage-v4"/);
  }
});

test('Джунгли: полная сцена, стык грунта и все тематические спрайты', () => {
  const expectedObstacles = [
    'wild-broken-log',
    'wild-moss-boulder',
    'wild-rock-pile',
    'wild-root-bundle',
    'wild-stump',
  ];
  const expectedPlatforms = ['wild-log-platform', 'wild-root-platform', 'wild-stone-ledge'];
  const obstacles = new Set(),
    platforms = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const level = buildLevel(grid, '0w1Max', seed);
    if (level.location !== 'jungle') continue;
    assert.ok(validateLayout(level).valid);
    const markup = levelMarkup(level);
    for (const [, type, name, x, y, width, height] of markup.matchAll(
      /id="(obstacle|platform)-\d+"[^>]+data-sprite="([^"]+)"><use href="#jungle-sprite-\2" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g,
    )) {
      if (type === 'obstacle') {
        assert.equal(Number(y) + Number(height), WORLD.groundY);
        obstacles.add(name);
      } else {
        assert.equal(Number(height), 32);
        assert.ok(
          level.platforms.some(
            (p) => p.x === Number(x) && p.y === Number(y) && p.width === Number(width),
          ),
        );
        platforms.add(name);
      }
    }
  }
  assert.deepEqual([...obstacles].sort(), expectedObstacles);
  assert.deepEqual([...platforms].sort(), expectedPlatforms);
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 34,
  });
  assert.match(svg, /width="1200" height="452" viewBox="0 -32 1200 452"/);
  assert.match(svg, /id="jungle-stage"[^>]*data-ground-baseline="374"/);
  assert.match(svg, /data-art-direction="wild-gorge"/);
  assert.doesNotMatch(svg, /jungle-sprite-(?:palm-bank|root-escarpment|moss-ledge|rope-bridge)\b/);
  const ground = [
    ...svg.matchAll(
      /href="#jungle-sprite-ground-strip" x="(\d+)" y="374" width="300" height="([0-9.]+)"/g,
    ),
  ];
  assert.deepEqual(
    ground.map(([, x]) => Number(x)),
    [0, 300, 600, 900],
  );
  for (const name of [
    'wild-waterfall-cliff',
    'wild-fallen-trunk',
    'wild-distant-forest',
    'wild-undergrowth',
    'ground-strip',
  ]) {
    const bounds = svg.match(
      new RegExp('<symbol id="jungle-sprite-' + name + '" viewBox="0 0 ([0-9.]+) ([0-9.]+)"'),
    );
    const use = svg.match(
      new RegExp(
        '<use href="#jungle-sprite-' +
          name +
          '" x="([0-9.]+)" y="([0-9.]+)" width="([0-9.]+)" height="([0-9.]+)"',
      ),
    );
    assert.ok(bounds && use, name);
    assert.ok(
      Math.abs(Number(use[3]) / Number(use[4]) - Number(bounds[1]) / Number(bounds[2])) < 1e-8,
      name,
    );
    if (name === 'wild-waterfall-cliff' || name === 'wild-fallen-trunk') {
      assert.equal(Number(use[2]) + Number(use[4]), WORLD.groundY);
      assert.ok(Number(use[1]) > 0 && Number(use[1]) + Number(use[3]) < WORLD.width);
    }
  }
  assert.doesNotMatch(
    svg,
    /jungle-sprite-(?:relay-|concrete-|bamboo-)|data-art-direction="radio-relay"/,
  );
  assert.doesNotMatch(svg, /<image\b|id="contribution-shade"/);
});

test('Снежная база: три платформы, четыре преграды и линия снега совпадают с геометрией', () => {
  const props = new Set();
  for (const seedOverride of [30, 36, 55]) {
    const map = buildLevel(grid, '0w1Max', seedOverride);
    assert.equal(map.location, 'snow');
    assert.ok(validateLayout(map).valid);
    const scene = renderSvg({
      weeks: fixture.weeks,
      sprites,
      username: '0w1Max',
      fixture: true,
      seedOverride,
    });
    assert.match(scene, /width="1200" height="462" viewBox="0 -32 1200 462"/);
    assert.match(scene, /id="snow-ground" data-ground-baseline="374"/);
    assert.match(scene, /id="snow-watchtower"/);
    assert.match(scene, /id="snow-bunker"/);
    assert.match(scene, /id="snow-object-shadows"/);
    assert.match(scene, /<rect [^>]*fill="#d8b580" fill-opacity="1"/);
    assert.doesNotMatch(scene, /<image\b|id="contribution-shade"/);
    for (const [, name] of scene.matchAll(/data-sprite="([^"]+)"><use href="#snow-sprite-\1"/g)) {
      props.add(name);
    }
    for (const { x, y, width } of map.platforms) {
      assert.match(
        scene,
        new RegExp(`href="#snow-sprite-[^"]+" x="${x}" y="${y}" width="${width}"`),
      );
    }
  }
  assert.deepEqual([...props].sort(), [
    'arctic-cargo-crate',
    'frosted-catwalk',
    'frosted-sandbags',
    'frozen-boulder',
    'ice-covered-slab',
    'reinforced-loading-deck',
    'snowbound-log',
  ]);
});

test('Завод: собственная палитра календаря, опорная линия и тени объектов', () => {
  const svg = renderSvg({ weeks: fixture.weeks, sprites, username: '0w1Max', seedOverride: 0 });
  assert.match(svg, /width="1200" height="469" viewBox="0 -32 1200 469"/);
  assert.equal((svg.match(/href="#factory-sprite-foundation-/g) || []).length, 4);
  assert.match(svg, /id="factory-skyline"/);
  for (const layer of ['process-yard', 'foundry', 'loading-bay']) {
    assert.ok(svg.includes(`href="#factory-sprite-${layer}"`));
  }
  assert.match(svg, /id="factory-ground"[^>]*data-ground-baseline="374"/);
  assert.match(svg, /id="industrial-object-shadows"/);
  assert.match(svg, /<text id="hud-username"[^>]+fill="#e2dfc7"/);
  const cells = svg.split('<g id="contribution-grid">')[1].split('</g>')[0];
  for (const color of ['#695544', '#9c7156', '#bd8b62', '#dab27b']) {
    assert.ok(cells.includes('fill="' + color + '" fill-opacity="1"'));
  }
  assert.doesNotMatch(svg, /id="contribution-shade"/);
});

test('Храм доступен явно и собирается из собственных спрайтов', () => {
  const seedOverride = 5;
  const map = buildLevel(grid, '0w1Max', seedOverride, 'temple');
  assert.equal(map.location, 'temple');
  assert.ok(validateLayout(map).valid);
  assert.equal(buildLevel(grid, '0w1Max', seedOverride).location, 'industrial');
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    seedOverride,
    locationOverride: 'temple',
  });
  assert.match(svg, /viewBox="0 -32 1200 469"/);
  for (let index = 0; index < 4; index++) {
    assert.ok(
      svg.includes(
        `href="#temple-sprite-causeway-${index}" x="${index * 300}" y="374" width="300" height="64"`,
      ),
    );
  }
  for (const color of ['#4b5943', '#667751', '#92966a', '#c8b681']) {
    assert.ok(svg.includes('fill="' + color + '" fill-opacity="1"'));
  }
  assert.match(svg, /id="temple-ground" data-ground-baseline="374"/);
  assert.match(svg, /href="#temple-sprite-temple-entrance"/);
  assert.match(svg, /data-biome="temple"/);
});

test('Побережье: отдельные спрайты, опорная линия дамбы и собственная палитра', () => {
  const seedOverride = 5;
  const map = buildLevel(grid, '0w1Max', seedOverride, 'coast');
  assert.ok(validateLayout(map).valid);
  const svg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    seedOverride,
    locationOverride: 'coast',
  });
  assert.match(svg, /height="469" viewBox="0 -32 1200 469"/);
  assert.match(svg, /id="coast-ground" data-ground-baseline="374"/);
  assert.match(svg, /href="#coast-sprite-lighthouse"/);
  assert.match(svg, /data-biome="coast"/);
  assert.match(svg, /fill="#c3bd92" fill-opacity="1"/);
  assert.equal((svg.match(/href="#coast-sprite-levee-/g) || []).length, 4);
});

test('Побережье: единый масштаб завода сохраняет прицел и кадры', () => {
  const seedOverride = 5;
  const map = buildLevel(grid, '0w1Max', seedOverride, 'coast');
  const plan = createMission(grid, map);
  const coastSvg = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride,
    locationOverride: 'coast',
  });
  assert.doesNotMatch(coastSvg, /id="storm-coast-profile-scale"/);
  assert.match(coastSvg, /height="469" viewBox="0 -32 1200 469"/);
  assert.match(coastSvg, /id="contribution-grid"/);
  assert.match(coastSvg, /width="18" height="18" rx="3"/);
  assert.match(coastSvg, /id="blue-commando"/);
  assert.match(coastSvg, /id="fx-muzzle"/);
  assert.equal(emittedShots(coastSvg), plan.totalHp);
  assert.match(coastSvg, /id="storm-coast-victory"/);
  assert.match(coastSvg, /STORM COAST/);
  assert.match(coastSvg, /GAME OVER/);
  assert.doesNotMatch(coastSvg, /desert-end-zone|<image\b|<script\b/);
  assert.equal(plan.segments.at(-1).x1, plan.initial.x);
  assert.equal(plan.segments.at(-1).y1, plan.initial.footY);
  const desert = renderSvg({
    weeks: fixture.weeks,
    sprites,
    username: '0w1Max',
    fixture: true,
    seedOverride: 3,
  });
  assert.doesNotMatch(desert, /storm-coast-profile-scale|storm-coast-victory|rx="3\.6"/);
});

test('Джунгли: опубликованный календарь сохраняет все даты, числа и уровни зелёного', async () => {
  const { weeks } = JSON.parse(await readFile('fixtures/jungle-preview-calendar.json', 'utf8'));
  const expected = weeks.flatMap((week) => week.contributionDays);
  const palette = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
  const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
  const svg = renderSvg({
    weeks,
    sprites,
    username: '0w1Max',
    seedOverride: 31,
    locationOverride: 'jungle',
  });
  const actual = [
    ...svg.matchAll(
      /<rect x="[0-9.]+" y="[0-9.]+" width="18" height="18"[^>]*fill="(#[0-9a-f]+)"[^>]*><title>(\d{4}-\d{2}-\d{2}): (\d+) contributions<\/title>/g,
    ),
  ];
  assert.equal(actual.length, expected.length, 'Дата не должна потеряться при смене локации');
  const byDate = new Map(expected.map((day) => [day.date, day]));
  for (const [, color, date, count] of actual) {
    const day = byDate.get(date);
    assert.ok(day, 'Лишняя дата ' + date);
    assert.equal(Number(count), day.contributionCount, date);
    assert.equal(color, palette[levels.indexOf(day.contributionLevel)], date);
    byDate.delete(date);
  }
  assert.equal(byDate.size, 0, 'Все опубликованные даты должны попасть в SVG');
  assert.doesNotMatch(svg, /<image\b|<script\b|<foreignObject\b/);
});
