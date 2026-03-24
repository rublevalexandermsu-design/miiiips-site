(function () {
  const DEMO_PASSWORD = 'demo2026';
  const SITE_DATA_FALLBACK = {
    news: [],
    videos: [],
    playlists: [],
    courses: [],
    documents: [],
    meta: { demoPassword: DEMO_PASSWORD }
  };

  const DOWNLOAD_MAP = {
    'Правила приема .PDF': 'assets/docs/miiiips_admission_guide.pdf',
    'Правила приёма .PDF': 'assets/docs/miiiips_admission_guide.pdf',
    'Принципы этики .PDF': 'assets/docs/miiiips_ethics_principles.pdf',
    'Как оформить работы .PDF': 'assets/docs/miiiips_work_format_guide.pdf',
    'Реестр требований': 'assets/docs/miiiips_publication_route.pdf',
    'Программа курса': 'assets/docs/miiiips_ei_course_program.pdf',
    'Маршрут публикации': 'assets/docs/miiiips_publication_route.pdf',
    'Краткий грантовый маршрут': 'assets/docs/miiiips_grants_brief.pdf',
    'Демо-отчет аудита': 'assets/docs/miiiips_audit_report_demo.pdf'
  };

  const EXTRA_PAGES = [
    ['course-ei.html', 'Курс ЭИ'],
    ['course-ei-catalog.html', 'Каталог ЭИ'],
    ['course-ei-program.html', 'Программа ЭИ'],
    ['course-ei-library.html', 'Библиотека ЭИ'],
    ['course-ei-lectures.html', 'Лекции ЭИ'],
    ['news-feed.html', 'Новости и лента'],
    ['account-editor.html', 'Кабинет редактора'],
    ['account-coordinator.html', 'Кабинет координатора']
  ];

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const apiBase = location.origin && location.origin.startsWith('http') ? location.origin : 'http://127.0.0.1:3007';

  function ensureGlobalStyles() {
    if (document.getElementById('miiiips-enhancements-style')) return;
    const style = document.createElement('style');
    style.id = 'miiiips-enhancements-style';
    style.textContent = [
      '.miiiips-injected{max-width:1200px;margin:0 auto;padding:40px 28px 0;}',
      '.miiiips-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;}',
      '.miiiips-card{background:#fff;border:1px solid #e2e2e2;box-shadow:0 10px 30px rgba(0,52,43,.05);padding:22px;}',
      '.miiiips-card h3{margin:0 0 10px;font:700 28px/1.1 Newsreader,serif;color:#00342b;}',
      '.miiiips-card p{margin:0;color:#3f4945;line-height:1.65;}',
      '.miiiips-kicker{display:inline-block;padding:6px 10px;border-radius:999px;background:#edf4f1;color:#004d40;font:700 11px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px;}',
      '.miiiips-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;}',
      '.miiiips-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;background:#004d40;color:#fff;border:none;text-decoration:none;font:700 12px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}',
      '.miiiips-btn.secondary{background:#fff;color:#00342b;border:1px solid #bfc9c4;}',
      '.miiiips-note{font-size:13px;color:#52635d;}',
      '.miiiips-toast{position:fixed;right:16px;bottom:16px;z-index:10000;background:#00342b;color:#fff;padding:12px 14px;max-width:360px;box-shadow:0 14px 30px rgba(0,0,0,.2);font:500 14px/1.5 Manrope,sans-serif;}',
      '.miiiips-form-status{margin-top:12px;font-size:14px;color:#004d40;}',
      '.miiiips-hidden{display:none !important;}',
      '.miiiips-embed{position:relative;width:100%;padding-top:56.25%;background:#e8e8e8;overflow:hidden;border:1px solid #d8ddd9;}',
      '.miiiips-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}',
      '.miiiips-role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:18px;}',
      '.miiiips-role-card{background:#fff;border:1px solid #d8ddd9;padding:18px;}',
      '.miiiips-simple-form{display:grid;gap:16px;background:#fff;border:1px solid #d8ddd9;padding:20px;}',
      '.miiiips-simple-form input,.miiiips-simple-form textarea,.miiiips-simple-form select{padding:12px;border:1px solid #bfc9c4;font:16px/1.4 Manrope,sans-serif;}',
      '.miiiips-simple-form label{display:grid;gap:8px;font:700 12px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#3f4945;}',
      '.miiiips-news-list{display:grid;gap:18px;}',
      '.miiiips-news-item{background:#fff;border:1px solid #e2e2e2;padding:22px;}',
      '.miiiips-news-item h3{margin:0 0 8px;font:700 28px/1.1 Newsreader,serif;color:#00342b;}',
      '.miiiips-inline-metric{padding:14px 0;border-top:1px solid rgba(0,0,0,.08);}',
      '.miiiips-inline-metric strong{display:block;font:700 32px/1 Newsreader,serif;color:#00342b;}',
      '.miiiips-top-nav-extra{display:flex;gap:18px;flex-wrap:wrap;align-items:center;}'
    ].join('');
    document.head.appendChild(style);
  }

  function toast(message) {
    ensureGlobalStyles();
    const existing = document.getElementById('miiiips-toast');
    if (existing) existing.remove();
    const box = document.createElement('div');
    box.id = 'miiiips-toast';
    box.className = 'miiiips-toast';
    box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  }

  async function loadSiteData() {
    try {
      const response = await fetch(apiBase + '/api/site-data', { cache: 'no-store' });
      if (!response.ok) throw new Error('bad site-data response');
      return await response.json();
    } catch (error) {
      try {
        const fallbackResponse = await fetch('assets/data/site-content.json', { cache: 'no-store' });
        if (!fallbackResponse.ok) throw new Error('fallback missing');
        return await fallbackResponse.json();
      } catch (_) {
        return SITE_DATA_FALLBACK;
      }
    }
  }

  function pickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = function () {
      if (input.files && input.files[0]) {
        toast('Выбран файл: ' + input.files[0].name + '. В прототипе он будет учтён в маршруте формы.');
      }
    };
    input.click();
  }
  window.codexPrototypePickFile = pickFile;

  function resolveDownload(label) {
    return DOWNLOAD_MAP[label.trim()] || null;
  }

  function wireDownloads() {
    document.querySelectorAll('span, a, button').forEach((node) => {
      const text = (node.textContent || '').trim();
      const href = resolveDownload(text);
      if (!href) return;
      node.style.cursor = 'pointer';
      node.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = href;
      });
    });
  }


  function ensurePageMapExists() {
    if (document.getElementById('codex-page-map')) return;
    const root = document.createElement('div');
    root.id = 'codex-page-map';
    root.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9999;font-family:Manrope,sans-serif;';
    root.innerHTML = '<button aria-expanded="false" id="codex-page-map-toggle" style="display:flex;align-items:center;gap:8px;background:#00342b;color:#fff;border:none;border-radius:999px;padding:10px 14px;box-shadow:0 10px 24px rgba(0,0,0,.18);cursor:pointer;font:700 13px/1.2 Manrope,sans-serif;" type="button"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#afefdd;"></span>Карта страниц</button><div id="codex-page-map-panel" style="display:none;margin-top:10px;width:320px;max-height:74vh;overflow:auto;background:#00342b;color:#ffffff;padding:12px;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08);"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;"><div style="font:700 13px/1.4 Manrope,sans-serif;">Локальный прототип Stitch v1.2</div><button id="codex-page-map-close" style="background:transparent;color:#fff;border:none;cursor:pointer;font:700 18px/1 Manrope,sans-serif;opacity:.8;" type="button">×</button></div><div style="font:12px/1.4 Manrope,sans-serif;opacity:.8;margin-bottom:10px;">Основные страницы: 18 | Служебные и кабинеты: 13</div><div style="font:700 11px/1.3 Manrope,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:10px 0 6px;">Основной сайт</div><div style="display:grid;gap:4px;"></div><div style="font:700 11px/1.3 Manrope,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:12px 0 6px;">Служебные страницы и кабинеты</div><div style="display:grid;gap:4px;"></div></div>';
    document.body.appendChild(root);
    const toggle = document.getElementById('codex-page-map-toggle');
    const closeBtn = document.getElementById('codex-page-map-close');
    const panel = document.getElementById('codex-page-map-panel');
    function setOpen(isOpen) { panel.style.display = isOpen ? 'block' : 'none'; toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); }
    toggle.addEventListener('click', function () { setOpen(panel.style.display === 'none' || panel.style.display === ''); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  function extendPageMap() {
    const panel = document.getElementById('codex-page-map-panel');
    if (!panel || panel.dataset.extended === '1') return;
    panel.dataset.extended = '1';
    const summary = panel.querySelectorAll('div')[1];
    if (summary) summary.textContent = 'Основные страницы: 18 | Служебные и кабинеты: 13';
    const sections = panel.querySelectorAll('div[style*="display:grid;gap:4px;"]');
    const mainLinks = [
      ['index.html','Главная'],['about.html','Об институте'],['research.html','Исследования'],['social-projects.html','Социальные проекты'],['education-ai.html','Обучение ИИ'],['publications.html','Публикации'],['grants-teams.html','Гранты и команды'],['conferences.html','Конференции'],['join.html','Вступить в институт'],['knowledge-base.html','База знаний'],['scientific-supervision.html','Научное руководство'],['contacts-partners.html','Контакты и партнёрства']
    ].concat(EXTRA_PAGES.slice(0, 6));
    const serviceLinks = [
      ['how-we-work.html','Как мы работаем'],['ethics-code.html','Этический кодекс'],['privacy-policy.html','Политика конфиденциальности'],['cooperation-terms.html','Условия взаимодействия'],['speeches-lectures.html','Выступления и лекции'],['accounts.html','Личный кабинет'],['account-author.html','Кабинет автора'],['account-student.html','Кабинет студента'],['account-supervisor.html','Кабинет научного руководителя'],['application-success.html','Заявка отправлена'],['audit-request.html','Аудит проекта']
    ].concat(EXTRA_PAGES.slice(6));
    function renderLinks(target, links) {
      if (!target) return;
      target.innerHTML = links.map(function (entry) {
        var active = entry[0] === page ? 'background:#afefdd;color:#00201a;font-weight:700;' : 'color:#e9f5f1;';
        return '<a href="' + entry[0] + '" style="display:block;padding:8px 10px;border-radius:10px;text-decoration:none;font:12px/1.35 Manrope,sans-serif;transition:background .2s ease,color .2s ease;' + active + '">' + entry[1] + '</a>';
      }).join('');
    }
    renderLinks(sections[0], mainLinks);
    renderLinks(sections[1], serviceLinks);
  }

  function extendTopNav() {
    const navs = document.querySelectorAll('nav');
    navs.forEach((nav) => {
      if (nav.dataset.miiiipsExtended === '1') return;
      const anchors = Array.from(nav.querySelectorAll('a[href]'));
      if (!anchors.length) return;
      if (anchors.some((a) => a.getAttribute('href') === 'course-ei.html')) {
        nav.dataset.miiiipsExtended = '1';
        return;
      }
      const course = document.createElement('a');
      course.href = 'course-ei.html';
      course.textContent = 'Курс ЭИ';
      const news = document.createElement('a');
      news.href = 'news-feed.html';
      news.textContent = 'Новости';
      [course, news].forEach((a) => {
        a.className = anchors[0].className || '';
        if ((page === a.getAttribute('href'))) a.className += ' active';
      });
      const navContainer = anchors[0].parentElement;
      if (navContainer) {
        navContainer.appendChild(course);
        navContainer.appendChild(news);
      }
      nav.dataset.miiiipsExtended = '1';
    });
  }

  function guessFormType() {
    if (page === 'join.html') return 'join_application';
    if (page === 'contacts-partners.html') return 'partnership_request';
    if (page === 'audit-request.html') return 'audit_request';
    if (page.indexOf('course-ei') === 0) return 'course_enrollment';
    return 'generic_form';
  }

  function ensureField(form, selector, name) {
    const node = form.querySelector(selector);
    if (node && !node.name) node.name = name;
    return node;
  }

  function prepareKnownForms() {
    document.querySelectorAll('form').forEach((form) => {
      if (!form.dataset.miiiipsPrepared) {
        form.dataset.miiiipsPrepared = '1';
        form.dataset.miiiipsForm = form.dataset.miiiipsForm || guessFormType();
      }
    });

    if (page === 'join.html') {
      const form = document.querySelector('form');
      if (form) {
        ensureField(form, 'input[type="text"]', 'name');
        const textInputs = form.querySelectorAll('input[type="text"]');
        if (textInputs[1] && !textInputs[1].name) textInputs[1].name = 'organization';
        const email = ensureField(form, 'input[type="email"]', 'email');
        const select = ensureField(form, 'select', 'role');
        const profileInputs = form.querySelectorAll('input[type="text"]');
        if (profileInputs[2] && !profileInputs[2].name) profileInputs[2].name = 'interest';
        const textarea = ensureField(form, 'textarea', 'message');
        const checkbox = form.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.name) checkbox.name = 'consent';
        if (email) email.required = true;
        if (textarea) textarea.required = true;
        if (select) select.insertAdjacentHTML('beforeend', '<option>Соискатель</option><option>Студент / слушатель</option><option>Автор</option>');
      }
    }

    if (page === 'contacts-partners.html') {
      const form = document.querySelector('form');
      if (form) {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"]');
        if (inputs[0] && !inputs[0].name) inputs[0].name = 'name';
        if (inputs[1] && !inputs[1].name) inputs[1].name = 'organization';
        if (inputs[2] && !inputs[2].name) inputs[2].name = 'email';
        const select = ensureField(form, 'select', 'interest');
        const textarea = ensureField(form, 'textarea', 'message');
        form.dataset.miiiipsForm = 'partnership_request';
        if (select && !select.querySelector('option[value="partnership"]')) {
          select.value = select.options[0] ? select.options[0].value : '';
        }
      }
    }
  }

  function injectAuditForm() {
    if (page !== 'audit-request.html' || document.getElementById('miiiips-audit-form')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const section = document.createElement('section');
    section.className = 'miiiips-injected';
    section.innerHTML = [
      '<div class="miiiips-kicker">Форма аудита</div>',
      '<div class="miiiips-simple-form" id="miiiips-audit-form-wrap">',
      '<form id="miiiips-audit-form" data-miiiips-form="audit_request">',
      '<label>Имя и фамилия<input name="name" placeholder="Как к вам обращаться" required></label>',
      '<label>Email<input name="email" type="email" placeholder="name@email.ru" required></label>',
      '<label>Организация / проект<input name="organization" placeholder="Институт, команда, проект"></label>',
      '<label>Тип запроса<select name="interest"><option>Аудит исследовательской идеи</option><option>Аудит публикационного маршрута</option><option>Аудит грантового контура</option><option>Аудит образовательной программы</option></select></label>',
      '<label>Что нужно проверить<textarea name="message" rows="6" placeholder="Опишите проект, стадию, материалы и ожидаемый результат." required></textarea></label>',
      '<div class="miiiips-actions"><button class="miiiips-btn" type="submit">Отправить запрос</button><a class="miiiips-btn secondary" href="assets/docs/miiiips_audit_report_demo.pdf">Посмотреть demo-отчёт</a></div>',
      '<div class="miiiips-form-status" data-form-status></div>',
      '</form>',
      '</div>'
    ].join('');
    main.appendChild(section);
  }

  function injectHomepageExtras(data) {
    if (page !== 'index.html' || document.getElementById('miiiips-home-extras')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const section = document.createElement('section');
    section.id = 'miiiips-home-extras';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Новые интеграции</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Курс эмоционального интеллекта</h3><p>Полноценный образовательный маршрут с каталогом программ, лекциями, библиотекой и кабинетом слушателя.</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei.html">Открыть курс</a></div></article><article class="miiiips-card"><h3>Новости и сигналы</h3><p>Гранты, публикации, лекции и события собираются в единую ленту обновлений.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="news-feed.html">Открыть ленту</a></div></article><article class="miiiips-card"><h3>Роли и кабинеты</h3><p>Автор, студент, научный руководитель, редактор и координатор получают отдельные сценарии работы.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="accounts.html">Перейти в кабинеты</a></div></article></div>';
    main.appendChild(section);
  }

  function injectEducationExtras() {
    if (page !== 'education-ai.html' || document.getElementById('miiiips-education-extras')) return;
    const target = document.querySelector('main');
    if (!target) return;
    const section = document.createElement('section');
    section.id = 'miiiips-education-extras';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Образовательный контур</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Курс ЭИ как часть института</h3><p>Мы встроили отдельный курс эмоционального интеллекта с витриной, программой, лекциями и библиотекой.</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei.html">Курс ЭИ</a></div></article><article class="miiiips-card"><h3>Каталог программ</h3><p>Сценарий будущих платных и открытых программ: интенсивы, методички, лекции и корпоративные форматы.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="course-ei-catalog.html">Каталог</a></div></article><article class="miiiips-card"><h3>YouTube и лекции</h3><p>Открытые лекции выводятся как отдельный медиаконтур сайта.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="course-ei-lectures.html">Лекции</a></div></article></div>';
    target.appendChild(section);
  }

  function injectKnowledgeExtras(data) {
    if (page !== 'knowledge-base.html' || document.getElementById('miiiips-doc-grid')) return;
    const target = document.querySelector('main');
    if (!target) return;
    const docs = (data.documents || []).map((doc) => '<article class="miiiips-card"><h3>' + doc.title + '</h3><p>Документ доступен для скачивания прямо из прототипа.</p><div class="miiiips-actions"><a class="miiiips-btn" href="' + doc.file + '">Скачать PDF</a></div></article>').join('');
    const section = document.createElement('section');
    section.id = 'miiiips-doc-grid';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Документы и маршруты</div><div class="miiiips-grid">' + docs + '</div>';
    target.appendChild(section);
  }

  function injectPublicationExtras(data) {
    if (page !== 'publications.html' || document.getElementById('miiiips-publication-extras')) return;
    const target = document.querySelector('main');
    if (!target) return;
    const demo = data.authorDemo || {};
    const section = document.createElement('section');
    section.id = 'miiiips-publication-extras';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Кабинет автора и эксперта</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Авторский маршрут</h3><p><strong>' + (demo.name || 'Татьяна Мунн') + '</strong><br>Материал: ' + (demo.article || 'Публикационный кейс') + '<br>Статус: ' + (demo.status || 'manual_gate') + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="account-author.html">Кабинет автора</a></div></article><article class="miiiips-card"><h3>Экспертный контроль</h3><p>Редактор/эксперт видит пакет автора, требования журнала, комментарии и состояние ручной проверки.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="account-editor.html">Кабинет редактора</a></div></article><article class="miiiips-card"><h3>Документы маршрута</h3><p>Маршрут публикации, требования и демо-отчёт доступны как реальные скачивания.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="assets/docs/miiiips_publication_route.pdf">Скачать маршрут</a></div></article></div>';
    target.appendChild(section);
  }

  function injectGrantExtras(data) {
    if (page !== 'grants-teams.html' || document.getElementById('miiiips-grants-extras')) return;
    const target = document.querySelector('main');
    if (!target) return;
    const grant = data.grantDemo || {};
    const section = document.createElement('section');
    section.id = 'miiiips-grants-extras';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Координационный контур</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Грантовый сигнал</h3><p><strong>' + (grant.program || 'Грантовый трек') + '</strong><br>Дедлайн: ' + (grant.deadline || '—') + '<br>Статус: ' + (grant.status || '—') + '</p></article><article class="miiiips-card"><h3>Кабинет координатора</h3><p>Заявки с сайта, дедлайны, digest и маршрутизация участников сходятся в одной роли.</p><div class="miiiips-actions"><a class="miiiips-btn" href="account-coordinator.html">Открыть кабинет</a></div></article><article class="miiiips-card"><h3>Грантовый бриф</h3><p>Демонстрационный документ позволяет проверить пользовательский сценарий скачивания.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="assets/docs/miiiips_grants_brief.pdf">Скачать PDF</a></div></article></div>';
    target.appendChild(section);
  }



  function injectActionForms() {
    const target = document.querySelector('main');
    if (!target) return;
    if (page === 'publications.html' && !document.getElementById('miiiips-publication-form')) {
      const section = document.createElement('section');
      section.className = 'miiiips-injected';
      section.innerHTML = '<div class="miiiips-kicker">Запрос на публикационное сопровождение</div><form id="miiiips-publication-form" class="miiiips-simple-form" data-miiiips-form="publication_support"><label>Имя и фамилия<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Организация<input name="organization"></label><label>Направление<select name="interest"><option>Статья</option><option>Монография</option><option>Редактура / доработка</option><option>Маршрут журнала</option></select></label><label>Комментарий<textarea name="message" rows="5" placeholder="Опишите стадию материала и что нужно проверить."></textarea></label><input type="hidden" name="role" value="Автор"><div class="miiiips-actions"><button class="miiiips-btn" type="submit">Отправить запрос</button><a class="miiiips-btn secondary" href="account-author.html">Кабинет автора</a></div><div class="miiiips-form-status" data-form-status></div></form>';
      target.appendChild(section);
    }
    if (page === 'grants-teams.html' && !document.getElementById('miiiips-grant-form')) {
      const section = document.createElement('section');
      section.className = 'miiiips-injected';
      section.innerHTML = '<div class="miiiips-kicker">Заявка на участие в грантовом контуре</div><form id="miiiips-grant-form" class="miiiips-simple-form" data-miiiips-form="grant_participation"><label>Имя и фамилия<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Организация<input name="organization"></label><label>Интерес<select name="interest"><option>Подбор гранта</option><option>Войти в команду</option><option>Собственный проект</option><option>Консультация по заявке</option></select></label><label>Описание<textarea name="message" rows="5" placeholder="Опишите тему, стадию, дедлайн или желаемую роль."></textarea></label><input type="hidden" name="role" value="Участник грантового контура"><div class="miiiips-actions"><button class="miiiips-btn" type="submit">Подать грантовую заявку</button><a class="miiiips-btn secondary" href="account-coordinator.html">Кабинет координатора</a></div><div class="miiiips-form-status" data-form-status></div></form>';
      target.appendChild(section);
    }
    if ((page === 'speeches-lectures.html' || page === 'course-ei-lectures.html' || page === 'conferences.html') && !document.getElementById('miiiips-lecture-form')) {
      const section = document.createElement('section');
      section.className = 'miiiips-injected';
      section.innerHTML = '<div class="miiiips-kicker">Запись на лекцию / мероприятие</div><form id="miiiips-lecture-form" class="miiiips-simple-form" data-miiiips-form="event_signup"><label>Имя и фамилия<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Формат<select name="interest"><option>Открытая лекция</option><option>Закрытая встреча</option><option>Пригласить спикера</option><option>Конференция / секция</option></select></label><label>Комментарий<textarea name="message" rows="5" placeholder="Опишите событие, тему или вопрос по участию."></textarea></label><input type="hidden" name="role" value="Участник события"><div class="miiiips-actions"><button class="miiiips-btn" type="submit">Оставить заявку</button><a class="miiiips-btn secondary" href="news-feed.html">Смотреть ленту событий</a></div><div class="miiiips-form-status" data-form-status></div></form>';
      target.appendChild(section);
    }
  }

  function injectCourseEnrollmentForm() {
    if ((page !== 'course-ei-program.html' && page !== 'course-ei.html') || document.getElementById('miiiips-course-form')) return;
    const target = document.querySelector('main');
    if (!target) return;
    const section = document.createElement('section');
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Запись на программу</div><form id="miiiips-course-form" class="miiiips-simple-form" data-miiiips-form="course_enrollment"><label>Имя и фамилия<input name="name" placeholder="Как к вам обращаться" required></label><label>Email<input name="email" type="email" placeholder="name@email.ru" required></label><label>Организация / роль<input name="organization" placeholder="Вуз, компания, сообщество"></label><label>Формат участия<select name="interest"><option>Интенсив по переговорам</option><option>Исследовательский трек</option><option>Открытые лекции</option><option>Корпоративный формат</option></select></label><label>Комментарий<textarea name="message" rows="5" placeholder="Опишите цель участия, ожидания и удобный формат."></textarea></label><input type="hidden" name="role" value="Студент / слушатель"><div class="miiiips-actions"><button class="miiiips-btn" type="submit">Записаться на программу</button><a class="miiiips-btn secondary" href="assets/docs/miiiips_ei_course_program.pdf">Скачать программу</a></div><div class="miiiips-form-status" data-form-status></div></form>';
    target.appendChild(section);
  }

  function injectAccountsExtras() {
    if (page !== 'accounts.html' || document.getElementById('miiiips-accounts-extra')) return;
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.id = 'miiiips-accounts-extra';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Тестовый доступ</div><div class="miiiips-card"><h3>Демо-доступ к кабинетам</h3><p>Для всей прототипной роли используется единый пароль <strong>' + DEMO_PASSWORD + '</strong>. Это упрощённый сценарий до настоящей авторизации.</p><div class="miiiips-role-grid"><div class="miiiips-role-card"><h3>Автор</h3><p>Публикации, журналы, статусы, документы.</p><div class="miiiips-actions"><a class="miiiips-btn" data-role-login="author" href="account-author.html">Войти как автор</a></div></div><div class="miiiips-role-card"><h3>Студент</h3><p>Курс ЭИ, лекции, библиотека и задания.</p><div class="miiiips-actions"><a class="miiiips-btn" data-role-login="student" href="account-student.html">Войти как студент</a></div></div><div class="miiiips-role-card"><h3>Научный руководитель</h3><p>Работа с соискателями, review doc, changelog.</p><div class="miiiips-actions"><a class="miiiips-btn" data-role-login="supervisor" href="account-supervisor.html">Войти как научрук</a></div></div><div class="miiiips-role-card"><h3>Редактор</h3><p>Manual gate, needs fix, ready queue.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" data-role-login="editor" href="account-editor.html">Войти как редактор</a></div></div><div class="miiiips-role-card"><h3>Координатор</h3><p>Гранты, заявки, лента, маршрутизация.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" data-role-login="coordinator" href="account-coordinator.html">Войти как координатор</a></div></div></div></div>';
    target.appendChild(section);
  }

  function enhanceSuccessPage() {
    if (page !== 'application-success.html') return;
    const params = new URLSearchParams(location.search);
    const flow = params.get('flow');
    const text = flow === 'payment_demo'
      ? 'Маршрут demo-оплаты пройден. Следующий шаг — письмо, заявка и запись в таблицу.'
      : 'Форма принята. В локальном API сценарии данные также пишутся в Google Sheets и уведомительный email.';
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-card"><div class="miiiips-kicker">Подтверждение</div><h3>Что происходит дальше</h3><p>' + text + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="news-feed.html">Посмотреть ленту</a><a class="miiiips-btn secondary" href="accounts.html">Открыть кабинеты</a></div></div>';
    target.appendChild(section);
  }

  function renderNews(data) {
    if (page !== 'news-feed.html') return;
    const grid = document.getElementById('news-feed-grid');
    if (!grid) return;
    const items = (data.news || []).map((item) => '<article class="miiiips-news-item"><div class="miiiips-kicker">' + item.type + ' · ' + item.date + '</div><h3>' + item.title + '</h3><p>' + item.summary + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="' + item.link + '">Открыть материал</a></div></article>').join('');
    grid.className = 'miiiips-news-list';
    grid.innerHTML = items || '<article class="miiiips-news-item"><h3>Лента пока пуста</h3><p>Когда подключим Sheets и Browser MCP, эта страница станет опорной для автоматических сценариев.</p></article>';
  }

  function renderLectures(data) {
    if (page !== 'course-ei-lectures.html') return;
    const grid = document.getElementById('course-ei-lecture-grid');
    if (!grid) return;
    const items = (data.videos || []).map((video) => '<article class="miiiips-card"><div class="miiiips-kicker">' + video.channel + ' · ' + video.duration + '</div><h3>' + video.title + '</h3><div class="miiiips-embed"><iframe src="' + video.embed + '" allowfullscreen loading="lazy"></iframe></div><p style="margin-top:12px;">' + (video.tags || []).join(' · ') + '</p></article>').join('');
    grid.innerHTML = items || grid.innerHTML;
  }

  function promptRoleLogin(event) {
    const link = event.currentTarget;
    const role = link.getAttribute('data-role-login') || 'participant';
    const password = window.prompt('Введите тестовый пароль для роли "' + role + '"', DEMO_PASSWORD);
    if (password === null) {
      event.preventDefault();
      return;
    }
    if (password !== DEMO_PASSWORD) {
      event.preventDefault();
      toast('Пароль не подошёл. Для демонстрации используйте: ' + DEMO_PASSWORD);
      return;
    }
    sessionStorage.setItem('miiiips-role', role);
    toast('Доступ подтверждён: ' + role + '.');
  }

  function wireRoleButtons() {
    document.querySelectorAll('[data-role-login]').forEach((node) => {
      node.addEventListener('click', promptRoleLogin);
    });
  }

  function serializeForm(form) {
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((value, key) => {
      if (payload[key] !== undefined) {
        if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
        payload[key].push(value);
      } else {
        payload[key] = value;
      }
    });
    payload.formType = form.dataset.miiiipsForm || guessFormType();
    payload.sourcePage = page;
    if (!payload.role && payload.formType === 'join_application') payload.role = form.querySelector('[name="role"]') ? form.querySelector('[name="role"]').value : 'Соискатель';
    return payload;
  }

  async function submitForm(form) {
    const statusNode = form.querySelector('[data-form-status]') || document.createElement('div');
    if (!statusNode.parentNode) {
      statusNode.setAttribute('data-form-status', '1');
      statusNode.className = 'miiiips-form-status';
      form.appendChild(statusNode);
    }
    const payload = serializeForm(form);
    statusNode.textContent = 'Отправляем данные...';
    try {
      const response = await fetch(apiBase + '/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('bad form response');
      const result = await response.json();
      sessionStorage.setItem('miiiips-last-form', JSON.stringify(result));
      statusNode.textContent = 'Заявка отправлена: таблица и email-маршрут сработали.';
      const target = payload.formType === 'course_enrollment' ? 'application-success.html?flow=course' : 'application-success.html';
      setTimeout(function () { window.location.href = target; }, 600);
    } catch (error) {
      const queued = JSON.parse(localStorage.getItem('miiiips-form-queue') || '[]');
      queued.push({ createdAt: new Date().toISOString(), payload: payload });
      localStorage.setItem('miiiips-form-queue', JSON.stringify(queued));
      statusNode.textContent = 'Локальный API недоступен. Заявка сохранена в демо-очередь браузера.';
      toast('API сейчас недоступен, но сценарий не потерян: заявка записана в локальную очередь.');
      setTimeout(function () { window.location.href = 'application-success.html'; }, 800);
    }
  }

  function wireForms() {
    document.querySelectorAll('form').forEach((form) => {
      if (form.dataset.miiiipsBound === '1') return;
      form.dataset.miiiipsBound = '1';
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitForm(form);
      });
      form.querySelectorAll('button').forEach((button) => {
        if ((button.textContent || '').trim() === 'Отправить анкету' || (button.textContent || '').trim() === 'Отправить запрос') {
          button.type = 'submit';
          button.onclick = null;
        }
      });
    });
  }

  function wireNewsletter() {
    document.querySelectorAll('input[type="email"]').forEach((input) => {
      const wrapper = input.closest('div');
      if (!wrapper) return;
      const arrow = wrapper.querySelector('.material-symbols-outlined');
      if (!arrow || arrow.dataset.miiiipsNewsletter === '1') return;
      if ((input.placeholder || '').toLowerCase() !== 'email') return;
      arrow.dataset.miiiipsNewsletter = '1';
      arrow.style.cursor = 'pointer';
      arrow.addEventListener('click', function () {
        const email = (input.value || '').trim();
        if (!email) {
          toast('Введите email, чтобы добавить подписку в маршрут новостей.');
          return;
        }
        localStorage.setItem('miiiips-newsletter-email', email);
        toast('Подписка сохранена в демо-режиме: ' + email);
      });
    });
  }

  function wireGenericButtons() {
    document.querySelectorAll('button').forEach((button) => {
      const text = (button.textContent || '').trim();
      if (text === 'Вход для участников' && !button.dataset.miiiipsLogin) {
        button.dataset.miiiipsLogin = '1';
        button.addEventListener('click', function () {
          window.location.href = 'accounts.html';
        });
      }
      if (text === 'Открыть карту мира' || text === 'Открыть карту') {
        button.addEventListener('click', function () {
          window.location.href = 'contacts-partners.html';
        });
      }
    });
  }

  function updateContactEmails() {
    document.querySelectorAll('*').forEach((node) => {
      if (node.children.length) return;
      const text = (node.textContent || '').trim();
      if (text === 'registry@miiiips.edu') {
        node.textContent = 'hello@miiiips.local';
      }
    });
  }

  async function init() {
    ensureGlobalStyles();
    ensurePageMapExists();
    extendPageMap();
    extendTopNav();
    wireDownloads();
    prepareKnownForms();
    injectAuditForm();
    const data = await loadSiteData();
    injectHomepageExtras(data);
    injectEducationExtras();
    injectKnowledgeExtras(data);
    injectPublicationExtras(data);
    injectGrantExtras(data);
    injectAccountsExtras();
    injectCourseEnrollmentForm();
    injectActionForms();
    renderNews(data);
    renderLectures(data);
    enhanceSuccessPage();
    wireRoleButtons();
    wireForms();
    wireNewsletter();
    wireGenericButtons();
    updateContactEmails();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

