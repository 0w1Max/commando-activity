/** Exact union of adjacent integer pixel rectangles; preserves vector geometry. */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileAtlas, OPTIMIZED_ATLASES } from '../src/art/compile-pixel-art.mjs';
export {
  compactPixelPath,
  compileAtlas,
  OPTIMIZED_ATLASES,
} from '../src/art/compile-pixel-art.mjs';

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  for (const name of OPTIMIZED_ATLASES) {
    const source = new URL(`../assets/${name}-sprites.json.gz.b64`, import.meta.url);
    const target = new URL(`../assets/${name}-optimized.json.gz.b64`, import.meta.url);
    const atlas = JSON.parse(
      gunzipSync(Buffer.from(readFileSync(source, 'utf8').trim(), 'base64')),
    );
    const compiled = JSON.stringify(compileAtlas(atlas));
    if (check) {
      if (
        gunzipSync(Buffer.from(readFileSync(target, 'utf8').trim(), 'base64')).toString() !==
        compiled
      )
        throw Error('Stale optimized atlas: ' + name);
    } else writeFileSync(target, gzipSync(compiled, { level: 9 }).toString('base64') + '\n');
    console.log(`${check ? 'Verified' : 'Compiled'} ${name}: ${Object.keys(atlas).length} sprites`);
  }
}
