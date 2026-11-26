export const LOCATION_POOL = Object.freeze(['jungle', 'desert', 'snow', 'volcano', 'industrial']);
export const LOCATION_NAMES = Object.freeze({
  jungle: 'Tropical Jungle',
  desert: 'Desert Canyon',
  snow: 'Snow Base',
  volcano: 'Volcanic Zone',
  industrial: 'Abandoned Factory',
  temple: 'Flooded Temple',
  coast: 'Storm Coast',
});
export function selectLocation(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('Некорректный seed локации');
  let x = (seed ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x = (x ^ (x >>> 16)) >>> 0;
  return LOCATION_POOL[x % LOCATION_POOL.length];
}
