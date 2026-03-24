(function () {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const DATA_PATH = 'assets/data/site-content.json';
  const FEEDS_PATH = 'assets/data/live-feeds.json';

  async function loadJson(path, fallback) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error('bad response');
      return await response.json();
    } catch (error) {
      return fallback;
    }
  }

  function ensureStyles() {
    if (document.getElementById('miiiips-live-layer-style')) return;
    const style = document.createElement('style');
    style.id = 'miiiips-live-layer-style';
    style.textContent = [
      '.miiiips-live-shell{max-width:1200px;margin:0 auto;padding:0 28px;}',
      '.miiiips-live-section{padding:26px 0;}',
      '.miiiips-live-section.compact{padding-top:18px;padding-bottom:18px;}',
      '.miiiips-live-kicker{display:inline-block;padding:6px 10px;border-radius:999px;background:#edf4f1;color:#004d40;font:700 11px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px;}',
      '.miiiips-live-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;}',
      '.miiiips-live-card{position:relative;background:#fff;border:1px solid #dbe3de;box-shadow:0 10px 30px rgba(0,52,43,.06);padding:22px;overflow:hidden;}',
      '.miiiips-live-card h3{margin:0 0 10px;font:700 28px/1.1 Newsreader,serif;color:#00342b;}',
      '.miiiips-live-card p{margin:0;color:#3f4945;line-height:1.65;}',
      '.miiiips-live-meta{font:700 11px/1.35 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#7d5700;margin-bottom:10px;}',
      '.miiiips-live-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;}',
      '.miiiips-live-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 15px;background:#004d40;color:#fff;text-decoration:none;border:none;border-radius:999px;font:700 12px/1.2 "Public Sans",sans-serif;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}',
      '.miiiips-live-btn.secondary{background:#fff;color:#00342b;border:1px solid #bfc9c4;}',
      '.miiiips-live-btn.ghost{background:rgba(0,77,64,.08);color:#004d40;}',
      '.miiiips-live-note{font-size:13px;color:#54645f;margin-top:8px;}',
      '.miiiips-live-ticker{position:relative;overflow:hidden;border-top:1px solid #dbe3de;border-bottom:1px solid #dbe3de;background:linear-gradient(90deg,#f3f7f5 0%,#ffffff 50%,#f3f7f5 100%);}',
      '.miiiips-live-ticker-track{display:flex;gap:28px;min-width:max-content;padding:12px 28px;animation:miiiipsTicker 64s linear infinite;}',
      '.miiiips-live-ticker-item{display:flex;gap:10px;align-items:center;color:#00342b;text-decoration:none;font:600 14px/1.4 Manrope,sans-serif;}',
      '.miiiips-live-ticker-item strong{font:700 11px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#7d5700;}',
      '.miiiips-live-ticker:hover .miiiips-live-ticker-track{animation-play-state:paused;}',
      '@keyframes miiiipsTicker{from{transform:translateX(0);}to{transform:translateX(-45%);}}',
      '.miiiips-contact-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:14px;}',
      '.miiiips-contact-tile{background:#00342b;color:#fff;padding:16px 16px 14px;border-radius:18px;text-decoration:none;display:grid;gap:6px;box-shadow:0 10px 24px rgba(0,0,0,.12);}',
      '.miiiips-contact-tile small{opacity:.72;font:700 11px/1.2 "Public Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;}',
      '.miiiips-contact-tile strong{font:700 18px/1.15 Newsreader,serif;}',
      '.miiiips-support-fab{position:fixed;right:18px;bottom:18px;z-index:10030;width:58px;height:58px;border:none;border-radius:999px;background:#004d40;color:#fff;box-shadow:0 14px 30px rgba(0,0,0,.22);cursor:pointer;font:700 13px/1 "Public Sans",sans-serif;}',
      '.miiiips-support-panel{position:fixed;right:18px;bottom:88px;z-index:10031;width:min(360px,calc(100vw - 22px));max-height:min(72vh,680px);overflow:auto;background:#fff;border:1px solid #dbe3de;box-shadow:0 16px 36px rgba(0,0,0,.22);border-radius:22px;display:none;}',
      '.miiiips-support-panel.open{display:block;}',
      '.miiiips-support-head{padding:18px 18px 14px;background:#00342b;color:#fff;border-radius:22px 22px 0 0;}',
      '.miiiips-support-head h3{margin:0 0 6px;font:700 28px/1.05 Newsreader,serif;}',
      '.miiiips-support-head p{margin:0;color:rgba(255,255,255,.78);font-size:14px;line-height:1.5;}',
      '.miiiips-support-body{padding:16px;display:grid;gap:14px;}',
      '.miiiips-support-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.miiiips-support-links a{display:block;padding:12px;border-radius:14px;background:#f2f6f4;color:#00342b;text-decoration:none;font:700 12px/1.3 "Public Sans",sans-serif;letter-spacing:.04em;text-transform:uppercase;}',
      '.miiiips-support-chip-wrap{display:flex;gap:8px;flex-wrap:wrap;}',
      '.miiiips-support-chip{padding:10px 12px;border:none;border-radius:999px;background:#edf4f1;color:#004d40;cursor:pointer;font:600 13px/1.35 Manrope,sans-serif;}',
      '.miiiips-support-answer{background:#f9fbfa;border:1px solid #dbe3de;padding:14px;border-radius:14px;color:#33413d;line-height:1.6;white-space:pre-wrap;}',
      '.miiiips-support-input{display:grid;grid-template-columns:1fr auto;gap:10px;}',
      '.miiiips-support-input input{padding:12px 14px;border:1px solid #c7d3cd;border-radius:14px;font:15px/1.4 Manrope,sans-serif;}',
      '.miiiips-support-close{position:absolute;right:14px;top:14px;border:none;background:transparent;color:#fff;font-size:22px;cursor:pointer;}',
      '.miiiips-photo-treated img,.miiiips-photo-treated [style*="background-image"]{filter:saturate(72%) contrast(1.02) brightness(.92);}',
      '.miiiips-photo-treated{position:relative;overflow:hidden;}',
      '.miiiips-photo-treated::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,77,64,.06),rgba(0,52,43,.22));pointer-events:none;mix-blend-mode:multiply;}',
      '.miiiips-media-surface{position:relative;overflow:hidden;border-radius:20px;background:#e8eeeb;}',
      '.miiiips-media-surface::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top left, rgba(175,239,221,.42), transparent 44%),linear-gradient(180deg, rgba(0,77,64,.08), rgba(0,52,43,.18));pointer-events:none;z-index:1;}',
      '.miiiips-media-surface > *{position:relative;z-index:0;}',
      '.miiiips-bullet-list{display:grid;gap:10px;margin:14px 0 0;padding:0;list-style:none;}',
      '.miiiips-bullet-list li{padding-left:18px;position:relative;color:#3f4945;line-height:1.6;}',
      '.miiiips-bullet-list li::before{content:"";position:absolute;left:0;top:.62em;width:8px;height:8px;border-radius:999px;background:#7d5700;}',
      '.miiiips-live-card iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:18px;display:block;background:#dfe7e3;}',
      '.miiiips-live-stack{display:grid;gap:14px;}',
      '@media (max-width:900px){.miiiips-live-shell{padding:0 16px;}.miiiips-live-grid,.miiiips-contact-strip,.miiiips-support-links{grid-template-columns:1fr !important;}.miiiips-live-ticker-track{gap:18px;padding:10px 16px;animation-duration:72s;}.miiiips-support-fab{right:14px;bottom:94px;}.miiiips-support-panel{right:10px;left:10px;bottom:154px;width:auto;max-height:64vh;}.miiiips-live-card{padding:18px;}.miiiips-live-card h3{font-size:24px;}.miiiips-live-section{padding:18px 0;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function safe(text) {
    return String(text || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function mainContainer() {
    return document.querySelector('main') || document.body;
  }

  function insertAfterHero(section) {
    const hero = document.querySelector('main section') || null;
    if (hero && hero.parentNode === mainContainer()) {
      hero.insertAdjacentElement('afterend', section);
    } else {
      mainContainer().prepend(section);
    }
  }

  function combineData(base, feeds) {
    return Object.assign({}, base || {}, { liveFeeds: feeds || {} });
  }

  function renderTicker(data) {
    if (!['index.html', 'news-feed.html', 'speeches-lectures.html', 'course-ei-lectures.html'].includes(page)) return;
    if (document.getElementById('miiiips-live-ticker')) return;
    const items = (data.liveFeeds && data.liveFeeds.ticker) || [];
    if (!items.length) return;
    const host = document.createElement('section');
    host.id = 'miiiips-live-ticker';
    host.className = 'miiiips-live-ticker';
    const doubled = items.concat(items).map(function (item) {
      return '<a class="miiiips-live-ticker-item" href="' + safe(item.url) + '" target="_blank" rel="noopener noreferrer"><strong>' + safe(item.source || 'Источник') + '</strong><span>' + safe(item.title) + '</span></a>';
    }).join('');
    host.innerHTML = '<div class="miiiips-live-ticker-track">' + doubled + '</div>';
    const anchor = document.querySelector('main');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(host, anchor);
    }
  }

  function contactTiles(data) {
    const contacts = data.contacts || {};
    const tiles = [];
    if (contacts.telegramChannel) tiles.push('<a class="miiiips-contact-tile" href="' + safe(contacts.telegramChannel.url) + '" target="_blank" rel="noopener noreferrer"><small>Telegram-канал</small><strong>' + safe(contacts.telegramChannel.handle) + '</strong><span>Анонсы лекций и выступлений</span></a>');
    if (contacts.telegramDirect) tiles.push('<a class="miiiips-contact-tile" href="' + safe(contacts.telegramDirect.url) + '" target="_blank" rel="noopener noreferrer"><small>Личный Telegram</small><strong>' + safe(contacts.telegramDirect.handle) + '</strong><span>Вопросы по лекциям и сотрудничеству</span></a>');
    if (contacts.whatsapp) tiles.push('<a class="miiiips-contact-tile" href="' + safe(contacts.whatsapp.url) + '" target="_blank" rel="noopener noreferrer"><small>WhatsApp</small><strong>' + safe(contacts.whatsapp.phone) + '</strong><span>Быстрый контакт и уточнение деталей</span></a>');
    if (contacts.email) tiles.push('<a class="miiiips-contact-tile" href="' + safe(contacts.email.url) + '"><small>Email</small><strong>' + safe(contacts.email.address) + '</strong><span>Письмо по программам, грантам и публикациям</span></a>');
    return tiles.join('');
  }

  function injectContactBlocks(data) {
    const pages = ['contacts-partners.html', 'join.html', 'course-ei-program.html', 'speeches-lectures.html', 'course-ei-lectures.html'];
    if (!pages.includes(page) || document.getElementById('miiiips-contact-block')) return;
    const section = document.createElement('section');
    section.id = 'miiiips-contact-block';
    section.className = 'miiiips-live-shell miiiips-live-section';
    section.innerHTML = '<div class="miiiips-live-kicker">Быстрая связь</div><div class="miiiips-live-card"><h3>Выберите удобный канал связи</h3><p>Чтобы пользователь не терялся между формой, лекцией и регистрацией, мы вынесли быстрые каналы отдельно: Telegram-канал для анонсов, личный Telegram и WhatsApp для уточнений, email — для деловой переписки.</p><div class="miiiips-contact-strip">' + contactTiles(data) + '</div></div>';
    const targetMain = mainContainer();
    const anchor = targetMain.querySelector('section:nth-of-type(2)') || targetMain.lastElementChild;
    if (anchor) anchor.insertAdjacentElement('afterend', section); else targetMain.appendChild(section);
  }

  function buildLectureCards(data) {
    const cards = [];
    (data.lectureSources || []).forEach(function (item) {
      cards.push('<article class="miiiips-live-card"><div class="miiiips-live-meta">' + safe(item.source || item.type || 'Источник') + ' · ' + safe(item.date || '') + '</div><h3>' + safe(item.title) + '</h3><p>' + safe(item.summary || '') + '</p><div class="miiiips-live-actions"><a class="miiiips-live-btn" target="_blank" rel="noopener noreferrer" href="' + safe(item.url) + '">Регистрация / открыть</a></div></article>');
    });
    return cards.join('');
  }

  function buildVideoCards(data) {
    return (data.videos || []).map(function (video) {
      return '<article class="miiiips-live-card"><div class="miiiips-live-meta">' + safe(video.channel || 'YouTube') + ' · ' + safe(video.duration || '') + '</div><h3>' + safe(video.title) + '</h3><iframe loading="lazy" src="' + safe(video.embed) + '" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="' + safe(video.title) + '"></iframe><p class="miiiips-live-note">' + safe((video.tags || []).join(' · ')) + '</p><div class="miiiips-live-actions"><a class="miiiips-live-btn secondary" target="_blank" rel="noopener noreferrer" href="' + safe(video.url || video.embed) + '">Смотреть на YouTube</a></div></article>';
    }).join('');
  }

  function renderLectureHub(data) {
    if (!['speeches-lectures.html', 'course-ei-lectures.html'].includes(page)) return;
    if (document.getElementById('miiiips-lecture-hub')) return;
    const section = document.createElement('section');
    section.id = 'miiiips-lecture-hub';
    section.className = 'miiiips-live-shell miiiips-live-section';
    const includeVideoGrid = page === 'speeches-lectures.html';
    section.innerHTML = [
      '<div class="miiiips-live-kicker">Подтверждённые публичные источники</div>',
      '<div class="miiiips-live-grid">',
      buildLectureCards(data),
      '</div>',
      '<div class="miiiips-live-card" style="margin-top:18px;">',
      '<h3>Видео и записи Татьяны Мунн</h3>',
      '<p>' + (includeVideoGrid
        ? 'Убрали случайные демо-видео и заменили блок на подтверждённые публичные записи и официальный канал.'
        : 'Здесь оставляем только подтверждённые источники и переходы: сами видео уже встроены ниже в основном блоке страницы, чтобы не дублировать YouTube.') + '</p>',
      '<div class="miiiips-live-actions">',
      '<a class="miiiips-live-btn" target="_blank" rel="noopener noreferrer" href="' + safe((data.contacts && data.contacts.youtube && data.contacts.youtube.url) || '#') + '">Открыть YouTube-канал</a>',
      '<a class="miiiips-live-btn secondary" target="_blank" rel="noopener noreferrer" href="https://moonn.ru/lectures1">Архив записей на сайте</a>',
      '</div>',
      '</div>',
      includeVideoGrid ? '<div class="miiiips-live-grid" style="margin-top:18px;">' + buildVideoCards(data) + '</div>' : ''
    ].join('');
    insertAfterHero(section);
  }

  function injectSpeechPageExtras(data) {
    if (page !== 'speeches-lectures.html' || document.getElementById('miiiips-speech-page-extra')) return;
    const section = document.createElement('section');
    section.id = 'miiiips-speech-page-extra';
    section.className = 'miiiips-live-shell miiiips-live-section compact';
    const tg = (((data.liveFeeds || {}).telegramUpdates) || []).slice(0, 2).map(function (item) { return '<li><a target="_blank" rel="noopener noreferrer" href="' + safe(item.url) + '">' + safe(item.title) + '</a></li>'; }).join('');
    section.innerHTML = '<div class="miiiips-live-card"><div class="miiiips-live-kicker">Timepad + Telegram + YouTube</div><h3>Маршрут для пользователя теперь собран в одном месте</h3><ul class="miiiips-bullet-list"><li>Сначала пользователь видит ближайшие лекции и Timepad-регистрацию.</li><li>Потом может подписаться на Telegram-канал, чтобы не пропускать анонсы.</li><li>Затем — посмотреть записи публичных выступлений и перейти на сайт Татьяны Мунн.</li></ul>' + (tg ? '<div class="miiiips-live-note" style="margin-top:12px;font-weight:700;">Последние релевантные посты Telegram</div><ul class="miiiips-bullet-list">' + tg + '</ul>' : '') + '<div class="miiiips-live-actions"><a class="miiiips-live-btn" href="contacts-partners.html">Все контакты</a><a class="miiiips-live-btn secondary" target="_blank" rel="noopener noreferrer" href="https://moonn.ru/events_tp">Смотреть расписание</a></div></div>';
    const targetMain = mainContainer();
    targetMain.appendChild(section);
  }

  function renderNewsPage(data) {
    if (page !== 'news-feed.html' || document.getElementById('miiiips-feed-columns')) return;
    const feeds = data.liveFeeds || {};
    const buildItems = function (items) {
      return (items || []).slice(0, 6).map(function (item) {
        return '<article class="miiiips-live-card"><div class="miiiips-live-meta">' + safe(item.source || 'Источник') + '</div><h3>' + safe(item.title) + '</h3><p>' + safe(item.summary || '') + '</p><div class="miiiips-live-actions"><a class="miiiips-live-btn secondary" target="_blank" rel="noopener noreferrer" href="' + safe(item.url) + '">Открыть источник</a></div></article>';
      }).join('');
    };
    const section = document.createElement('section');
    section.id = 'miiiips-feed-columns';
    section.className = 'miiiips-live-shell miiiips-live-section';
    section.innerHTML = [
      '<div class="miiiips-live-grid">',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Психология и тренды</div>', buildItems(feeds.psychologyTrends), '</div>',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Образование и регуляторика</div>', buildItems(feeds.educationPolicy), '</div>',
      '</div>',
      '<div class="miiiips-live-grid" style="margin-top:18px;">',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Конференции и события</div>', buildItems(feeds.conferenceUpdates), '</div>',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Спорт, ИИ и исследования</div>', buildItems(feeds.sportAiUpdates), '</div>',
      '</div>',
      '<div class="miiiips-live-card" style="margin-top:18px;"><div class="miiiips-live-kicker">Открытые научные публикации</div><div class="miiiips-live-grid">', buildItems(feeds.openPublications), '</div></div>',
      '<div class="miiiips-live-card" style="margin-top:18px;"><div class="miiiips-live-kicker">Новости Татьяны Мунн</div><div class="miiiips-live-grid">', buildItems(feeds.moonnUpdates), '</div></div>',
      '<div class="miiiips-live-card" style="margin-top:18px;"><div class="miiiips-live-kicker">Telegram-канал</div><div class="miiiips-live-grid">', buildItems(feeds.telegramUpdates), '</div></div>'
    ].join('');
    mainContainer().appendChild(section);
  }

  function injectSignalBlocks(data) {
    const allowedPages = ['index.html', 'social-projects.html', 'publications.html'];
    if (!allowedPages.includes(page) || document.getElementById('miiiips-signal-blocks')) return;
    const feeds = data.liveFeeds || {};
    const buildCompact = function (items) {
      return (items || []).slice(0, 3).map(function (item) {
        return '<article class="miiiips-live-card"><div class="miiiips-live-meta">' + safe(item.source || 'Источник') + '</div><h3>' + safe(item.title) + '</h3><p>' + safe(item.summary || '') + '</p><div class="miiiips-live-actions"><a class="miiiips-live-btn secondary" target="_blank" rel="noopener noreferrer" href="' + safe(item.url) + '">Открыть источник</a></div></article>';
      }).join('');
    };
    const section = document.createElement('section');
    section.id = 'miiiips-signal-blocks';
    section.className = 'miiiips-live-shell miiiips-live-section';
    section.innerHTML = [
      '<div class="miiiips-live-kicker">Живые обновления</div>',
      '<div class="miiiips-live-grid">',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Публикации и журналы</div>', buildCompact(feeds.openPublications), '</div>',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Конференции и лекции</div>', buildCompact((feeds.conferenceUpdates || []).concat(feeds.moonnUpdates || [])), '</div>',
      '<div class="miiiips-live-stack"><div class="miiiips-live-kicker">Регуляторика и тренды</div>', buildCompact((feeds.educationPolicy || []).concat(feeds.psychologyTrends || [])), '</div>',
      '</div>'
    ].join('');
    insertAfterHero(section);
  }

  function findBestAnswer(data, query) {
    const faq = ((data.support || {}).faq || []);
    const normalized = (query || '').toLowerCase();
    const candidates = [
      ['timepad', 'Как зарегистрироваться через Timepad?'],
      ['лекц', 'Где лекции и выступления?'],
      ['выступ', 'Где лекции и выступления?'],
      ['курс', 'Где курс эмоционального интеллекта?'],
      ['эмоцион', 'Где курс эмоционального интеллекта?'],
      ['telegram', 'Как связаться с Татьяной Мунн?'],
      ['телег', 'Как связаться с Татьяной Мунн?'],
      ['whatsapp', 'Как связаться с Татьяной Мунн?'],
      ['ватс', 'Как связаться с Татьяной Мунн?'],
      ['email', 'Как связаться с Татьяной Мунн?'],
      ['почт', 'Как связаться с Татьяной Мунн?'],
      ['вступ', 'Как вступить в институт?'],
      ['кабинет', 'Где личный кабинет?'],
      ['публикац', 'Как подать запрос на публикационное сопровождение?'],
      ['грант', 'Где новости и обновления?'],
      ['новост', 'Где новости и обновления?']
    ];
    const matched = candidates.find(function (entry) { return normalized.includes(entry[0]); });
    const answer = faq.find(function (item) { return item.q === (matched ? matched[1] : ''); }) || faq[0];
    if (!answer) return 'Откройте раздел «Контакты и партнёрства» или страницу нужного маршрута — я помогу довести и этот слой.';
    return answer.q + '\n\n' + answer.a;
  }

  function injectSupportWidget(data) {
    if (document.getElementById('miiiips-support-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'miiiips-support-fab';
    fab.className = 'miiiips-support-fab';
    fab.type = 'button';
    fab.textContent = 'Помощь';

    const panel = document.createElement('section');
    panel.id = 'miiiips-support-panel';
    panel.className = 'miiiips-support-panel';
    panel.innerHTML = [
      '<div class="miiiips-support-head">',
      '<button class="miiiips-support-close" type="button" aria-label="Закрыть">×</button>',
      '<h3>' + safe((data.support && data.support.title) || 'Поддержка') + '</h3>',
      '<p>' + safe((data.support && data.support.intro) || 'Подскажем, куда идти дальше.') + '</p>',
      '</div>',
      '<div class="miiiips-support-body">',
      '<div class="miiiips-support-links">',
      '<a target="_blank" rel="noopener noreferrer" href="' + safe(data.contacts.telegramDirect.url) + '">Telegram</a>',
      '<a target="_blank" rel="noopener noreferrer" href="' + safe(data.contacts.whatsapp.url) + '">WhatsApp</a>',
      '<a href="' + safe(data.contacts.email.url) + '">Email</a>',
      '<a target="_blank" rel="noopener noreferrer" href="' + safe(data.contacts.timepad.url) + '">Timepad</a>',
      '</div>',
      '<div class="miiiips-support-chip-wrap">',
      ((data.support && data.support.faq) || []).slice(0, 8).map(function (item) { return '<button class="miiiips-support-chip" type="button" data-support-q="' + safe(item.q) + '">' + safe(item.q) + '</button>'; }).join(''),
      '</div>',
      '<div class="miiiips-support-input"><input id="miiiips-support-input" type="text" placeholder="Например: как зарегистрироваться на лекцию?" /><button class="miiiips-live-btn" id="miiiips-support-ask" type="button">Спросить</button></div>',
      '<div class="miiiips-support-answer" id="miiiips-support-answer">Выберите готовый вопрос или задайте свой — помощник подскажет ближайший маршрут.</div>',
      '</div>'
    ].join('');

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    const setOpen = function (open) {
      panel.classList.toggle('open', open);
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    fab.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    panel.querySelector('.miiiips-support-close').addEventListener('click', function () { setOpen(false); });
    panel.querySelectorAll('[data-support-q]').forEach(function (button) {
      button.addEventListener('click', function () {
        panel.querySelector('#miiiips-support-answer').textContent = findBestAnswer(data, button.getAttribute('data-support-q'));
      });
    });
    panel.querySelector('#miiiips-support-ask').addEventListener('click', function () {
      const value = panel.querySelector('#miiiips-support-input').value || '';
      panel.querySelector('#miiiips-support-answer').textContent = findBestAnswer(data, value);
    });
  }

  function enhanceMediaTreatment() {
    document.querySelectorAll('img').forEach(function (img) {
      const rectStyle = window.getComputedStyle(img);
      if (rectStyle.display === 'none') return;
      const parent = img.parentElement;
      if (!parent || parent.classList.contains('miiiips-photo-treated')) return;
      if ((img.clientWidth || img.width || 0) < 80) return;
      parent.classList.add('miiiips-photo-treated');
      parent.classList.add('miiiips-media-surface');
    });
    document.querySelectorAll('[style*="background-image"]').forEach(function (node) {
      if (node.classList.contains('miiiips-photo-treated')) return;
      const style = node.getAttribute('style') || '';
      if (!/background-image/i.test(style)) return;
      node.classList.add('miiiips-photo-treated');
      node.classList.add('miiiips-media-surface');
    });
  }

  async function init() {
    ensureStyles();
    const [siteData, liveFeeds] = await Promise.all([
      loadJson(DATA_PATH, {}),
      loadJson(FEEDS_PATH, {})
    ]);
    const data = combineData(siteData, liveFeeds);
    renderTicker(data);
    renderLectureHub(data);
    injectSpeechPageExtras(data);
    renderNewsPage(data);
    injectSignalBlocks(data);
    injectContactBlocks(data);
    injectSupportWidget(data);
    enhanceMediaTreatment();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
