# Installation

**English** · [Русский](../ru/INSTALL.md) · [Home](../../README.md)

**[Open the setup assistant](https://0w1max.github.io/commando-activity/?lang=en)**

The assistant prepares the links; the steps below explain each action. Never enter your token into the assistant.

You need a personal GitHub account and its public profile repository, `YOUR_LOGIN/YOUR_LOGIN`. Create a README there if needed. Your existing profile is preserved; no fork of this project is required.

The output image is public and may include aggregate private contribution counts visible to your owner token. Repository names and commit details are not requested. Do not enable live publication if you do not want those counts published.

## 1. Add the calendar secret

Create a **classic personal access token** in your account settings, Developer settings → Personal access tokens → Tokens (classic). Select only **read:user**, choose an expiry date, and copy the token directly into your profile repository's Settings → Secrets and variables → Actions → New repository secret.

Name the secret **COMMANDO_READ_USER_TOKEN**. Do not put its value in a workflow, README, issue, URL or setup assistant. The token must belong to the owner of the profile. No `repo`, `workflow` or administrative scope is requested. The separate automatic `GITHUB_TOKEN` writes the image into your repository; your PAT only reads the calendar.

## 2. Add the workflow

Copy [examples/profile-workflow.yml](../../examples/profile-workflow.yml) into `.github/workflows/commando.yml` in your profile repository's default branch. The pinned reusable workflow loads the generator from this project and publishes only to the calling repository. It does not copy source files into your profile.

Enable Actions if GitHub requests it. The workflow needs `contents: write`, subject to your repository policy. Do not enable write tokens for pull requests from forks. Open Actions → Commando Activity → Run workflow and wait for success.

The first successful run creates `output` with `commando-activity.svg` and `commando-state.json`. Both files are updated atomically. Keep the state file; do not edit the generated files manually.

## 3. Add the image

```markdown
![Commando Activity](https://raw.githubusercontent.com/YOUR_LOGIN/YOUR_LOGIN/output/commando-activity.svg)
```

Replace both occurrences of `YOUR_LOGIN`. Open the image URL first, then the profile. Images can be cached. A scheduled refresh is not continuous synchronization: the example requests two runs per day, around 00:17 and 12:17 Moscow time; GitHub may delay scheduled jobs.

## Troubleshooting and upgrades

| Problem              | Check                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Workflow not found   | A valid released version reference, allowed Actions, public source repository                      |
| Job skipped          | Run from your default branch                                                                       |
| Missing token / 401  | Secret name, PAT value and expiration                                                              |
| Owner/scope rejected | Your own classic PAT with read:user                                                                |
| Output changed       | Retry; a concurrent run updated output                                                             |
| Checksum mismatch    | Restore SVG and state together from the last good output commit                                    |
| Image 404            | First run succeeded, repository public, exact raw URL                                              |
| No scheduled runs    | Actions enabled, schedule active, PAT valid; GitHub may disable schedules in inactive public repos |

To upgrade, review a new release and change the version suffix in your caller workflow. Existing tags are never moved by the release workflow. To uninstall, remove your caller workflow and README image; the output history can remain. This release documents personal accounts and classic PATs. Organization profiles and fine-grained PATs are not certified by these tests.

Code uses MIT; original artwork uses CC0 1.0 with no mandatory attribution. See [asset rights](../../ASSET_RIGHTS.md).

[Reference](REFERENCE.md) · [Troubleshooting](TROUBLESHOOTING.md)
