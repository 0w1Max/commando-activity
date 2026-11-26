# Repository protection setup

**English** · [Русский](../ru/REPOSITORY_SECURITY.md)

## Observed state — 27 November 2026

Both public repository ruleset lists were empty. The branch API reported `protected: false` for product `main` and profile `main`/`output`. The integration rejected detailed legacy protection reads with `403 Resource not accessible by integration`; this is an access limitation, not a clean security result. Secret scanning alert settings, push protection and private reporting have not been verified. The cloud browser was signed out; no administrator settings were changed.

The prepared JSON files below are **disabled drafts**, not enabled protections. They do not introduce bypass actors or change credentials. Review and activate each in its intended repository. GitHub supports JSON import through Settings → Rules → Rulesets → New ruleset → Import a ruleset; labels may change.

| Repository                 | Draft                                                              | Protection when activated                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0w1Max/commando-activity` | [product-main.json](../../examples/rulesets/product-main.json)     | PR required for `main`; passing `test` and `visual` checks from GitHub Actions; up-to-date base; resolved review threads; block deletion and force push |
| `0w1Max/commando-activity` | [product-tags.json](../../examples/rulesets/product-tags.json)     | Block updates and deletion of existing `v*` tags; allow creating new release tags                                                                       |
| `0w1Max/0w1Max`            | [profile-main.json](../../examples/rulesets/profile-main.json)     | PR required for profile source; block deletion and force push; no nonexistent PR checks required                                                        |
| `0w1Max/0w1Max`            | [profile-output.json](../../examples/rulesets/profile-output.json) | Block deletion and force push of `output`; allow normal automated commits                                                                               |

## Apply and verify

1. Save/export existing settings before changing them. Import one draft into the exact repository named in the table, and inspect its target refs and rules.
2. For product `main`, confirm the required names are exactly `test` and `visual`. These currently run from GitHub Actions app ID `15368`. Do not require the `release` job: it runs after merging, not on PRs.
3. Activate the reviewed ruleset by selecting **Active** and saving. A saved **Disabled** draft provides no protection. Check the repository's public Rules page and branch protected flag afterward.
4. Before activating profile rules, ensure `output` has been initialized. Do not add a PR requirement, signed commits, approval checks or a restriction on ordinary updates to `output`: the publisher writes through `GITHUB_TOKEN` directly.
5. After activation, verify a normal product PR passes and can merge, a fresh release tag can be created, and the profile publisher still completes. Do not deliberately try to delete a production tag or branch as a test.

No second human approval is required: the owner can merge their own checked PR. Broad admin/app bypass is deliberately absent. The first release after activating rules is the end-to-end compatibility check; JSON validation alone is not live verification. If a setting blocks intended work, inspect the exact rule and correct it rather than disabling all protections.

## Other administrator settings

- In Settings → Advanced Security, inspect available Secret Protection/secret-scanning alerts and push protection. Public scanning and owner-visible alerts are distinct settings; do not assume their status from the presence of a policy file.
- Enable **Private vulnerability reporting**, then verify Security → Advisories shows **Report a vulnerability** to an eligible viewer. Never submit a real token in a test report.
- Keep Dependabot alerts/updates available. Review its PRs through normal CI; dependency upgrades are not automatic approval.
- Limit workflow token permissions per job and keep owner calendar credentials read-only. Never broaden PAT scopes to solve a branch-rule problem. No token value, expiry or permissions were inspected in this review.

Update [SECURITY.md](../../SECURITY.md) with verified settings only after observing success. This document is a runbook and dated observation, not proof that settings are active.

## References

- [GitHub ruleset imports](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [Ruleset API fields](https://docs.github.com/en/rest/repos/rules)
- [Secret scanning configuration](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning)
- [Private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)
