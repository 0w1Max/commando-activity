/** The approved native monospace HUD; no experimental fonts at runtime. */
const escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
export function hudTextWidth(text, size) {
  return [...text].length * size * 0.6;
}
export function hudText(text, { x, y, size, fill, id, month }) {
  return `<text${id ? ` id="${escape(id)}"` : ''}${month ? ` data-month="${escape(month)}"` : ''} x="${x}" y="${y}" font-family="monospace" font-size="${size}" font-weight="bold" fill="${fill}" aria-label="${escape(text)}">${escape(text)}</text>`;
}
