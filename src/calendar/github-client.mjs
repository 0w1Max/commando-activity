export async function fetchCalendar(
  username,
  token,
  { fetchImpl = globalThis.fetch, timeoutMs = 15000 } = {},
) {
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username))
    throw new Error('Некорректное имя GitHub пользователя');
  if (!token) throw new Error('Для настоящего календаря нужен GITHUB_TOKEN (или GH_TOKEN)');
  const query = `query($login:String!){ viewer { login } user(login:$login){ contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    response = await fetchImpl('https://api.github.com/graphql', {
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'User-Agent': '0w1max-commando-activity-generator',
      },
      body: JSON.stringify({ query, variables: { login: username } }),
      signal: controller.signal,
    });
    const scopes = response.headers.get('x-oauth-scopes');
    if (
      scopes !== null &&
      !scopes
        .split(',')
        .map((s) => s.trim())
        .some((s) => s === 'read:user' || s === 'user')
    )
      throw new Error('Токен не имеет scope read:user, публикация запрещена');
    if (!response.ok) throw new Error(`Ошибка GitHub GraphQL: HTTP ${response.status}`);
    const data = await response.json();
    if (data.errors?.length) throw new Error(`GitHub GraphQL вернул ${data.errors.length} ошибок`);
    if (data.data?.viewer?.login?.toLowerCase() !== username.toLowerCase())
      throw new Error('Токен принадлежит не владельцу профиля GitHub');
    const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!Array.isArray(weeks) || !weeks.length) throw new Error('GitHub вернул пустой календарь');
    return weeks;
  } finally {
    clearTimeout(timeout);
  }
}
