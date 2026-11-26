# Artwork provenance and permission review

**English** · [Русский](../ru/ARTWORK.md)

## Current result — 27 November 2026

The [inventory](../../compliance/artwork-manifest.json) covers **19 packed atlas files**: 11 source atlases and 8 optimized derivatives. Seven archived PNGs and two historical compilers have immutable repository links, Git blob IDs and SHA-256 hashes. This establishes technical provenance, not ownership or permission to redistribute.

| Group                                           | Evidence recovered                                                                                                       | Rights status                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Factory V8 terrain                              | Two archived PNGs; full compilation followed by `--small` reproduces the current atlas byte for byte                     | Review required                  |
| Canyon, temple and coast terrain kits           | Three concept PNGs plus the shared revision PNG; the archived compiler reproduces all three atlases byte for byte        | Review required                  |
| Canyon background                               | Archived background PNG exists; the original background-to-atlas conversion has not been reproduced                      | Review required                  |
| Soldier and other location/experimental atlases | Existing atlas bytes preserved in the historical repository and v2.8.2; no complete upstream creation record established | Review required                  |
| Eight optimized atlases                         | Derived from the corresponding source atlas by the exact vector compiler; existing `check:art` verifies the conversion   | Inherit unresolved source rights |

The historical snapshot is [0w1Max/0w1Max at bf8f103](https://github.com/0w1Max/0w1Max/tree/bf8f10350b0c82fa2e651b318b8b83298d821a36). PNGs are linked there rather than duplicated into the product. Local copies matched the archived Git blob IDs. Source PNG reproduction was checked with Python/Pillow during this review; the historical compiler is not installed as a new runtime dependency.

Filenames, a generated-images directory and compiler comments do **not** establish which image service was used, which references were supplied or what rights apply. Unknown creator, generator and license fields stay empty. There is no finding here that an asset was stolen, and no claim that every asset is cleared.

## Resolve each source

1. Identify the original creation/download record. For generated material, record the service, date, source/reference inputs and human edits. For downloaded material, record the exact source page and license version.
2. Save a reviewable permission reference and the relevant license/terms. Check redistribution of source assets and generated SVGs, not only permission to use them in a game.
3. Preserve required credit and change notices. A general acknowledgements paragraph does not replace license obligations.
4. Update the inventory after reviewing the evidence; resolve upstream sources before marking derivatives verified.
5. If permission cannot be established, replace the affected material with suitable original or properly licensed artwork. Compare appearance and mobile rendering before publication.

For new external artwork, prefer clear CC0 or CC BY 4.0 terms. This is an acquisition preference, not a license retroactively assigned to current files. Independently created artwork needs an explicit permission statement too. AI output rights and copyrightability are separate questions and vary by jurisdiction; a generator name alone is insufficient.

## Automated checks

- `npm run check:assets` checks coverage, hashes, evidence references and derivation consistency. It currently succeeds with an explicit unresolved-rights warning.
- `npm run check:assets:cleared` additionally requires all records to be verified. **It currently fails intentionally** because the rights review is incomplete.
- `npm run check:art` reproduces all eight optimized vector atlases from the bundled sources.
- Neither an inventory checker nor REUSE/SPDX proves that permission is genuine or legally sufficient. Review remains necessary.

MIT covers the original code described in [LICENSE-CODE](../../LICENSE-CODE). [LICENSES/MIT.txt](../../LICENSES/MIT.txt) contains the standard license text; it does not expand that scope to artwork. Add other license texts only when their applicability has been established. The native monospace HUD does not bundle a font file; archived OFL font experiments are outside the current product tree.

Generated previews, profile SVGs and release screenshots inherit the status of the artwork they contain. Moving a disputed asset out of the next release would not remove previous releases or Git history; a confirmed infringement would require a separate response.

## Basis

- [SuperTuxKart artwork policy](https://www.supertuxkart.net/Licensing)
- [Godot license compliance](https://docs.godotengine.org/en/stable/about/complying_with_licenses.html)
- [REUSE tutorial](https://reuse.software/tutorial/) and [limits of its metadata checks](https://reuse.software/faq/)
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
- [Kenney asset terms](https://kenney.nl/support)
- [U.S. Copyright Office: AI output copyrightability](https://copyright.gov/newsnet/2025/1060.html) — U.S. position, not a worldwide rule
