/** Idempotent release adapter. Existing tags and release notes are never rewritten. */
export function changelogEntry(markdown, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error('Invalid release version');
  const heading = new RegExp(
    '^## \\[' + version.replaceAll('.', '\\.') + '\\] - \\d{4}-\\d{2}-\\d{2}\\s*$',
    'm',
  );
  const match = heading.exec(markdown);
  if (!match) throw Error('Missing changelog entry for ' + version);
  const tail = markdown.slice(match.index + match[0].length);
  const end = tail.search(/^## /m);
  const body = (end < 0 ? tail : tail.slice(0, end)).trim();
  if (!body) throw Error('Empty release notes');
  return body;
}
export async function publishRelease({ github, owner, repo, sha, version, english, russian }) {
  const body =
    '## English\n\n' +
    changelogEntry(english, version) +
    '\n\n## Русский\n\n' +
    changelogEntry(russian, version);
  const tag = 'v' + version;
  try {
    await github.rest.git.getRef({ owner, repo, ref: 'tags/' + tag });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.git.createRef({ owner, repo, ref: 'refs/tags/' + tag, sha });
  }
  try {
    await github.rest.repos.getReleaseByTag({ owner, repo, tag });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      name: 'Commando Activity ' + tag,
      body,
      draft: false,
      prerelease: false,
    });
  }
  return { tag };
}
