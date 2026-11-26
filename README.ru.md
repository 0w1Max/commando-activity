# Commando Activity

[English](README.md) · **Русский**

Анимированный восьмибитный календарь активности для GitHub-профиля. Четыре локации, патрулирующий персонаж, прыжки, препятствия и синхронная стрельба по клеткам — на основе вашей реальной активности.

![Живой пример](https://raw.githubusercontent.com/0w1Max/0w1Max/output/commando-activity.svg)

## Подключить к профилю

Форк, сервер, установка npm и копирование движка в профиль не нужны.

1. Добавьте собственный classic PAT со scope **read:user** в секрет репозитория **COMMANDO_READ_USER_TOKEN**.
2. Скопируйте [короткий workflow](examples/profile-workflow.yml) в `.github/workflows/commando.yml` профильного репозитория. Откройте Actions → Commando Activity → Run workflow.
3. Вставьте картинку в README, заменив `YOUR_LOGIN` своим логином:

```markdown
![Commando Activity](https://raw.githubusercontent.com/YOUR_LOGIN/YOUR_LOGIN/output/commando-activity.svg)
```

[Пошаговая установка](docs/ru/INSTALL.md) · [English instructions](docs/en/INSTALL.md) · [Исходник помощника установки](site/index.html)

Workflow получает календарь, проверяет результат и обновляет `output`. Исходники остаются здесь; в вашем профиле хранятся небольшой workflow подключения и готовая картинка. Версия закреплена: обновление выполняется явной заменой `@v2.8.1`.

## Структура

| Раздел | Содержание |
|---|---|
| `scripts/` | Генератор, миссия, рендер и публикация |
| `assets/` | Только спрайты, необходимые при запуске |
| `tests/`, `fixtures/` | Регрессионные тесты и исторические данные проверок |
| `docs/en/`, `docs/ru/` | Английская и русская документация отдельно |
| `examples/` | Минимальный пример подключения |
| `site/` | Двуязычный помощник установки без отправки данных и сбора токенов |

Для разработки: Node.js 22+, `npm test`, `npm run demo`. Runtime-зависимостей нет. Это SVG-анимация, а не игра с управлением клавиатурой.

[Разработка](docs/ru/DEVELOPMENT.md) · [Перенос из профиля](docs/ru/MIGRATION.md) · [Вклад в проект](CONTRIBUTING.md) · [Изменения](CHANGELOG.md)

Оригинальный код имеет MIT-лицензию с явно заданной областью. Права на часть старой графики не подтверждены и не входят в эту лицензию: перед распространением ресурсов прочитайте [ASSET_RIGHTS.md](ASSET_RIGHTS.md). Проект не является официальным продуктом Contra/Konami.

## Благодарности

На создание Commando Activity вдохновил проект [pacman-contribution-graph](https://github.com/abozanona/pacman-contribution-graph) — идея превращения календаря активности GitHub в игровую анимацию.
