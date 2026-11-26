# Security policy

**English** · [Русский](SECURITY.ru.md)

The latest stable release is the supported baseline. Older pinned releases remain available, but fixes are not automatically backported. Install compatible patch releases after reviewing their notes.

## Report a problem

Use the repository's Security → Report a vulnerability **if that feature is available**. Its availability is a GitHub setting; this policy does not claim it has been enabled. Otherwise open an issue asking for a private reporting channel, without exploit details or credentials. Never post a PAT, private calendar export or unredacted log publicly.

## Trust boundaries

- The setup assistant generates links/snippets locally and never requests a token. Its language preference is the only stored browser setting.
- The owner PAT is a repository secret passed only to calendar generation. Use minimum read:user and an expiry; write/admin scopes are not needed.
- A separate GITHUB_TOKEN writes the SVG/state pair. Anyone who can change trusted workflow code can potentially misuse its credentials; restrict repository write access.
- Third-party Actions are pinned to reviewed commit SHAs. A release tag is a convenience pin, not a cryptographic guarantee against a compromised maintainer account.
- Generated-SVG checks enforce this generator's output contract. They are not a general-purpose sanitizer for arbitrary uploaded SVG files.

CI has no production secrets on PRs. Release writes occur only after checks on main. Dependency audit and regression checks reduce risk; they do not constitute a penetration test or guarantee that no vulnerabilities exist. Repository protection/private-reporting settings must be verified separately by an administrator.

## Repository settings

The [setup and dated observations](docs/en/REPOSITORY_SECURITY.md) distinguish disabled ruleset templates from live protections. On 27 November 2026, both repositories reported unprotected main branches. Administrator changes remain pending.
