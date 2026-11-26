# Releases

**English** · [Русский](../ru/RELEASING.md)

## Version policy

Consumer contracts are the reusable workflow, documented CLI, output filenames/state schema and approved rendering behavior. Internal module paths are not a published library API.

- PATCH: compatible bug fixes, hardening and refactoring with the visual contract retained.
- MINOR: compatible new user-facing functionality.
- MAJOR: incompatible workflow, configuration, state or installation changes; provide migration instructions.

2.8.2 is a patch: code organization, input/release checks and documentation improve while the 2.8.1 animation remains the baseline.

## Maintainer checklist

1. Update package.json, settings, release catalog, setup assistant, workflow pins and example together. `npm run check` rejects drift.
2. Write matching English/Russian changelog entries under Added/Changed/Fixed/Security/Removed as applicable. Explain user impact; do not dump commit logs or invent changes.
3. Run locked-tool checks, tests, demo and browser comparisons. Review graphics rights if art changes.
4. Merge the reviewed PR. Main CI repeats required checks, then creates the new version tag and bilingual release notes. Existing tags/releases are not overwritten.
5. Verify the tag points to the intended commit and publication succeeds before telling users the release is live. Consumers upgrade their pinned caller explicitly.

GitHub Releases is the distribution record. `commando-release.json` records current metadata and historical artwork provenance; it must not be confused with a tag SHA. For a rollback, choose a known-good release and restore a matched image/state pair through a checked publication; no automatic rollback is promised.

2.8.3 adds provenance integrity checks and protection setup documentation without changing rendering. Artwork clearance and activation of administrator settings remain separate acceptance criteria; neither is implied by a release tag.
