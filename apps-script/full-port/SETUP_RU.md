# Apps Script worker и мастер настройки Jmail

Для развёртывания единого пользовательского мастера используй [LIVE_TEST_RU.md](../../LIVE_TEST_RU.md). Пакет состоит из сборного `Code.gs`, HTML-файла `WebApp.html` и `appsscript.json`.

Мастер рассчитан на Web App, развернутый с параметром **Execute as: User accessing the web app**. Это обязательно: ключ, профиль, настройки и идентификаторы ресурсов хранятся в User Properties отдельного пользователя. Не разворачивай пилот как `Execute as: Me`.

Мастер умеет создать персональные Google Sheets, Drive-папку, Gmail labels, Gmail filter по адресам отправителей, профиль по TXT резюме, проверить личный Gemini key, провести ручной пробный запуск и включить/остановить ежедневный триггер.

## Проверки

Из корня репозитория:

- `node apps-script/full-port/profile_builder_test.mjs`
- `node apps-script/full-port/synthetic_test.mjs`
- `node apps-script/full-port/integration_test.mjs`

Они используют синтетические данные и заглушки Google API. Они не заменяют тест в отдельном Google аккаунте.
