import { chooseNextTarget } from './target-selection.mjs';
import { WORLD } from './world.mjs';
import { seededRandom, hash32 } from './layout.mjs';
import { clamp, round } from './math.mjs';
import { aimGeometry, firstLiveIntersection } from './aim.mjs';
import { createMovement } from './movement.mjs';
export { WORLD } from './world.mjs';
export * from './layout.mjs';
export { aimGeometry, firstLiveIntersection } from './aim.mjs';
/**
 * Прочность зависит только от уровня активности GitHub.
 * NONE=0, Q1/Q2=1, Q3=2, Q4=3. Исходные данные не мутируем.
 */
export function hpForLevel(level) {
  if (!Number.isInteger(level) || level < 0 || level > 4)
    throw new Error('Недопустимый уровень клетки');
  return level === 0 ? 0 : level >= 3 ? level - 1 : 1;
}

function allTargets(grid) {
  const out = [];
  for (let col = 0; col < grid.length; col++)
    for (let row = 0; row < 7; row++) {
      const cell = grid[col][row];
      if (!cell || cell.level === 0) continue;
      out.push({
        col,
        row,
        key: `${col}:${row}`,
        level: cell.level,
        maxHp: hpForLevel(cell.level),
        x: WORLD.gridX + col * WORLD.step + WORLD.cell / 2,
        y: WORLD.gridY + row * WORLD.step + WORLD.cell / 2,
      });
    }
  return out;
}

/** Выдаёт воспроизводимый план: движение, прыжки, точные попадания, финальная зачистка. */
export function createMission(grid, level) {
  const targets = allTargets(grid);
  const live = new Map(targets.map((cell) => [cell.key, { ...cell, hp: cell.maxHp }]));
  // Псевдослучайность привязана к seed карты + содержимому календаря.
  // Нет Math.random(): повторный запуск строит тот же маршрут и набор попаданий.
  const rand = seededRandom(
    hash32(`mission-v3|${level.seed}|` + targets.map((v) => `${v.key}:${v.maxHp}`).join('|')),
  );
  // У каждого столбца собственная очередь: верхняя клетка открывается после
  // уничтожения всех живых клеток под ней. При этом сами столбцы НЕ сортируются
  // по рядам; следующий выстрел может быть в любом открытом столбце.
  const columns = Array.from({ length: grid.length }, () => []);
  for (const target of targets) columns[target.col].push(target);
  for (const cells of columns) cells.sort((a, b) => b.row - a.row);
  let selectionIndex = 0;
  const targetOrder = [];
  const segments = [],
    shots = [],
    jumps = [];
  const motion = createMovement(level, rand, segments, jumps, shots);
  const { segment, moveTo, moveGround, leapTo, safeGroundLanding } = motion;

  const used = new Set();

  while (live.size) {
    // Короткие свободные пробежки нарушают ритм «переход-выстрел»,
    // а переходы через препятствия остаются под контролем moveGround.
    if (
      selectionIndex > 0 &&
      selectionIndex % 7 === 0 &&
      rand() < 0.32 &&
      motion.player.footY === WORLD.groundY
    ) {
      const direction = rand() < 0.5 ? -1 : 1;
      const x = safeGroundLanding(
        clamp(motion.player.x + direction * (45 + rand() * 105), 5, 1110),
        direction,
      );
      moveGround(x);
    }
    const choice = chooseNextTarget({ columns, live, player: motion.player, level, rand });
    if (!choice) throw new Error('Исчезла доступная цель при незавершённой миссии');
    const { target, dest } = choice;
    moveTo(dest);
    if (motion.player.facing !== dest.facing)
      segment('turn', 0.045, motion.player.x, motion.player.footY, dest.facing);
    segment('aim', 0.052);
    const geometry = aimGeometry(
      motion.player.x,
      motion.player.footY,
      motion.player.facing,
      dest.tilt,
    );
    const origin = { x: round(geometry.origin.x), y: round(geometry.origin.y) };
    if (firstLiveIntersection(origin, target, live)?.key !== target.key)
      throw new Error(`Траектория перекрыта перед выстрелом: ${target.key}`);
    // Важно: цель остаётся живой до последнего попадания.
    const distance = Math.hypot(origin.x - target.x, origin.y - target.y);
    const state = live.get(target.key);
    if (!state || state.hp !== target.maxHp)
      throw new Error(`Неверное состояние цели: ${target.key}`);
    for (let hit = 1; hit <= target.maxHp; hit++) {
      const start = round(motion.time);
      const impact = round(start + distance / 780);
      const hpBefore = state.hp;
      state.hp--;
      shots.push({
        ...target,
        origin,
        facing: motion.player.facing,
        tilt: dest.tilt,
        start,
        impact,
        playerX: round(motion.player.x),
        footY: round(motion.player.footY),
        hitIndex: hit,
        hpBefore,
        hpAfter: state.hp,
        finalHit: state.hp === 0,
      });
      segment('shoot', Math.max(0.105, impact - start + 0.018));
    }
    if (state.hp !== 0) throw new Error(`Цель не уничтожена: ${target.key}`);
    live.delete(target.key);
    if (used.has(target.key)) throw new Error(`Повторная цель: ${target.key}`);
    used.add(target.key);
    targetOrder.push(target.key);
    selectionIndex++;
  }
  const lastImpact = shots.reduce((v, s) => Math.max(v, s.impact), motion.time);
  if (motion.time < lastImpact) segment('aim', lastImpact - motion.time);
  // Победная поза не телепортирует бойца: после неё он реально проходит
  // остаток уровня, перепрыгивая препятствия и спускаясь с платформ.
  const finishAt = round(motion.time);
  segment('victory', 0.78);
  const returnStart = round(motion.time);
  const spawnX = 90;
  moveTo({ x: spawnX, footY: WORLD.groundY, platform: null });
  // Если финиш оказался рядом со стартом, устраиваем короткое патрулирование
  // с прыжком на безопасном левом участке, вместо искусственного ожидания.
  if (motion.time - returnStart < 1.5) {
    moveGround(165);
    leapTo(215, WORLD.groundY, 'hop');
    moveGround(spawnX);
  }
  if (Math.abs(motion.player.x - spawnX) > 0.0001 || motion.player.footY !== WORLD.groundY)
    throw new Error('Боец не вернулся на старт перед повтором');
  if (motion.player.facing !== 'right') segment('turn', 0.22, spawnX, WORLD.groundY, 'right');
  // Стартовый и заключительный кадры совпадают (x, y, направление, idle).
  segment('idle', 0.85, spawnX, WORLD.groundY, 'right');
  const duration = round(motion.time);
  const restoreStart = round(returnStart + 0.12);
  const restoreEnd = round(duration - 0.12);
  if (restoreEnd - restoreStart < 0.6)
    throw new Error('Недостаточно времени для плавного восстановления поля');
  if (duration > 720) throw new Error(`Непрактичная длительность анимации: ${duration}с`);
  if (used.size !== targets.length || live.size !== 0)
    throw new Error(`Не все квадраты обработаны: ${used.size}/${targets.length}`);
  const totalHp = targets.reduce((sum, cell) => sum + cell.maxHp, 0);
  if (shots.length !== totalHp)
    throw new Error(`Недостаточно попаданий: ${shots.length}/${totalHp}`);
  return {
    duration,
    segments,
    shots,
    jumps,
    level,
    targets: targets.length,
    totalHp,
    targetOrder,
    initial: { x: spawnX, footY: WORLD.groundY, facing: 'right' },
    lastImpact,
    finishAt,
    returnStart,
    restoreStart,
    restoreEnd,
  };
}
