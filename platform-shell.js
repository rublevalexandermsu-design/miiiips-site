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

  const list = (items, renderer) => items && items.length
    ? `<ul style="margin:12px 0 0;padding-left:18px;color:#51635d;line-height:1.75;">${items.map(renderer).join('')}</ul>`
    : '<p style="margin-top:12px;color:#60716b;">Содержимое появится по мере наполнения маршрута.</p>';

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

    const profileHeader = `
      <div class="card">
        <h3>${escapeHtml(profile.name)}</h3>
        <p>${escapeHtml(profile.summary)}</p>
        <p style="margin-top:12px;font-size:13px;color:#60716b;">${escapeHtml(stateLabels[profile.lifecycleState] || profile.status)} · ${escapeHtml(profile.directions.join(' · '))}</p>
      </div>`;

    const milestoneHtml = list(profile.milestones || [], (item) => `<li><strong>${escapeHtml(item.label)}</strong> — ${item.state === 'done' ? 'выполнено' : item.state === 'current' ? 'текущий фокус' : 'следующий шаг'}</li>`);

    const summaryMount = document.getElementById('account-profile-summary');
    if (summaryMount) {
      summaryMount.innerHTML = `
        ${profileHeader}
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

    const eiCourse = courses.find((item) => item.id === 'ei-core');
    const courseStatus = document.getElementById('course-shell-status');
    if (courseStatus && eiCourse) {
      const activeInstance = (eiCourse.instances || []).find((item) => (profile.courses.active || []).includes(item.id)) || eiCourse.instances?.[0];
      const nextResearch = (eiCourse.linkedResearch || []).map((id) => caseMap[id]?.title).filter(Boolean).join(' · ');
      courseStatus.innerHTML = `
        <h3>${escapeHtml(profile.name)}</h3>
        <p>${escapeHtml(eiCourse.courseCard.lead)}</p>
        <p style="margin-top:12px;color:#60716b;">Ваш статус: ${escapeHtml(profile.courses.currentState)} · Прогресс: ${profile.courses.progress}% · Группа: ${escapeHtml(activeInstance?.cohort || 'текущий набор')}</p>
        <p style="margin-top:12px;color:#60716b;">Следующий шаг: ${escapeHtml(profile.courses.nextStep)}</p>
        <div class="cta-row">
          <a class="btn" href="${withProfile('accounts.html', profile.id)}">Открыть кабинет</a>
          <a class="btn secondary" href="${withProfile(profile.route.research, profile.id)}">Исследовательская среда</a>
        </div>
        <p style="margin-top:12px;color:#60716b;">Связанные направления: ${escapeHtml(nextResearch || 'Исследовательские кейсы будут раскрываться по мере движения по курсу.')}</p>`;
    }

    const courseFactory = document.getElementById('course-factory-status');
    if (courseFactory && eiCourse) {
      const moduleList = list(eiCourse.modules || [], (module) => `<li>${escapeHtml(module.title)}${module.state === 'published' ? '' : ' — следующий блок'}</li>`);
      courseFactory.innerHTML = `
        <h3>Как устроен курс</h3>
        <p>${escapeHtml(eiCourse.courseCard.result)}</p>
        ${moduleList}
        <p style="margin-top:12px;color:#60716b;">Итог: ${escapeHtml(eiCourse.certificate.label)}. После завершения курс переводит участника в публикационный и исследовательский маршрут.</p>`;
    }

    const grantMount = document.getElementById('grant-shell-status');
    if (grantMount) {
      const eligible = grants.filter((grant) => (profile.grants.eligible || []).includes(grant.id));
      grantMount.innerHTML = `
        <h3>Релевантные возможности</h3>
        <p>${escapeHtml(profile.name)} сейчас находится на стадии: ${escapeHtml(profile.grants.readiness)}.</p>
        ${list(eligible, (grant) => `<li><strong>${escapeHtml(grant.title)}</strong> — ${escapeHtml(grant.nextAction)}</li>`)}
      `;
    }

    const grantResearchMount = document.getElementById('grant-research-status');
    if (grantResearchMount) {
      const relatedCases = (profile.researchTracks || []).map((entry) => caseMap[entry.id]).filter(Boolean);
      grantResearchMount.innerHTML = `
        <h3>Что усиливает заявку</h3>
        <p>Исследовательские кейсы и публикации становятся частью доказательной базы, а не остаются отдельными страницами.</p>
        ${list(relatedCases, (entry) => `<li><strong>${escapeHtml(entry.title)}</strong> — связано с маршрутом ${escapeHtml(entry.direction)}</li>`)}
      `;
    }

    const eventMount = document.getElementById('event-shell-status');
    if (eventMount) {
      const attended = (userEvent.attended || []).map((id) => eventMap[id]).filter(Boolean);
      const upcoming = (userEvent.upcoming || []).map((id) => eventMap[id]).filter(Boolean);
      const derived = (userEvent.derivedOutputs || []).map((id) => publicationMap[id]).filter(Boolean);
      eventMount.innerHTML = `
        <div class="card" style="margin-bottom:20px;">
          <h3>${escapeHtml(profile.name)}</h3>
          <p>События в истории соединяются с курсами, публикациями и исследовательскими треками.</p>
          <p style="margin-top:12px;color:#60716b;">Посещено: ${attended.length} · Ближайшие: ${upcoming.length} · Материалы, выросшие из участия: ${derived.length}</p>
        </div>
        <div class="grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
          <div class="card" style="padding:20px;"><h3>Архив участия</h3>${list(attended, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div>
          <div class="card" style="padding:20px;"><h3>Ближайшие шаги</h3>${list(upcoming, (event) => `<li><a href="${withProfile(event.detailPage, profile.id)}">${escapeHtml(event.title)}</a></li>`)}</div>
          <div class="card" style="padding:20px;"><h3>Что уже выросло</h3>${list(derived, (entry) => `<li><a href="${withProfile(entry.page, profile.id)}">${escapeHtml(entry.publicCard.title)}</a></li>`)}</div>
        </div>`;
    }

    const researchMount = document.getElementById('research-shell-status');
    if (researchMount) {
      const currentTracks = (profile.researchTracks || []).map((entry) => caseMap[entry.id]).filter(Boolean);
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
      const owned = (profile.publications.owned || []).map((id) => publicationMap[id]).filter(Boolean);
      publicationMount.innerHTML = `
        <div class="bg-surface-container-lowest p-8 border-l-4 border-primary shadow-sm">
          <h3 class="text-3xl font-serif text-primary mb-4">Редакционный маршрут участника</h3>
          <p class="text-on-surface-variant">Материалы проходят единый путь: исходный замысел, структурирование, проверка качества и публичный выпуск.</p>
          <div class="mt-6 grid gap-3">${stages.map((stage) => `<div><strong>${escapeHtml(stage.label)}</strong><div class="text-sm text-on-surface-variant mt-1">${escapeHtml(stage.summary)}</div></div>`).join('')}</div>
          <div class="mt-8 grid gap-4">${owned.map((entry) => `<div style="padding:18px;border:1px solid #d8ddd9;background:#fff;"><strong>${escapeHtml(entry.publicCard.title)}</strong><div style="margin-top:8px;color:#51635d;">${escapeHtml(entry.publicCard.summary)}</div><div style="margin-top:8px;color:#60716b;font-size:13px;">Статус: ${escapeHtml(entry.reviewState)} · Направление: ${escapeHtml(entry.direction)}</div></div>`).join('')}</div>
        </div>`;
    }

    const rowingCaseStatus = document.getElementById('rowing-case-status');
    if (rowingCaseStatus) {
      const rowingCase = caseMap['rowing-agent'];
      const rowingPublication = publicationMap[rowingCase?.publicationRoute];
      rowingCaseStatus.innerHTML = `
        <span class="eyebrow">Исследовательский кейс</span>
        <h2 style="margin:12px 0 14px;">От экспериментального контура к публичному материалу</h2>
        <p>${escapeHtml(rowingCase.summary)}</p>
        <p style="margin-top:12px;color:#60716b;">Состояние: ${escapeHtml(rowingCase.state)} · Связанный курс: ${escapeHtml(courses.find((item) => item.id === rowingCase.courseLink || item.id === rowingCase.linkedCourse)?.title || 'не назначен')}</p>
        <div class="cta-row">
          <a class="btn primary" href="${withProfile('research-sandbox.html', profile.id)}">Исследовательская среда</a>
          <a class="btn secondary" href="${withProfile('grants-teams.html', profile.id)}">Грантовый маршрут</a>
          ${rowingPublication ? `<a class="btn secondary" href="${withProfile(rowingPublication.page, profile.id)}">Публикационный маршрут</a>` : ''}
        </div>`;
    }

    const rowingCaseRoute = document.getElementById('rowing-case-route');
    if (rowingCaseRoute) {
      const rowingCase = caseMap['rowing-agent'];
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
