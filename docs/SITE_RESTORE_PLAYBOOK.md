# Playbook: Как Вернуть Блок, Кнопку, Страницу Или Шаблон

Этот playbook нужен для быстрых точечных возвратов без панического отката всего сайта.

## Быстрый сценарий

### 1. Найти файл
Пример:
- `publications.html`
- `prototype-enhancements.js`
- `assets/data/events.json`

### 2. Найти рабочий коммит
```powershell
git log --oneline -- publications.html
```

### 3. Выгрузить предыдущую версию в preview
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\restore_site_asset.ps1 -Commit <commit> -RelativePath publications.html -Mode preview
```

### 4. Сравнить preview с текущим файлом

Смотреть:
- какой блок был удалён;
- был ли это HTML-контейнер;
- был ли это JS-mount;
- был ли это текст, стиль или кнопка.

### 5. Вернуть только нужное

Предпочтительно:
- не откатывать весь файл;
- вернуть только нужный кусок.

### 6. Прогнать guards
```powershell
python .\tools\site_release_guard.py
python .\tools\site_data_guard.py
```

### 7. Сделать отдельный fix-коммит

Пример:
```powershell
git add publications.html
git commit -m "fix: restore publications layout block"
git push origin main
```

## Когда можно делать полный restore файла

Полный restore допустим, если:
- файл сломан целиком;
- проще вернуть рабочую версию и потом заново дочистить;
- у файла мало новых изменений, которые жалко терять.

Команда:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\restore_site_asset.ps1 -Commit <commit> -RelativePath publications.html -Mode restore
```

## Когда нельзя делать полный restore

Нельзя делать полный restore, если:
- в файле после этого коммита появились важные рабочие правки;
- он зависит от новых JSON-структур;
- можно вернуть только один блок без риска для остального.

В этом случае использовать только `preview` и переносить кусок вручную.

## Типовые объекты для возврата

### Кнопки и меню
Обычно искать в:
- `prototype-enhancements.js`
- самих HTML-файлах

### Публичные блоки страниц
Искать в:
- соответствующей HTML-странице
- `platform-shell.js`
- `miiiips-live-layer.js`

### Карточки событий и event-логика
Искать в:
- `conferences.html`
- `conferences-events.js`
- `assets/data/events.json`

### Course / account / grants / publications
Искать и в HTML, и в data-layer:
- `assets/data/platform-profiles.json`
- `assets/data/course-registry.json`
- `assets/data/grant-registry.json`
- `assets/data/publication-registry.json`

## Практическое правило

Если исчез один блок:
- не откатывать весь сайт.

Если исчезла логика одной страницы:
- сначала проверить HTML;
- затем JS;
- затем data-layer.

Если исчезло сразу много:
- смотреть последний пакетный коммит и разбивать проблему по слоям.
