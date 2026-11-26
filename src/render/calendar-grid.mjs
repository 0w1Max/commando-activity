import { WORLD } from '../domain/world.mjs';
import { escapeXml, round, fmt, animationAttr } from './svg.mjs';
const { gridX: GRID_X, gridY: GRID_Y, step: STEP, cell: CELL } = WORLD;
export function gridMarkup(
  grid,
  mission,
  { colors, emptyBorder, activeBorder, emptyOpacity, radius = '2', cellGrow = 0 },
) {
  const impacts = new Map();
  for (const shot of mission.shots) {
    if (!impacts.has(shot.key)) impacts.set(shot.key, []);
    impacts.get(shot.key).push(shot);
  }
  let output = '';
  for (let col = 0; col < grid.length; col++)
    for (let row = 0; row < 7; row++) {
      const cell = grid[col][row];
      if (!cell) continue;
      const key = `${col}:${row}`,
        hits = impacts.get(key) ?? [];
      const x = GRID_X + col * STEP,
        y = GRID_Y + row * STEP;
      const title = `${cell.date}: ${cell.count} contributions`;
      let child = '';
      if (hits.length) {
        // Повреждение и исчезновение — мгновенные события; восстановление
        // происходит плавно по столбцам, пока боец возвращается к старту.
        const fade = 0.3;
        const range = mission.restoreEnd - mission.restoreStart - fade;
        const share = (col + row * 0.04) / (grid.length - 1 + 0.24);
        const at = round(mission.restoreStart + share * range);
        const end = round(at + fade);
        const keys = [0],
          opacity = ['1'];
        for (const shot of hits) {
          keys.push(round(shot.impact - 0.001), shot.impact);
          opacity.push(opacity.at(-1), shot.finalHit ? '0' : '1');
        }
        keys.push(at, end, mission.duration);
        opacity.push('0', '1', '1');
        // Интерполяция между совпадающими состояниями эквивалентна удержанию:
        // 0.001 секунды на разрушение; 0.3 секунды на восстановление.
        child += animationAttr('opacity', keys, opacity, mission.duration, 'linear');
        const shadeKeys = [0, ...hits.map((h) => h.impact), at, mission.duration];
        const shades = [
          colors[cell.level],
          ...hits.map((h) =>
            h.finalHit ? colors[1] : colors[Math.min(cell.level, h.hpAfter + 1)],
          ),
          colors[cell.level],
          colors[cell.level],
        ];
        child += animationAttr('fill', shadeKeys, shades, mission.duration);
      }
      const fillOpacity = cell.level === 0 ? emptyOpacity : '1';
      const border = cell.level === 0 ? emptyBorder : activeBorder;
      // Keep the visible cell geometry aligned with collision and bullet coordinates.
      const inset = cellGrow / 2,
        visualSize = CELL + cellGrow;
      output += `<rect x="${fmt(x - inset)}" y="${fmt(y - inset)}" width="${fmt(visualSize)}" height="${fmt(visualSize)}" rx="${radius}" fill="${colors[cell.level]}" fill-opacity="${fillOpacity}"${border}><title>${escapeXml(title)}</title>${child}</rect>`;
    }
  return output;
}
