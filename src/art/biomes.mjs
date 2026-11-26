import { biomeFor } from '../domain/biomes.mjs';
export { BIOMES, biomeFor } from '../domain/biomes.mjs';

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (channels) =>
  '#' +
  channels
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * У солдата остаются исходные синие повязка, кожа, оружие и контуры.
 * Перекрашиваются только различимые по цвету ткань и детали жилета.
 */
export function soldierColor(original, location) {
  if (location === 'jungle') return original;
  const { outfit } = biomeFor(location);
  if (!/^#[\da-f]{6}$/i.test(original)) return original;
  const [r, g, b] = rgb(original);
  if (b > r * 1.22 && b > g * 1.1) return original; // синяя повязка
  if (r > g * 1.22 && g > b * 1.16) return original; // кожа, руки, лицо
  if (Math.max(r, g, b) < 49) return original; // тёмные контуры
  const olive = r >= 64 && g >= 58 && g > b * 1.34 && r >= g * 0.87 && r <= g * 1.25;
  const vest = r >= 61 && r <= 139 && Math.abs(r - g) < 24 && Math.abs(g - b) < 29 && !olive;
  if (!olive && !vest) return original;
  const base = rgb(olive ? outfit.cloth : outfit.vest);
  const brightness = r * 0.25 + g * 0.6 + b * 0.15;
  const factor = clamp(brightness / (olive ? 103 : 90), 0.58, 1.34);
  return hex(base.map((v) => v * factor));
}

/** Palette-mapping keeps 8-bit source geometry unchanged, but makes each biome cohesive. */
export function tintTerrainArt(markup, location) {
  if (location === 'jungle') return markup;
  const pal = biomeFor(location).palette;
  return markup.replace(/(fill|stroke)="(#[0-9a-f]{6})"/gi, (attr, prop, color) => {
    const [r, g, b] = rgb(color);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 38) return attr;
    let role;
    if (g > r * 1.18 && g > b * 1.16) role = 'leaf';
    else if (r > g * 1.18 && g > b * 1.08) role = 'timber';
    else if (r > g * 0.9 && g > b * 1.2 && r <= g * 1.18) role = 'leaf';
    else if (Math.abs(r - g) < 25 && Math.abs(g - b) < 27) role = 'stone';
    else role = 'metal';
    const desired = rgb(pal[role]);
    const factor = clamp(lum / 129, 0.53, 1.35);
    return `${prop}="${hex(desired.map((v) => v * factor))}"`;
  });
}

const bar = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

/** Decorations are purely visual, inside the existing collision bounding boxes. */
export function obstacleBiomeDetail(obstacle, location) {
  const { width: w, height: h } = obstacle;
  const pal = biomeFor(location).palette;
  switch (location) {
    case 'jungle':
      return `<g data-theme-detail="jungle">${bar(6, -h + 2, 6, 3, pal.leaf)}${bar(w - 13, -h + 4, 5, 4, pal.highlight)}</g>`;
    case 'desert':
      return `<g data-theme-detail="desert">${bar(5, -h + 3, w - 11, 3, pal.highlight)}${bar(11, -8, 5, 3, pal.shade)}${bar(w - 10, -13, 4, 3, pal.stone)}</g>`;
    case 'snow':
      return `<g data-theme-detail="snow">${bar(3, -h + 1, w - 6, 5, pal.highlight)}${bar(8, -h + 6, 4, 4, pal.leaf)}${bar(w - 13, -h + 6, 3, 6, pal.leaf)}</g>`;
    case 'volcano':
      return `<g data-theme-detail="volcano"><path d="M6 -4h8v-7h5v5h7v-6" stroke="${pal.leaf}" stroke-width="3" fill="none"/>${bar(w - 10, -h + 4, 4, 4, pal.highlight)}</g>`;
    case 'industrial':
      return `<g data-theme-detail="industrial">${bar(4, -h + 4, w - 8, 4, pal.highlight)}${bar(8, -h + 9, 5, 3, pal.shade)}${bar(w - 13, -h + 9, 5, 3, pal.shade)}</g>`;
    default:
      throw new Error('Неподдерживаемая локация');
  }
}

export function platformBiomeDetail(platform, location) {
  const w = platform.width;
  const pal = biomeFor(location).palette;
  switch (location) {
    case 'jungle':
      return `<g data-theme-detail="jungle">${bar(4, -2, w - 8, 4, pal.leaf)}${bar(14, 8, 3, 11, pal.leaf)}${bar(w - 25, 11, 4, 13, pal.leaf)}</g>`;
    case 'desert':
      return `<g data-theme-detail="desert">${bar(3, -1, w - 6, 4, pal.highlight)}${bar(9, 5, 8, 3, pal.stone)}${bar(w - 24, 5, 8, 3, pal.stone)}</g>`;
    case 'snow':
      return `<g data-theme-detail="snow">${bar(3, -3, w - 6, 6, pal.highlight)}${Array.from({ length: Math.floor(w / 32) }, (_, i) => bar(14 + i * 32, 3, 4, 9, pal.leaf)).join('')}</g>`;
    case 'volcano':
      return `<g data-theme-detail="volcano">${bar(4, -1, w - 8, 3, pal.shade)}${Array.from({ length: Math.floor(w / 27) }, (_, i) => bar(12 + i * 27, 2, 7, 3, pal.highlight)).join('')}</g>`;
    case 'industrial':
      return `<g data-theme-detail="industrial">${bar(2, 0, w - 4, 2, pal.highlight)}${bar(4, 9, w - 8, 3, pal.shade)}</g>`;
    default:
      throw new Error('Неподдерживаемая локация');
  }
}
