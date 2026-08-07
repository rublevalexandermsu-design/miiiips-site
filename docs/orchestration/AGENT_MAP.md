# Agent Map: Оркестр Платформы МИИИИПС

## Назначение

Этот документ фиксирует агентную архитектуру платформы:
- кто за что отвечает;
- какие skills использует;
- какими страницами и данными владеет;
- куда эскалирует задачу;
- где заканчивается его зона ответственности.

Базовый принцип:
- `skill` = набор правил и компетенций;
- `agent` = роль-исполнитель;
- `Global Orchestrator` = распределяет задачи, собирает итог и контролирует выпуск.

---

## 1. Global Orchestrator

### Роль
Главный координирующий агент платформы.

### Отвечает за
- разбор большой задачи;
- разбиение на подзадачи;
- выбор нужных агентов;
- сбор результата в единый выпуск;
- проверку, что решения не конфликтуют;
- финальное решение о публикации.

### Используемые skills
- `multi-agent-orchestrator`
- `institute-platform-architect`
- `cross-project-linker`

### Основные активы
- все `docs/orchestration/*`
- `assets/data/agent-orchestration.json`
- `tools/agent_router.py`

### Не делает напрямую
- не пишет массово контент;
- не ведёт research-case;
- не редактирует event pages без передачи профильному агенту.

---

## 2. Architecture Agent

### Роль
Архитектор платформы и общей модели данных.

### Отвечает за
- единый shell;
- shared entities;
- общие registries;
- связи между проектами;
- правила reuse;
- boundary между общим слоем и модулем проекта.

### Skills
- `institute-platform-architect`
- `cross-project-linker`

### Основные страницы
- `index.html`
- `about.html`
- `accounts.html`
- `research.html`
- `social-projects.html`
- `contacts-partners.html`
- `mgu-branches.html`
- `city-lecture-network.html`

### Основные данные
- `assets/data/platform-profiles.json`
- `assets/data/account-shell.json`
- `platform-shell.js`

### Эскалация
- в QA Agent для релиз-проверки;
- в Accounts Agent, если задача про личный маршрут;
- в Courses/Grants/Research, если задача уходит в модуль.

---

## 3. Accounts Agent

### Роль
Владелец participant shell и личных кабинетов.

### Отвечает за
- participant profile;
- role pages;
- статус участника;
- маршруты участия;
- видимость связанного курса, гранта, публикации и события.

### Skills
- `account-shell-integrator`

### Основные страницы
- `accounts.html`
- `account-author.html`
- `account-student.html`
- `account-supervisor.html`
- `account-editor.html`
- `account-coordinator.html`
- `application-success.html`
- `audit-request.html`
- `join.html`

### Основные данные
- `assets/data/platform-profiles.json`
- `assets/data/user-event-history.json`

### Эскалация
- в Courses Agent для обучения;
- в Grants Agent для заявочного маршрута;
- в Editorial Agent для автора/редактора;
- в QA Agent перед выпуском.

---

## 4. Events Agent

### Роль
Владелец полного жизненного цикла мероприятий.

### Отвечает за
- создание событий;
- обновление существующих событий;
- понедельничные лекции;
- event pages;
- календарь, фильтры, карточки;
- архив материалов события.

### Skills
- `event-lifecycle-publisher`

### Основные страницы
- `conferences.html`
- `event-registration.html`
- `event-bandits.html`
- `event-parkgorkogo.html`
- `event-gelendzhik.html`
- `event-bystraya-psihologiya-30032026.html`
- `event-psychology-men.html`
- `event-psychology-znakomstv.html`

### Основные данные
- `assets/data/events.json`
- `assets/data/user-event-history.json`

### Эскалация
- в Editorial Agent, если из события растёт статья;
- в Research Agent, если из события растёт кейс;
- в QA Agent перед публикацией.

---

## 5. Courses Agent

### Роль
Владелец фабрики курсов.

### Отвечает за
- course template;
- course instances;
- программа курса;
- библиотека и лекции;
- progress / access / certificate / payment state;
- перенос курса ЭИ в универсальную course factory.

### Skills
- `ei-course-factory`

### Основные страницы
- `course-ei.html`
- `course-ei-program.html`
- `course-ei-catalog.html`
- `course-ei-library.html`
- `course-ei-lectures.html`
- `course-certificate-ei.html`
- `payment-demo.html`
- `education-ai.html`

### Основные данные
- `assets/data/course-registry.json`

### Эскалация
- в Accounts Agent для route/state участника;
- в Grants Agent, если курс связан с грантовой подготовкой;
- в QA Agent перед релизом.

---

## 6. Grants Agent

### Роль
Владелец грантового маршрута института.

### Отвечает за
- подбор грантов по профилю;
- readiness;
- inquiry/application flow;
- роль института и роль исполнителя;
- связь грантов с research и publications.

### Skills
- `grants-online-orchestrator`

### Основные страницы
- `grants-teams.html`
- частично `account-coordinator.html`
- частично `account-supervisor.html`

### Основные данные
- `assets/data/grant-registry.json`
- `assets/data/grant-application-registry.json`

### Эскалация
- в Research Agent, если нужна доказательная база;
- в Editorial Agent, если нужна публикационная база;
- в QA Agent перед релизом.

---

## 7. Editorial Agent

### Роль
Владелец editorial pipeline и публичных материалов.

### Отвечает за
- ingest;
- превращение сырого материала в публикацию;
- human-facing copy;
- publication cards;
- SEO-ready output;
- связь статьи с курсом, грантом, событием и кейсом.

### Skills
- `autoarticle-pipeline`

### Основные страницы
- `publications.html`
- `scientific-editing.html`
- `knowledge-base.html`
- `news-feed.html`
- частично `account-author.html`
- частично `account-editor.html`

### Основные данные
- `assets/data/editorial-pipeline.json`
- `assets/data/editorial-ingest.json`
- `assets/data/publication-registry.json`
- `assets/data/site-content.json`

### Эскалация
- в QA Agent перед выпуском;
- в Research Agent, если статья растёт из кейса;
- в Events Agent, если статья растёт из лекции.

---

## 8. Research Agent

### Роль
Владелец research sandbox и applied case publishing.

### Отвечает за
- research lifecycle;
- research sandbox;
- case pages;
- artifacts;
- связку кейсов с грантами, публикациями и курсами.

### Skills
- `rowing-case-publisher`

### Основные страницы
- `research.html`
- `research-sandbox.html`
- `biomechanics-rowing.html`

### Основные данные
- `assets/data/research-case-registry.json`
- `assets/data/research-metadata.json`
- `assets/data/research-sandbox.json`

### Эскалация
- в Grants Agent для заявочного маршрута;
- в Editorial Agent для публикационного вывода;
- в QA Agent перед релизом.

---

## 9. Compliance Agent

### Роль
Владелец внутреннего контура отчётности, календаря сроков и Telegram-отражения.

### Отвечает за
- перечень обязательных отчётов;
- разбивку по месяцам;
- архив неактуальных периодов;
- папки хранения отчётов и доказательств;
- напоминания и статусы подач;
- синхронизацию сайта, Telegram-бота и внутреннего контурного реестра.

### Skills
- `internal-compliance-orchestrator`

### Основные страницы и контуры
- `internal-compliance.html`
- `docs/internal_compliance_dashboard/README.md`
- `assets/data/internal-compliance/reporting-pack.json`
- `assets/data/internal-compliance/reporting-registry.json`
- `projects/telegram_materials_bot/telegram_materials_bot.py`

### Основные данные
- `assets/data/internal-compliance/internal-compliance-dashboard-data.json`
- `assets/data/internal-compliance/reporting-pack.json`
- `assets/data/internal-compliance/reporting-registry.json`

### Эскалация
- в QA Agent перед выпуском внутреннего контура;
- в Global Orchestrator, если меняются правила обязательности или маршруты отражения в Telegram.

---

## 10. QA Agent

### Роль
Финальный guard публичного слоя.

### Отвечает за
- отсутствие техтекста;
- отсутствие заглушек;
- корректность route/data связей;
- release gates;
- блокировку плохого выпуска.

### Skills
- `site-content-qa-guard`

### Основные страницы
- весь публичный HTML

### Основные данные и инструменты
- `tools/site_release_guard.py`
- `tools/site_data_guard.py`
- `tools/publish_with_guard.ps1`

### Эскалация
- только в Global Orchestrator.

---

## Рабочая схема

### Когда хватает одного агента
- изменение касается одной страницы и одного data-layer;
- нет изменения shared entities;
- не затрагиваются несколько модулей.

### Когда нужен оркестратор
- задача затрагивает несколько зон:
  - shell + courses
  - events + publications
  - grants + research
  - research + site copy + release
- нужно свести архитектуру, данные, UI и публикацию вместе.

### Практический принцип

Не делать:
- один универсальный агент на всё;
- один агент на каждый skill механически.

Делать:
- один оркестратор;
- 7–8 ролевых агентов;
- skills как библиотеку компетенций для этих агентов.
