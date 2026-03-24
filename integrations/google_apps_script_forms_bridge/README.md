# Google Apps Script bridge for public site forms

Этот мост нужен, чтобы публичный сайт на GitHub Pages мог отправлять формы не в локальный API, а в Google Sheets + Gmail через Apps Script Web App.

## Что здесь есть
- `Code.gs` — веб-обработчик `doPost/doGet`
- `appsscript.json` — манифест проекта

## Что нужно сделать позже
1. Авторизовать `clasp`
2. Создать Apps Script project в этой папке
3. Связать проект с таблицей заявок или новой Google таблицей
4. Задеплоить как Web App с доступом `Anyone`
5. Вписать URL веб-приложения в фронтовый конфиг сайта

После этого GitHub Pages версия сайта сможет отправлять формы в Google без локального сервера.
