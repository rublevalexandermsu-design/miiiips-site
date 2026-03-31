(function () {
  const params = new URLSearchParams(location.search);
  const storageKey = 'miiiips_active_profile';
  const profileOverride = params.get('profile');
  if (profileOverride) localStorage.setItem(storageKey, profileOverride);
  const activeProfileId = profileOverride || localStorage.getItem(storageKey) || 'student-demo';

  const fetchJSON = (path) => fetch(path).then((r) => {
    if (!r.ok) throw new Error(path);
    return r.json();
  });

  Promise.all([
    fetchJSON('assets/data/platform-profiles.json'),
    fetchJSON('assets/data/course-registry.json'),
    fetchJSON('assets/data/grant-registry.json'),
    fetchJSON('assets/data/editorial-pipeline.json'),
    fetchJSON('assets/data/research-case-registry.json'),
    fetchJSON('assets/data/events.json')
  ]).then(([profilesData, coursesData, grantsData, editorialData, caseData, eventsData]) => {
    const profiles = profilesData.profiles || [];
    const profile = profiles.find((item) => item.id === activeProfileId) || profiles[0];
    if (!profile) return;
    localStorage.setItem(storageKey, profile.id);

    const roleMap = {
      author: 'account-author.html',
      student: 'account-student.html',
      supervisor: 'account-supervisor.html',
      editor: 'account-editor.html',
      coordinator: 'account-coordinator.html'
    };
    const roleLabel = {
      author: 'Автор',
      student: 'Студент',
      supervisor: 'Руководитель',
      editor: 'Редактор',
      coordinator: 'Координатор'
    };

    const withProfile = (href) => {
      if (!href || href.startsWith('http') || href.startsWith('#')) return href;
      const joiner = href.includes('?') ? '&' : '?';
      return href + joiner + 'profile=' + encodeURIComponent(profile.id);
    };

    const profileCard = (title, body, links) => `
      <div class="card">
        <h3>${title}</h3>
        <p>${body}</p>
        ${links && links.length ? `<div class="cta-row">${links.map((link) => `<a class="btn secondary" href="${withProfile(link.href)}">${link.label}</a>`).join('')}</div>` : ''}
      </div>`;

    const summaryMount = document.getElementById('account-profile-summary');
    if (summaryMount) {
      summaryMount.innerHTML = `
        <div class="card">
          <h3>${profile.name}</h3>
          <p>${profile.summary}</p>
          <p style="margin-top:12px;font-size:13px;color:#60716b;">${profile.directions.join(' · ')}</p>
          <div class="cta-row">
            <a class="btn" href="${withProfile(profile.route.course)}">Курс</a>
            <a class="btn secondary" href="${withProfile(profile.route.grants)}">Гранты</a>
            <a class="btn secondary" href="${withProfile(profile.route.research)}">Исследования</a>
          </div>
        </div>
        <div class="card">
          <h3>Текущее состояние</h3>
          <p>${profile.status}</p>
          <p style="margin-top:12px;font-size:13px;color:#60716b;">Публикации: ${profile.publications.published} · Черновики: ${profile.publications.drafts} · Прогресс по курсу: ${profile.courses.progress}%</p>
        </div>`;
    }

    const switcherMount = document.getElementById('account-profile-switcher');
    if (switcherMount) {
      switcherMount.innerHTML = profiles.map((item) => `
        <a class="btn ${item.id === profile.id ? '' : 'secondary'}" href="accounts.html?profile=${encodeURIComponent(item.id)}">${item.name}</a>`).join('');
    }

    const quick = document.getElementById('account-quick-routes');
    if (quick) {
      quick.innerHTML = profile.roles.map((role) => `<a class="btn secondary" href="${withProfile(roleMap[role] || 'accounts.html')}">${roleLabel[role] || role}</a>`).join('');
    }

    const roleSummary = document.getElementById('role-profile-summary');
    if (roleSummary) {
      roleSummary.innerHTML = profileCard('Профиль участника', `${profile.name}. ${profile.summary}`, [
        {label: 'Курс', href: profile.route.course},
        {label: 'Гранты', href: profile.route.grants},
        {label: 'События', href: profile.route.events}
      ]);
    }
    const roleMetrics = document.getElementById('role-route-summary');
    if (roleMetrics) {
      roleMetrics.innerHTML = profileCard('Что уже собрано в маршруте', `Опубликовано материалов: ${profile.publications.published}. Активных событий в истории: ${(profile.events.attended || []).length}. Исследовательских треков: ${(profile.researchTracks || []).length}.`, [
        {label: 'Публикации', href: profile.route.publications},
        {label: 'Исследовательская среда', href: profile.route.research}
      ]);
    }

    const course = (coursesData.courses || []).find((item) => item.id === 'ei-core');
    const courseMount = document.getElementById('course-shell-status');
    if (courseMount && course) {
      const active = (profile.courses.active || []).includes(course.id);
      courseMount.innerHTML = `
        <h3>${profile.name}</h3>
        <p>${active ? 'Курс уже включён в персональный маршрут участника.' : 'Курс доступен как следующий шаг в персональном маршруте.'}</p>
        <p style="margin-top:12px;color:#60716b;">Прогресс: ${profile.courses.progress}% · Формат: ${course.format} · Итог: ${course.certificate}</p>
        <div class="cta-row">
          <a class="btn" href="${withProfile('accounts.html')}">Открыть кабинет</a>
          <a class="btn secondary" href="${withProfile(course.page)}">Маршрут курса</a>
        </div>`;
    }

    const courseFactory = document.getElementById('course-factory-status');
    if (courseFactory && course) {
      courseFactory.innerHTML = `<h3>Фабрика курсов</h3><p>${course.nextTemplate}</p><p style="margin-top:12px;color:#60716b;">Модули: ${course.modules.join(' · ')}</p>`;
    }

    const grantsMount = document.getElementById('grant-shell-status');
    if (grantsMount) {
      const relevant = (grantsData.grants || []).filter((grant) => profile.grants.eligible.includes(grant.id));
      grantsMount.innerHTML = `<h3>Маршрут участника</h3><p>${profile.name} сейчас находится на стадии: ${profile.grants.readiness}.</p><ul style="margin:14px 0 0;padding-left:18px;color:#3f4945;line-height:1.7;">${relevant.slice(0, 3).map((grant) => `<li>${grant.title}</li>`).join('')}</ul><div class="cta-row"><a class="btn" href="${withProfile('accounts.html')}">Профиль участника</a></div>`;
    }

    const grantsResearchMount = document.getElementById('grant-research-status');
    if (grantsResearchMount) {
      const linkedCases = (caseData.cases || []).filter((entry) => (profile.researchTracks || []).includes(entry.id) || entry.id === 'sandbox-hub');
      grantsResearchMount.innerHTML = `<h3>Исследования как аргумент заявки</h3><p>Исследовательские материалы участника не остаются отдельно: они усиливают грантовый маршрут и публичную витрину института.</p><p style="margin-top:12px;color:#60716b;">Связанные кейсы: ${linkedCases.map((entry) => entry.title).join(' · ')}</p>`;
    }

    const eventsMount = document.getElementById('event-shell-status');
    if (eventsMount) {
      const events = eventsData.events || [];
      const attended = events.filter((event) => (profile.events.attended || []).includes(event.id));
      const upcoming = events.filter((event) => (profile.events.upcoming || []).includes(event.id));
      eventsMount.innerHTML = `<div class="card" style="margin-bottom:20px;"><h3>${profile.name}</h3><p>Событий в истории: ${attended.length}. Ближайших событий: ${upcoming.length}.</p><p style="margin-top:12px;color:#60716b;">История участника связывает лекции, курсы, исследования и публичные материалы.</p></div><div class="grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">${[{ title: 'Архив участия', items: attended }, { title: 'Ближайшие события', items: upcoming }].map((block) => `<div class="card"><h3>${block.title}</h3>${block.items.length ? `<ul style="margin:14px 0 0;padding-left:18px;color:#51635d;line-height:1.7;">${block.items.map((event) => `<li><a href="${withProfile(event.detailPage)}">${event.title}</a></li>`).join('')}</ul>` : '<p>Список появится по мере наполнения маршрута.</p>'}</div>`).join('')}</div>`;
    }

    const researchMount = document.getElementById('research-shell-status');
    if (researchMount) {
      researchMount.innerHTML = `<h3>Вход в исследовательскую среду</h3><p>${profile.name} видит исследовательскую среду как продолжение своего маршрута: после курса, события или публикации можно перейти к кейсу и более глубокому исследованию.</p><p style="margin-top:12px;color:#60716b;">Треки участника: ${(profile.researchTracks || []).length ? profile.researchTracks.join(' · ') : 'будут добавляться по мере участия'}</p>`;
    }

    const researchCasesMount = document.getElementById('research-case-list');
    if (researchCasesMount) {
      researchCasesMount.innerHTML = (caseData.cases || []).map((entry) => `<article class="card panel" style="margin-bottom:18px;"><h3>${entry.title}</h3><p>${entry.summary}</p><div class="cta-row"><a class="btn secondary" href="${withProfile(entry.page)}">Открыть кейс</a></div></article>`).join('');
    }

    const editorialMount = document.getElementById('editorial-shell-status');
    if (editorialMount) {
      editorialMount.innerHTML = `<div class="bg-surface-container-lowest p-8 border-l-4 border-primary shadow-sm"><h3 class="text-3xl font-serif text-primary mb-4">Редакционный маршрут участника</h3><p class="text-on-surface-variant">Материалы автора проходят через единый контур: исходник, структурирование, проверка качества и публичный выпуск. Роли автора, редактора и научного руководителя связаны в одном маршруте.</p><div class="mt-6 grid gap-3">${(editorialData.stages || []).map((stage) => `<div><strong>${stage.label}</strong><div class="text-sm text-on-surface-variant mt-1">${stage.summary}</div></div>`).join('')}</div></div>`;
    }
  }).catch((error) => {
    console.warn('platform-shell load failed', error);
  });
})();
