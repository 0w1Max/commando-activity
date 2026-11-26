import { installArtifacts } from './setup.mjs';
import { translations, preferredLanguage } from './i18n.mjs';
const element = (id) => document.getElementById(id);
const storageKey = 'commando-language';
let saved = null;
try {
  saved = localStorage.getItem(storageKey);
} catch {
  /* Storage can be disabled; installation still works. */
}
let lang = preferredLanguage({ search: location.search, saved, browser: navigator.language });
function setLanguage(value, persist = false) {
  lang = value;
  document.documentElement.lang = value;
  for (const node of document.querySelectorAll('[data-i18n]'))
    node.textContent = translations[value][node.dataset.i18n];
  for (const code of ['en', 'ru'])
    element(code).setAttribute('aria-pressed', String(code === value));
  element('guide').href =
    `https://github.com/0w1Max/commando-activity/blob/main/docs/${value}/INSTALL.md`;
  element('status').textContent = '';
  element('error').textContent = '';
  if (persist) {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* Preference persistence is optional. */
    }
    const url = new URL(location.href);
    url.searchParams.set('lang', value);
    history.replaceState(null, '', url);
  }
}
for (const code of ['en', 'ru'])
  element(code).addEventListener('click', () => setLanguage(code, true));
element('form').addEventListener('input', () => {
  element('results').hidden = true;
  element('status').textContent = '';
  element('error').textContent = '';
});
element('form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const artifacts = installArtifacts(
      element('login').value.trim(),
      element('branch').value.trim(),
    );
    element('workflow').value = artifacts.workflow;
    element('markdown').value = artifacts.markdown;
    for (const [id, key] of [
      ['secret', 'secretUrl'],
      ['add', 'workflowUrl'],
      ['actions', 'actionsUrl'],
    ])
      element(id).href = artifacts[key];
    element('results').hidden = false;
    element('error').textContent = '';
  } catch {
    element('error').textContent = translations[lang].invalid;
    element('results').hidden = true;
  }
});
for (const button of document.querySelectorAll('[data-copy]'))
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(element(button.dataset.copy).value);
      element('status').textContent = translations[lang].copied;
    } catch {
      element('status').textContent = translations[lang].copyFailed;
    }
  });
setLanguage(lang);
