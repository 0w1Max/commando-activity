# Commando Activity

**English** · [Русский](README.ru.md)

Your GitHub contribution calendar, brought to life as an animated pixel-art world.

[![Checks](https://github.com/0w1Max/commando-activity/actions/workflows/ci.yml/badge.svg)](https://github.com/0w1Max/commando-activity/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/0w1Max/commando-activity)](https://github.com/0w1Max/commando-activity/releases/latest)

![Live animation](https://raw.githubusercontent.com/0w1Max/0w1Max/output/commando-activity.svg?v=2.8.2)

Four rotating locations. A soldier patrols, jumps over obstacles and clears your contribution cells. Generated from your real activity; this is an SVG animation, with no keyboard controls or server to maintain.

**Current version: 2.8.2.** The mobile optimization introduced in 2.8.1 is retained.

## Add it to your profile

**[Open the setup assistant →](https://0w1max.github.io/commando-activity/?lang=en)**

Enter your GitHub login. The assistant prepares your workflow and README snippet locally. It never asks for your token.

1. Add your own classic PAT with the minimum **read:user** scope as the profile repository secret **COMMANDO_READ_USER_TOKEN**.
2. Add the generated workflow, run it from Actions, and wait for a successful publication.
3. Add the generated image snippet to your README.

No fork, npm installation or game source files in your profile repository. Your existing portfolio stays in place. Installation requires write access to your public `LOGIN/LOGIN` repository and permission to run GitHub Actions.

**Artwork notice:** original code is licensed under [MIT](LICENSE-CODE). Rights to some legacy artwork have not been established; that artwork is excluded from the code license. Read [Code and asset rights](ASSET_RIGHTS.md) before redistributing or adapting the graphics.

## Find your way

| I want to…                      | Start here                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Install the animation           | [Step-by-step installation](docs/en/INSTALL.md)                                 |
| Fix a failed run or stale image | [Troubleshooting](docs/en/TROUBLESHOOTING.md)                                   |
| Understand settings and outputs | [Reference](docs/en/REFERENCE.md)                                               |
| Understand the architecture     | [Architecture](docs/en/ARCHITECTURE.md)                                         |
| Develop or contribute           | [Development](docs/en/DEVELOPMENT.md) · [Contributing](CONTRIBUTING.md)         |
| Review changes and limitations  | [Changelog](CHANGELOG.md) · [Audit](docs/en/AUDIT.md) · [Security](SECURITY.md) |

## How it works

GitHub Actions reads your calendar, builds a deterministic mission, renders a self-contained SVG and commits the image and state together to your profile's `output` branch. The example refreshes twice daily. GitHub scheduling and image caching can delay updates.

Your profile contains a small version-pinned caller workflow and generated output. Source code lives here. Updates are explicit: review a release and change the caller's `@v…` reference. Existing release tags are not moved.

| Directory                 | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `src/domain/`             | Pure layout, movement, aiming and target selection |
| `src/calendar/`           | Calendar validation and GitHub transport           |
| `src/art/`, `src/render/` | Pixel artwork and SVG assembly                     |
| `src/publication/`        | Rotation, output checks and atomic persistence     |
| `scripts/`                | Small command-line entrypoints                     |
| `site/`                   | English/Russian setup assistant                    |
| `tests/`, `tools/`        | Regression tests and repository checks             |

## Acknowledgements

Commando Activity was inspired by [pacman-contribution-graph](https://github.com/abozanona/pacman-contribution-graph) and its idea of turning the GitHub contribution calendar into a game animation.

Independent project; not an official Contra/Konami product.
