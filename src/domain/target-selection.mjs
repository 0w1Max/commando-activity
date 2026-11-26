import { WORLD } from './world.mjs';
import { chooseFiringPosition, UnreachableTargetError } from './aim.mjs';
export function candidateBatches(ranked) {
  const preferred = ranked.slice(0, 10).map((candidate) => candidate.target);
  const distant = ranked.slice(10).sort((a, b) => a.lottery - b.lottery);
  preferred.push(...distant.slice(0, 4).map((candidate) => candidate.target));
  const keys = new Set(preferred.map((target) => target.key));
  return {
    preferred,
    remaining: ranked
      .filter((candidate) => !keys.has(candidate.target.key))
      .map((candidate) => candidate.target),
  };
}
export function chooseNextTarget({ columns, live, player, level, rand }) {
  // По одному ближайшему к земле оставшемуся квадрату на столбец.
  // Отдельно от ограничения по столбцам проверяется реальный луч пули:
  // любой пересечённый живой квадрат делает кандидат недоступным.
  const frontier = columns.map((cells) => cells.find((c) => live.has(c.key))).filter(Boolean);
  if (!frontier.length) return null;
  // Ранжирование не по строкам, а по текущей окрестности бойца с шумом.
  // Редкие дальние кандидаты дают неожиданные развороты, но не вынуждают
  // бойца каждые несколько выстрелов пересекать всю карту.
  const ranked = frontier
    .map((target) => ({
      target,
      nearby: Math.abs(target.x - (player.x + WORLD.spriteSize / 2)) + rand() * 210,
      lottery: rand(),
    }))
    .sort((a, b) => a.nearby - b.nearby);
  const { preferred, remaining } = candidateBatches(ranked);
  const options = [];
  const tryCandidate = (target) => {
    let dest;
    try {
      dest = chooseFiringPosition(target, player.facing, level, player.x, live);
    } catch (error) {
      if (!(error instanceof UnreachableTargetError)) throw error;
      return;
    }
    const cost = Math.abs(dest.x - player.x) + (dest.footY === player.footY ? 0 : 110);
    // Местные цели немного предпочтительнее, но удалённые тоже возможны.
    // Диапазон весов не допускает вырождения в полностью жадный обход.
    const weight = 0.045 + 5 * Math.exp(-cost / 125) + rand() * 0.07;
    options.push({ target, dest, weight });
  };
  for (const target of preferred) tryCandidate(target);
  // Если случайная выборка вся перекрыта, ищем среди остальных.
  if (!options.length) for (const target of remaining) tryCandidate(target);
  if (!options.length) throw new Error('Не найдено ни одной доступной цели при живых клетках');
  const total = options.reduce((v, o) => v + o.weight, 0);
  let ticket = rand() * total;
  for (const choice of options) {
    ticket -= choice.weight;
    if (ticket <= 0) return choice;
  }
  return options.at(-1);
}
