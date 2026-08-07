# Orchestration Protocol

## Цель

Сделать так, чтобы большие задачи по платформе не выполнялись хаотично одним агентом, а проходили через управляемый оркестр ролей.

---

## 1. Когда нужен один агент

Один агент достаточно, если:
- меняется одна страница или один модуль;
- правка не затрагивает shared entities;
- нет конфликта между UI, data-layer и release;
- задача не затрагивает несколько направлений одновременно.

Примеры:
- правка одной event page;
- обновление курса ЭИ;
- правка grant copy;
- чистка техтекста на одной странице.

---

## 2. Когда нужен оркестратор

Оркестратор обязателен, если задача затрагивает:
- несколько skills;
- несколько страниц;
- несколько registries;
- UI + data + release одновременно;
- cross-project reuse.

Примеры:
- новая Monday lecture: event + editorial + QA;
- новый research case: research + grants + publications + QA;
- новая course factory feature: shell + courses + payment + certificates + QA.

---

## 3. Порядок распределения задачи

### Шаг 1. Классификация
Global Orchestrator определяет:
- primary domain;
- secondary domains;
- affected pages;
- affected data files;
- release risk.

### Шаг 2. Выбор агентов
Минимальный набор ролей, которые реально нужны.

### Шаг 3. Разделение ответственности
Каждый агент получает:
- свой write-set;
- свои страницы;
- свои data files;
- свой deliverable.

### Шаг 4. Сведение результата
Global Orchestrator:
- проверяет отсутствие противоречий;
- сверяет тексты, данные и маршруты;
- передаёт в QA.

### Шаг 5. Release
QA Agent прогоняет:
- `site_release_guard.py`
- `site_data_guard.py`
- `publish_with_guard.ps1`

Только после этого идёт публикация.

---

## 4. Стандартный pipeline по ролям

### A. Архитектурная задача
1. `Architecture Agent`
2. `Accounts Agent` / `Courses Agent` / `Grants Agent` / `Research Agent`
3. `QA Agent`
4. `Global Orchestrator`

### B. Публикация мероприятия
1. `Events Agent`
2. `Editorial Agent` при необходимости
3. `QA Agent`
4. `Global Orchestrator`

### C. Новый курс
1. `Courses Agent`
2. `Accounts Agent`
3. `QA Agent`
4. `Global Orchestrator`

### D. Новый research case
1. `Research Agent`
2. `Grants Agent`
3. `Editorial Agent`
4. `QA Agent`
5. `Global Orchestrator`

### E. Чистка публичного текста
1. `Editorial Agent`
2. `QA Agent`
3. `Global Orchestrator`

### F. Отчётность и внутренний контур
1. `Compliance Agent`
2. `Global Orchestrator` при изменении правил и маршрутов
3. `QA Agent`
4. `Global Orchestrator`

---

## 5. Write-set правило

Каждый агент должен по возможности работать в своей зоне:

- `Accounts Agent`
  - role pages
  - participant data
- `Events Agent`
  - event pages
  - `events.json`
- `Courses Agent`
  - course pages
  - `course-registry.json`
- `Grants Agent`
  - grant pages
  - grant registries
- `Editorial Agent`
  - publications/news/knowledge
  - editorial registries
- `Research Agent`
  - research pages
  - research registries
- `QA Agent`
  - guards only
- `Compliance Agent`
  - internal compliance page
  - reporting registry
  - report pack
  - Telegram report mirror

Если задача требует пересечения write-set, решение принимает `Global Orchestrator`.

---

## 6. Что нельзя делать

- не использовать один generic agent для всех задач;
- не отдавать одному агенту одновременно:
  - architecture
  - content
  - QA
  - release
- не смешивать отчётность и публикационный поток без `Compliance Agent`;
- не публиковать без QA;
- не менять shared entities без сверки с `Architecture Agent`.

---

## 7. Release decision

Финальный выпуск делает не профильный агент, а `Global Orchestrator` после успешного QA.

Это нужно, чтобы:
- не публиковать частично согласованные изменения;
- не выпускать страницу, которая сломает другой модуль;
- не терять общую платформенную картину.
