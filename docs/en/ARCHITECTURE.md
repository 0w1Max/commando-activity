# Architecture

**English** · [Русский](../ru/ARCHITECTURE.md)

## Boundaries

The project is an offline SVG generator with a GitHub publishing adapter, not a continuously running game server. Plain functions and explicit data structures fit this size; there is no dependency injection container, framework or database.

| Layer         | Responsibility                                              | Allowed dependencies                |
| ------------- | ----------------------------------------------------------- | ----------------------------------- |
| `domain`      | Seeded layout, movement, intersections, targeting           | Domain modules only; no Node I/O    |
| `calendar`    | Validate API data; authenticated calendar transport         | Calendar code and platform APIs     |
| `art`         | Read approved atlases; render location-specific materials   | Domain constants and art modules    |
| `render`      | Calendar, player, effects and scene composition             | Domain, calendar, art and rendering |
| `publication` | Daily selection, state validation, persistence              | Domain/rendering and GitHub adapter |
| `scripts`     | Read CLI arguments, files and environment; invoke functions | Runtime modules                     |

The architecture check rejects circular static imports, domain I/O and imports from runtime code back into CLI/site/tests. This is a useful constraint, not a proof of every possible runtime dependency.

## Data flow

Calendar weeks → validated grid → deterministic layout → mission segments and shot events → SVG → validated SVG/state pair → one `output` commit. Network access is isolated in `calendar/github-client.mjs`; writing to GitHub is isolated in `publication/output-store.mjs`.

The mission coordinator owns the live target map and seeded RNG. The movement builder owns time and player position. These mutable states are private to a single mission. RNG call order and rounding are part of the rendering contract; moving a random call changes the choreography even if types remain correct.

Rendering is split by responsibility: `calendar-grid.mjs`, `player.mjs`, `effects.mjs`, `shot-pool.mjs`, then `render-svg.mjs`. Artwork modules describe scenes; collision dimensions live in domain configuration. The domain can be imported without loading artwork from disk.

## Stable visual contract

All four released scenes use 1200×469, viewBox `0 -32 1200 469`, 18px cells at 20px spacing and grid origin (72,60). Nickname: monospace bold 21px, baseline -8. Months: monospace bold 15px, baseline 46. Palettes vary by location. Do not rescale just one scene.

The 2.8.1 vector contour compaction and effect pools are retained. Pools are reused only after all previous visible effects finish. Source artwork is retained beside reproducible optimized atlases. The refactor is checked against stored 2.8.1 SVG hashes and Chromium/WebKit snapshots. Emulation does not measure FPS on a physical iPhone.

## Trade-offs

`createMission` remains a stateful coordinator rather than being split into many tiny abstractions. Its sequence is meaningful. Experimental scenes remain available for regression checks but are excluded from publication. The supported consumer interface is the reusable workflow and documented CLI; internal `src/` paths are not a stable library API.
