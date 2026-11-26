import { WORLD } from '../domain/world.mjs';
import { round, fmt, keyPct, animationAttr } from './svg.mjs';
import { soldierColor } from '../art/biomes.mjs';
export function spriteDefs(sprites, location) {
  let out = '';
  for (const [name, colors] of Object.entries(sprites)) {
    out += `<g id="soldier-${name}" shape-rendering="crispEdges">`;
    for (const [color, path] of Object.entries(colors))
      out += `<path d="${path}" fill="${soldierColor(color, location)}"/>`;
    out += '</g>';
  }
  return out;
}

export function playerMarkup(mission) {
  const d = mission.duration;
  const keys = [0],
    moves = [`${mission.initial.x} ${mission.initial.footY - WORLD.spriteSize}`];
  function add(t, x, y) {
    const next = Math.min(t, d);
    if (next <= keys.at(-1)) return;
    keys.push(round(next));
    moves.push(`${fmt(x)} ${fmt(y - WORLD.spriteSize)}`);
  }
  for (const s of mission.segments) {
    if (['jump', 'hop', 'drop'].includes(s.kind)) {
      for (let i = 1; i <= 12; i++) {
        const u = i / 12;
        const x = s.x0 + (s.x1 - s.x0) * u;
        const y = s.y0 + (s.y1 - s.y0) * u - Math.sin(u * Math.PI) * (s.arc ?? 57);
        add(s.start + (s.end - s.start) * u, x, y);
      }
    } else add(s.end, s.x1, s.y1);
  }
  // Не подменять последнюю позицию стартовой: планировщик ОБЯЗАН
  // физически завершить маршрут там, где начинается новый цикл.
  if (keys.at(-1) !== d) throw new Error('Маршрут бойца не доходит до конца SVG');
  const startPoint = `${fmt(mission.initial.x)} ${fmt(mission.initial.footY - WORLD.spriteSize)}`;
  if (moves.at(-1) !== startPoint) throw new Error('Анимация не замкнута: скачок позиции на стыке');
  const motion = `<animateTransform attributeName="transform" type="translate" calcMode="linear" keyTimes="${keys.map((t) => keyPct(t, d)).join(';')}" values="${moves.join(';')}" dur="${fmt(d)}s" repeatCount="indefinite"/>`;
  // Кадры переключаются только при событиях; внутри run — 4 фазы шага.
  const marks = [{ t: 0, frame: 'idle-a', face: 'right' }];
  function push(t, frame, face) {
    const t0 = round(t);
    if (t0 > marks.at(-1).t && t0 < d) marks.push({ t: t0, frame, face });
    else if (t0 === marks.at(-1).t) marks[marks.length - 1] = { t: t0, frame, face };
  }
  for (const s of mission.segments) {
    const face = s.facing;
    if (s.kind === 'run' || s.kind === 'walk') {
      const frames = ['run-a', 'run-b', 'run-c', 'run-d'];
      let n = 0;
      for (let t = s.start; t < s.end; t += s.kind === 'walk' ? 0.18 : 0.115)
        push(t, frames[n++ % 4], face);
    } else if (['jump', 'hop', 'drop'].includes(s.kind)) push(s.start, 'jump', face);
    else if (s.kind === 'shoot')
      push(s.start, 'aim', face); // без второго запечённого всполоха
    else if (s.kind === 'aim') push(s.start, 'aim', face);
    else push(s.start, 'idle-a', face);
  }
  push(d - 0.02, 'idle-a', 'right');
  marks.push({ t: d, frame: 'idle-a', face: 'right' });
  // Поворот позы aim по тем же углам, которыми планировщик рассчитал луч.
  const poseMarks = [{ t: 0, tilt: 0 }];
  for (const shot of mission.shots) {
    const at = round(Math.max(0, shot.start - 0.052));
    if (at > poseMarks.at(-1).t) poseMarks.push({ t: at, tilt: shot.tilt });
    else if (at === poseMarks.at(-1).t)
      poseMarks[poseMarks.length - 1] = { t: at, tilt: shot.tilt };
  }
  poseMarks.push({ t: d, tilt: 0 });
  const tiltAnimation = `<animateTransform attributeName="transform" type="rotate" calcMode="discrete"
    keyTimes="${poseMarks.map((m) => keyPct(m.t, d)).join(';')}"
    values="${poseMarks.map((m) => `${fmt(m.tilt)} ${WORLD.aimPivotX} ${WORLD.aimPivotY}`).join(';')}"
    dur="${fmt(d)}s" repeatCount="indefinite"/>`;
  const frames = ['idle-a', 'run-a', 'run-b', 'run-c', 'run-d', 'jump', 'aim'];
  let output = '';
  for (const face of ['right', 'left']) {
    const content = frames
      .map((name) => {
        const vals = marks.map((m) => (m.frame === name && m.face === face ? '1' : '0'));
        const art =
          name === 'aim'
            ? `<use href="#soldier-aim" clip-path="url(#aim-legs)"/>
        <g>${tiltAnimation}<use href="#soldier-aim" clip-path="url(#aim-upper)"/></g>`
            : `<use href="#soldier-${name}"/>`;
        return `<g opacity="${vals[0]}">${art}${animationAttr(
          'opacity',
          marks.map((m) => m.t),
          vals,
          d,
        )}</g>`;
      })
      .join('');
    if (face === 'right') output += `<g>${content}</g>`;
    else output += `<g transform="translate(78 0) scale(-1 1)">${content}</g>`;
  }
  return `<g id="blue-commando" transform="translate(${startPoint})" aria-label="Blue-bandana soldier">${motion}${output}</g>`;
}
