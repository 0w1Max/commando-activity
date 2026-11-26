# Repository audit and migration

**English** · [Русский](../ru/MIGRATION.md) · 2026-11-24

## Findings

| Finding                                                        | Effect                                                                                 | Resolution                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Personal profile and reusable game shared one repository       | A product fork included the author's portfolio; releases and issues had mixed purposes | Standalone `0w1Max/commando-activity`; profile keeps a small caller                  |
| Six long-lived feature branches                                | No clear active source; old design names looked like current products                  | Archive exact heads, then retire obsolete branches after successful migration        |
| Original Draft PR #1 still open                                | It appeared to be active despite stable releases 2.6/2.7                               | Supersede after preserving its unique history                                        |
| Original feature branch has 122 commits outside current main   | Blind deletion could lose experimental history                                         | Record its SHA and preserve an archive tag before deletion                           |
| About 71 MB of preview files in default tree                   | Slow download and contradictory fonts/layouts in historical samples                    | Keep historical art in the original v2.7.0 snapshot, not the new runtime tree        |
| Rejected fonts loaded by runtime module                        | Unused resources remained dependencies of production                                   | Native approved monospace module; experiments remain archived                        |
| Profile workflow and generator lived together                  | Installation required a full fork and repeated source copies                           | Pinned reusable workflow, explicit caller secret, atomic output in caller repository |
| Russian-only technical docs mixed with English personal README | No coherent language navigation                                                        | Separate EN/RU product READMEs, install and developer guides                         |
| Missing asset provenance                                       | Cannot honestly describe the whole art bundle as freely licensed                       | Preserve explicit code/art distinction; rights clearance remains open                |

A branch contains a complete repository snapshot. Seeing the portfolio README in an old game branch is normal Git behavior, not corrupted files. The architectural issue was having two independently maintained products in one repository. Historical snapshots intentionally retain the contents they had at the time.

## Preservation

Original stable source: `0w1Max/0w1Max@4a49b871fb219a46397a8ba671a2497338553b39`, tag `v2.7.0`. Exact original branch heads are recorded in [migration-snapshot.json](../migration-snapshot.json). Retired feature heads are archived as `archive/2026-11-24/BRANCH-NAME` in the original repository. No force push or history rewrite is part of this migration.

The original profile's output URL remains valid. Its PAT stays in the profile repository and is passed explicitly to a pinned reusable workflow; no secret is extracted or copied. Daily publication retains its existing state and same-day location. The game engine's approved layout and colors are unchanged.

## Final responsibilities

`0w1Max/0w1Max`: personal READMEs, project overviews, profile icons, small integration workflow, generated output branch. `0w1Max/commando-activity`: product code, runtime assets, tests, installation UX, EN/RU documentation, CI and product releases.

Old Git history still occupies storage. Cleaning the default tree does not shrink historical clones; that would require a separate history rewrite and would break old references. The deliberate outcome is a clean current tree with recoverable history.

This audit records concrete inspected findings; it is not a guarantee that no unknown defects exist. Branch protection, organization installation, fine-grained PAT support and full artwork rights clearance remain separate work.
