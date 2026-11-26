# Troubleshooting

**English** · [Русский](../ru/TROUBLESHOOTING.md)

Start with the latest run in Actions → Commando Activity. Open the first failed step; later skipped steps are consequences. Do not post tokens or unredacted logs.

| Symptom                          | What to check                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| No workflow in Actions           | File is `.github/workflows/commando.yml` on the default branch; Actions is allowed                                                                 |
| Workflow/ref not found           | The pinned release exists and external reusable workflows are permitted                                                                            |
| Job skipped                      | Run from the profile repository's default branch                                                                                                   |
| 401 / expired token              | Secret name/value and PAT expiry; replace the secret, not the YAML                                                                                 |
| Wrong owner or scope             | Owner's classic PAT with minimum read:user; do not grant repo or workflow scopes                                                                   |
| First image is 404               | Wait for a successful run; inspect output branch and exact image URL                                                                               |
| Old image after success          | Open the raw image and refresh the profile; GitHub/browser caches may lag                                                                          |
| Output changed during generation | Rerun; a concurrent publisher updated output                                                                                                       |
| Checksum mismatch                | Restore SVG and JSON together from one known-good output commit, then rerun                                                                        |
| Schedule stopped                 | Check Actions, token expiry and GitHub's inactive-repository schedule policy                                                                       |
| Mobile stutter                   | Compare the raw image and profile in the same browser; record device/iOS/browser, location and release. Do not lower quality before reproducing it |

For help, open a [bug report](https://github.com/0w1Max/commando-activity/issues/new?template=bug_report.yml) with the release, failing step, browser/device and expected/actual result. Use [security reporting](../../SECURITY.md) for sensitive problems. Settings administration and organization policies can require the repository owner.
