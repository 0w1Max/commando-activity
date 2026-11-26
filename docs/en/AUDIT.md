# Engineering audit — 2026-11-26

**English** · [Русский](../ru/AUDIT.md)

Scope: source modules, CLI, workflow security, input/output contracts, setup assistant, documentation, tests, release metadata and dependency configuration. Baseline: stable **2.8.1**, commit `f68e1b35f94a12deffe8205945d90dfbd69657b7`. Remediation: **2.8.2**. This is a source review and regression audit, not a formal penetration test, independent certification or proof of absence of defects.

## Assessment

The project already had a useful deterministic core, an owner-checked credential boundary, atomic SVG/state commits, pinned Actions and browser regression checks. It was not all in one file. However, its separation was incomplete: importing the planner loaded artwork from disk, rendering was coupled to transport/CLI, and source comments overstated purity. The release catalog was stale. Calling the original architecture fully polished would have been inaccurate.

For this small offline generator, a function-based modular design is appropriate. A server, database, DI container or a large generic clean-architecture framework would add maintenance without solving a current need. The revised [architecture](ARCHITECTURE.md) makes the actual dependencies explicit and checks them automatically.

## Findings and remediation

| Finding in 2.8.1                                                                          | Impact                                                                   | 2.8.2 response                                                                                                            |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Planner imported scene/art modules; circular imports existed                              | Hidden I/O, difficult isolated tests and fragile initialization          | Pure domain constants/layout/aim/movement/selection; checked layer graph                                                  |
| Generator combined transport, normalization, rendering and CLI                            | Changes touched unrelated responsibilities                               | Separate calendar, rendering and thin CLI modules                                                                         |
| Release catalog still said 2.8.0 and pointed at the profile as current source             | Misleading version/provenance metadata                                   | Correct current source/version, preserve explicitly labeled origin, enforce version consistency                           |
| Impossible dates could roll over; duplicate days were overwritten                         | Malformed input could silently change a calendar                         | Reject invalid, duplicate, unordered and duplicate-weekday input                                                          |
| Request timer stopped after headers                                                       | A stalled body could outlive the configured timeout                      | Keep abort active through JSON reading; regression test                                                                   |
| Fallback targeting skipped part of the unselected ranked list                             | Some reachable candidates could be missed when the shortlist was blocked | Partition preferred/remaining candidates without omissions; retain normal RNG order                                       |
| SVG checks rejected some active elements but not event handlers/external paint references | Incomplete defense-in-depth contract                                     | Reject active content, external href/paint sources and XML entity/style directives; not advertised as a generic sanitizer |
| Temporary QA installs had no lockfile; code had no common lint/format gate                | Reproducibility and maintenance drift                                    | Locked dev-only tools, lint/format/architecture/link checks and dependency audit                                          |
| Large mixed test file and unused imports/helpers                                          | Review/navigation overhead                                               | Split domain/render/scene tests; remove unused declarations                                                               |
| English-only change history and generic release notes; inconsistent help navigation       | Users could not easily find or understand changes                        | Matched RU/EN guides, classified changelogs and generated bilingual release notes                                         |
| Setup language choice was not shareable/persistent                                        | Repeated navigation and accessibility friction                           | Native language names, URL priority, optional preference storage, selected-button state; keep prepared results            |
| Old gallery comment claimed it never used the owner credential                            | Misleading security documentation                                        | Describe its actual read:user owner-calendar requirement                                                                  |

No externally reachable critical exploit was established in this review. That is not the same as proving the project has none. Dependency audit at remediation time reported no known vulnerabilities in the locked tree; advisory databases can change.

## Regression evidence

Existing tests remain; new tests cover malformed calendars, body timeouts, SVG references, target coverage, release idempotence and language behavior. Twelve SHA-256 SVG contracts from 2.8.1 cover four locations on normal, empty and dense calendars; valid fixture output must remain byte-identical, including animation tracks and counts. Browser CI additionally compares desktop/mobile Chromium and WebKit and exercises the setup flow. See each release's actual Actions run for final pass/fail, rather than treating this document as a permanent live status badge.

The owner reported that 2.8.1 stopped stuttering on their iPhone. That is real-device feedback, not an instrumented FPS benchmark. This audit preserves that rendering path; it does not claim a measured frame rate on every phone/browser.

## Remaining limits

1. **Artwork redistribution remains unresolved.** Complete provenance/permissions for legacy sprites/backgrounds are not established. MIT covers the stated original code scope, not all graphics. A universally redistributable artwork package cannot honestly be promised until this is resolved or the art is replaced with verified material.
2. Branch protection, secret-scanning settings and private vulnerability reporting require administrative verification. Their configuration was not established by this audit. A SECURITY.md file does not enable private reporting by itself.
3. The caller's PAT privileges/expiry and GitHub scheduling/caching are external constraints. Use minimum read:user; review whether published aggregate counts include private activity.
4. Organization profiles, fine-grained PATs, assistive technology combinations and the full iOS/device matrix are not all verified.
5. `createMission` intentionally remains an ordered stateful coordinator. The architecture gate checks static imports; it is not a general formal proof. More abstraction should follow a concrete maintenance problem, not an arbitrary function-length target.

## Documentation basis

Documentation is arranged around user tasks: install, troubleshoot, reference, understand, contribute. Language controls use English/Русский and link to the corresponding topic. Changelogs describe notable changes rather than raw commit history. These are selected primary references, not a claim to have read the entire internet:

- [GitHub: README responsibilities](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [GitHub: secure use of Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub: security policies](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/add-security-policy)
- [Diátaxis](https://diataxis.fr/)
- [Write the Docs](https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/)
- [W3C: internationalization and language navigation](https://www.w3.org/International/quicktips/)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [Русский](https://keepachangelog.com/ru/1.1.0/)
- [Semantic Versioning](https://semver.org/) · [Русский](https://semver.org/lang/ru/spec/v2.0.0.html)
