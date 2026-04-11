const CONFIG = {
  SHEET_NAME: 'Заявки с сайта',
  TZ: 'Europe/Moscow',
  FALLBACK_TARGET_EMAIL: 'rublevalexanderus@gmail.com',
  TELEGRAM_API_BASE: 'https://api.telegram.org',
  DEFAULT_TELEGRAM_BOT_TOKEN: '8667212345:AAFl-v-LVZelaIb95G57YpXXdsC5Ehlvmd8',
  DEFAULT_TELEGRAM_ALERT_CHAT_ID: '-1002564966905',
  DEFAULT_TELEGRAM_ALERT_THREAD_ID: '2342'
};

const REQUEST_COLUMNS = [
  ['created_at', 'Дата заявки'],
  ['form_type', 'Тип заявки'],
  ['request_kind', 'Сценарий'],
  ['source_page', 'Страница'],
  ['source_page_url', 'URL страницы'],
  ['event_title', 'Мероприятие'],
  ['event_date', 'Дата мероприятия'],
  ['event_url', 'Ссылка на мероприятие'],
  ['role', 'Роль'],
  ['name', 'Имя'],
  ['email', 'Email'],
  ['phone', 'Телефон'],
  ['contact', 'Контакт'],
  ['organization', 'Организация'],
  ['interest', 'Интерес'],
  ['message', 'Сообщение'],
  ['payment_stage', 'Оплата / следующий шаг'],
  ['payload_json', 'Payload JSON']
];

const JOURNAL_REQUEST_COLUMNS = [
  ['created_at', 'Дата заявки'],
  ['form_type', 'Тип заявки'],
  ['request_kind', 'Сценарий'],
  ['source_page', 'Страница'],
  ['source_page_url', 'URL страницы'],
  ['journal_title', 'Журнал'],
  ['issue_id', 'Выпуск ID'],
  ['issue_label', 'Выпуск'],
  ['author_name', 'Автор'],
  ['email', 'Email'],
  ['contact', 'Контакт'],
  ['organization', 'Организация'],
  ['article_title', 'Название статьи'],
  ['abstract', 'Аннотация'],
  ['keywords', 'Ключевые слова'],
  ['language', 'Язык'],
  ['file_name', 'Файл'],
  ['file_type', 'Тип файла'],
  ['file_size', 'Размер файла'],
  ['file_path', 'Ссылка/путь к файлу'],
  ['captcha', 'Антиспам'],
  ['message', 'Сопроводительное письмо'],
  ['payload_json', 'Payload JSON']
];

function doGet() {
  return jsonResponse({
    ok: true,
    status: 'ready',
    service: 'miiiips-public-forms',
    sheet_name: getSheetName_()
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const formType = stringValue_(payload.form_type || payload.formType);
    if (formType === 'journal_submission') {
      // If the client sends a base64 DataURL, persist it to Drive and remove the heavy content from JSON logs.
      tryPersistJournalUpload_(payload);
    }
    const submission = normalizeSubmission_(payload);
    const sheet = ensureSheet_(submission.form_type);
    appendRow_(sheet, submission);
    const emailResult = sendNotificationEmail_(submission);
    const telegramResult = sendTelegramAlert_(submission, emailResult);
    return jsonResponse({
      ok: true,
      created_at: submission.created_at,
      sheet_url: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      sheet_name: sheet.getName(),
      email: emailResult,
      telegram: telegramResult
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function configureBridge(config) {
  const payload = config || {};
  const props = PropertiesService.getScriptProperties();
  const normalized = {};
  [
    'TARGET_EMAIL',
    'SITE_REQUEST_SHEET_NAME',
    'JOURNAL_SHEET_NAME',
    'JOURNAL_DRIVE_FOLDER_ID',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_ALERT_CHAT_ID',
    'TELEGRAM_ALERT_THREAD_ID'
  ].forEach(function (key) {
    if (payload[key] != null && String(payload[key]).trim()) {
      normalized[key] = String(payload[key]).trim();
    }
  });
  props.setProperties(normalized, false);
  return {
    ok: true,
    savedKeys: Object.keys(normalized)
  };
}

function getBridgeStatus() {
  const props = PropertiesService.getScriptProperties();
  return {
    ok: true,
    sheet_name: getSheetName_(),
    target_email: getTargetEmail_(),
    telegram_chat_configured: Boolean(stringValue_(props.getProperty('TELEGRAM_ALERT_CHAT_ID'))),
    telegram_thread_configured: Boolean(stringValue_(props.getProperty('TELEGRAM_ALERT_THREAD_ID'))),
    telegram_token_configured: Boolean(stringValue_(props.getProperty('TELEGRAM_BOT_TOKEN')))
  };
}

function parsePayload_(e) {
  const raw = (e && e.postData && e.postData.contents) || '{}';
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizeSubmission_(payload) {
  const eventTitle = stringValue_(payload.event_title || payload.eventTitle);
  const eventDate = stringValue_(payload.event_date || payload.eventDate);
  const eventUrl = stringValue_(payload.event_url || payload.eventUrl);
  const sourcePage = stringValue_(payload.source_page || payload.sourcePage);
  const sourcePageUrl = stringValue_(payload.source_page_url || payload.sourcePageUrl);
  const formType = stringValue_(payload.form_type || payload.formType);
  const requestKind = stringValue_(payload.request_kind || payload.intent || payload.requestKind);
  const paymentStage = stringValue_(payload.payment_stage || payload.paymentStage);
  const articleFile = payload.article_file && typeof payload.article_file === 'object' ? payload.article_file : {};

  const safePayload = sanitizePayload_(payload);
  return {
    created_at: formatDate_(new Date()),
    form_type: formType,
    request_kind: requestKind,
    source_page: sourcePage,
    source_page_url: sourcePageUrl,
    event_title: eventTitle,
    event_date: eventDate,
    event_url: eventUrl,
    journal_title: stringValue_(payload.journal_title || payload.journalTitle),
    issue_id: stringValue_(payload.issue_id || payload.issueId || payload.issue),
    issue_label: stringValue_(payload.issue_label || payload.issueLabel),
    author_name: stringValue_(payload.author_name || payload.authorName || payload.name),
    role: stringValue_(payload.role),
    name: stringValue_(payload.name),
    email: stringValue_(payload.email),
    phone: stringValue_(payload.phone),
    contact: stringValue_(payload.contact || payload.phone),
    organization: stringValue_(payload.organization || payload.affiliation),
    interest: stringValue_(payload.interest),
    article_title: stringValue_(payload.article_title || payload.articleTitle),
    abstract: stringValue_(payload.abstract),
    keywords: stringValue_(payload.keywords),
    language: stringValue_(payload.language),
    file_name: stringValue_(articleFile.name),
    file_type: stringValue_(articleFile.type),
    file_size: stringValue_(articleFile.size),
    file_path: stringValue_(articleFile.fileUrl || articleFile.file_url || articleFile.saved_path || articleFile.savedPath || payload.file_path || payload.filePath),
    captcha: stringValue_(payload.captcha),
    message: stringValue_(payload.message),
    payment_stage: paymentStage,
    payload_json: JSON.stringify(safePayload, null, 2)
  };
}

function sanitizePayload_(payload) {
  const cloned = JSON.parse(JSON.stringify(payload || {}));
  if (cloned && cloned.article_file && typeof cloned.article_file === 'object') {
    if (cloned.article_file.dataUrl) cloned.article_file.dataUrl = '[omitted]';
    if (cloned.article_file.data_url) cloned.article_file.data_url = '[omitted]';
  }
  return cloned;
}

function tryPersistJournalUpload_(payload) {
  if (!payload || !payload.article_file || typeof payload.article_file !== 'object') return;
  const info = payload.article_file;
  const dataUrl = stringValue_(info.dataUrl || info.data_url);
  if (!dataUrl || dataUrl.indexOf(',') === -1) return;
  const parts = dataUrl.split(',');
  const meta = parts[0] || '';
  const encoded = parts.slice(1).join(',');
  if (meta.indexOf('base64') === -1) return;
  const mimeMatch = meta.match(/^data:([^;]+);base64/i);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const fileName = stringValue_(info.name) || ('journal-submission-' + Utilities.getUuid() + '.bin');
  try {
    const bytes = Utilities.base64Decode(encoded);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const folder = getJournalUploadsFolder_();
    const file = folder ? folder.createFile(blob) : DriveApp.createFile(blob);
    // Record the storage location for notifications and the sheet.
    info.fileId = file.getId();
    info.fileUrl = file.getUrl();
    info.saved_path = file.getUrl();
    // Remove heavy content from the in-flight payload to avoid bloating sheet/email JSON.
    delete info.dataUrl;
    delete info.data_url;
  } catch (error) {
    // Best-effort: even if Drive persistence fails, we still want the submission itself to be recorded.
  }
}

function getJournalUploadsFolder_() {
  const props = PropertiesService.getScriptProperties();
  const existing = stringValue_(props.getProperty('JOURNAL_DRIVE_FOLDER_ID'));
  if (existing) {
    try {
      return DriveApp.getFolderById(existing);
    } catch (error) {
      // ignore and recreate
    }
  }
  try {
    const folder = DriveApp.createFolder('MIIIIPS Journal Submissions');
    props.setProperty('JOURNAL_DRIVE_FOLDER_ID', folder.getId());
    return folder;
  } catch (error) {
    return null;
  }
}

function ensureSheet_(formType) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetName_(formType);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  const headers = headersForFormType_(formType);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const mismatch = headers.some(function (header, index) {
      return String(firstRow[index] || '').trim() !== header;
    });
    if (mismatch) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

function appendRow_(sheet, submission) {
  const row = columnsForFormType_(submission.form_type).map(function (item) {
    return submission[item[0]] || '';
  });
  sheet.appendRow(row);
}

function sendNotificationEmail_(submission) {
  const targetEmail = getTargetEmail_();
  const subjectTail = submission.article_title || submission.issue_label || submission.event_title || formTypeLabel_(submission.form_type);
  const subject = '[МИИИИПС] Новая заявка: ' + subjectTail;
  const bodyLines = [
    'Новая заявка с сайта МИИИИПС',
    '',
    'Тип формы: ' + formTypeLabel_(submission.form_type),
    'Сценарий: ' + submission.request_kind,
    'Страница: ' + submission.source_page,
    'URL страницы: ' + submission.source_page_url,
    'Мероприятие: ' + submission.event_title,
    'Дата мероприятия: ' + submission.event_date,
    'URL мероприятия: ' + submission.event_url,
    'Роль: ' + submission.role,
    'Имя: ' + submission.name,
    'Email: ' + submission.email,
    'Телефон: ' + submission.phone,
    'Контакт: ' + submission.contact,
    'Организация: ' + submission.organization,
    'Интерес: ' + submission.interest,
    'Оплата / следующий шаг: ' + submission.payment_stage,
  ];
  if (submission.journal_title) {
    bodyLines.push('Журнал: ' + submission.journal_title);
  }
  if (submission.issue_label) {
    bodyLines.push('Выпуск: ' + submission.issue_label);
  }
  if (submission.author_name) {
    bodyLines.push('Автор: ' + submission.author_name);
  }
  if (submission.article_title) {
    bodyLines.push('Название статьи: ' + submission.article_title);
  }
  if (submission.abstract) {
    bodyLines.push('Аннотация: ' + String(submission.abstract).slice(0, 400));
  }
  if (submission.keywords) {
    bodyLines.push('Ключевые слова: ' + submission.keywords);
  }
  if (submission.language) {
    bodyLines.push('Язык: ' + submission.language);
  }
  if (submission.file_name) {
    bodyLines.push('Файл: ' + submission.file_name + ' (' + submission.file_type + ', ' + submission.file_size + ' байт)');
  }
  if (submission.file_path) {
    bodyLines.push('Путь к файлу: ' + submission.file_path);
  }
  bodyLines.push('', 'Сообщение:', submission.message, '', 'Payload JSON:', submission.payload_json);
  const body = bodyLines.join('\n');
  MailApp.sendEmail(targetEmail, subject, body);
  return {
    mode: 'sent',
    to: targetEmail
  };
}

function sendTelegramAlert_(submission, emailResult) {
  const props = PropertiesService.getScriptProperties();
  const token = stringValue_(props.getProperty('TELEGRAM_BOT_TOKEN')) || CONFIG.DEFAULT_TELEGRAM_BOT_TOKEN;
  const chatId = stringValue_(props.getProperty('TELEGRAM_ALERT_CHAT_ID')) || CONFIG.DEFAULT_TELEGRAM_ALERT_CHAT_ID;
  const threadId = stringValue_(props.getProperty('TELEGRAM_ALERT_THREAD_ID')) || CONFIG.DEFAULT_TELEGRAM_ALERT_THREAD_ID;
  if (!token || !chatId) {
    return { mode: 'unconfigured' };
  }

  const textLines = [
    'Новая заявка с сайта МИИИИПС',
    '',
    'Тип: ' + formTypeLabel_(submission.form_type),
    submission.event_title ? 'Мероприятие: ' + submission.event_title : '',
    submission.event_date ? 'Дата: ' + submission.event_date : '',
    submission.event_url ? 'Ссылка на событие: ' + submission.event_url : '',
    submission.journal_title ? 'Журнал: ' + submission.journal_title : '',
    submission.issue_label ? 'Выпуск: ' + submission.issue_label : '',
    submission.author_name ? 'Автор: ' + submission.author_name : '',
    submission.article_title ? 'Название статьи: ' + submission.article_title : '',
    submission.abstract ? 'Аннотация: ' + String(submission.abstract).slice(0, 400) : '',
    submission.keywords ? 'Ключевые слова: ' + submission.keywords : '',
    submission.language ? 'Язык: ' + submission.language : '',
    submission.file_name ? 'Файл: ' + submission.file_name + ' (' + submission.file_type + ', ' + submission.file_size + ' байт)' : '',
    submission.name ? 'Имя: ' + submission.name : '',
    submission.email ? 'Email: ' + submission.email : '',
    submission.contact ? 'Контакт: ' + submission.contact : '',
    submission.organization ? 'Организация: ' + submission.organization : '',
    submission.interest ? 'Интерес: ' + submission.interest : '',
    submission.payment_stage ? 'Оплата / этап: ' + submission.payment_stage : '',
    '',
    'Сообщение:',
    submission.message || '(пусто)',
    '',
    'Таблица: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    emailResult && emailResult.to ? 'Email: ' + emailResult.to : ''
  ].filter(Boolean);

  const payload = {
    chat_id: chatId,
    text: textLines.join('\n'),
    disable_web_page_preview: true
  };
  if (threadId) {
    payload.message_thread_id = Number(threadId);
  }

  const response = UrlFetchApp.fetch(CONFIG.TELEGRAM_API_BASE + '/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  return {
    mode: status >= 200 && status < 300 ? 'sent' : 'failed',
    status: status
  };
}

function getSheetName_(formType) {
  const props = PropertiesService.getScriptProperties();
  if (stringValue_(formType) === 'journal_submission') {
    return stringValue_(props.getProperty('JOURNAL_SHEET_NAME')) || 'Заявки журнала';
  }
  return stringValue_(props.getProperty('SITE_REQUEST_SHEET_NAME')) || CONFIG.SHEET_NAME;
}

function headersForFormType_(formType) {
  return columnsForFormType_(formType).map(function (item) {
    return item[1];
  });
}

function columnsForFormType_(formType) {
  return stringValue_(formType) === 'journal_submission' ? JOURNAL_REQUEST_COLUMNS : REQUEST_COLUMNS;
}

function getTargetEmail_() {
  const props = PropertiesService.getScriptProperties();
  return stringValue_(props.getProperty('TARGET_EMAIL')) || CONFIG.FALLBACK_TARGET_EMAIL;
}

function stringValue_(value) {
  return String(value == null ? '' : value).trim();
}

function formatDate_(date) {
  return Utilities.formatDate(date, CONFIG.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function formTypeLabel_(formType) {
  const mapping = {
    event_video_request: 'Запрос видео',
    event_speaker_invite: 'Приглашение лектора',
    event_signup: 'Заявка на участие в событии',
    course_enrollment: 'Заявка на программу',
    publication_support: 'Публикационный запрос',
    journal_submission: 'Заявка в журнал',
    grant_participation: 'Грантовая заявка',
    newsletter_subscription: 'Подписка',
    generic_form: 'Заявка с сайта'
  };
  return mapping[formType] || formType || 'Заявка с сайта';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
