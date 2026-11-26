# Changelog

**English** · [Русский](CHANGELOG.ru.md)

Notable user-facing changes. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow the [consumer compatibility policy](docs/en/RELEASING.md).

## [Unreleased]

## [2.8.2] - 2026-11-26

### Added

- Architecture, settings reference, troubleshooting, security policy and audit documentation in English and Russian.
- Locked development tools, lint/format checks, import-layer/cycle checks and exact 2.8.1 SVG contracts.
- Shareable setup language links and optional language preference persistence.

### Changed

- Separate pure domain calculations, calendar transport, artwork, rendering and publication. Keep documented CLI entrypoints and the optimized animation unchanged.
- Split the large regression suite by responsibility; remove unused code and misleading legacy comments.
- Generate bilingual release notes from this changelog; retain existing tags.

### Fixed

- Release catalog version and source-repository drift.
- Rejection of invalid, duplicate and out-of-order calendar dates.
- Calendar request timeout now covers the response body.
- Fallback target selection no longer omits unselected distant candidates.

### Security

- Tighten the generated SVG contract against active content and external references.
- Pin development dependencies in a lockfile, update Node.js 24 Actions and restrict the setup page with a content security policy.

## [2.8.1] - 2026-11-26

### Changed

- Reuse shot/effect elements only after their visible intervals; mission timing, trajectories and player frames are retained.
- Merge adjacent same-color rectangles into exact vector contours. No rasterization or palette reduction.

### Added

- Reproducible source/compiled artwork checks and overlapping-effect regression tests.
- Chromium/WebKit comparisons at desktop and mobile sizes.

## [2.8.0] - 2026-11-24

### Added

- Standalone repository with a version-pinned reusable publisher; no engine files or fork in a consumer profile.
- Separate English/Russian documentation and a local setup assistant.

### Removed

- Author portfolio content, rejected font dependencies and large historical previews from the product tree.

### Changed

- Retain the 2.7.0 rendering, daily rotation, owner checks, collisions and output safeguards.

## [2.7.0]

Original integrated release: https://github.com/0w1Max/0w1Max/releases/tag/v2.7.0
