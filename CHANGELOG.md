# Changelog

## 2.8.1 — 2026-11-26

- Reuse shot/effect elements after their visible intervals instead of allocating a full animation set per shot. Mission planning, timing, trajectories and player frames are unchanged.
- Merge adjacent same-color pixel rectangles into exact vector contours; keep original source atlases. No rasterization, palette reduction or runtime dependencies.
- Preserve dimensions, palettes, transparency, procedural layouts, HUD and daily rotation. Add source/compiled consistency and overlapping-effect regression checks.


## 2.8.0 — 2026-11-24

- Extracted the game from the author's profile into a standalone project.
- Added a version-pinned reusable publisher: profile repositories need one small workflow, not a fork or engine copy.
- Separated English/Russian READMEs, installation and developer documentation.
- Added a bilingual setup assistant that generates non-secret installation snippets locally.
- Removed rejected font runtime dependencies, author portfolio content and large historical previews from the product tree.
- Kept v2.7.0 rendering, daily rotation, owner checks, collision and output safeguards.

## 2.7.0

Original integrated release: https://github.com/0w1Max/0w1Max/releases/tag/v2.7.0
