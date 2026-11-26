const define = (obstacles, platforms, palette, outfit) =>
  Object.freeze({
    obstacles: Object.freeze(obstacles),
    platforms: Object.freeze(platforms),
    palette: Object.freeze(palette),
    outfit: Object.freeze(outfit),
  });

export const BIOMES = Object.freeze({
  jungle: define(
    ['jungle-rock', 'fallen-log', 'stone-ruin', 'tree-stump', 'supply-crate'],
    ['wooden-bridge', 'mossy-stone', 'vine-ledge'],
    {
      leaf: '#65ba46',
      timber: '#91603b',
      stone: '#778a78',
      metal: '#637d75',
      shade: '#263d30',
      highlight: '#b2e77b',
    },
    { cloth: '#848e43', vest: '#666b65' },
  ),
  desert: define(
    ['jungle-rock', 'sandbags', 'stone-ruin', 'supply-crate'],
    ['wooden-bridge', 'mossy-stone', 'camo-platform'],
    {
      leaf: '#c2a05a',
      timber: '#a06b44',
      stone: '#c98f62',
      metal: '#aa8b6e',
      shade: '#613c2e',
      highlight: '#f6d08b',
    },
    { cloth: '#c99a64', vest: '#95634f' },
  ),
  snow: define(
    ['jungle-rock', 'fallen-log', 'sandbags', 'supply-crate'],
    ['mossy-stone', 'metal-catwalk', 'camo-platform'],
    {
      leaf: '#d7edfa',
      timber: '#71828a',
      stone: '#9fbaca',
      metal: '#829cae',
      shade: '#354a61',
      highlight: '#f4fbff',
    },
    { cloth: '#b2c6c7', vest: '#6b8494' },
  ),
  volcano: define(
    ['jungle-rock', 'fallen-log', 'sandbags', 'stone-ruin', 'tree-stump', 'supply-crate'],
    ['mossy-stone', 'metal-catwalk', 'camo-platform'],
    {
      leaf: '#f58a37',
      timber: '#6b4540',
      stone: '#625057',
      metal: '#65565d',
      shade: '#231f2d',
      highlight: '#ffc14f',
    },
    { cloth: '#69616a', vest: '#484651' },
  ),
  coast: define(
    ['sandbags', 'fallen-log', 'supply-crate', 'jungle-rock'],
    ['wooden-bridge', 'mossy-stone', 'metal-catwalk'],
    {
      leaf: '#7f937e',
      timber: '#7b7465',
      stone: '#718d99',
      metal: '#6e8a95',
      shade: '#294554',
      highlight: '#c0bf9f',
    },
    { cloth: '#829592', vest: '#536c7d' },
  ),
  temple: define(
    ['stone-ruin', 'jungle-rock', 'supply-crate', 'tree-stump'],
    ['mossy-stone', 'vine-ledge', 'wooden-bridge'],
    {
      leaf: '#849158',
      timber: '#8a7757',
      stone: '#879778',
      metal: '#6d8880',
      shade: '#345a54',
      highlight: '#d2c38d',
    },
    { cloth: '#9e9f65', vest: '#627d73' },
  ),
  industrial: define(
    ['sandbags', 'stone-ruin', 'supply-crate', 'fallen-log'],
    ['metal-catwalk', 'camo-platform', 'wooden-bridge'],
    {
      leaf: '#a39271',
      timber: '#8e7a64',
      stone: '#829084',
      metal: '#82998f',
      shade: '#293e3b',
      highlight: '#b9b49b',
    },
    { cloth: '#82958d', vest: '#505f69' },
  ),
});

export function biomeFor(location) {
  if (!Object.hasOwn(BIOMES, location)) throw new Error('Неизвестная игровая локация: ' + location);
  return BIOMES[location];
}
