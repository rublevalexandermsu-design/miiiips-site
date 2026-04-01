(function () {
  const params = new URLSearchParams(location.search);
  const storageKey = 'miiiips_active_profile';
  const profileOverride = params.get('profile');
  if (profileOverride) localStorage.setItem(storageKey, profileOverride);
  const activeProfileId = profileOverride || localStorage.getItem(storageKey) || 'student-core';

  const fetchJSON = (path) => fetch(path).then((r) => {
    if (!r.ok) throw new Error(path);
    return r.json();
  });

  const pageMap = {
    author: 'account-author.html',
    student: 'account-student.html',
    supervisor: 'account-supervisor.html',
    editor: 'account-editor.html',
    coordinator: 'account-coordinator.html'
  };

  const roleLabels = {
    author: 'Автор',
    student: 'Студент',
    supervisor: 'Научный руководитель',
    editor: 'Редактор',
    coordinator: 'Координатор'
  };

  const stateLabels = {
    learning: 'Учебный маршрут активен',
    publishing: 'Идёт публикационный маршрут',
    supervising: 'Идёт кураторская работа',
    routing: 'Идёт координация платформы'
  };

  const withProfile = (href, profileId) => {
    if (!href || href.startsWith('http') || href.startsWith('#')) return href;
    const joiner = href.includes('?') ? '&' : '?';
    return href + joiner + 'profile=' + encodeURIComponent(profileId);
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const friendlyGrantState = (value) => ({
    observer: 'наблюдение и знакомство с направлением',
    preparation: 'подготовка доказательной базы',
    submission: 'сборка заявки и команды',
    routing: 'координация и распределение маршрутов'
  }[value] || value || 'в работе');

  const list = (items, renderer, emptyText = 'Содержимое появится по мере движения по маршруту.') => items && items.length
    ? `<ul style="margin:12px 0 0;padding-left:18px;color:#51635d;line-height:1.75;">${items.map(renderer).join('')}</ul>`
    : `<p style="margin-top:12px;color:#60716b;">${escapeHtml(emptyText)}</p>`;

  const card = (title, body, extra = '') => `<div class="card" style="padding:20px;"><h3>${escapeHtml(title)}</h3><p>${body}</p>${extra}</div>`;

  Promise.all([
    fetchJSON('assets/data/platform-profiles.json'),
    fetchJSON('assets/data/course-registry.json'),
    fetchJSON('assets/data/grant-registry.json'),
    fetchJSON('assets/data/editorial-pipeline.json'),
    fetchJSON('assets/data/publication-registry.json'),
    fetchJSON('assets/data/research-case-registry.json'),
    fetchJSON('assets/data/research-metadata.json'),
    fetchJSON('assets/data/user-event-history.json'),
    fetchJSON('assets/data/events.json')
  ]).then(([profilesData, coursesData, grantsData, editorialData, publicationData, caseData, metadataData, userEventData, eventsData]) => {
    const profiles = profilesData.profiles || [];
    const profile = profiles.find((item) => item.id === activeProfileId) || profiles[0];
    if (!profile) return;
    localStorage.setItem(storageKey, profile.id);

    const courses = coursesData.courses || [];
    const grants = grantsData.grants || [];
    const stages = editorialData.stages || [];
    const publications = publicationData.publications || [];
    const cases = caseData.cases || [];
    const metadataProfiles = metadataData.profiles || [];
    const events = eventsData.events || [];
    const userEvent = (userEventData.profiles || []).find((entry) => entry.profileId === profile.id) || { attended: [], upcoming: [], derivedOutputs: [] };

    const eventMap = Object.fromEntries(events.map((event) => [event.id, event]));
    const publicationMap = Object.fromEntries(publications.map((entry) => [entry.id, entry]));
    const caseMap = Object.fromEntries(cases.map((entry) => [entry.id, entry]));
    const courseById = Object.fromEntries(courses.map((entry) => [entry.id, entry]));
    const grantMap = Object.fromEntries(grants.map((entry) => [entry.id, entry]));

    const activeCourse = (profile.courses.history || [])[0] || null;
    const primaryCourse = activeCourse ? Object.values(courseById).find((course) => (course.instances || []).some((item) => item.id === activeCourse.instanceId)) : courseById['ei-core'];
    const ownedPublications = (profile.publications.owned || []).map((id) => publicationMap[id]).filter(Boolean);
    const currentTracks = (profile.researchTracks || []).map((entry) => caseMap[entry.id]).filter(Boolean);
    const attendedEvents = (userEvent.attended || []).map((id) => eventMap[id]).filter(Boolean);
    const upcomingEvents = (userEvent.upcoming || []).map((id) => eventMap[id]).filter(Boolean);
    const derivedOutputs = (userEvent.derivedOutputs || []).map((id) => publicationMap[id]).filter(Boolean);
    const recommendedGrants = (profile.grants.recommended || []).map((id) => grantMap[id]).filter(Boolean);

    const milestoneHtml = list(profile.milestones || [], (item) => `<li><strong>${escapeHtml(item.label)}</strong> — ${item.state === 'done' ? 'выполнено' : item.state === 'current' ? 'текущий фокус' : 'следующий шаг'}</li>`);

    const summaryMount = document.getElementById('account-profile-summary');
    if (summaryMount) {
      summaryMount.innerHTML = `
        <div class="card">
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(profile.summary)}</p>
          <p style="margin-top:12px;font-size:13px;color:#60716b;">${escapeHtml(stateLabels[profile.lifecycleState] || profile.status)} · ${escapeHtml(profile.directions.join(' · '))}</p>
        </div>
        <div class="card">
          <h3>Текущее положение</h3>
          <p>${escapeHtml(profile.permissionsSummary || profile.status)}</p>
          <p style="margin-top:12px;color:#60716b;">Курс: ${profile.courses.progress}% · Публикации: ${profile.publications.published} · События в истории: ${(profile.events.attended || []).length}</p>
          ${milestoneHtml}
        </div>`;
    }

    const switcherMount = document.getElementById('account-profile-switcher');
    if (switcherMount) {
      switcherMount.innerHTML = profiles.map((item) => `<a class="btn ${item.id === profile.id ? '' : 'secondary'}" href="accounts.html?profile=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a>`).join('');
    }

    const quickMount = document.getElementById('account-quick-routes');
    if (quickMount) {
      quickMount.innerHTML = profile.roles.map((role) => `<a class="btn secondary" href="${withProfile(pageMap[role] || 'accounts.html', profile.id)}">${escapeHtml(roleLabels[role] || role)}</a>`).join('');
    }

    const operational = document.getElementById('account-operational-dashboard');
    if (operational) {
      operational.innerHTML = `<div class="grid two">
        ${card('Главный фокус', escapeHtml(profile.courses.nextStep || profile.grants.nextAction), `<p style="margin-top:12px;color:#60716b;">Статус участника: ${escapeHtml(profile.status)}</p>`)}
        ${card('Ближайший выход наружу', derivedOutputs[0] ? `Следующий материал уже намечен: <strong>${escapeHtml(derivedOutputs[0].publicCard.title)}</strong>.` : 'Следующим результатом станет материал, связанный с курсом или событием.', `<p style="margin-top:12px;color:#60716b;">Грантовая стадия: ${escapeHtml(friendlyGrantState(profile.grants.readiness))}</p>`)}
      </div>
      <div class="grid" style="margin-top:18px;">
        ${card('Курс', primaryCourse ? `${escapeHtml(primaryCourse.title)}. Прогресс участника — ${profile.courses.progress}%.` : 'Курс будет добавлен после выбора направления.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.course, profile.id)}">Открыть курс</a></div>`)}
        ${card('События', attendedEvents.length ? `В истории уже ${attendedEvents.length} события, а ближайшее — ${escapeHtml(upcomingEvents[0]?.title || 'следующее в календаре')}.` : 'История событий начнёт собираться после первых посещений.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.events, profile.id)}">Календарь</a></div>`)}
        ${card('Исследования и публикации', currentTracks.length ? `Активные треки: ${escapeHtml(currentTracks.map((item) => item.title).join(' · '))}.` : 'Исследовательский трек откроется по мере движения по маршруту.', `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Среда</a><a class="btn secondary" href="${withProfile(profile.route.publications, profile.id)}">Публикации</a></div>`)}
      </div>`;
    }

    const roleSummary = document.getElementById('role-profile-summary');
    if (roleSummary) {
      roleSummary.innerHTML = `
        <div class="card">
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(profile.summary)}</p>
          <p style="margin-top:12px;color:#60716b;">Статус: ${escapeHtml(profile.status)}</p>
          <div class="cta-row">
            <a class="btn secondary" href="${withProfile(profile.route.course, profile.id)}">Курс</a>
            <a class="btn secondary" href="${withProfile(profile.route.events, profile.id)}">События</a>
            <a class="btn secondary" href="${withProfile(profile.route.publications, profile.id)}">Публикации</a>
          </div>
        </div>`;
    }

    const routeSummary = document.getElementById('role-route-summary');
    if (routeSummary) {
      routeSummary.innerHTML = `
        <div class="card">
          <h3>Следующий шаг маршрута</h3>
          <p>${escapeHtml(profile.courses.nextStep || profile.grants.nextAction)}</p>
          <p style="margin-top:12px;color:#60716b;">Активные роли: ${escapeHtml(profile.roles.map((role) => roleLabels[role] || role).join(' · '))}</p>
          ${milestoneHtml}
        </div>`;
    }

    const nextActions = document.getElementById('role-next-actions');
    if (nextActions) {
      nextActions.innerHTML = `<div class="grid two">
        ${card('Что делать сейчас', escapeHtml(profile.courses.nextStep || profile.grants.nextAction), `<p style="margin-top:12px;color:#60716b;">Рекомендованные гранты: ${escapeHtml(recommendedGrants.map((item) => item.title).join(' · ') || 'будут показаны по мере зрелости профиля')}</p>`)}
        ${card('Что уже собрано', `Публикаций: ${profile.publications.published}. Черновиков в работе: ${profile.publications.drafts}. Исследовательских треков: ${currentTracks.length}.`, `<div class="cta-row"><a class="btn secondary" href="${withProfile(profile.route.grants, profile.id)}">Открыть гранты</a><a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Открыть исследования</a></div>`)}
      </div>`;
    }

    const courseStatus = document.getElementById('course-shell-status');
    if (courseStatus && primaryCourse) {
      const activeInstance = (primaryCourse.instances || []).find((item) => (profile.courses.active || []).includes(item.id)) || primaryCourse.instances?.[0];
      const nextResearch = (primaryCourse.linkedResearch || []).map((id) => caseMap[id]?.title).filter(Boolean).join(' · ');
      courseStatus.innerHTML = `
        <h3>${escapeHtml(profile.name)}</h3>
        <p>${escapeHtml(primaryCourse.courseCard.lead)}</p>
        <p style="margin-top:12px;color:#60716b;">Ваш статус: ${escapeHtml(profile.courses.currentState)} · Прогресс: ${profile.courses.progress}% · Группа: ${escapeHtml(activeInstance?.cohort || 'текущий набор')}</p>
        <p style="margin-top:12px;color:#60716b;">Следующий шаг: ${escapeHtml(profile.courses.nextStep)}</p>
        <div class="cta-row">
          <a class="btn" href="${withProfile('accounts.html', profile.id)}">Открыть кабинет</a>
          <a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Исследовательская среда</a>
        </div>
        <p style="margin-top:12px;color:#60716b;">Связанные направления: ${escapeHtml(nextResearch || 'Исследовательские кейсы будут раскрываться по мере движения по курсу.')}</p>`;
    }

    const courseFactory = document.getElementById('course-factory-status');
    if (courseFactory && primaryCourse) {
      courseFactory.innerHTML = `
        <h3>Как устроен курс</h3>
        <p>${escapeHtml(primaryCourse.courseCard.result)}</p>
        ${list(primaryCourse.modules || [], (module) => `<li>${escapeHtml(module.title)}${module.state === 'published' ? '' : ' — следующий блок'}</li>`)}
        <p style="margin-top:12px;color:#60716b;">Итог: ${escapeHtml(primaryCourse.certificate.label)}. После завершения маршрут ведёт в публикации и исследования.</p>`;
    }

    const courseLinked = document.getElementById('course-linked-surfaces');
    if (courseLinked && primaryCourse) {
      const linkedEvents = (primaryCourse.linkedEvents || []).map((id) => eventMap[id]).filter(Boolean);
      const linkedResearch = (primaryCourse.linkedResearch || []).map((id) => caseMap[id]).filter(Boolean);
      courseLinked.innerHTML = `<div class="grid two">
        ${card('С чем связан курс', linkedEvents.length ? `Ближайшие события поддерживают курс: ${escapeHtml(linkedEvents.map((event) => event.title).join(' · '))}.` : 'Событийная связка будет добавляться по мере развития программы.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('conferences.html', profile.id)}">События</a></div>`)}
        ${card('Куда он выводит дальше', linkedResearch.length ? `После курса открываются исследовательские направления: ${escapeHtml(linkedResearch.map((entry) => entry.title).join(' · '))}.` : 'Следующим шагом станет исследовательская практика.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('research-sandbox.html', profile.id)}">Исследования</a><a class="btn secondary" href="${withProfile('publications.html', profile.id)}">Публикации</a></div>`)}
      </div>`;
    }

    const grantMount = document.getElementById('grant-shell-status');
    if (grantMount) {
      const eligible = grants.filter((grant) => (profile.grants.eligible || []).includes(grant.id));
      grantMount.innerHTML = `
        <h3>Релевантные возможности</h3>
        <p>${escapeHtml(profile.name)} сейчас находится на стадии: ${escapeHtml(friendlyGrantState(profile.grants.readiness))}.</p>
        ${list(eligible, (grant) => `<li><strong>${escapeHtml(grant.title)}</strong> — ${escapeHtml(grant.nextAction)}</li>`)}
      `;
    }

    const grantResearchMount = document.getElementById('grant-research-status');
    if (grantResearchMount) {
      const relatedCases = currentTracks;
      grantResearchMount.innerHTML = `
        <h3>Что усиливает заявку</h3>
        <p>Исследовательские кейсы и публикации становятся частью доказательной базы, а не остаются отдельными страницами.</p>
        ${list(relatedCases, (entry) => `<li><strong>${escapeHtml(entry.title)}</strong> — связано с маршрутом ${escapeHtml(entry.direction)}</li>`)}
      `;
    }

    const grantApplication = document.getElementById('grant-application-state');
    if (grantApplication) {
      grantApplication.innerHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
        ${card('Позиция участника', escapeHtml(profile.grants.nextAction), `<p style="margin-top:12px;color:#60716b;">Участник выступает как ${escapeHtml(recommendedGrants[0]?.participantRole || 'исполнитель направления')}.</p>`)}
        ${card('Позиция института', escapeHtml(recommendedGrants[0]?.instituteRole || 'Институт координирует и подаёт заявку от общего имени.'), `<p style="margin-top:12px;color:#60716b;">Это позволяет связывать исследования, публикации и обучение в одной заявке.</p>`)}
        ${card('Что нужно подтвердить', currentTracks.length ? `Уже есть исследовательские опоры: ${escapeHtml(currentTracks.map((item) => item.title).join(' · '))}.` : 'Для следующего шага нужен исследовательский или публикационный материал.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('research-sandbox.html', profile.id)}">Исследования</a><a class="btn secondary" href="${withProfile('publications.html', profile.id)}">Публикации</a></div>`)}
      </div>`;
    }

    const eventMount = document.getElementById('event-shell-status');
    if (eventMount) {
      eventMount.innerHTML = `
        <div class="card" style="margin-bottom:20px;">
          <h3>${escapeHtml(profile.name)}</h3>
          <p>События в истории соединяются с курсами, публикациями и исследовательскими треками.</p>
          <p style="margin-top:12px;color:#60716b;">Посещено: ${attendedEvents.length} · Ближайшие: ${upcomingEvents.length} · Материалы, выросшие из участия: ${derivedOutputs.length}</p>
        </div>
        <div class="grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
          <div class="card" style="padding:20px;"><h3>Архив участия</h3>${list(attendedEvents, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div>
          <div class="card" style="padding:20px;"><h3>Ближайшие шаги</h3>${list(upcomingEvents, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div>
          <div class="card" style="padding:20px;"><h3>Что уже выросло</h3>${list(derivedOutputs, (entry) => `<li><a href="${withProfile(entry.page, profile.id)}">${escapeHtml(entry.publicCard.title)}</a></li>`)}</div>
        </div>`;
    }

    const eventRoute = document.getElementById('event-route-status');
    if (eventRoute) {
      const upcomingLead = upcomingEvents[0];
      const leadLinks = upcomingLead ? [
        upcomingLead.linkedCourse ? courseById[upcomingLead.linkedCourse]?.title : null,
        upcomingLead.linkedResearch ? caseMap[upcomingLead.linkedResearch]?.title : null,
        upcomingLead.linkedPublication ? publicationMap[upcomingLead.linkedPublication]?.publicCard?.title : null
      ].filter(Boolean) : [];
      eventRoute.innerHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
        ${card('Как событие работает в маршруте', upcomingLead ? `Ближайшее событие — ${escapeHtml(upcomingLead.title)}. После участия маршрут может продолжиться в ${escapeHtml(leadLinks.join(' · ') || 'курс, публикацию или исследовательскую линию')}.` : 'Каждое событие должно оставлять после себя материал, связку или следующий шаг для участника.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('course-ei.html', profile.id)}">Связанный курс</a></div>`)}
        ${card('Для координатора и редактора', derivedOutputs.length ? `Уже собраны материалы: ${escapeHtml(derivedOutputs.map((entry) => entry.publicCard.title).join(' · '))}.` : 'После события здесь появляются страницы, фотографии, конспекты и связанные публикации.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('publications.html', profile.id)}">Публикации</a></div>`)}
      </div>`;
    }

    const researchMount = document.getElementById('research-shell-status');
    if (researchMount) {
      researchMount.innerHTML = `
        <span class="badge">Маршрут участника</span>
        <h2 style="margin:12px 0 14px;">Исследовательская среда открывается как продолжение маршрута</h2>
        <p>${escapeHtml(profile.name)} приходит сюда не отдельно от курса и событий, а как следующий шаг после обучения, публичных встреч и первых материалов.</p>
        ${list(currentTracks, (entry) => `<li><strong>${escapeHtml(entry.title)}</strong> — ${escapeHtml(entry.summary)}</li>`)}
      `;
    }

    const researchList = document.getElementById('research-case-list');
    if (researchList) {
      researchList.innerHTML = cases.map((entry) => {
        const metadata = metadataProfiles.find((item) => item.id === entry.id);
        const linkedGrant = grants.find((grant) => grant.id === entry.grantLink || grant.id === entry.linkedGrant);
        return `<article class="card panel" style="margin-bottom:18px;">
          <span class="badge">${escapeHtml(entry.direction)}</span>
          <h3 style="margin:12px 0 10px;">${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.summary)}</p>
          <p style="margin-top:12px;color:#60716b;">Состояние: ${escapeHtml(entry.state)} · Грантовый маршрут: ${escapeHtml(linkedGrant?.title || 'готовится')}</p>
          <div class="cta-row">
            <a class="btn secondary" href="${withProfile(entry.page, profile.id)}">Открыть кейс</a>
            ${metadata?.publication_route && publicationMap[metadata.publication_route] ? `<a class="btn secondary" href="${withProfile(publicationMap[metadata.publication_route].page, profile.id)}">Связанный материал</a>` : ''}
          </div>
        </article>`;
      }).join('');
    }

    const publicationMount = document.getElementById('editorial-shell-status');
    if (publicationMount) {
      publicationMount.innerHTML = `
        <div class="bg-surface-container-lowest p-8 border-l-4 border-primary shadow-sm">
          <h3 class="text-3xl font-serif text-primary mb-4">Редакционный маршрут участника</h3>
          <p class="text-on-surface-variant">Материалы проходят единый путь: исходный замысел, структурирование, проверка качества и публичный выпуск.</p>
          <div class="mt-6 grid gap-3">${stages.map((stage) => `<div><strong>${escapeHtml(stage.label)}</strong><div class="text-sm text-on-surface-variant mt-1">${escapeHtml(stage.summary)}</div></div>`).join('')}</div>
        </div>`;
    }

    const publicationRoute = document.getElementById('publication-route-summary');
    if (publicationRoute) {
      publicationRoute.innerHTML = `<div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
        ${card('Материалы в работе', ownedPublications.length ? `У участника уже есть ${ownedPublications.length} материалов в маршруте.` : 'Материалы появятся после первой лекции, статьи или исследовательской заметки.', list(ownedPublications, (entry) => `<li><strong>${escapeHtml(entry.publicCard.title)}</strong> — ${escapeHtml(entry.reviewState)}</li>`, 'Пока нет материалов в активном выпуске.'))}
        ${card('Куда они ведут', ownedPublications.length ? 'Публикации могут усиливать грантовый маршрут, курс и исследовательские кейсы.' : 'После появления первого материала здесь будет показана его связь с курсами, событиями и исследованиями.', `<div class="cta-row"><a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">Гранты</a><a class="btn secondary" href="${withProfile('research-sandbox.html', profile.id)}">Исследования</a></div>`)}
      </div>`;
    }

    const publicationCards = document.getElementById('publication-card-list');
    if (publicationCards) {
      const visiblePublications = ownedPublications.length ? ownedPublications : publications.filter((entry) => profile.roles.includes(entry.ownerRole)).slice(0, 3);
      const responsibilities = Object.entries(editorialData.roleResponsibilities || {})
        .filter(([role]) => profile.roles.includes(role))
        .map(([role, items]) => `<div class="card" style="padding:20px;"><h3>${escapeHtml(roleLabels[role] || role)}</h3>${list(items, (item) => `<li>${escapeHtml(item)}</li>`)}</div>`)
        .join('');
      publicationCards.innerHTML = `<div class="grid two">
        <div>
          <span class="badge">Материалы маршрута</span>
          <div class="grid" style="margin-top:14px;">${visiblePublications.map((entry) => card(entry.publicCard.title, escapeHtml(entry.publicCard.summary), `<p style="margin-top:12px;color:#60716b;">Стадия: ${escapeHtml(entry.reviewState)} · Направление: ${escapeHtml(entry.direction)}</p><div class="cta-row"><a class="btn secondary" href="${withProfile(entry.page, profile.id)}">Открыть материал</a></div>`)).join('')}</div>
        </div>
        <div>
          <span class="badge">Роли в выпуске</span>
          <div class="grid" style="margin-top:14px;">${responsibilities || card('Рабочая роль', 'Публикационный маршрут будет уточняться по мере подключения ролей.')}</div>
        </div>
      </div>`;
    }

    const rowingCaseStatus = document.getElementById('rowing-case-status');
    const rowingCase = caseMap['rowing-agent'];
    const rowingPublication = publicationMap[rowingCase?.publicationRoute];
    if (rowingCaseStatus && rowingCase) {
      rowingCaseStatus.innerHTML = `
        <span class="eyebrow">Исследовательский кейс</span>
        <h2 style="margin:12px 0 14px;">От экспериментального контура к публичному материалу</h2>
        <p>${escapeHtml(rowingCase.summary)}</p>
        <p style="margin-top:12px;color:#60716b;">Состояние: ${escapeHtml(rowingCase.state)} · Связанный курс: ${escapeHtml(courseById[rowingCase.courseLink || rowingCase.linkedCourse]?.title || 'не назначен')}</p>
        <div class="cta-row">
          <a class="btn primary" href="${withProfile('research-sandbox.html', profile.id)}">Исследовательская среда</a>
          <a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">Грантовый маршрут</a>
          ${rowingPublication ? `<a class="btn secondary" href="${withProfile(rowingPublication.page, profile.id)}">Публикационный маршрут</a>` : ''}
        </div>`;
    }

    const rowingCaseEvidence = document.getElementById('rowing-case-evidence');
    if (rowingCaseEvidence && rowingCase) {
      rowingCaseEvidence.innerHTML = `
        <span class="eyebrow">Опоры кейса</span>
        <h2 style="margin:12px 0 14px;">Что уже собрано в исследовательской линии</h2>
        ${list(rowingCase.artifacts || [], (item) => `<li>${escapeHtml(item)}</li>`)}
        <p style="margin-top:12px;color:#60716b;">Авторы: ${escapeHtml((rowingCase.authors || []).join(' · '))}</p>`;
    }

    const rowingCaseRoute = document.getElementById('rowing-case-route');
    if (rowingCaseRoute && rowingCase) {
      rowingCaseRoute.innerHTML = `
        <span class="eyebrow">Связи кейса</span>
        <h2 style="margin:12px 0 14px;">Как этот трек встраивается в платформу</h2>
        ${list([
          'Исследовательская среда собирает черновые материалы и подготавливает их к устойчивой форме.',
          'Грантовый контур использует кейс как доказательство зрелости направления.',
          'Публикационный маршрут превращает кейс в понятный материал для сайта и партнёров.',
          'Курс помогает переводить исследование в обучение и практические разборы.'
        ], (item) => `<li>${escapeHtml(item)}</li>`)}
      `;
    }
  }).catch((error) => {
    console.warn('platform-shell load failed', error);
  });
})();
