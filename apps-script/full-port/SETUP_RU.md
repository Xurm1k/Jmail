# Полный перенос Job Automation в Jmail: закрытый пилот

В этой папке находится конфигурируемый перенос существующего Apps Script сценария Job Automation. Ветку `main` и GitHub Pages он не меняет. Перенесены оригинальные функции анализа, проверка evidence и маршрута, создание CV/Anschreiben PDF, запись по месяцам, история дублей, черновики и текущая обработка ярлыков.

## Что хранится где

- Исходники в `full-port` не содержат пользовательский API key, личное резюме, адрес, email или Google ID.
- Ключ Gemini хранится в Script Properties под `GEMINI_API_KEY`.
- Профиль хранится как JSON в `CAREER_PROFILE_JSON`.
- Данные отправителя и пороги хранятся в `JMAIL_SENDER_JSON` и `JMAIL_SETTINGS_JSON`.
- Google IDs таблицы и папки создаются функцией `setupJmail()` и сохраняются в Script Properties.

## Первичная установка

1. Создать Apps Script проект под отдельным Gmail аккаунтом, который будет использоваться для вакансий.
2. Добавить один файл `Code.gs` и скопировать в него содержимое [`full-port/Code.gs`](./Code.gs). Включить показ файла манифеста и вставить [`appsscript.json`](./appsscript.json). Отдельные `.gs` файлы в папке оставлены для чтения и ревью.
3. В Project Settings → Script Properties добавить:
   - `GEMINI_API_KEY`: личный ключ Gemini;
   - `CAREER_PROFILE_JSON`: объект профиля в формате, описанном ниже;
   - `JMAIL_SENDER_JSON`: объект с `name`, `address`, `phone`, `email`, `city`;
   - `JMAIL_SETTINGS_JSON`: объект настроек, пример ниже.
4. Сохранить и запустить `setupJmail()`. Google попросит разрешения на Gmail, Drive, Sheets и внешние запросы. Функция создаст таблицу, папку и нужные ярлыки.
5. Создать Gmail фильтр, который добавляет уведомления о вакансиях в ярлык `Jmail/Вакансии`.
6. Вручную запустить `processJobEmails()` на тестовых письмах и проверить PDF, таблицу, черновики, ярлыки и папку. Только после проверки вручную запустить `installJmailDailyTrigger()`.

Пример `JMAIL_SETTINGS_JSON`:

```json
{
  "inputLabel": "Jmail/Вакансии",
  "processedLabel": "Jmail/Обработано",
  "reviewLabel": "Jmail/Проверить",
  "minMatchScore": 85,
  "maxCommuteMinutes": 60,
  "minMatchScore": 85,
  "jobCriteria": "Удалённая или гибридная работа; немецкий B1; без тяжёлой физической нагрузки",
  "excludedRoleFamilies": ["data_analyst"],
  "excludedPhysicalDemands": ["heavy", "prolonged_standing"],
  "allowedRoleFamilies": ["office_admin", "quality_control", "customer_service", "supervisor", "other"],
  "allowedPhysicalDemands": ["desk", "light"],
  "allowedApplicationEfforts": ["simple", "moderate"],
  "userEmail": "user@example.com"
}
```

Порог, дополнительные критерии, исключения по типу работы, допустимые форматы роли/нагрузки/отклика задаются в `JMAIL_SETTINGS_JSON`. Значения по умолчанию повторяют текущие ограничения Job Automation; при необходимости пользователь меняет массивы в своих Script Properties.\n\nСхема `CAREER_PROFILE_JSON` должна соответствовать источнику вакансий: `experiences` — массив объектов `{id, company, role, location, period, claims:[{id,tags,text}]}`; также нужны `militaryService`, `education`, `languages`, `skills` (объекты `{id,text}`) и `optionalCareerTransition`. JSON должен помещаться в лимит одного Script Property. Автоматическое преобразование загруженного резюме в этот формат и выдача готового к вставке пакета из PWA ещё не подключены.

## Сохранённое поведение

Сценарий сохраняет действующую бизнес-логику Job Automation: порог оценки, строгий отказ дублей и неподходящих ролей, ручная проверка при недостаточных доказательствах, проверка маршрута до лимита, создание персональных PDF, строка в месячном листе, черновик отклика и отдельная обработка автоответов/рассылок.

В исходной логике некоторые письма перемещаются в корзину, неподходящие архивируются, а ручная команда очистки удаляет неподтверждённые строки и файлы. Использовать сначала только на отдельном аккаунте и тестовых письмах. Ежедневный триггер не включать до ручной проверки.

## Синтетическая проверка

Из корня репозитория выполнить:

`node apps-script/full-port/synthetic_test.mjs`

Тест проверяет 8 решений фильтра (порог, SKIP, evidence, тип роли, физическую нагрузку и маршрут) без вызова Google. Directions API замокан; Gemini и реальный документооборот тестом не запускаются.
