import { WORLD } from './world.mjs';
/**
 * Столкновение линии полёта с первой живой клеткой.
 * Проверяется реальный прямоугольник клетки, а не только её центр/столбец.
 */
export function firstLiveIntersection(origin, end, live) {
  const dx = end.x - origin.x,
    dy = end.y - origin.y;
  let nearest = null,
    bestT = Infinity;
  for (const cell of live.values()) {
    if (cell.hp <= 0) continue;
    const half = WORLD.cell / 2;
    const left = cell.x - half,
      right = cell.x + half,
      top = cell.y - half,
      bottom = cell.y + half;
    let t0 = 0,
      t1 = 1;
    for (const [p, v, min, max] of [
      [origin.x, dx, left, right],
      [origin.y, dy, top, bottom],
    ]) {
      if (Math.abs(v) < 1e-9) {
        if (p < min || p > max) {
          t0 = 2;
          break;
        }
      } else {
        let a = (min - p) / v,
          b = (max - p) / v;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, b);
        if (t0 > t1) break;
      }
    }
    if (t0 <= t1 && t0 >= 0 && t0 < bestT) {
      bestT = t0;
      nearest = { key: cell.key, t: t0, col: cell.col, row: cell.row };
    }
  }
  return nearest;
}

/**
 * Единственный источник геометрии дула. Поворот верхней части спрайта aim
 * относительно опорной точки применяется и к стволу, и к началу траектории.
 * Угол tilt — градусы, положительный наклон опускает ствол в сторону движения.
 */
export function aimGeometry(playerX, footY, facing, tilt = 0) {
  if (facing !== 'left' && facing !== 'right')
    throw new Error('Некорректное направление персонажа');
  const rad = (tilt * Math.PI) / 180,
    co = Math.cos(rad),
    si = Math.sin(rad);
  const rotate = (x, y) => ({
    x: WORLD.aimPivotX + (x - WORLD.aimPivotX) * co - (y - WORLD.aimPivotY) * si,
    y: WORLD.aimPivotY + (x - WORLD.aimPivotX) * si + (y - WORLD.aimPivotY) * co,
  });
  const tip = rotate(WORLD.aimTipX, WORLD.aimTipY),
    grip = rotate(WORLD.aimGripX, WORLD.aimGripY);
  const dir = facing === 'right' ? 1 : -1;
  const offset = (x) => (facing === 'right' ? x : WORLD.spriteSize - x);
  return {
    origin: { x: playerX + offset(tip.x), y: footY - WORLD.spriteSize + tip.y },
    barrel: { x: dir * (tip.x - grip.x), y: tip.y - grip.y },
    tilt,
  };
}

export class UnreachableTargetError extends Error {}

export function chooseFiringPosition(target, pass, level, currentX, live) {
  const footCandidates = [];
  for (const groundY of [WORLD.groundY, ...level.platforms.map((p) => p.y)]) {
    for (const facing of ['right', 'left']) {
      // Смещаем плечо вместе с оружием; SVG повторяет тот же поворот.
      for (const tilt of [-23, -19, -15, -11, -7, -3, 0, 3, 7, 11, 14]) {
        const pose = aimGeometry(0, groundY, facing, tilt);
        const vertical = pose.origin.y - target.y;
        if (vertical < 12 || pose.barrel.y >= -2) continue;
        const run = vertical * Math.abs(pose.barrel.x / pose.barrel.y);
        const dir = facing === 'right' ? 1 : -1;
        const x = target.x - pose.origin.x - dir * run;
        if (x < 6 || x > 1110) continue;
        const muzzle = aimGeometry(x, groundY, facing, tilt);
        if (
          Math.abs(
            (target.x - muzzle.origin.x) * muzzle.barrel.y -
              (target.y - muzzle.origin.y) * muzzle.barrel.x,
          ) > 0.01
        )
          continue;
        const onPlatform = level.platforms.find((p) => p.y === groundY);
        if (
          onPlatform &&
          !(x + 38 >= onPlatform.x + 14 && x + 38 <= onPlatform.x + onPlatform.width - 14)
        )
          continue;
        const blocking = level.obstacles.some(
          (o) => groundY === WORLD.groundY && x + 8 < o.x + o.width + 5 && x + 70 > o.x - 5,
        );
        if (blocking) continue;
        if (firstLiveIntersection(muzzle.origin, target, live)?.key !== target.key) continue;
        footCandidates.push({
          x,
          footY: groundY,
          facing,
          tilt,
          platform: onPlatform ?? null,
          cost:
            Math.abs(x - currentX) * 0.07 +
            Math.abs(tilt) * 0.55 +
            (facing !== pass ? 13 : 0) +
            (onPlatform ? -5 : 0),
        });
      }
    }
  }
  if (!footCandidates.length)
    throw new UnreachableTargetError(`Нельзя прицелиться в клетку ${target.key}`);
  footCandidates.sort((a, b) => a.cost - b.cost);
  return footCandidates[0];
}
