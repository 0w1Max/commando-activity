# Development and maintenance

[Русский](../ru/DEVELOPMENT.md)

Use Node.js 22+. `npm test` runs the regression suite; `npm run demo` creates a clearly marked fixture animation in `generated/`. No npm installation or external runtime dependencies are required. Open SVGs in a browser to check animation, not just PNG screenshots.

| Module | Responsibility |
|---|---|
| scripts/mission.mjs | Seeded layout, movement, jump clearance, aim geometry and shot timeline |
| scripts/generate.mjs | GitHub GraphQL, owner/scope checks, calendar normalization and SVG assembly |
| scripts/*-scene.mjs, *-sprites.mjs | Scene art and local runtime atlases |
| scripts/level-art.mjs | Platforms, obstacles and shadows |
| scripts/profile-hud.mjs, hud-font.mjs | Shared typography and month spacing |
| scripts/daily-location.mjs | Date-based rotation and no-repeat state |
| scripts/publish-daily.mjs | Publication generation |
| scripts/output-store.mjs | First output, checksum checks, race protection and atomic commits |
| scripts/validate-daily.mjs | Production validation |
| .github/workflows/generate.yml | Reusable publisher; caller context determines the target |
| .github/workflows/ci.yml | Tests and versioned releases |

## Stable behavior

Released locations: desert, industrial, temple, coast. Experimental scenes remain testable, but are not selected by daily publication. `commando-settings.json` keeps the approved seeds and Europe/Moscow cycle. Do not change the seed of a location already published today without an explicit state migration. Same-day reruns keep the selected location; skipped days cannot cause consecutive repeats.

Every released scene uses 1200×469, viewBox `0 -32 1200 469`, 18 px cells at 20 px spacing, grid origin (72,60). Nickname: monospace bold 21 px, baseline -8. Months: monospace bold 15 px, baseline 46. Palettes may vary; viewport, font metrics and coordinates must not. There is no coast-only zoom. Collision footprints must match art and actual jump keyframes; bullets must leave the muzzle and intersect the correct cell.

## Branches and releases

Keep `main` releasable. Create one short-lived branch per change, open a PR, test, merge, and delete the completed branch. A branch is a full repository snapshot, not a folder. Do not use branches as a permanent menu of scene versions. Tags/releases record stable versions; old experiments live in historical archives, not in the default tree.

Before releasing, update package/settings/catalog versions together and the pinned source ref in generate.yml and examples/profile-workflow.yml. Test the demo and all four scenes. CI creates a version tag after tests; existing tags are not moved. Consumers explicitly choose when to upgrade. Protect main and require CI in repository settings if your policy allows it; this document does not claim protection has already been configured.

Runtime credentials belong to the caller repository. Never copy or retrieve user PATs into this project. Output is updated without force, with SVG and state in one commit. A failed API request leaves the previous image available. There is no automatic rollback: restore a matched SVG/state pair with a new commit or revert the caller version after a checked migration.

Historical calendars in fixtures are tests only. Source art compilers, rejected fonts and large visual experiments remain in the original v2.7.0 archive; they are not runtime requirements.
