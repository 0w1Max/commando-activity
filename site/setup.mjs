export const workflow = `name: Commando Activity
on:
  workflow_dispatch:
  schedule:
    - cron: '17 21,9 * * *'
permissions:
  contents: write
jobs:
  game:
    uses: 0w1Max/commando-activity/.github/workflows/generate.yml@v2.8.3
    secrets:
      read_user_token: \${{ secrets.COMMANDO_READ_USER_TOKEN }}
`;
export function installArtifacts(login, branch = 'main') {
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login)) throw Error('Invalid GitHub login');
  if (!/^[a-z\d][a-z\d._/-]{0,99}$/i.test(branch) || branch.includes('..') || branch.endsWith('/'))
    throw Error('Invalid branch');
  const repo = `https://github.com/${login}/${login}`;
  return {
    workflow,
    markdown: `![Commando Activity](https://raw.githubusercontent.com/${login}/${login}/output/commando-activity.svg)`,
    secretUrl: repo + '/settings/secrets/actions/new',
    workflowUrl:
      repo +
      '/new/' +
      encodeURIComponent(branch) +
      '?filename=' +
      encodeURIComponent('.github/workflows/commando.yml') +
      '&value=' +
      encodeURIComponent(workflow),
    actionsUrl: repo + '/actions/workflows/commando.yml',
  };
}
