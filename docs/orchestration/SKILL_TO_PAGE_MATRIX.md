# Skill To Page Matrix

## Формат
- `Skill`
- `Основные страницы`
- `Основные данные`
- `Основные скрипты`
- `Владелец`

---

## institute-platform-architect
- Страницы:
  - `index.html`
  - `about.html`
  - `accounts.html`
  - `research.html`
  - `social-projects.html`
  - `contacts-partners.html`
  - `mgu-branches.html`
  - `city-lecture-network.html`
- Данные:
  - `assets/data/platform-profiles.json`
  - `assets/data/account-shell.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Architecture Agent`

## account-shell-integrator
- Страницы:
  - `accounts.html`
  - `account-author.html`
  - `account-student.html`
  - `account-supervisor.html`
  - `account-editor.html`
  - `account-coordinator.html`
  - `join.html`
  - `application-success.html`
  - `audit-request.html`
- Данные:
  - `assets/data/platform-profiles.json`
  - `assets/data/user-event-history.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Accounts Agent`

## event-lifecycle-publisher
- Страницы:
  - `conferences.html`
  - `event-registration.html`
  - `event-bandits.html`
  - `event-parkgorkogo.html`
  - `event-gelendzhik.html`
  - `event-bystraya-psihologiya-30032026.html`
  - `event-psychology-men.html`
  - `event-psychology-znakomstv.html`
- Данные:
  - `assets/data/events.json`
  - `assets/data/user-event-history.json`
- Скрипты:
  - `conferences-events.js`
- Владелец:
  - `Events Agent`

## ei-course-factory
- Страницы:
  - `course-ei.html`
  - `course-ei-program.html`
  - `course-ei-catalog.html`
  - `course-ei-library.html`
  - `course-ei-lectures.html`
  - `course-certificate-ei.html`
  - `payment-demo.html`
  - `education-ai.html`
- Данные:
  - `assets/data/course-registry.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Courses Agent`

## grants-online-orchestrator
- Страницы:
  - `grants-teams.html`
  - `account-coordinator.html`
  - `account-supervisor.html`
- Данные:
  - `assets/data/grant-registry.json`
  - `assets/data/grant-application-registry.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Grants Agent`

## autoarticle-pipeline
- Страницы:
  - `publications.html`
  - `scientific-editing.html`
  - `knowledge-base.html`
  - `news-feed.html`
  - `account-author.html`
  - `account-editor.html`
- Данные:
  - `assets/data/editorial-pipeline.json`
  - `assets/data/editorial-ingest.json`
  - `assets/data/publication-registry.json`
  - `assets/data/site-content.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Editorial Agent`

## rowing-case-publisher
- Страницы:
  - `research.html`
  - `research-sandbox.html`
  - `biomechanics-rowing.html`
- Данные:
  - `assets/data/research-case-registry.json`
  - `assets/data/research-metadata.json`
  - `assets/data/research-sandbox.json`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Research Agent`

## cross-project-linker
- Страницы:
  - `accounts.html`
  - `publications.html`
  - `grants-teams.html`
  - `course-ei.html`
  - `research.html`
  - `research-sandbox.html`
- Данные:
  - все shared registries в `assets/data/`
- Скрипты:
  - `platform-shell.js`
- Владелец:
  - `Architecture Agent`

## site-content-qa-guard
- Страницы:
  - весь публичный HTML
- Данные:
  - весь публичный data-layer
- Скрипты:
  - `tools/site_release_guard.py`
  - `tools/site_data_guard.py`
  - `tools/publish_with_guard.ps1`
- Владелец:
  - `QA Agent`

## multi-agent-orchestrator
- Страницы:
  - не привязан к одной странице
- Данные:
  - `assets/data/agent-orchestration.json`
- Скрипты:
  - `tools/agent_router.py`
- Владелец:
  - `Global Orchestrator`
