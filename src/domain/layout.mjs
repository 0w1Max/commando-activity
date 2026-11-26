import { selectLocation } from './locations.mjs';
import { biomeFor } from './biomes.mjs';
import { factoryObstacleSizes } from './terrain-sizes.mjs';
import { LOCATION_KITS, hasLocationKit, usesTerrainClearance } from './location-kits.mjs';

export function hash32(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Коллекции оригинальных 8-bit объектов, оформляемые рендерером отдельно. */
export const OBSTACLE_POOL = Object.freeze([
  'jungle-rock',
  'fallen-log',
  'sandbags',
  'stone-ruin',
  'tree-stump',
  'supply-crate',
]);
export const PLATFORM_POOL = Object.freeze([
  'wooden-bridge',
  'mossy-stone',
  'vine-ledge',
  'metal-catwalk',
  'camo-platform',
]);

export function randomCount(random, max) {
  if (!Number.isInteger(max) || max < 0) throw new Error('Некорректный предел объектов');
  return Math.floor(random() * (max + 1));
}

/** Fisher–Yates: без повторений, пока есть уникальные варианты. */
export function pickUnique(pool, count, random) {
  if (!Array.isArray(pool) || !Number.isInteger(count) || count < 0)
    throw new Error('Неверный пул объектов');
  const options = [...new Set(pool)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options.slice(0, count);
}

export function validateLayout(level) {
  const issues = [];
  if (level.obstacles.length > 3) issues.push('Больше трёх препятствий');
  if (level.platforms.length > 2) issues.push('Больше двух платформ');
  if (new Set(level.obstacles.map((o) => o.kind)).size !== level.obstacles.length)
    issues.push('Повторение типа препятствия');
  if (new Set(level.platforms.map((p) => p.kind)).size > 1)
    issues.push('На одной карте платформы разных типов');
  if (new Set(level.platforms.map((p) => p.width)).size > 1)
    issues.push('На одной карте платформы разной ширины');
  if (level.location !== undefined) {
    const theme = biomeFor(level.location);
    if (level.obstacles.some((o) => !theme.obstacles.includes(o.kind)))
      issues.push('Преграда не соответствует локации');
    if (level.platforms.some((p) => !theme.platforms.includes(p.kind)))
      issues.push('Платформа не соответствует локации');
  }
  for (let i = 0; i < level.platforms.length; i++) {
    const p = level.platforms[i];
    if (
      !PLATFORM_POOL.includes(p.kind) ||
      p.x < 190 ||
      p.x + p.width > 1110 ||
      p.width < 110 ||
      p.width > (usesTerrainClearance(level.location) ? 160 : 165) ||
      p.y < (usesTerrainClearance(level.location) ? 300 : 310) ||
      p.y > 340
    )
      issues.push(`Платформа ${i} вне допустимых размеров`);
    for (let j = i + 1; j < level.platforms.length; j++) {
      const q = level.platforms[j];
      if (!(p.x + p.width + 90 < q.x || q.x + q.width + 90 < p.x))
        issues.push(`Платформы ${i}/${j} слишком близко`);
    }
  }
  for (let i = 0; i < level.obstacles.length; i++) {
    const o = level.obstacles[i];
    if (
      !OBSTACLE_POOL.includes(o.kind) ||
      o.x < 290 ||
      o.x + o.width > 1120 ||
      o.width < 20 ||
      o.width > (level.location === 'industrial' ? 45 : 55) ||
      o.height < 15 ||
      o.height > (usesTerrainClearance(level.location) ? 38 : 36)
    )
      issues.push(`Препятствие ${i} вне допустимых размеров`);
    for (let j = i + 1; j < level.obstacles.length; j++) {
      const q = level.obstacles[j];
      if (Math.abs(o.x - q.x) < 180) issues.push(`Препятствия ${i}/${j} слишком близко`);
    }
    for (let j = 0; j < level.platforms.length; j++) {
      const p = level.platforms[j];
      if (!(o.x + o.width < p.x - 45 || o.x > p.x + p.width + 45))
        issues.push(`Препятствие ${i} перекрывает платформу ${j}`);
    }
  }
  return { valid: issues.length === 0, issues };
}

export function buildLevel(grid, username = '0w1Max', seedOverride, locationOverride) {
  if (
    !Array.isArray(grid) ||
    grid.length < 53 ||
    grid.length > 55 ||
    grid.some((w) => !Array.isArray(w) || w.length !== 7)
  ) {
    throw new Error('Для карты нужен календарь из 53–55 недель по 7 дней');
  }
  const seed =
    seedOverride ??
    hash32(
      username +
        '|' +
        grid
          .flat()
          .map((d) => (d ? `${d.date}:${d.count}:${d.level}` : '-'))
          .join('|'),
    );
  const location = locationOverride ?? selectLocation(seed);
  const biome = biomeFor(location);
  const rand = seededRandom(seed);
  const platformCount = randomCount(rand, 2);
  const obstacleCount = randomCount(rand, 3);
  // Одна общая модель и ширина для всех платформ этой карты.
  const platformKind = platformCount
    ? biome.platforms[Math.floor(rand() * biome.platforms.length)]
    : null;
  const platformWidth = platformCount
    ? usesTerrainClearance(location)
      ? 150 + Math.floor(rand() * 11)
      : 116 + Math.floor(rand() * 34)
    : null;
  const obstacleTypes = pickUnique(biome.obstacles, obstacleCount, rand);
  // Две непересекающиеся зоны, доступные для прыжка с земли.
  const zones = pickUnique([0, 1], platformCount, rand).sort();
  const platforms = zones.map((zone) => ({
    kind: platformKind,
    x: Math.round((zone === 0 ? 255 : 735) + rand() * 80),
    width: platformWidth,
    y: usesTerrainClearance(location)
      ? 300 + Math.floor(rand() * 7)
      : 317 + Math.floor(rand() * 16),
  }));
  const sizes = {
    'jungle-rock': [34, 27],
    'fallen-log': [44, 19],
    sandbags: [45, 25],
    'stone-ruin': [32, 32],
    'tree-stump': [31, 30],
    'supply-crate': [34, 27],
  };
  const obstacles = [];
  for (const kind of obstacleTypes) {
    const [width, height] = (
      location === 'industrial'
        ? factoryObstacleSizes
        : hasLocationKit(location)
          ? LOCATION_KITS[location].sizes
          : sizes
    )[kind];
    // Левый участок x < 290 оставлен свободным для заключительного патруля.
    // 50 воспроизводимых кандидатов: при нехватке места объект НЕ добавляем.
    for (let attempt = 0; attempt < 50; attempt++) {
      const x =
        290 +
        Math.floor(
          rand() * (usesTerrainClearance(location) ? Math.min(780, 1120 - width - 290 + 1) : 780),
        );
      const o = { kind, x, width, height };
      if (obstacles.some((prev) => Math.abs(prev.x - x) < 180)) continue;
      if (platforms.some((p) => !(x + width < p.x - 45 || x > p.x + p.width + 45))) continue;
      obstacles.push(o);
      break;
    }
  }
  const level = { seed, location, obstacles, platforms };
  const checked = validateLayout(level);
  if (!checked.valid) throw new Error('Некорректная карта: ' + checked.issues.join('; '));
  return level;
}
