# Reference

**English** · [Русский](../ru/REFERENCE.md)

## Supported use

Personal, public GitHub profile repositories (`LOGIN/LOGIN`), an owner classic PAT with read:user and GitHub Actions. Organization profiles and fine-grained PATs have not been verified. Calendar counts are read through GitHub GraphQL; the SVG is a generated animation, not a live browser game.

## Commands

| Command                                                | Result                                                |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `npm run demo`                                         | Marked fixture SVG and state in generated/            |
| `node scripts/generate.mjs --demo --output PATH`       | Standalone fixture SVG                                |
| `node scripts/generate.mjs --output PATH`              | Live SVG; requires owner credentials                  |
| `node scripts/publish-daily.mjs --previous-state PATH` | Daily image/state; live mode requires previous state  |
| `node scripts/validate-daily.mjs SVG STATE`            | Validate live output against settings                 |
| `node scripts/compile-pixel-art.mjs --check`           | Check optimized atlases against source                |
| `npm test`                                             | Runtime regression and exact SVG contract tests       |
| `npm run check`                                        | Module boundaries, cycles, version and document links |

## Inputs

| Name                        | Meaning                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `GITHUB_USER`               | Owner login; the reusable workflow sets it from its caller             |
| `GH_TOKEN` / `GITHUB_TOKEN` | Owner calendar credential in the CLI; never write it to a file or URL  |
| `COMMANDO_READ_USER_TOKEN`  | Name of the caller repository secret passed as read_user_token         |
| `COMMANDO_MAP_SEED`         | Reproduce an ad-hoc CLI map; does not override daily publication seeds |
| `COMMANDO_LOCATION`         | Ad-hoc scene selection; daily publication uses settings instead        |
| `commando-settings.json`    | Version, approved location seeds and Europe/Moscow rotation            |

The daily workflow injects the PAT only into the calendar-generation step. Its separate automatic GITHUB_TOKEN writes output. No runtime npm dependencies, server or database are required.

## Outputs and refresh

`output/commando-activity.svg` and `output/commando-state.json` are committed together. The JSON contains schema/version, date/location/seed, previous selection, calendar metadata and the image SHA-256. Treat them as a pair; do not edit them separately.

The example schedule is 21:17 and 09:17 UTC (00:17 and 12:17 Europe/Moscow). GitHub may delay runs; the image may be cached. The same Moscow day retains the location and seed, while refreshed activity can change the mission. The next published day avoids the previous location, even after skipped days.
