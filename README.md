# Commando Activity

**English** · [Русский](README.ru.md)

An animated 8-bit contribution calendar for your GitHub profile. Four themed worlds, a patrolling soldier, jumps, obstacles and synchronized shots — generated from your real GitHub activity.

![Live example](https://raw.githubusercontent.com/0w1Max/0w1Max/output/commando-activity.svg)

## Add to your profile

No fork, server, npm installation or engine files in your profile repository.

1. Add your own classic PAT with **read:user** as the repository secret **COMMANDO_READ_USER_TOKEN**.
2. Copy [this small workflow](examples/profile-workflow.yml) into `.github/workflows/commando.yml` in your profile repository. Open Actions → Commando Activity → Run workflow.
3. Add the image to your README, replacing `YOUR_LOGIN`:

```markdown
![Commando Activity](https://raw.githubusercontent.com/YOUR_LOGIN/YOUR_LOGIN/output/commando-activity.svg)
```

[Detailed installation](docs/en/INSTALL.md) · [Русская инструкция](docs/ru/INSTALL.md) · [Setup assistant source](site/index.html)

The workflow reads your calendar, validates the result and updates `output`. Source code stays here; your profile only stores its small caller workflow and generated image. Releases are version pinned; upgrading is an explicit change of the `@v2.8.0` reference.

## Project

| Area | Contents |
|---|---|
| `scripts/` | Generator, mission planning, rendering and publication |
| `assets/` | Runtime sprite data only |
| `tests/`, `fixtures/` | Regression tests and historical test data |
| `docs/en/`, `docs/ru/` | Separate English and Russian documentation |
| `examples/` | Minimal integration example |
| `site/` | Bilingual, local-only setup assistant; never collects tokens |

Node.js 22+: `npm test` and `npm run demo`. No runtime dependencies. This is an SVG animation, not a keyboard-controlled browser game.

[Development](docs/en/DEVELOPMENT.md) · [Migration record](docs/en/MIGRATION.md) · [Contributing](CONTRIBUTING.md) · [Changes](CHANGELOG.md)

Original code has an MIT license with an explicit scope. Some legacy artwork has incomplete provenance and is **not** covered by that grant: read [ASSET_RIGHTS.md](ASSET_RIGHTS.md) before redistributing artwork. This is an independent project, not an official Contra/Konami product.

## Acknowledgements

Commando Activity was inspired by [pacman-contribution-graph](https://github.com/abozanona/pacman-contribution-graph) and its idea of turning the GitHub contribution calendar into a game animation.
