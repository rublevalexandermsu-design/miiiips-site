# Timepad Site Sync

Канонический источник входящих событий: `https://miiiips.timepad.ru/events/`, организация Timepad `479377`.

Команда локальной синхронизации:

```powershell
python tools\timepad_site_events_sync.py --min-date 2026-04-27 --max-year 2026
```

Что делает синхронизация:

- сканирует публичные страницы Timepad;
- берёт дату, время, описание, ссылку регистрации и постер события;
- не создаёт дубли, если событие уже есть в `assets/data/events.json`;
- создаёт или обновляет страницу `event-*.html`;
- создаёт файл календаря `assets/calendar/*.ics`;
- сохраняет SEO-фото в `assets/images/lectures/` с датой, названием, `psiholog-tatyana-munn-mgu` и `miiiips`;
- обновляет `page-manifests`, AEO/SEO packages, `llms.txt`, `image-sitemap.xml`, `conferences.json`.

Правило готовности:

- событие есть в `assets/data/events.json`;
- дата отображается в календаре;
- есть отдельная HTML-страница;
- есть картинка, `.ics`, page manifest и AEO package;
- регистрационная ссылка ведёт на `miiiips.timepad.ru`, а не на старый личный Timepad.
