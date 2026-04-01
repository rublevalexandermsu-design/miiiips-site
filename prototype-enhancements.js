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
    'Требования к публикациям': 'assets/docs/miiiips_publication_route.pdf',
    'Программа курса': 'assets/docs/miiiips_ei_course_program.pdf',
    'Путь публикации': 'assets/docs/miiiips_publication_route.pdf',
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
    ['biomechanics-rowing.html', 'Биомеханика и гребля'],
    ['event-bandits.html', 'Семинар: бандиты'],
    ['event-parkgorkogo.html', 'Лекция в Парке Горького'],
    ['event-gelendzhik.html', 'Геленджик: маршрут'],
    ['event-registration.html', 'Регистрация на событие'],
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
      '.miiiips-top-nav-extra{display:flex;gap:18px;flex-wrap:wrap;align-items:center;}',
      '.miiiips-mobile-dock{display:none;}',
      '.miiiips-mobile-sheet{display:none;}',
      '.miiiips-mobile-sheet.open{display:block;}',
      '.miiiips-mobile-sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10020;}',
      '.miiiips-mobile-sheet-panel{position:fixed;left:0;right:0;bottom:0;z-index:10021;background:#00342b;color:#fff;border-radius:18px 18px 0 0;padding:18px 18px 26px;max-height:72vh;overflow:auto;box-shadow:0 -10px 30px rgba(0,0,0,.22);}',
      '.miiiips-mobile-sheet-panel h3{font:700 24px/1.1 Newsreader,serif;margin:0 0 14px;color:#fff;}',
      '.miiiips-mobile-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.miiiips-mobile-grid a{display:block;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;padding:12px 12px;border-radius:12px;font:600 13px/1.35 Manrope,sans-serif;}',
      '@media (max-width: 900px){nav{overflow-x:auto;-webkit-overflow-scrolling:touch;}nav::-webkit-scrollbar{display:none;}nav a{white-space:nowrap;}#codex-page-map{left:12px !important;bottom:82px !important;}#codex-page-map-panel{width:min(92vw,340px) !important;max-height:66vh !important;} .miiiips-injected{padding:28px 16px 0;} .miiiips-card{padding:18px;} .miiiips-card h3,.miiiips-news-item h3{font-size:24px;} .miiiips-simple-form{padding:16px;} .miiiips-news-list,.miiiips-role-grid,.miiiips-grid,.miiiips-mobile-grid{grid-template-columns:1fr !important;} .miiiips-actions{flex-direction:column;align-items:stretch;} .miiiips-actions .miiiips-btn,.miiiips-actions .miiiips-btn.secondary{width:100%;justify-content:center;} .miiiips-mobile-dock{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:10010;background:#00342b;border-radius:18px;padding:8px;gap:8px;box-shadow:0 12px 30px rgba(0,0,0,.22);} .miiiips-mobile-dock a,.miiiips-mobile-dock button{flex:1;min-width:0;background:transparent;border:none;color:#fff;padding:10px 8px;border-radius:12px;font:700 11px/1.2 \"Public Sans\",sans-serif;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;cursor:pointer;} .miiiips-mobile-dock a.active,.miiiips-mobile-dock button.active{background:#afefdd;color:#00201a;} body{padding-bottom:86px !important;}}'
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
    root.innerHTML = '<button aria-expanded="false" id="codex-page-map-toggle" style="display:flex;align-items:center;gap:8px;background:#00342b;color:#fff;border:none;border-radius:999px;padding:10px 14px;box-shadow:0 10px 24px rgba(0,0,0,.18);cursor:pointer;font:700 13px/1.2 Manrope,sans-serif;" type="button"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#afefdd;"></span>Карта страниц</button><div id="codex-page-map-panel" style="display:none;margin-top:10px;width:320px;max-height:74vh;overflow:auto;background:#00342b;color:#ffffff;padding:12px;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08);"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;"><div style="font:700 13px/1.4 Manrope,sans-serif;">Разделы сайта</div><button id="codex-page-map-close" style="background:transparent;color:#fff;border:none;cursor:pointer;font:700 18px/1 Manrope,sans-serif;opacity:.8;" type="button">×</button></div><div style="font:12px/1.4 Manrope,sans-serif;opacity:.8;margin-bottom:10px;">Основные страницы: 20 | Служебные и кабинеты: 18</div><div style="font:700 11px/1.3 Manrope,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:10px 0 6px;">Основной сайт</div><div style="display:grid;gap:4px;"></div><div style="font:700 11px/1.3 Manrope,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:12px 0 6px;">Служебные страницы и кабинеты</div><div style="display:grid;gap:4px;"></div></div>';
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
    if (summary) summary.textContent = 'Основные страницы: 20 | Служебные и кабинеты: 18';
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
      const hrefs = anchors.map((a) => (a.getAttribute('href') || '').toLowerCase());
      const isPrimarySiteNav = hrefs.some((href) => [
        'index.html',
        'research.html',
        'education-ai.html',
        'publications.html',
        'grants-teams.html',
        'conferences.html',
        'join.html'
      ].includes(href));
      if (!isPrimarySiteNav) return;
      if (anchors.some((a) => a.getAttribute('href') === 'course-ei.html') &&
          anchors.some((a) => a.getAttribute('href') === 'speeches-lectures.html') &&
          anchors.some((a) => a.getAttribute('href') === 'news-feed.html')) {
        nav.dataset.miiiipsExtended = '1';
        return;
      }
      const extraLinks = [
        ['course-ei.html', 'Курс ЭИ'],
        ['speeches-lectures.html', 'Выступления'],
        ['news-feed.html', 'Новости']
      ].filter(function (entry) {
        return !hrefs.includes(entry[0]);
      }).map(function (entry) {
        const link = document.createElement('a');
        link.href = entry[0];
        link.textContent = entry[1];
        return link;
      });
      extraLinks.forEach((a) => {
        a.className = anchors[0].className || '';
        if (page === a.getAttribute('href')) {
          a.className += ' active';
          if (!a.className.includes('border-b-2')) {
            a.style.borderBottom = '2px solid #7d5700';
            a.style.paddingBottom = '4px';
            a.style.color = '#004d40';
          }
        }
      });
      const navContainer = nav;
      if (navContainer) {
        extraLinks.forEach(function (link) {
          navContainer.appendChild(link);
        });
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
    section.innerHTML = '<div class="miiiips-kicker">Образовательный контур</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Курс ЭИ как часть института</h3><p>Мы встроили отдельный курс эмоционального интеллекта с витриной, программой, лекциями и библиотекой.</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei.html">Курс ЭИ</a></div></article><article class="miiiips-card"><h3>Каталог программ</h3><p>Сценарий будущих платных и открытых программ: интенсивы, методички, лекции и корпоративные форматы.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="course-ei-catalog.html">Каталог</a></div></article><article class="miiiips-card"><h3>YouTube и лекции</h3><p>Открытые лекции выводятся как отдельный медиараздел сайта.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="course-ei-lectures.html">Лекции</a></div></article></div>';
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
    section.innerHTML = '<div class="miiiips-kicker">Кабинет автора и эксперта</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Авторский маршрут</h3><p><strong>' + (demo.name || 'Татьяна Мунн') + '</strong><br>Материал: ' + (demo.article || 'Публикационный кейс') + '<br>Статус: ' + (demo.status || 'manual_gate') + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="account-author.html">Кабинет автора</a></div></article><article class="miiiips-card"><h3>Экспертный контроль</h3><p>Редактор/эксперт видит пакет автора, требования журнала, комментарии и состояние ручной проверки.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="account-editor.html">Кабинет редактора</a></div></article><article class="miiiips-card"><h3>Документы маршрута</h3><p>Путь публикации, требования и демо-отчёт доступны как реальные скачивания.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="assets/docs/miiiips_publication_route.pdf">Скачать маршрут</a></div></article></div>';
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
    section.innerHTML = '<div class="miiiips-kicker">Координация</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Грантовый сигнал</h3><p><strong>' + (grant.program || 'Грантовый трек') + '</strong><br>Дедлайн: ' + (grant.deadline || '—') + '<br>Статус: ' + (grant.status || '—') + '</p></article><article class="miiiips-card"><h3>Кабинет координатора</h3><p>Заявки с сайта, дедлайны, digest и маршрутизация участников сходятся в одной роли.</p><div class="miiiips-actions"><a class="miiiips-btn" href="account-coordinator.html">Открыть кабинет</a></div></article><article class="miiiips-card"><h3>Грантовый бриф</h3><p>Демонстрационный документ позволяет проверить пользовательский сценарий скачивания.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="assets/docs/miiiips_grants_brief.pdf">Скачать PDF</a></div></article></div>';
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
    if ((page === 'speeches-lectures.html' || page === 'course-ei-lectures.html') && !document.getElementById('miiiips-lecture-form')) {
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

  function injectCourseCatalogExtras(data) {
    if (page !== 'course-ei-catalog.html' || document.getElementById('miiiips-course-catalog-extra')) return;
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.id = 'miiiips-course-catalog-extra';
    section.className = 'miiiips-injected';
    const courses = (data.courses || []).map(function (course) {
      return '<article class="miiiips-card"><div class="miiiips-kicker">' + course.format + '</div><h3>' + course.title + '</h3><p>' + course.summary + '</p><p class="miiiips-note" style="margin-top:10px;">' + course.duration + ' · ' + course.audience + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei-program.html">Открыть маршрут</a><a class="miiiips-btn secondary" href="course-ei-library.html">Материалы</a></div></article>';
    }).join('');
    section.innerHTML = '<div class="miiiips-kicker">Каталог и форматы участия</div><div class="miiiips-grid">' + courses + '</div><div class="miiiips-card" style="margin-top:18px;"><h3>Как устроен вход в курс</h3><div class="miiiips-grid"><div><strong>1. Выбор формата</strong><p>Открытые лекции, практический интенсив, исследовательский трек или корпоративный модуль.</p></div><div><strong>2. Заявка</strong><p>Форма сразу попадает в Google Sheets и дублируется на email для быстрой координации.</p></div><div><strong>3. Кабинет слушателя</strong><p>После подтверждения маршрут продолжается в кабинете: материалы, дедлайны, лекции и рекомендации.</p></div></div></div>';
    target.appendChild(section);
  }

  function injectCourseLibraryExtras(data) {
    if (page !== 'course-ei-library.html' || document.getElementById('miiiips-course-library-extra')) return;
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.id = 'miiiips-course-library-extra';
    section.className = 'miiiips-injected';
    const docs = (data.documents || []).slice(0, 4).map(function (doc) {
      return '<article class="miiiips-card"><div class="miiiips-kicker">' + (doc.type || 'Материал') + '</div><h3>' + doc.title + '</h3><p>' + doc.summary + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="' + doc.link + '">Открыть документ</a></div></article>';
    }).join('');
    section.innerHTML = '<div class="miiiips-kicker">Библиотека материалов</div><div class="miiiips-grid">' + docs + '</div><div class="miiiips-card" style="margin-top:18px;"><h3>Что получает слушатель</h3><div class="miiiips-grid"><div><strong>Методички</strong><p>Короткие рабочие PDF для самостоятельной практики и фиксации прогресса.</p></div><div><strong>Чек-листы</strong><p>Материалы для переговоров, эмоциональной саморегуляции и взаимодействия в команде.</p></div><div><strong>Материалы лекций</strong><p>Слайды, конспекты, дополнительные ссылки и маршруты для повторения.</p></div></div></div>';
    target.appendChild(section);
  }

  function injectStudentCabinetExtras() {
    if (page !== 'account-student.html' || document.getElementById('miiiips-student-extra')) return;
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.id = 'miiiips-student-extra';
    section.className = 'miiiips-injected';
    section.innerHTML = '<div class="miiiips-kicker">Следующие шаги слушателя</div><div class="miiiips-grid"><article class="miiiips-card"><h3>Ближайшее событие</h3><p>Открытая лекция по эмоциональной устойчивости в переговорах и подготовке к публичным выступлениям.</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei-lectures.html">Открыть лекции</a></div></article><article class="miiiips-card"><h3>Материалы недели</h3><p>Подборка документов и рабочих тетрадей для самостоятельной практики внутри кабинета.</p><div class="miiiips-actions"><a class="miiiips-btn secondary" href="course-ei-library.html">Открыть библиотеку</a></div></article><article class="miiiips-card"><h3>Маршрут обучения</h3><p>Стандартный путь: лекция → практика → мини-отчёт → рекомендация по следующему модулю.</p><div class="miiiips-actions"><a class="miiiips-btn" href="course-ei-program.html">Смотреть программу</a></div></article></div>';
    target.appendChild(section);
  }

  function injectNewsFeedExtras(data) {
    if (page !== 'news-feed.html' || document.getElementById('miiiips-news-extra')) return;
    const target = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.id = 'miiiips-news-extra';
    section.className = 'miiiips-injected';
    const highlights = (data.news || []).slice(0, 3).map(function (item) {
      return '<article class="miiiips-card"><div class="miiiips-kicker">' + item.type + ' · ' + item.date + '</div><h3>' + item.title + '</h3><p>' + item.summary + '</p><div class="miiiips-actions"><a class="miiiips-btn" href="' + item.link + '">Перейти</a></div></article>';
    }).join('');
    section.innerHTML = '<div class="miiiips-kicker">Оперативная лента</div><div class="miiiips-grid">' + highlights + '</div><div class="miiiips-card" style="margin-top:18px;"><h3>Как эта лента будет работать дальше</h3><p>Сейчас лента уже живая и кликабельная. Следующий шаг — усилить её автоматической подгрузкой из Google Sheets, YouTube и публикационных/грантовых контуров института.</p></div>';
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

  async function submitInlinePayload(payload, statusNode, options) {
    const settings = options || {};
    if (statusNode) statusNode.textContent = settings.pendingText || 'Отправляем данные...';
    try {
      const response = await fetch(apiBase + '/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('bad inline response');
      const result = await response.json();
      sessionStorage.setItem('miiiips-last-form', JSON.stringify(result));
      if (statusNode) statusNode.textContent = settings.successText || 'Заявка принята. Письмо и запись в таблицу отправлены.';
      toast(settings.toastText || 'Маршрут сработал: письмо ушло, запись в таблицу добавлена.');
      return result;
    } catch (error) {
      const queued = JSON.parse(localStorage.getItem('miiiips-form-queue') || '[]');
      queued.push({ createdAt: new Date().toISOString(), payload: payload, source: 'inline' });
      localStorage.setItem('miiiips-form-queue', JSON.stringify(queued));
      if (statusNode) statusNode.textContent = settings.fallbackText || 'API временно недоступен. Данные сохранены в локальную очередь.';
      toast('Сайт сохранил сценарий локально: как только API снова будет доступен, маршрут можно повторить.');
      return null;
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

  function ensureInlineStatus(host) {
    let statusNode = host.querySelector('[data-inline-status]');
    if (!statusNode) {
      statusNode = document.createElement('div');
      statusNode.className = 'miiiips-form-status';
      statusNode.setAttribute('data-inline-status', '1');
      host.appendChild(statusNode);
    }
    return statusNode;
  }

  function buildInlinePayload(input, formType) {
    return {
      formType: formType,
      sourcePage: page,
      role: 'Подписчик',
      name: '',
      email: (input.value || '').trim(),
      organization: 'МИИИИПС сайт',
      interest: 'Новости / лекции / обновления',
      message: 'Подписка с публичной страницы сайта'
    };
  }

  function wireNewsletter() {
    const acceptable = ['email', 'электронная почта', 'ваш email'];
    document.querySelectorAll('input[type="email"]').forEach((input) => {
      if (input.closest('form')) return;
      const placeholder = (input.getAttribute('placeholder') || '').trim().toLowerCase();
      if (!acceptable.includes(placeholder)) return;
      const host = input.closest('div')?.parentElement || input.parentElement;
      if (!host) return;
      const button = host.querySelector('button') || host.querySelector('.material-symbols-outlined');
      if (!button || button.dataset.miiiipsNewsletter === '1') return;
      button.dataset.miiiipsNewsletter = '1';
      button.style.cursor = 'pointer';
      const statusNode = ensureInlineStatus(host);
      const submit = async function (event) {
        if (event) event.preventDefault();
        const email = (input.value || '').trim();
        if (!email) {
          statusNode.textContent = 'Введите email, чтобы включить подписку.';
          toast('Нужно указать email, чтобы добавить подписку.');
          return;
        }
        localStorage.setItem('miiiips-newsletter-email', email);
        await submitInlinePayload(
          buildInlinePayload(input, 'newsletter_subscription'),
          statusNode,
          {
            pendingText: 'Подключаем подписку...',
            successText: 'Подписка подключена: обновления будут приходить на email и фиксироваться в маршруте сайта.',
            fallbackText: 'Подписка сохранена локально. При следующем доступе к API можно повторить отправку.',
            toastText: 'Подписка на обновления сохранена.'
          }
        );
      };
      button.addEventListener('click', submit);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') submit(event);
      });
    });
  }

  function injectMobileDock() {
    if (document.getElementById('miiiips-mobile-dock')) return;
    const dock = document.createElement('div');
    dock.id = 'miiiips-mobile-dock';
    dock.className = 'miiiips-mobile-dock';
    const dockLinks = [
      ['index.html', 'Главная'],
      ['course-ei.html', 'Курс'],
      ['news-feed.html', 'Новости'],
      ['accounts.html', 'Кабинет']
    ];
    dock.innerHTML = dockLinks.map(function (entry) {
      const active = page === entry[0] ? 'active' : '';
      return '<a class="' + active + '" href="' + entry[0] + '">' + entry[1] + '</a>';
    }).join('') + '<button type="button" id="miiiips-mobile-menu-toggle">Меню</button>';
    document.body.appendChild(dock);

    const sheet = document.createElement('div');
    sheet.id = 'miiiips-mobile-sheet';
    sheet.className = 'miiiips-mobile-sheet';
    const menuLinks = [
      ['about.html', 'Об институте'],
      ['research.html', 'Исследования'],
      ['education-ai.html', 'Обучение ИИ'],
      ['speeches-lectures.html', 'Выступления и лекции'],
      ['publications.html', 'Публикации'],
      ['grants-teams.html', 'Гранты'],
      ['conferences.html', 'Конференции'],
      ['join.html', 'Вступить'],
      ['knowledge-base.html', 'База знаний'],
      ['scientific-supervision.html', 'Научное руководство'],
      ['contacts-partners.html', 'Контакты'],
      ['course-ei-catalog.html', 'Каталог ЭИ'],
      ['course-ei-library.html', 'Библиотека ЭИ']
    ];
    sheet.innerHTML = '<div class="miiiips-mobile-sheet-backdrop" data-mobile-sheet-close="1"></div><div class="miiiips-mobile-sheet-panel"><div class="miiiips-actions" style="justify-content:space-between;margin-top:0;margin-bottom:14px;"><h3>Разделы сайта</h3><button class="miiiips-btn secondary" type="button" data-mobile-sheet-close="1">Закрыть</button></div><div class="miiiips-mobile-grid">' + menuLinks.map(function (entry) { return '<a href="' + entry[0] + '">' + entry[1] + '</a>'; }).join('') + '</div></div>';
    document.body.appendChild(sheet);

    const toggle = document.getElementById('miiiips-mobile-menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        sheet.classList.add('open');
      });
    }
    sheet.querySelectorAll('[data-mobile-sheet-close]').forEach(function (node) {
      node.addEventListener('click', function () {
        sheet.classList.remove('open');
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
    const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const overlayExcludedPages = new Set(['event-registration.html', 'event-bandits.html', 'event-parkgorkogo.html', 'event-gelendzhik.html']);
    ensureGlobalStyles();
    extendTopNav();
    wireDownloads();
    prepareKnownForms();
    injectAuditForm();
    const data = await loadSiteData();
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


