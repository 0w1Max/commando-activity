# Artwork provenance and licensing

**English** · [Русский](../ru/ARTWORK.md)

## Status on 27 November 2026

The owner confirms original creation with the assistant and authorizes CC0 1.0 reuse. [LICENSE-ASSETS](../../LICENSE-ASSETS) defines the scope; the [standard CC0 legal code](../../LICENSES/CC0-1.0.txt) is unmodified. Code remains under [MIT](../../LICENSE-CODE). Artwork attribution is optional; commercial reuse is allowed within CC0's terms.

The [inventory](../../compliance/artwork-manifest.json) covers 19 atlases: 11 source files and 8 optimized derivatives. Their `owner-licensed` status records owner permission, not independent legal verification. Seven archived PNGs and two compilers have immutable links, Git blob IDs and SHA-256 hashes.

Four terrain atlases — factory, canyon, temple and coast — were reproduced byte for byte from archived PNGs using historical Python/Pillow compilers. All eight optimized atlases are reproducible with the current vector compiler. A canyon background PNG was recovered, but its complete conversion was not reproduced. Historical bytes of the soldier and remaining atlases are preserved; complete initial generation records are unavailable. Generation service, model and settings are not invented.

The [source archive](https://github.com/0w1Max/0w1Max/tree/bf8f10350b0c82fa2e651b318b8b83298d821a36) is linked rather than duplicated into runtime. Archived fonts and third-party materials are excluded from CC0, as are user names and calendar data.

## New artwork

1. Record source, date, reference inputs and edits; for generated material, record the service and available settings.
2. Obtain explicit permission and retain applicable terms. Agree to CC0 for original contributions; do not automatically relicense third-party material.
3. Update inventory hashes and derivation chains. Derivative licensing must account for source terms.
4. Compare appearance and mobile rendering before publication.

## Checks

- `npm run check:assets:licensed` is required in CI: coverage, asset/license hashes, owner declaration, permission references and licensed upstream inputs. It currently passes for all 19 atlases.
- `npm run check:assets` checks the inventory and warns about unresolved records.
- `npm run check:assets:cleared` is a compatible legacy name for the strict check, not an independent legal certification.
- `npm run check:art` reproduces all eight optimized atlases.

Automated checks establish record consistency, not genuine permission or copyrightability. CC0 covers only rights the owner can grant; it does not create missing rights or waive third-party rights.

## References

- [CC0](https://creativecommons.org/publicdomain/zero/1.0/)
- [Kenney asset terms](https://kenney.nl/support)
- [REUSE tutorial](https://reuse.software/tutorial/)
- [SuperTuxKart licensing](https://www.supertuxkart.net/Licensing)
