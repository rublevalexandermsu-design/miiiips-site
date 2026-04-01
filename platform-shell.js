(function () {
  const params = new URLSearchParams(location.search);
  const storageKey = 'miiiips_active_profile';
  const override = params.get('profile');
  if (override) localStorage.setItem(storageKey, override);

  const fetchJSON = (path) => fetch(path).then((r) => {
    if (!r.ok) throw new Error(path);
    return r.json();
  });

  const escapeHtml = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const roleLabels = {
    student: 'Студент', author: 'Автор', supervisor: 'Научный руководитель', editor: 'Редактор', coordinator: 'Координатор'
  };
  const pageMap = {
    author: 'account-author.html', student: 'account-student.html', supervisor: 'account-supervisor.html', editor: 'account-editor.html', coordinator: 'account-coordinator.html'
  };
  const courseStateLabel = { active: 'идёт обучение', mentoring: 'идёт сопровождение', curating: 'идёт координация' };
  const grantStateLabel = { preparation: 'подготовка доказательной базы', submission: 'сборка и согласование заявки', routing: 'координация маршрутов' };
  const appStateLabel = { confirmed_interest: 'интерес подтверждён', research_fit_confirmed: 'релевантность подтверждена', priority_track: 'приоритетный трек', assembly: 'сборка пакета', evidence_building: 'сбор доказательной базы', approved_for_submission: 'готово к подаче' };

  const withProfile = (href, profileId) => {
    if (!href || href.startsWith('http') || href.startsWith('#')) return href;
    const base = href.split('?')[0];
    const q = new URLSearchParams(href.includes('?') ? href.split('?')[1] : '');
    q.set('profile', profileId);
    return base + '?' + q.toString();
  };

  const list = (items, renderer, empty = 'Раздел будет наполняться по мере движения маршрута.') => (
    items && items.length
      ? `<ul style="margin:12px 0 0;padding-left:18px;color:#51635d;line-height:1.75;">${items.map(renderer).join('')}</ul>`
      : `<p style="margin-top:12px;color:#60716b;">${escapeHtml(empty)}</p>`
  );

  const card = (title, body, extra = '') => `<div class="card" style="padding:20px;"><h3>${escapeHtml(title)}</h3><p>${body}</p>${extra}</div>`;
  const mount = (id, html) => { const node = document.getElementById(id); if (node) node.innerHTML = html; };

  Promise.all([
    fetchJSON('assets/data/platform-profiles.json'),
    fetchJSON('assets/data/course-registry.json'),
    fetchJSON('assets/data/grant-registry.json'),
    fetchJSON('assets/data/grant-application-registry.json'),
    fetchJSON('assets/data/editorial-pipeline.json'),
    fetchJSON('assets/data/editorial-ingest.json'),
    fetchJSON('assets/data/publication-registry.json'),
    fetchJSON('assets/data/research-case-registry.json'),
    fetchJSON('assets/data/research-metadata.json'),
    fetchJSON('assets/data/user-event-history.json'),
    fetchJSON('assets/data/events.json')
  ]).then(([profilesData, courseData, grantData, grantAppData, editorialData, ingestData, publicationData, caseData, metadataData, userEventData, eventsData]) => {
    const participants = profilesData.participants || profilesData.profiles || [];
    const defaultId = profilesData.defaultProfileId || participants[0]?.id;
    const activeProfileId = override || localStorage.getItem(storageKey) || defaultId;
    const profile = participants.find((item) => item.id === activeProfileId) || participants[0];
    if (!profile) return;
    localStorage.setItem(storageKey, profile.id);

    const courses = courseData.courses || [];
    const grants = grantData.grants || [];
    const grantApps = grantAppData.applications || [];
    const publications = publicationData.publications || [];
    const cases = caseData.cases || [];
    const events = eventsData.events || [];
    const userEvents = userEventData.profiles || [];
    const ingest = ingestData.sources || [];

    const courseMap = Object.fromEntries(courses.map((item) => [item.id, item]));
    const grantMap = Object.fromEntries(grants.map((item) => [item.id, item]));
    const publicationMap = Object.fromEntries(publications.map((item) => [item.id, item]));
    const caseMap = Object.fromEntries(cases.map((item) => [item.id, item]));
    const eventMap = Object.fromEntries(events.map((item) => [item.id, item]));
    const participantEvent = userEvents.find((item) => item.profileId === profile.id) || { attended: [], upcoming: [], registrations: [], derivedOutputs: [] };
    const ownedPublications = (profile.publications?.owned || []).map((id) => publicationMap[id]).filter(Boolean);
    const trackCards = (profile.researchTracks || []).map((item) => caseMap[item.id || item]).filter(Boolean);
    const attendedEvents = (participantEvent.attended || []).map((id) => eventMap[id]).filter(Boolean);
    const upcomingEvents = (participantEvent.upcoming || []).map((id) => eventMap[id]).filter(Boolean);
    const outputs = (participantEvent.derivedOutputs || []).map((id) => publicationMap[id]).filter(Boolean);
    const eligibleGrants = (profile.grants?.recommended || []).map((id) => grantMap[id]).filter(Boolean);
    const grantApplications = grantApps.filter((item) => item.participantId === profile.id);
    const ingestItems = ingest.filter((item) => item.ownerId === profile.id || profile.roles.includes(item.ownerRole));

    const allInstances = courses.flatMap((course) => (course.instances || []).map((inst) => ({ course, inst })));
    const activeCourseState = profile.courses?.history?.[0];
    const activeCourse = activeCourseState
      ? allInstances.find((item) => item.inst.id === activeCourseState.instanceId)
      : null;
    const currentCourse = activeCourse?.course || courseMap['ei-core'];
    const currentInstance = activeCourse?.inst || currentCourse?.instances?.[0];

    mount('account-profile-switcher', participants.map((item) => `<a class="btn ${item.id === profile.id ? '' : 'secondary'}" href="accounts.html?profile=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a>`).join(''));
    mount('account-quick-routes', profile.roles.map((role) => `<a class="btn secondary" href="${withProfile(pageMap[role] || 'accounts.html', profile.id)}">${escapeHtml(roleLabels[role] || role)}</a>`).join(''));

    mount('account-profile-summary', `
      <div class="card">
        <h3>${escapeHtml(profile.name)}</h3>
        <p>${escapeHtml(profile.summary)}</p>
        <p style="margin-top:12px;font-size:13px;color:#60716b;">${escapeHtml(profile.status)} · ${escapeHtml((profile.directions || []).join(' · '))}</p>
      </div>
      <div class="card">
        <h3>Текущее положение</h3>
        <p>${escapeHtml(profile.permissionsSummary || '')}</p>
        <p style="margin-top:12px;color:#60716b;">Курс: ${profile.courses?.progress || 0}% · Публикации: ${profile.publications?.published || 0} · События: ${(profile.events?.attended || []).length}</p>
        ${list(profile.milestones || [], (item) => `<li><strong>${escapeHtml(item.label)}</strong> — ${item.state === 'done' ? 'выполнено' : item.state === 'current' ? 'в фокусе' : 'следом'}</li>`)}
      </div>`);

    mount('account-operational-dashboard', `
      <div class="grid two">
        ${card('Главный фокус', escapeHtml(profile.courses?.nextStep || profile.grants?.nextAction || ''), `<p style="margin-top:12px;color:#60716b;">Состояние участника: ${escapeHtml(profile.status)}</p>`) }
        ${card('Что уже даёт маршрут', outputs[0] ? `Следующий материал уже собран: <strong>${escapeHtml(outputs[0].publicCard.title)}</strong>.` : 'Маршрут уже связывает обучение, события, исследования и публикации.', `<p style="margin-top:12px;color:#60716b;">Грантовая стадия: ${escapeHtml(grantStateLabel[profile.grants?.readiness] || profile.grants?.readiness || '')}</p>`) }
      </div>
      <div class="grid" style="margin-top:18px;">
        ${card('Курс', currentCourse ? `${escapeHtml(currentCourse.title)}. Прогресс — ${profile.courses?.progress || 0}%.` : 'Курс появится после выбора направления.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.course, profile.id)}">Открыть курс</a></div>`) }
        ${card('События', attendedEvents.length ? `В истории уже ${attendedEvents.length} события, ближайшее — ${escapeHtml(upcomingEvents[0]?.title || 'следующее в календаре')}.` : 'История событий начнёт собираться после первых посещений.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.events, profile.id)}">Календарь</a></div>`) }
        ${card('Исследования и публикации', trackCards.length ? `Активные треки: ${escapeHtml(trackCards.map((item) => item.title).join(' · '))}.` : 'Исследовательский трек откроется по мере движения по маршруту.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Исследования</a><a class="btn secondary" href="${withProfile(profile.route.publications, profile.id)}">Публикации</a></div>`) }
      </div>`);

    mount('role-profile-summary', `<div class="card"><h3>${escapeHtml(profile.name)}</h3><p>${escapeHtml(profile.summary)}</p><p style="margin-top:12px;color:#60716b;">${escapeHtml(profile.status)}</p><div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.course, profile.id)}">Курс</a><a class="btn secondary" href="${withProfile(profile.route.events, profile.id)}">События</a><a class="btn secondary" href="${withProfile(profile.route.publications, profile.id)}">Публикации</a></div></div>`);
    mount('role-route-summary', `<div class="card"><h3>Следующий шаг маршрута</h3><p>${escapeHtml(profile.courses?.nextStep || profile.grants?.nextAction || '')}</p><p style="margin-top:12px;color:#60716b;">Активные роли: ${escapeHtml((profile.roles || []).map((role) => roleLabels[role] || role).join(' · '))}</p>${list(profile.milestones || [], (item) => `<li>${escapeHtml(item.label)}</li>`)}</div>`);
    mount('role-next-actions', `<div class="grid two">${card('Что делать сейчас', escapeHtml(profile.courses?.nextStep || profile.grants?.nextAction || ''), `<p style="margin-top:12px;color:#60716b;">Релевантные гранты: ${escapeHtml(eligibleGrants.map((item) => item.title).join(' · ') || 'появятся по мере зрелости профиля')}</p>`) }${card('Что уже собрано', `Публикаций: ${profile.publications?.published || 0}. Черновиков: ${profile.publications?.drafts || 0}. Исследовательских треков: ${trackCards.length}.`, `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.grants, profile.id)}">Гранты</a><a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Исследования</a></div>`)}</div>`);

    if (currentCourse) {
      mount('course-shell-status', `
        <h3>${escapeHtml(profile.name)}</h3>
        <p>${escapeHtml(currentCourse.courseCard.lead)}</p>
        <p style="margin-top:12px;color:#60716b;">Статус курса: ${escapeHtml(courseStateLabel[profile.courses?.currentState] || profile.courses?.currentState || '')} · Прогресс: ${profile.courses?.progress || 0}% · Группа: ${escapeHtml(currentInstance?.cohort || '')}</p>
        <p style="margin-top:12px;color:#60716b;">Доступ: ${escapeHtml(profile.courses?.accessState || '')} · Подтверждение участия: ${escapeHtml(profile.courses?.paymentState || '')} · Сертификат: ${escapeHtml(profile.courses?.certificateState || '')}</p>
        <div class="cta-row">
          <a class="btn" href="${withProfile('accounts.html', profile.id)}">Открыть кабинет</a>
          <a class="btn secondary" href="${withProfile(profile.courses?.paymentRoute || 'payment-demo.html?course=ei-core', profile.id)}">Подтверждение участия</a>
          <a class="btn secondary" href="${withProfile(profile.courses?.certificatePage || currentCourse.certificate.page, profile.id)}">Сертификат</a>
        </div>`);
      mount('course-factory-status', `<h3>Как устроен маршрут</h3><p>${escapeHtml(currentCourse.courseCard.result)}</p>${list(currentCourse.modules || [], (m) => `<li>${escapeHtml(m.title)}${m.state === 'published' ? '' : ' — следующий модуль'}</li>`)}<p style="margin-top:12px;color:#60716b;">Итоговый документ: ${escapeHtml(currentCourse.certificate.label)}.</p>`);
      const linkedEvents = (currentCourse.linkedEvents || []).map((id) => eventMap[id]).filter(Boolean);
      const linkedResearch = (currentCourse.linkedResearch || []).map((id) => caseMap[id]).filter(Boolean);
      mount('course-linked-surfaces', `<div class="grid two">${card('С чем связан курс', linkedEvents.length ? `Курс опирается на события: ${escapeHtml(linkedEvents.map((event) => event.title).join(' · '))}.` : 'Событийная связка появится по мере наполнения программы.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('conferences.html', profile.id)}">События</a></div>`)}${card('Куда он выводит дальше', linkedResearch.length ? `После курса открываются исследовательские направления: ${escapeHtml(linkedResearch.map((entry) => entry.title).join(' · '))}.` : 'Следующим шагом станет исследовательская практика.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('research-sandbox.html', profile.id)}">Исследования</a><a class="btn secondary" href="${withProfile('publications.html', profile.id)}">Публикации</a></div>`)}</div>`);
    }

    mount('grant-shell-status', `<h3>Релевантные возможности</h3><p>${escapeHtml(profile.name)} сейчас находится на стадии: ${escapeHtml(grantStateLabel[profile.grants?.readiness] || profile.grants?.readiness || '')}.</p>${list(eligibleGrants, (grant) => `<li><strong>${escapeHtml(grant.title)}</strong> — ${escapeHtml(grant.nextAction)}</li>`)}`);
    mount('grant-research-status', `<h3>Что усиливает заявку</h3><p>Исследовательские кейсы и публикации становятся частью доказательной базы.</p>${list(trackCards, (entry) => `<li><strong>${escapeHtml(entry.title)}</strong> — ${escapeHtml(entry.summary)}</li>`)}`);
    mount('grant-application-state', `<div class="grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">${grantApplications.map((app) => {
      const grant = grantMap[app.grantId];
      return card(grant?.title || app.grantId, `Сейчас: ${escapeHtml(appStateLabel[app.inquiryState] || app.inquiryState)}. Следующий шаг: ${escapeHtml(app.nextAction)}`, `<p style="margin-top:12px;color:#60716b;">Готово: ${escapeHtml((app.readyEvidence || []).join(' · ')) || 'пока без артефактов'}.</p><p style="margin-top:12px;color:#60716b;">Нужно добрать: ${escapeHtml((app.missingEvidence || []).join(' · ')) || 'ничего'}.</p>`);
    }).join('')}</div>`);

    mount('event-shell-status', `<div class="card" style="margin-bottom:20px;"><h3>${escapeHtml(profile.name)}</h3><p>События соединяются с курсами, публикациями и исследовательскими треками.</p><p style="margin-top:12px;color:#60716b;">Посещено: ${attendedEvents.length} · Ближайшие: ${upcomingEvents.length} · Производные материалы: ${outputs.length}</p></div><div class="grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;"><div class="card" style="padding:20px;"><h3>Архив участия</h3>${list(attendedEvents, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div><div class="card" style="padding:20px;"><h3>Ближайшие события</h3>${list(upcomingEvents, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div><div class="card" style="padding:20px;"><h3>Что уже выросло</h3>${list(outputs, (entry) => `<li><a href="${withProfile(entry.page, profile.id)}">${escapeHtml(entry.publicCard.title)}</a></li>`)}</div></div>`);
    const nextEvent = upcomingEvents[0];
    const nextLinks = nextEvent ? [nextEvent.linkedCourse && courseMap[nextEvent.linkedCourse]?.title, nextEvent.linkedResearch && caseMap[nextEvent.linkedResearch]?.title, nextEvent.linkedPublication && publicationMap[nextEvent.linkedPublication]?.publicCard?.title].filter(Boolean) : [];
    mount('event-route-status', `<div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">${card('Как событие продолжает маршрут', nextEvent ? `Ближайшее событие — ${escapeHtml(nextEvent.title)}. После него маршрут продолжается в ${escapeHtml(nextLinks.join(' · ') || 'курс, публикацию или исследовательскую линию')}.` : 'Каждое событие должно оставлять после себя материал и следующий шаг.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('course-ei.html', profile.id)}">Связанный курс</a></div>`)}${card('Что получает редактор и координатор', outputs.length ? `Уже собраны материалы: ${escapeHtml(outputs.map((entry) => entry.publicCard.title).join(' · '))}.` : 'После события здесь появляются страницы, фотографии, конспекты и связанные публикации.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('publications.html', profile.id)}">Публикации</a></div>`)}</div>`);

    mount('research-shell-status', `<span class="badge">Маршрут участника</span><h2 style="margin:12px 0 14px;">Исследовательская среда открывается как продолжение маршрута</h2><p>${escapeHtml(profile.name)} приходит сюда как следующий шаг после обучения, публичных встреч и первых материалов.</p>${list(trackCards, (entry) => `<li><strong>${escapeHtml(entry.title)}</strong> — ${escapeHtml(entry.summary)}</li>`)}`);
    mount('research-case-list', cases.map((entry) => {
      const grant = grantMap[entry.grantLink || entry.linkedGrant];
      return `<article class="card panel" style="margin-bottom:18px;"><span class="badge">${escapeHtml(entry.direction)}</span><h3 style="margin:12px 0 10px;">${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.summary)}</p><p style="margin-top:12px;color:#60716b;">Состояние: ${escapeHtml(entry.state)} · Доказательная сила: ${escapeHtml(entry.evidenceState || '')}</p><div class="cta-row"><a class="btn secondary" href="${withProfile(entry.page, profile.id)}">Открыть кейс</a>${grant ? `<a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">${escapeHtml(grant.title)}</a>` : ''}</div></article>`;
    }).join(''));

    mount('editorial-shell-status', `<div class="bg-surface-container-lowest p-8 border-l-4 border-primary shadow-sm"><h3 class="text-3xl font-serif text-primary mb-4">Редакционный маршрут участника</h3><p class="text-on-surface-variant">Материалы проходят единый путь: замысел, структурирование, проверка качества и публичный выпуск.</p><div class="mt-6 grid gap-3">${(editorialData.stages || []).map((stage) => `<div><strong>${escapeHtml(stage.label)}</strong><div class="text-sm text-on-surface-variant mt-1">${escapeHtml(stage.summary)}</div></div>`).join('')}</div></div>`);
    mount('publication-route-summary', `<div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">${card('Материалы в работе', ownedPublications.length ? `Участник уже ведёт ${ownedPublications.length} материала в маршруте.` : 'Материалы появятся после первой лекции, статьи или исследовательской заметки.', list(ownedPublications, (entry) => `<li><strong>${escapeHtml(entry.publicCard.title)}</strong> — ${escapeHtml(entry.reviewState)}</li>`, 'Пока нет материалов в активном выпуске.'))}${card('Куда они ведут', 'Публикации усиливают грантовый маршрут, курс и исследовательские кейсы.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">Гранты</a><a class="btn secondary" href="${withProfile('research-sandbox.html', profile.id)}">Исследования</a></div>`)}</div>`);
    mount('publication-card-list', `<div class="grid two"><div><span class="badge">Материалы маршрута</span><div class="grid" style="margin-top:14px;">${(ownedPublications.length ? ownedPublications : publications.filter((entry) => profile.roles.includes(entry.ownerRole)).slice(0, 3)).map((entry) => card(entry.publicCard.title, escapeHtml(entry.publicCard.summary), `<p style="margin-top:12px;color:#60716b;">Стадия: ${escapeHtml(entry.reviewState)} · Направление: ${escapeHtml(entry.direction)}</p><div class="cta-row"><a class="btn secondary" href="${withProfile(entry.page, profile.id)}">Открыть материал</a></div>`)).join('')}</div></div><div><span class="badge">Входящие материалы</span><div class="grid" style="margin-top:14px;">${(ingestItems.length ? ingestItems : []).map((entry) => card(entry.title, escapeHtml(entry.nextAction), `<p style="margin-top:12px;color:#60716b;">Источник: ${escapeHtml(entry.sourceType)} · Стадия: ${escapeHtml(entry.stage)}</p>`)).join('') || card('Редакционный поток', 'Новые материалы будут показываться здесь по мере поступления.')}</div></div></div>`);

    const rowing = caseMap['rowing-agent'];
    const rowingPub = publicationMap[rowing?.publicationRoute];
    if (rowing) {
      mount('rowing-case-status', `<span class="eyebrow">Исследовательский кейс</span><h2 style="margin:12px 0 14px;">От эксперимента к публичному материалу</h2><p>${escapeHtml(rowing.summary)}</p><p style="margin-top:12px;color:#60716b;">Стадия: ${escapeHtml(rowing.state)} · Публикационная готовность: ${escapeHtml(rowing.publicationReadiness)} · Проверка: ${escapeHtml(rowing.reviewCompleteness)}</p><div class="cta-row"><a class="btn primary" href="${withProfile('research-sandbox.html', profile.id)}">Исследовательская среда</a><a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">Грантовый маршрут</a>${rowingPub ? `<a class="btn secondary" href="${withProfile(rowingPub.page, profile.id)}">Публикационный маршрут</a>` : ''}</div>`);
      mount('rowing-case-evidence', `<span class="eyebrow">Опоры кейса</span><h2 style="margin:12px 0 14px;">Что уже собрано в исследовательской линии</h2>${list(rowing.artifacts || [], (item) => `<li>${escapeHtml(item)}</li>`)}<p style="margin-top:12px;color:#60716b;">Авторы: ${escapeHtml((rowing.authors || []).join(' · '))}</p>`);
      mount('rowing-case-route', `<span class="eyebrow">Связи кейса</span><h2 style="margin:12px 0 14px;">Как этот трек встраивается в платформу</h2>${list(['Исследовательская среда собирает черновые материалы и подготавливает их к устойчивой форме.','Грантовый контур использует кейс как доказательство зрелости направления.','Публикационный маршрут превращает кейс в понятный материал для сайта и партнёров.','Курс помогает переводить исследование в обучение и практические разборы.'], (item) => `<li>${escapeHtml(item)}</li>`)} `);
    }
  }).catch((error) => console.warn('platform-shell load failed', error));
})();
