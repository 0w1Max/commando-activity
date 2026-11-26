export function compactPixelPath(data) {
  // Only the source atlas' exact rectangle grammar is eligible for compaction.
  // Leave arbitrary SVG paths untouched rather than approximating their shape.
  const rectangles = [...data.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-(\d+)z/g)];
  if (
    !data.length ||
    rectangles.map((m) => m[0]).join('') !== data ||
    rectangles.some((m) => m[3] !== m[5])
  )
    return data;
  const pixels = new Set();
  for (const rectangle of rectangles) {
    const [x, y, width, height] = rectangle.slice(1, 5).map(Number);
    for (let row = y; row < y + height; row++)
      for (let col = x; col < x + width; col++) pixels.add(`${col},${row}`);
  }
  const edges = new Map();
  function addEdge(x, y, nextX, nextY) {
    const key = `${x},${y}`;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push([nextX, nextY]);
  }
  // Keep filled pixels on the right. Inner contours therefore retain holes
  // under SVG's nonzero winding rule, without changing fill-rule attributes.
  for (const key of pixels) {
    const [x, y] = key.split(',').map(Number);
    if (!pixels.has(`${x},${y - 1}`)) addEdge(x, y, x + 1, y);
    if (!pixels.has(`${x + 1},${y}`)) addEdge(x + 1, y, x + 1, y + 1);
    if (!pixels.has(`${x},${y + 1}`)) addEdge(x + 1, y + 1, x, y + 1);
    if (!pixels.has(`${x - 1},${y}`)) addEdge(x, y + 1, x, y);
  }
  let output = '';
  while (edges.size) {
    const start = edges.keys().next().value;
    let [x, y] = start.split(',').map(Number),
      previous = null;
    const points = [[x, y]];
    do {
      const key = `${x},${y}`,
        choices = edges.get(key);
      if (!choices?.length) throw Error('Unclosed pixel contour');
      let index = 0;
      if (previous && choices.length > 1) {
        // Prefer the right turn at diagonally touching pixel corners.
        const dx = x - previous[0],
          dy = y - previous[1];
        index = choices.findIndex(([nx, ny]) => nx - x === -dy && ny - y === dx);
        if (index < 0) index = 0;
      }
      const next = choices.splice(index, 1)[0];
      if (!choices.length) edges.delete(key);
      previous = [x, y];
      [x, y] = next;
      points.push(next);
    } while (`${x},${y}` !== start);
    const corners = points.slice(0, -1).filter(([x, y], i, all) => {
      const before = all[(i + all.length - 1) % all.length],
        after = all[(i + 1) % all.length];
      return (x - before[0]) * (after[1] - y) !== (y - before[1]) * (after[0] - x);
    });
    output += 'M' + corners[0].join(' ');
    for (let i = 1; i < corners.length; i++) {
      const dx = corners[i][0] - corners[i - 1][0],
        dy = corners[i][1] - corners[i - 1][1];
      output += dx ? 'h' + dx : 'v' + dy;
    }
    output += 'z';
  }
  return output;
}
export function compileAtlas(atlas) {
  return Object.fromEntries(
    Object.entries(atlas).map(([name, [w, h, paths]]) => [
      name,
      [w, h, paths.map(([color, data]) => [color, compactPixelPath(data)])],
    ]),
  );
}
export const OPTIMIZED_ATLASES = Object.freeze([
  'desert',
  'factory',
  'temple',
  'coast',
  'factory-v8',
  'desert-kit',
  'temple-kit',
  'coast-kit',
]);
