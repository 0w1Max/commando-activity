import { WORLD } from './world.mjs';
import { clamp, round } from './math.mjs';
import { usesTerrainClearance } from './location-kits.mjs';
export function createMovement(level, rand, segments, jumps, shots) {
  let t = 0,
    player = { x: 90, footY: WORLD.groundY, facing: 'right' };
  const speed = 168;
  function segment(kind, duration, toX = player.x, toY = player.footY, facing = player.facing) {
    const start = round(t),
      end = round(t + Math.max(duration, 0.02));
    const s = {
      kind,
      start,
      end,
      x0: round(player.x),
      x1: round(toX),
      y0: round(player.footY),
      y1: round(toY),
      facing,
    };
    segments.push(s);
    t = end;
    player = { x: toX, footY: toY, facing };
    if (kind === 'jump' || kind === 'drop' || kind === 'hop') jumps.push(s);
    return s;
  }
  function walkTo(x) {
    if (Math.abs(x - player.x) < 0.0001) return;
    const facing = x > player.x ? 'right' : 'left';
    const distance = Math.abs(x - player.x);
    const walking = distance < 130 && rand() < 0.48;
    segment(walking ? 'walk' : 'run', distance / (walking ? 108 : speed), x, player.footY, facing);
  }
  function leapTo(x, y, kind = 'jump') {
    const jump = segment(
      kind,
      Math.max(0.46, Math.abs(x - player.x) / 180),
      x,
      y,
      x > player.x ? 'right' : 'left',
    );
    if (usesTerrainClearance(level.location)) {
      let arc = 57;
      for (let i = 1; i < 120; i++) {
        const u = i / 120,
          px = jump.x0 + (jump.x1 - jump.x0) * u,
          base = jump.y0 + (jump.y1 - jump.y0) * u;
        for (const o of level.obstacles) {
          if (px + 54 > o.x && px + 24 < o.x + o.width) {
            arc = Math.max(arc, (base - (WORLD.groundY - o.height - 8)) / Math.sin(u * Math.PI));
          }
        }
      }
      jump.arc = Math.ceil(arc);
    }
  }
  function moveTo(dest) {
    const targetX = dest.x;
    let goalY = dest.footY;
    const platformNow = level.platforms.find(
      (p) => p.y === player.footY && player.x + 38 >= p.x && player.x + 38 <= p.x + p.width,
    );
    if (platformNow && goalY !== player.footY) {
      const dir = targetX > player.x ? 1 : -1;
      const exit = safeGroundLanding(clamp(player.x + dir * 70, 5, 1110), dir);
      leapTo(exit, WORLD.groundY, 'drop');
    }
    if (goalY !== WORLD.groundY && player.footY === WORLD.groundY) {
      const p = dest.platform;
      const toSide = player.x < p.x + p.width / 2 ? 1 : -1;
      const approach = toSide > 0 ? p.x - 55 : p.x + p.width + 55;
      const approachX = safeGroundLanding(clamp(approach, 5, 1110), approach > player.x ? 1 : -1);
      moveGround(approachX);
      const land = clamp(toSide > 0 ? p.x + 15 : p.x + p.width - 91, p.x - 20, p.x + p.width - 58);
      leapTo(land, p.y, 'jump');
    }
    if (player.footY === WORLD.groundY && goalY === WORLD.groundY) moveGround(targetX);
    else walkTo(targetX);
  }
  function safeGroundLanding(x, dir) {
    let position = x;
    for (const o of level.obstacles) {
      const left = o.x - 78,
        right = o.x + o.width;
      if (position > left && position < right) position = dir > 0 ? right + 12 : left - 12;
    }
    return clamp(position, 5, 1110);
  }
  function moveGround(destX) {
    if (Math.abs(destX - player.x) < 0.0001) return;
    const dir = destX > player.x ? 1 : -1;
    // Запретная зона включает и ширину бойца: прыжок должен начаться ДО столкновения.
    const crossed = level.obstacles
      .filter((o) =>
        dir > 0
          ? player.x <= o.x - 70 &&
            destX >= o.x + o.width - (usesTerrainClearance(level.location) ? 24 : 8)
          : player.x >= o.x + o.width - (usesTerrainClearance(level.location) ? 24 : 8) &&
            destX <= o.x - 70,
      )
      .sort((a, b) => dir * (a.x - b.x));
    let jumped = false;
    for (const o of crossed) {
      const before = clamp(dir > 0 ? o.x - 90 : o.x + o.width + 18, 5, 1110);
      const after = clamp(dir > 0 ? o.x + o.width + 18 : o.x - 90, 5, 1110);
      if (dir * (before - player.x) > 1) walkTo(before);
      if (dir * (after - player.x) > 1) {
        leapTo(after, WORLD.groundY, 'jump');
        jumped = true;
      }
    }
    const diff = destX - player.x;
    if (!jumped && Math.abs(diff) > 140 && (level.seed + shots.length) % 3 === 0) {
      const mid = player.x + diff * 0.46;
      const from = mid - 25 * dir,
        to = mid + 36 * dir;
      const clear =
        !usesTerrainClearance(level.location) ||
        !level.obstacles.some(
          (o) => Math.max(from, to) + 70 > o.x && Math.min(from, to) + 8 < o.x + o.width,
        );
      if (clear) {
        walkTo(from);
        leapTo(to, WORLD.groundY, 'hop');
      }
    }
    walkTo(destX);
  }

  return {
    get time() {
      return t;
    },
    get player() {
      return player;
    },
    segment,
    moveTo,
    moveGround,
    leapTo,
    safeGroundLanding,
  };
}
