export const translations = {
  en: {
    publicOutput:
      'The published image is public and may include aggregate private contribution counts visible to your owner token. Repository names and commit details are not requested.',
    title: 'Your activity. A living world.',
    intro:
      'Add an animated contribution calendar to your GitHub profile in three steps. No fork or server required.',
    start: 'Start with your GitHub login',
    login: 'GitHub username',
    advanced: 'Advanced: profile branch',
    branch: 'Default branch of your profile repository',
    prepare: 'Prepare my installation',
    privacy: 'Your login is used only in this page to generate links. Never enter a token here.',
    secretTitle: 'Add your calendar secret',
    secretText:
      'Create a classic GitHub PAT with read:user only. Add it as COMMANDO_READ_USER_TOKEN in your profile repository. The secret stays in GitHub.',
    secretLink: 'Open repository secrets',
    workflowTitle: 'Add the small workflow',
    workflowText:
      'Open the prepared file, commit it to your default branch, then run Commando Activity from Actions. Wait for a successful first run.',
    add: 'Create workflow in GitHub',
    copy: 'Copy',
    imageTitle: 'Add the image to your README',
    refresh:
      'Your calendar refreshes twice daily. GitHub may cache the image or delay scheduled runs.',
    guide: 'Detailed guide',
    rights:
      'Original code and legacy artwork have separate rights. See ASSET_RIGHTS.md before redistributing artwork.',
    invalid: 'Check the GitHub username and branch.',
    copied: 'Copied.',
    copyFailed: 'Select the text and copy it manually.',
  },
  ru: {
    publicOutput:
      'Картинка публичная и может включать суммарные приватные вклады, доступные токену владельца. Названия репозиториев и детали коммитов не запрашиваются.',
    title: 'Твоя активность. Живой мир.',
    intro: 'Добавь анимированный календарь в GitHub-профиль за три шага. Без форка и сервера.',
    start: 'Начни со своего логина GitHub',
    login: 'Логин GitHub',
    advanced: 'Дополнительно: ветка профиля',
    branch: 'Основная ветка профильного репозитория',
    prepare: 'Подготовить установку',
    privacy:
      'Логин используется только на этой странице для подготовки ссылок. Никогда не вводи сюда токен.',
    secretTitle: 'Добавь секрет календаря',
    secretText:
      'Создай classic PAT GitHub только со scope read:user. Добавь его в секрет COMMANDO_READ_USER_TOKEN профильного репозитория. Секрет остаётся в GitHub.',
    secretLink: 'Открыть секреты репозитория',
    workflowTitle: 'Добавь короткий workflow',
    workflowText:
      'Открой подготовленный файл, сохрани его в основной ветке. Затем запусти Commando Activity во вкладке Actions и дождись успешного первого запуска.',
    add: 'Создать workflow в GitHub',
    copy: 'Копировать',
    imageTitle: 'Вставь картинку в README',
    refresh:
      'Календарь обновляется дважды в сутки. Возможны кеш картинки и задержки расписания GitHub.',
    guide: 'Подробная инструкция',
    rights:
      'У оригинального кода и старой графики разные права. Перед распространением ресурсов прочитай ASSET_RIGHTS.md.',
    invalid: 'Проверь логин GitHub и имя ветки.',
    copied: 'Скопировано.',
    copyFailed: 'Выдели текст и скопируй вручную.',
  },
};
export function preferredLanguage({ search = '', saved = null, browser = 'en' } = {}) {
  const requested = new URLSearchParams(search).get('lang');
  if (['en', 'ru'].includes(requested)) return requested;
  if (['en', 'ru'].includes(saved)) return saved;
  return browser.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
