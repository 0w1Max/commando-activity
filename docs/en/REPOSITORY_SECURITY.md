# Repository protection setup

**English** · [Русский](../ru/REPOSITORY_SECURITY.md)

## Observed state — 27 November 2026

Active rulesets protect `main` and release tags matching `v*`. Changes to `main` require a pull request, passing `test` and `visual` checks from GitHub Actions, and an up-to-date base. Review conversations must be resolved. Deletion and force pushes to `main` are blocked. Existing release tags cannot be updated or deleted; new tags can be created. No approving review from a second contributor is required. Both rulesets have empty bypass lists.

- [Main ruleset](https://github.com/0w1Max/commando-activity/rules/28206297): **Active**, targeting only `refs/heads/main`; required checks come from GitHub Actions app ID `15368`.
- [Published-tag ruleset](https://github.com/0w1Max/commando-activity/rules/28206421): **Active**, targeting `refs/tags/v*`; creation is unrestricted.

Ruleset settings were verified through the GitHub API on 27 November 2026. Owner-provided GitHub screenshots on the same date show Secret Protection enabled, Push protection On, and Private vulnerability reporting enabled in `0w1Max/commando-activity`. Secret scanning shows **0 open alerts** in both the product and profile repositories. This is a dated observation of reported alerts, not proof that no secret could exist.

The profile repository `0w1Max/0w1Max` is separate: its ruleset list remains empty, and no profile branch rules were enabled in this work. The profile screenshots confirm 0 open secret-scanning alerts; its Secret Protection, Push protection and private-reporting switches were not separately verified.

The product settings screenshot also shows Dependency graph, Dependabot alerts and Dependabot security updates **Off**. This work does not claim those features are enabled; the existing Dependabot version-update workflow is a separate mechanism.

The prepared JSON files below are **disabled drafts**, not enabled protections. They do not introduce bypass actors or change credentials. The product protections listed above are already active; do not import duplicate rulesets. Profile drafts are optional examples and have not been activated. For a new installation, review the intended targets before activation. GitHub supports JSON import through Settings → Rules → Rulesets → New ruleset → Import a ruleset; labels may change.

| Repository                 | Draft                                                              | Protection when activated                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0w1Max/commando-activity` | [product-main.json](../../examples/rulesets/product-main.json)     | PR required for `main`; passing `test` and `visual` checks from GitHub Actions; up-to-date base; resolved review threads; block deletion and force push |
| `0w1Max/commando-activity` | [product-tags.json](../../examples/rulesets/product-tags.json)     | Block updates and deletion of existing `v*` tags; allow creating new release tags                                                                       |
| `0w1Max/0w1Max`            | [profile-main.json](../../examples/rulesets/profile-main.json)     | PR required for profile source; block deletion and force push; no nonexistent PR checks required                                                        |
| `0w1Max/0w1Max`            | [profile-output.json](../../examples/rulesets/profile-output.json) | Block deletion and force push of `output`; allow normal automated commits                                                                               |

## Reuse templates and verify changes

1. Save/export existing settings before changing them. Import one draft into the exact repository named in the table, and inspect its target refs and rules.
2. For product `main`, confirm the required names are exactly `test` and `visual`. These currently run from GitHub Actions app ID `15368`. Do not require the `release` job: it runs after merging, not on PRs.
3. Activate the reviewed ruleset by selecting **Active** and saving. A saved **Disabled** draft provides no protection. Check the repository's public Rules page and branch protected flag afterward.
4. Before activating profile rules, ensure `output` has been initialized. Do not add a PR requirement, signed commits, approval checks or a restriction on ordinary updates to `output`: the publisher writes through `GITHUB_TOKEN` directly.
5. After activation, verify a normal product PR passes and can merge, a fresh release tag can be created, and the profile publisher still completes. Do not deliberately try to delete a production tag or branch as a test.

No second human approval is required: the owner can merge their own checked PR. Broad admin/app bypass is deliberately absent. The first release after activating rules is the end-to-end compatibility check; JSON validation alone is not live verification. If a setting blocks intended work, inspect the exact rule and correct it rather than disabling all protections.

## Other administrator settings

- Product Secret Protection, Push protection and private reporting are enabled according to the dated owner screenshots above. Review their current state in Settings → Advanced Security before recording future changes; a policy file alone does not enable them.
- Use Security → Advisories for private vulnerability reports. The owner-facing settings screenshot confirms enablement; the separate researcher-facing reporting button was not independently tested. No test report or real secret was submitted.
- Dependabot alerts and security updates were Off in the supplied product screenshot. Do not equate configured version-update PRs or `npm audit` with enabled GitHub alerts. Review dependency PRs through normal CI; upgrades are not automatic approval.
- Limit workflow token permissions per job and keep owner calendar credentials read-only. Never broaden PAT scopes to solve a branch-rule problem. No token value, expiry or permissions were inspected in this review.

Keep [SECURITY.md](../../SECURITY.md) and its Russian counterpart aligned with observed settings. Product ruleset activation is verified by API; screenshot-only observations are explicitly labeled. A regular documentation PR can verify the protected merge path. A new release and a publisher run after activation are separate checks; this document does not claim those have been exercised.

## References

- [GitHub ruleset imports](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Ruleset API fields](https://docs.github.com/en/rest/repos/rules)
- [Secret scanning configuration](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning)
- [Private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)
