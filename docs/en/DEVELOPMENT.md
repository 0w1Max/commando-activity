# Development

**English** · [Русский](../ru/DEVELOPMENT.md)

Use a recent Node.js 22 LTS patch (or newer). Consumers do not need Node, npm or a fork; these steps are for maintainers.

1. Clone this repository and create a short-lived branch.
2. Run `npm ci` to install locked development tools. Runtime has no npm dependencies.
3. Run `npm run check`, `npm run lint`, `npm run format:check` and `npm test`.
4. Run `npm run demo`; open `generated/commando-activity.svg` in a browser. Fixture data is visibly marked and cannot be published as live output.
5. Open a PR. CI checks both Node logic and browser rendering before a release.

Use `npm run format` for consistent formatting. Comments should explain geometry, security boundaries or non-obvious invariants; avoid narrating ordinary statements. Keep the domain free of filesystem/network imports. See [architecture](ARCHITECTURE.md).

## Artwork changes

Original atlases are `assets/*-sprites.json.gz.b64`. After an approved source edit, run `node scripts/compile-pixel-art.mjs` and commit the matching `*-optimized.json.gz.b64` files. Run `npm run check:art` to verify reproducibility. Do not edit optimized data by hand or change palettes to make a size test pass. Read [asset rights](../../ASSET_RIGHTS.md) first.

## Visual verification

CI checks out v2.8.1 as a separate reference and compares all four locations in Chromium and WebKit at 1200px/1× and 390px/3×, including shots, impacts, jumps and restoration. Run `node tools/verify-rendering.cjs PATH_TO_REFERENCE generated/visual-check` to reproduce it after installing the Playwright browsers. `BROWSER_ENGINE=webkit` chooses WebKit. Tiny renderer rounding differences are tolerated; the exact SVG contract test independently protects valid fixture output.

Real-device feedback remains necessary. Do not equate headless browser checks with a measured iPhone frame rate.

## Releases

See [release policy](RELEASING.md). Never move an existing stable tag. Keep completed work in PR history and tags rather than permanent scene branches. The [migration record](MIGRATION.md) explains the original profile split.
