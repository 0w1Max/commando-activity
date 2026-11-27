# Security policy

**English** · [Русский](SECURITY.ru.md)

The latest stable release is the supported baseline. Older pinned releases remain available, but fixes are not automatically backported. Install compatible patch releases after reviewing their notes.

## Report a problem

Private vulnerability reporting is enabled for this repository, as confirmed by the owner's GitHub screenshot on 27 November 2026. Open [Security → Advisories](https://github.com/0w1Max/commando-activity/security/advisories) and use **Report a vulnerability** to report privately. If that option later becomes unavailable, open an issue asking for a private reporting channel without exploit details or credentials. Never post a PAT, private calendar export or unredacted log publicly.

## Trust boundaries

- The setup assistant generates links/snippets locally and never requests a token. Its language preference is the only stored browser setting.
- The owner PAT is a repository secret passed only to calendar generation. Use minimum read:user and an expiry; write/admin scopes are not needed.
- A separate GITHUB_TOKEN writes the SVG/state pair. Anyone who can change trusted workflow code can potentially misuse its credentials; restrict repository write access.
- Third-party Actions are pinned to reviewed commit SHAs. A release tag is a convenience pin, not a cryptographic guarantee against a compromised maintainer account.
- Generated-SVG checks enforce this generator's output contract. They are not a general-purpose sanitizer for arbitrary uploaded SVG files.

CI has no production secrets on PRs. Release writes occur only after checks on main. Dependency audit and regression checks reduce risk; they do not constitute a penetration test or guarantee that no vulnerabilities exist. Administrator settings are separate from source checks; the dated state below records what was actually verified.

## Repository settings

Active rulesets protect `main` and release tags matching `v*`. Changes to `main` require a pull request, passing `test` and `visual` checks from GitHub Actions, and an up-to-date base. Review conversations must be resolved. Deletion and force pushes to `main` are blocked. Existing release tags cannot be updated or deleted; new tags can be created. No approving review from a second contributor is required. Both rulesets have empty bypass lists.

Ruleset settings were verified through the GitHub API on 27 November 2026. Owner-provided GitHub screenshots on the same date show Secret Protection enabled, Push protection On, and Private vulnerability reporting enabled in `0w1Max/commando-activity`. Secret scanning shows **0 open alerts** in both the product and profile repositories. This is a dated observation of reported alerts, not proof that no secret could exist.

The profile repository `0w1Max/0w1Max` is separate: its ruleset list remains empty, and no profile branch rules were enabled in this work. The profile screenshots confirm 0 open secret-scanning alerts; its Secret Protection, Push protection and private-reporting switches were not separately verified.

See [verified settings and maintenance](docs/en/REPOSITORY_SECURITY.md). The JSON templates remain disabled examples; they are not the live rulesets.
