import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePublication } from '../src/publication/validate.mjs';
export { validatePublication };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [svgPath, statePath] = process.argv.slice(2);
  const result = validatePublication(
    readFileSync(svgPath, 'utf8'),
    JSON.parse(readFileSync(statePath, 'utf8')),
    JSON.parse(readFileSync(new URL('../commando-settings.json', import.meta.url), 'utf8')),
  );
  console.log(
    'PASS: daily location, full calendar, latest month, GAME OVER and SVG/state consistency',
    result,
  );
}
