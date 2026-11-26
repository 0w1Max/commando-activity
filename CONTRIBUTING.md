# Contributing

**English** · [Русский](CONTRIBUTING.ru.md)

Start with the [development guide](docs/en/DEVELOPMENT.md) and [architecture](docs/en/ARCHITECTURE.md). Open a focused issue for a behavior change; small fixes can go directly to a PR.

Use one short-lived branch and explain the problem, resulting behavior and verification. Preserve seeded RNG order, rendering coordinates and output consistency. Include a regression test for a real defect; do not add tests that merely repeat the implementation. Keep secrets and generated live output out of source commits.

Before review: `npm ci`, `npm run check`, `npm run lint`, `npm run format:check`, `npm test`, `npm run demo`. CI adds Chromium/WebKit comparisons. New artwork needs documented provenance and permission; see [asset rights](ASSET_RIGHTS.md). Use [private reporting](SECURITY.md) for security issues.

This is a small function-based generator. Prefer clear domain boundaries over generic frameworks or layers with no job. Explain non-obvious invariants in comments; omit promotional claims and obsolete experiment notes. English and Russian documentation changes should describe the same behavior and link to the corresponding translated page.

Artwork changes must update the [inventory](compliance/artwork-manifest.json) and include source/permission evidence; see the [review procedure](docs/en/ARTWORK.md). Run `npm run check:assets`. A passing integrity check does not clear unresolved rights.
