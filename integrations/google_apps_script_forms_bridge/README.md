# Google Apps Script bridge for public site forms

Этот мост нужен, чтобы формы с `miiiips.ru` работали без локального Python API:

- публичный endpoint принимает заявку;
- пишет строку в Google Sheet `Заявки с сайта`;
- отправляет email на рабочую почту;
- шлёт Telegram alert в рабочую тему;
- возвращает JSON-ответ сайту.

## Что здесь лежит

- `Code.gs` — production-версия веб-обработчика
- `appsscript.json` — манифест Apps Script

## Что нужно настроить в Script Properties

После создания проекта и перед деплоем задай:

- `TARGET_EMAIL` = `rublevalexanderus@gmail.com`
- `SITE_REQUEST_SHEET_NAME` = `Заявки с сайта`
- `TELEGRAM_BOT_TOKEN` = `<token рабочего бота>`
- `TELEGRAM_ALERT_CHAT_ID` = `-1002564966905`
- `TELEGRAM_ALERT_THREAD_ID` = `2342`

## Порядок деплоя

1. Авторизовать `clasp`
2. Создать новый Apps Script project
3. Прописать `.clasp.json` с `scriptId`
4. `clasp push`
5. Развернуть как `Web App`
   - Execute as: `User deploying`
   - Access: `Anyone`
6. Вписать URL web app в:
   - `assets/data/site-integrations.json`
7. Закоммитить и запушить сайт

## Почему это лучше прежнего localhost API

- сайт начинает работать для внешних пользователей, а не только на этой машине;
- Gmail OAuth не нужно крутить в локальном Python;
- письмо уходит из Google-контекста владельца скрипта;
- таблица и Telegram уведомления тоже уходят из одного публичного backend-контура.

## Ограничение

Apps Script сам по себе неудобен как прямой cross-origin JSON backend для `fetch`.
Поэтому фронт должен использовать его как приоритетный публичный endpoint через конфиг сайта.
Если браузер упрётся в cross-origin ограничения, следующим шагом поверх этого моста нужно поставить тонкий proxy-runtime.
