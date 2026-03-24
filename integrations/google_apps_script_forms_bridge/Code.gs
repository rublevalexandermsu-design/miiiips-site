const CONFIG = {
  SHEET_NAME: 'Заявки',
  ALLOWED_ORIGIN: '*'
};

function doOptions() {
  return createCorsResponse({ ok: true });
}

function doGet() {
  return createCorsResponse({ ok: true, status: 'ready', message: 'MIIIIPS form bridge is running' });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['created_at','form_type','source_page','role','name','email','organization','interest','message','payload_json']);
    }
    const createdAt = new Date().toISOString();
    sheet.appendRow([
      createdAt,
      payload.formType || '',
      payload.sourcePage || '',
      payload.role || '',
      payload.name || '',
      payload.email || '',
      payload.organization || '',
      payload.interest || '',
      payload.message || '',
      JSON.stringify(payload)
    ]);

    const subject = '[МИИИИПС] Новая заявка: ' + (payload.formType || 'site_form');
    const body = [
      'Новая заявка с публичного сайта МИИИИПС',
      '',
      'Тип: ' + (payload.formType || ''),
      'Страница: ' + (payload.sourcePage || ''),
      'Роль: ' + (payload.role || ''),
      'Имя: ' + (payload.name || ''),
      'Email: ' + (payload.email || ''),
      'Организация: ' + (payload.organization || ''),
      'Интерес: ' + (payload.interest || ''),
      '',
      'Сообщение:',
      payload.message || '',
      '',
      'Payload JSON:',
      JSON.stringify(payload, null, 2)
    ].join('
');

    MailApp.sendEmail(Session.getActiveUser().getEmail(), subject, body);

    return createCorsResponse({ ok: true, created_at: createdAt, sheet_url: spreadsheet.getUrl() });
  } catch (error) {
    return createCorsResponse({ ok: false, error: String(error) });
  }
}

function createCorsResponse(payload) {
  const out = ContentService.createTextOutput(JSON.stringify(payload));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
