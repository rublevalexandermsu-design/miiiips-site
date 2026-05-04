# Timepad integration roadmap

## Что уже работает
- публичные ссылки на Timepad-события и анонсы;
- блок ближайшей лекции и общий lecture hub;
- маршруты из сайта института в регистрацию.

## Что можно сделать без доступа
- обновлять ссылки на события;
- парсить публичные афиши и анонсы;
- вести блок ближайших мероприятий.

## Что понадобится для глубокой интеграции
1. API token Timepad
или
2. widget code регистрации
или
3. доступ к кабинету организатора

## Что это даст
- встроенную регистрацию прямо на сайте;
- автоподгрузку будущих событий;
- единый маршрут из сайта института без ручной переклейки ссылок.
# Timepad Speaker Entity Block

Canonical block for events where Татьяна Мунн is the speaker:

- manifest: `tatyana-speaker-entity-block.json`
- canonical author page: `https://miiiips.ru/author-tatyana-munn-kumskova.html`
- machine-readable person graph: `https://miiiips.ru/person.json`

Rollout rule: add the visible `О лекторе` block to Timepad event descriptions only through the Timepad API scripts after `TIMEPAD_API_TOKEN` is loaded in a separate Timepad branch. Do not add hidden SEO text; the identity bridge must stay visible and natural.
