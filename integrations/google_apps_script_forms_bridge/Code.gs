const CONFIG = {
  SHEET_NAME: 'Заявки с сайта',
  TZ: 'Europe/Moscow',
  FALLBACK_TARGET_EMAIL: 'rublevalexanderus@gmail.com',
  TELEGRAM_API_BASE: 'https://api.telegram.org'
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
    const submission = normalizeSubmission_(payload);
    const sheet = ensureSheet_();
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

  return {
    created_at: formatDate_(new Date()),
    form_type: formType,
    request_kind: requestKind,
    source_page: sourcePage,
    source_page_url: sourcePageUrl,
    event_title: eventTitle,
    event_date: eventDate,
    event_url: eventUrl,
    role: stringValue_(payload.role),
    name: stringValue_(payload.name),
    email: stringValue_(payload.email),
    phone: stringValue_(payload.phone),
    contact: stringValue_(payload.contact),
    organization: stringValue_(payload.organization),
    interest: stringValue_(payload.interest),
    message: stringValue_(payload.message),
    payment_stage: paymentStage,
    payload_json: JSON.stringify(payload, null, 2)
  };
}

function ensureSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetName_();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  const headers = REQUEST_COLUMNS.map(function (item) { return item[1]; });
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
  const row = REQUEST_COLUMNS.map(function (item) {
    return submission[item[0]] || '';
  });
  sheet.appendRow(row);
}

function sendNotificationEmail_(submission) {
  const targetEmail = getTargetEmail_();
  const subjectTail = submission.event_title || formTypeLabel_(submission.form_type);
  const subject = '[МИИИИПС] Новая заявка: ' + subjectTail;
  const body = [
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
    '',
    'Сообщение:',
    submission.message,
    '',
    'Payload JSON:',
    submission.payload_json
  ].join('\n');
  MailApp.sendEmail(targetEmail, subject, body);
  return {
    mode: 'sent',
    to: targetEmail
  };
}

function sendTelegramAlert_(submission, emailResult) {
  const props = PropertiesService.getScriptProperties();
  const token = stringValue_(props.getProperty('TELEGRAM_BOT_TOKEN'));
  const chatId = stringValue_(props.getProperty('TELEGRAM_ALERT_CHAT_ID'));
  const threadId = stringValue_(props.getProperty('TELEGRAM_ALERT_THREAD_ID'));
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

function getSheetName_() {
  const props = PropertiesService.getScriptProperties();
  return stringValue_(props.getProperty('SITE_REQUEST_SHEET_NAME')) || CONFIG.SHEET_NAME;
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
