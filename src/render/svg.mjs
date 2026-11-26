export const escapeXml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
export const round = (x) => Math.round(x * 10000) / 10000;
export const fmt = (n) => Number(n.toFixed(6)).toString();
export function keyPct(t, duration) {
  return fmt(Math.max(0, Math.min(1, t / duration)));
}
export function animationAttr(name, keys, values, duration, mode = 'discrete') {
  return `<animate attributeName="${name}" calcMode="${mode}" keyTimes="${keys.map((t) => keyPct(t, duration)).join(';')}" values="${values.join(';')}" dur="${fmt(duration)}s" repeatCount="indefinite"/>`;
}
