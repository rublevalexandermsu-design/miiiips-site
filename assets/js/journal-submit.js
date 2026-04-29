(function () {
  const INTEGRATIONS_PATH = 'assets/data/site-integrations.json';
  const REGISTRY_PATH = 'assets/data/publication-registry.json';
  const DEFAULT_MAIL_FALLBACK = 'mailto:monn.official@yandex.ru';
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const FALLBACK_ISSUES = [
    {
      id: 'journal-2026-spring',
      issueNo: '1',
      volume: '1',
      title: { ru: 'Пилотный выпуск журнала', en: 'Pilot Issue' },
      period: { ru: 'Весна 2026', en: 'Spring 2026' },
      status: 'published'
    },
    {
      id: 'journal-2026-summer',
      issueNo: '2',
      volume: '1',
      title: { ru: 'Летний выпуск и междисциплинарные материалы', en: 'Summer Interdisciplinary Issue' },
      period: { ru: 'Лето 2026', en: 'Summer 2026' },
      status: 'in_preparation'
    }
  ];

  let integrationsPromise = null;
  let registryPromise = null;

  function safe(text) {
    return String(text || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function loadJson(path, fallback) {
    return fetch(path, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('missing');
        return response.json();
      })
      .catch(function () {
        return fallback;
      });
  }

  function loadIntegrations() {
    if (!integrationsPromise) {
      integrationsPromise = loadJson(INTEGRATIONS_PATH, {
        forms: {
          publicApiBase: '',
          googleAppsScriptWebAppUrl: '',
          localApiBase: 'http://127.0.0.1:3007',
          mailtoFallback: DEFAULT_MAIL_FALLBACK
        }
      });
    }
    return integrationsPromise;
  }

  function loadRegistry() {
    if (!registryPromise) {
      registryPromise = loadJson(REGISTRY_PATH, { journal: { title: 'Журнал МИИИИПС', titleEn: 'MIIIIPS Journal', issues: FALLBACK_ISSUES } });
    }
    return registryPromise;
  }

  function apiCandidates(config) {
    const forms = (config && config.forms) || {};
    const candidates = [];
    if (forms.publicApiBase) candidates.push(String(forms.publicApiBase).replace(/\/+$/, ''));
    if (location.origin && location.origin.startsWith('http')) candidates.push(location.origin);
    if (forms.localApiBase) candidates.push(String(forms.localApiBase).replace(/\/+$/, ''));
    else candidates.push('http://127.0.0.1:3007');
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function prepareMailto(payload, config) {
    const mailFallback = ((config && config.forms && config.forms.mailtoFallback) || DEFAULT_MAIL_FALLBACK).trim() || DEFAULT_MAIL_FALLBACK;
    const subject = encodeURIComponent('Заявка в журнал МИИИИПС: ' + (payload.article_title || payload.issue_label || 'подать статью'));
    const body = encodeURIComponent([
      'Новая заявка в журнал МИИИИПС',
      '',
      'Тип формы: ' + (payload.formType || ''),
      'Журнал: ' + (payload.journal_title || ''),
      'Выпуск: ' + (payload.issue_label || ''),
      'Автор: ' + (payload.author_name || ''),
      'Email: ' + (payload.email || ''),
      'Контакт: ' + (payload.contact || ''),
      'Статья: ' + (payload.article_title || ''),
      '',
      'Аннотация:',
      payload.abstract || '',
      '',
      'Ключевые слова:',
      payload.keywords || '',
      '',
      'Сообщение:',
      payload.message || ''
    ].join('\n'));
    return mailFallback + '?subject=' + subject + '&body=' + body;
  }

  function setStatus(node, text, tone) {
    if (!node) return;
    node.textContent = text;
    node.dataset.tone = tone || 'neutral';
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('file read failed')); };
      reader.onload = function () { resolve(reader.result); };
      reader.readAsDataURL(file);
    });
  }

  function buildSubmissionSummary(payload) {
    return [
      'Подача статьи в журнал',
      '',
      'Журнал: ' + (payload.journal_title || ''),
      'Выпуск: ' + (payload.issue_label || ''),
      'Автор: ' + (payload.author_name || ''),
      'Статья: ' + (payload.article_title || ''),
      'Email: ' + (payload.email || ''),
      'Контакт: ' + (payload.contact || ''),
      'Организация: ' + (payload.organization || ''),
      'Язык: ' + (payload.language || ''),
      '',
      'Аннотация:',
      payload.abstract || '',
      '',
      'Ключевые слова:',
      payload.keywords || '',
      '',
      'Сопроводительное письмо:',
      payload.message || ''
    ].join('\n');
  }

  function issueLabel(issue, lang) {
    if (!issue) return '';
    const locale = lang === 'en' ? 'en' : 'ru';
    const title = issue.title && issue.title[locale] ? issue.title[locale] : issue.title && issue.title.ru ? issue.title.ru : 'Issue';
    const period = issue.period && issue.period[locale] ? issue.period[locale] : issue.period && issue.period.ru ? issue.period.ru : '';
    const issueNo = issue.issueNo ? ('№ ' + issue.issueNo) : '';
    return [issueNo, title, period].filter(Boolean).join(' · ');
  }

  function populateIssues(select, registry, lang) {
    const journal = registry && registry.journal ? registry.journal : {};
    const issues = Array.isArray(journal.issues) && journal.issues.length ? journal.issues : FALLBACK_ISSUES;
    const previousValue = select.value;
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = lang === 'en' ? 'Choose issue' : 'Выберите выпуск';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    issues.forEach(function (issue) {
      const option = document.createElement('option');
      option.value = issue.id || issue.issueNo || issueLabel(issue, lang);
      option.dataset.issueLabelRu = issueLabel(issue, 'ru');
      option.dataset.issueLabelEn = issueLabel(issue, 'en');
      option.dataset.journalTitleRu = journal.title || 'Журнал МИИИИПС';
      option.dataset.journalTitleEn = journal.titleEn || 'MIIIIPS Journal';
      option.textContent = issueLabel(issue, lang);
      if (String(issue.status || '').toLowerCase() === 'published') {
        option.dataset.status = 'published';
      }
      select.appendChild(option);
    });
    if (previousValue) {
      const match = Array.from(select.options).find(function (option) {
        return option.value === previousValue;
      });
      if (match) {
        select.value = previousValue;
        return;
      }
    }
    if (select.options.length > 1) {
      select.selectedIndex = 1;
    }
  }

  function syncDerivedFields(form) {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
    const issueSelect = form.querySelector('[name="issue"]');
    const journalTitleField = form.querySelector('[name="journal_title"]');
    const issueIdField = form.querySelector('[name="issue_id"]');
    const issueLabelField = form.querySelector('[name="issue_label"]');
    const eventTitleField = form.querySelector('[name="event_title"]');
    const eventDateField = form.querySelector('[name="event_date"]');
    const eventUrlField = form.querySelector('[name="event_url"]');
    const requestKindField = form.querySelector('[name="request_kind"]');
    const selected = issueSelect && issueSelect.options[issueSelect.selectedIndex];
    if (selected && selected.value) {
      const title = lang === 'en' ? (selected.dataset.journalTitleEn || selected.dataset.journalTitleRu || 'MIIIIPS Journal') : (selected.dataset.journalTitleRu || selected.dataset.journalTitleEn || 'Журнал МИИИИПС');
      const label = lang === 'en' ? (selected.dataset.issueLabelEn || selected.textContent) : (selected.dataset.issueLabelRu || selected.textContent);
      if (journalTitleField) journalTitleField.value = title;
      if (issueIdField) issueIdField.value = selected.value;
      if (issueLabelField) issueLabelField.value = label;
      if (eventTitleField) eventTitleField.value = label;
      if (eventDateField) eventDateField.value = label;
      if (eventUrlField) eventUrlField.value = new URL('journal-issue.html', location.href).href;
      if (requestKindField) requestKindField.value = lang === 'en' ? 'Journal submission' : 'Подача статьи в журнал';
    }
  }

  async function init() {
    const form = document.getElementById('journal-submit-form');
    if (!form) return;
    const integrations = await loadIntegrations();
    const registry = await loadRegistry();
    const statusNode = document.getElementById('journal-submit-status');
    const captchaNode = document.getElementById('captcha-sum');
    const issueSelect = form.querySelector('[name="issue"]');
    const captchaAnswer = String(form.dataset.captchaAnswer || '7');
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';

    populateIssues(issueSelect, registry, lang);
    syncDerivedFields(form);

    if (issueSelect) {
      issueSelect.addEventListener('change', function () {
        syncDerivedFields(form);
      });
    }

    document.querySelectorAll('[data-lang-switch]').forEach(function (button) {
      button.addEventListener('click', function () {
        setTimeout(function () {
          populateIssues(issueSelect, registry, document.documentElement.lang === 'en' ? 'en' : 'ru');
          syncDerivedFields(form);
        }, 0);
      });
    });

    form.querySelector('[name="source_page"]').value = 'journal-submit.html';
    form.querySelector('[name="source_page_url"]').value = location.href;
    form.querySelector('[name="formType"]').value = 'journal_submission';
    form.querySelector('[name="role"]').value = 'author';
    form.querySelector('[name="captcha"]').value = '';

    form.addEventListener('submit', async function (submitEvent) {
      submitEvent.preventDefault();
      syncDerivedFields(form);
      const captchaInput = String(form.querySelector('[name="captcha"]').value || '').trim();
      if (captchaInput !== captchaAnswer) {
        setStatus(statusNode, lang === 'en' ? 'Check the anti-spam code and try again.' : 'Проверьте антиспам-код и повторите попытку.', 'error');
        return;
      }
      const fileInput = form.querySelector('[name="article_file"]');
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        setStatus(statusNode, lang === 'en' ? 'Add the article file before submitting.' : 'Добавьте файл статьи перед отправкой.', 'error');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setStatus(statusNode, lang === 'en' ? 'File is too large. Please keep it under 8 MB.' : 'Файл слишком большой. Пожалуйста, сократите его до 8 МБ.', 'error');
        return;
      }
      setStatus(statusNode, lang === 'en' ? 'Preparing submission…' : 'Подготавливаем заявку…', 'neutral');
      const fd = new FormData(form);
      const payload = {};
      fd.forEach(function (value, key) {
        if (key === 'article_file') return;
        payload[key] = value;
      });
      // Normalize common fields because different templates may use camelCase names.
      payload.author_name = payload.author_name || payload.authorName || payload.name || '';
      payload.article_title = payload.article_title || payload.articleTitle || '';
      payload.issue_label = payload.issue_label || payload.issueLabel || payload.issue || '';
      payload.issue_id = payload.issue_id || payload.issueId || '';
      payload.journal_title = payload.journal_title || payload.journalTitle || '';
      payload.source_page = payload.source_page || payload.sourcePage || '';
      payload.source_page_url = payload.source_page_url || payload.sourcePageUrl || '';
      payload.source_page = 'journal-submit.html';
      payload.source_page_url = location.href;
      payload.formType = 'journal_submission';
      payload.request_kind = lang === 'en' ? 'Journal submission' : 'Подача статьи в журнал';
      payload.role = 'author';
      payload.journal_title = form.querySelector('[name="journal_title"]').value || payload.journal_title || (registry.journal && (lang === 'en' ? registry.journal.titleEn : registry.journal.title)) || 'Журнал МИИИИПС';
      payload.issue_id = form.querySelector('[name="issue_id"]').value || payload.issue_id || '';
      payload.issue_label = form.querySelector('[name="issue_label"]').value || payload.issue_label || '';
      payload.event_title = payload.issue_label || payload.journal_title;
      payload.event_date = payload.issue_label || '';
      payload.event_url = new URL('journal-issue.html', location.href).href;
      payload.message = buildSubmissionSummary(payload);

      try {
        const fileDataUrl = await readFileAsDataURL(file);
        payload.article_file = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: fileDataUrl
        };
      } catch (error) {
        setStatus(statusNode, lang === 'en' ? 'Unable to read the file. Try again.' : 'Не удалось прочитать файл. Попробуйте ещё раз.', 'error');
        return;
      }

      try {
        let delivered = false;
        for (const base of apiCandidates(integrations)) {
          try {
            const response = await fetch(base + '/api/forms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('bad response');
            await response.json();
            delivered = true;
            break;
          } catch (error) {
            delivered = false;
          }
        }
        if (!delivered && integrations && integrations.forms && integrations.forms.googleAppsScriptWebAppUrl) {
          await submitToGoogleAppsScript(integrations.forms.googleAppsScriptWebAppUrl, payload);
          delivered = true;
        }
        if (!delivered) throw new Error('all routes failed');
        setStatus(
          statusNode,
          lang === 'en'
            ? 'Article submitted. The editorial board will receive email, Telegram, and sheet records.'
            : 'Статья отправлена. Редакция получит письмо, уведомление и запись в таблице.',
          'success'
        );
        setTimeout(function () {
          location.href = 'application-success.html?flow=journal-submit';
        }, 850);
      } catch (error) {
        setStatus(
          statusNode,
          lang === 'en'
            ? 'The direct route is unavailable. Opening the fallback email route.'
            : 'Прямой маршрут недоступен. Откроем резервный email-маршрут.',
          'warning'
        );
        window.location.href = prepareMailto(payload, integrations);
      }
    });

    if (captchaNode) {
      captchaNode.textContent = captchaAnswer;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
