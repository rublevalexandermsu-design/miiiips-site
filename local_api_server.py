from __future__ import annotations

import base64
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from email.message import EmailMessage
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

HOST = '127.0.0.1'
PORT = 3007
SITE_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = SITE_ROOT / 'local_api_config.json'
DEFAULT_CONFIG_PATH = SITE_ROOT / 'local_api_config.sample.json'
STATE_FILE = SITE_ROOT / 'runtime' / 'local_api_state.json'
SUBMISSIONS_FILE = SITE_ROOT / 'runtime' / 'submissions.jsonl'
SITE_CONTENT_FILE = SITE_ROOT / 'assets' / 'data' / 'site-content.json'

GOOGLE_AVAILABLE = True
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except Exception:
    GOOGLE_AVAILABLE = False
    Request = Credentials = InstalledAppFlow = build = HttpError = None

GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
]
SHEETS_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
]
SITE_REQUEST_COLUMNS = [
    ('created_at', 'Дата заявки'),
    ('form_type', 'Тип заявки'),
    ('request_kind', 'Сценарий'),
    ('source_page', 'Страница'),
    ('source_page_url', 'URL страницы'),
    ('event_title', 'Мероприятие'),
    ('event_date', 'Дата мероприятия'),
    ('event_url', 'Ссылка на мероприятие'),
    ('role', 'Роль'),
    ('name', 'Имя'),
    ('email', 'Email'),
    ('phone', 'Телефон'),
    ('contact', 'Контакт'),
    ('organization', 'Организация'),
    ('interest', 'Интерес'),
    ('message', 'Сообщение'),
    ('payment_stage', 'Оплата / следующий шаг'),
    ('payload_json', 'Payload JSON'),
]
SITE_REQUEST_HEADERS = [label for _, label in SITE_REQUEST_COLUMNS]


def load_json(path: Path, fallback):
    if path.exists():
        return json.loads(path.read_text(encoding='utf-8'))
    return fallback


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def get_config():
    cfg = load_json(DEFAULT_CONFIG_PATH, {})
    cfg.update(load_json(CONFIG_PATH, {}))
    cfg.setdefault('runtime_dir', str(SITE_ROOT / 'runtime'))
    cfg.setdefault('site_root', str(SITE_ROOT))
    cfg.setdefault('local_api_base', f'http://{HOST}:{PORT}')
    cfg.setdefault('sheet_name', 'Заявки с сайта')
    cfg.setdefault('telegram_alert_chat_id', 0)
    cfg.setdefault('telegram_alert_thread_id', 2342)
    cfg.setdefault('telegram_alert_env_path', str((SITE_ROOT.parent.parent / 'projects' / 'telegram_materials_bot' / '.env').resolve()))
    return cfg


def append_jsonl(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('a', encoding='utf-8') as fh:
        fh.write(json.dumps(payload, ensure_ascii=False) + '\n')


def load_google_credentials(credentials_path: str, token_path: str, scopes: list[str]):
    if not GOOGLE_AVAILABLE:
        return None
    credentials_path = os.path.expanduser(credentials_path)
    token_path = os.path.expanduser(token_path)
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, scopes)
    if not creds or not creds.valid:
        try:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(credentials_path):
                    return None
                flow = InstalledAppFlow.from_client_secrets_file(credentials_path, scopes)
                creds = flow.run_local_server(port=0)
            Path(token_path).write_text(creds.to_json(), encoding='utf-8')
        except Exception:
            return None
    return creds


def get_gmail_services(config):
    creds = load_google_credentials(config.get('gmail_credentials', ''), config.get('gmail_token', ''), GMAIL_SCOPES)
    if not creds:
        return None, None
    gmail = build('gmail', 'v1', credentials=creds)
    profile = gmail.users().getProfile(userId='me').execute()
    return gmail, profile.get('emailAddress', '')


def get_sheets_service(config):
    creds = load_google_credentials(config.get('sheets_credentials', ''), config.get('sheets_token', ''), SHEETS_SCOPES)
    if not creds:
        return None
    return build('sheets', 'v4', credentials=creds)


def sheet_name_for_submission(config, submission):
    if submission.get('form_type') in {'event_video_request', 'event_speaker_invite'}:
        return str(config.get('site_request_sheet_name') or config.get('sheet_name') or 'Заявки с сайта')
    return str(config.get('sheet_name') or 'Заявки с сайта')


def ensure_sheet_headers(sheets, spreadsheet_id: str, sheet_name: str, headers: list[str]):
    meta = sheets.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    existing_titles = {
        str(sheet.get('properties', {}).get('title') or '').strip()
        for sheet in meta.get('sheets', [])
    }
    normalized_sheet_name = str(sheet_name or '').strip()
    if normalized_sheet_name not in existing_titles:
        try:
            sheets.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': [{'addSheet': {'properties': {'title': normalized_sheet_name}}}]},
            ).execute()
        except Exception as exc:
            if 'already exists' not in str(exc).lower():
                raise
    sheets.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f'{normalized_sheet_name}!A1',
        valueInputOption='USER_ENTERED',
        body={'values': [headers]},
    ).execute()


def ensure_sheet(config):
    try:
        sheets = get_sheets_service(config)
    except Exception:
        return {'mode': 'unavailable'}
    if not sheets:
        return {'mode': 'unavailable'}
    state = load_json(STATE_FILE, {})
    spreadsheet_id = state.get('spreadsheet_id')
    spreadsheet_title = config.get('spreadsheet_title', 'МИИИИПС — Заявки сайта')
    sheet_name = config.get('sheet_name', 'Заявки с сайта')
    if not spreadsheet_id:
        spreadsheet = sheets.spreadsheets().create(body={
            'properties': {'title': spreadsheet_title},
            'sheets': [{'properties': {'title': sheet_name}}],
        }).execute()
        spreadsheet_id = spreadsheet['spreadsheetId']
        state['spreadsheet_id'] = spreadsheet_id
        save_json(STATE_FILE, state)
    ensure_sheet_headers(sheets, spreadsheet_id, sheet_name, SITE_REQUEST_HEADERS)
    return {
        'mode': 'ready',
        'spreadsheet_id': spreadsheet_id,
        'sheet_name': sheet_name,
        'url': f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit',
        'service': sheets,
    }


def append_sheet_row(config, submission):
    sheet_state = ensure_sheet(config)
    if sheet_state.get('mode') != 'ready':
        return sheet_state
    sheets = sheet_state['service']
    sheet_name = sheet_name_for_submission(config, submission)
    ensure_sheet_headers(sheets, sheet_state['spreadsheet_id'], sheet_name, SITE_REQUEST_HEADERS)
    row = [[str(submission.get(key, '')) for key, _ in SITE_REQUEST_COLUMNS]]
    sheets.spreadsheets().values().append(
        spreadsheetId=sheet_state['spreadsheet_id'],
        range=f"{sheet_name}!A1",
        valueInputOption='USER_ENTERED',
        insertDataOption='INSERT_ROWS',
        body={'values': row},
    ).execute()
    payload = {k: v for k, v in sheet_state.items() if k != 'service'}
    payload['sheet_name'] = sheet_name
    return payload


def form_type_label(form_type: str) -> str:
    mapping = {
        'event_video_request': 'Запрос видео',
        'event_speaker_invite': 'Приглашение лектора',
        'event_signup': 'Заявка на участие в событии',
        'course_enrollment': 'Заявка на программу',
        'publication_support': 'Публикационный запрос',
        'grant_participation': 'Грантовая заявка',
        'newsletter_subscription': 'Подписка',
    }
    return mapping.get(str(form_type or '').strip(), str(form_type or 'Заявка с сайта'))


def make_email_body(submission, target_email):
    lines = [
        'Новая заявка с сайта МИИИИПС',
        '',
        f"Тип формы: {form_type_label(submission.get('form_type', ''))}",
        f"Сценарий: {submission.get('request_kind', '')}",
        f"Страница: {submission.get('source_page', '')}",
        f"URL страницы: {submission.get('source_page_url', '')}",
        f"Мероприятие: {submission.get('event_title', '')}",
        f"Дата мероприятия: {submission.get('event_date', '')}",
        f"URL мероприятия: {submission.get('event_url', '')}",
        f"Роль: {submission.get('role', '')}",
        f"Имя: {submission.get('name', '')}",
        f"Email: {submission.get('email', '')}",
        f"Телефон: {submission.get('phone', '')}",
        f"Контакт: {submission.get('contact', '')}",
        f"Организация: {submission.get('organization', '')}",
        f"Интерес: {submission.get('interest', '')}",
        f"Оплата / следующий шаг: {submission.get('payment_stage', '')}",
        '',
        'Сообщение:',
        submission.get('message', ''),
        '',
        'JSON payload:',
        json.dumps(submission.get('payload', {}), ensure_ascii=False, indent=2),
    ]
    return '\n'.join(lines)


def make_gmail_message(from_email, to_email, subject, body):
    msg = EmailMessage()
    msg['To'] = to_email
    if from_email:
        msg['From'] = from_email
    msg['Subject'] = subject
    msg.set_content(body)
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
    return {'raw': raw}


def send_or_draft_email(config, submission):
    try:
        gmail, profile_email = get_gmail_services(config)
    except Exception:
        return {'mode': 'unavailable'}
    if not gmail:
        return {'mode': 'unavailable'}
    target_email = (config.get('target_email') or profile_email or '').strip()
    event_title = str(submission.get('event_title') or '').strip()
    subject_tail = event_title or submission.get('form_type', 'site-form')
    subject = f"[МИИИИПС] Новая заявка: {subject_tail}"
    body = make_email_body(submission, target_email)
    message = make_gmail_message(profile_email, target_email, subject, body)
    try:
        result = gmail.users().messages().send(userId='me', body=message).execute()
        return {'mode': 'sent', 'id': result.get('id'), 'to': target_email or profile_email}
    except HttpError:
        draft = gmail.users().drafts().create(userId='me', body={'message': message}).execute()
        return {'mode': 'draft', 'id': draft.get('id'), 'to': target_email or profile_email}


def load_bot_token_from_env(env_path: str) -> str:
    path = os.path.expanduser(env_path or '')
    if not path or not os.path.exists(path):
        return ''
    try:
        for raw_line in Path(path).read_text(encoding='utf-8').splitlines():
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            if key.strip() == 'TELEGRAM_BOT_TOKEN':
                return value.strip().strip('"').strip("'")
    except Exception:
        return ''
    return ''


def make_telegram_text(submission, sheet_result, email_result):
    lines = [
        'Новая заявка с сайта МИИИИПС',
        '',
        f"Тип: {form_type_label(submission.get('form_type', ''))}",
    ]
    if submission.get('event_title'):
        lines.append(f"Мероприятие: {submission.get('event_title')}")
    if submission.get('event_date'):
        lines.append(f"Дата: {submission.get('event_date')}")
    if submission.get('event_url'):
        lines.append(f"Ссылка на событие: {submission.get('event_url')}")
    if submission.get('name'):
        lines.append(f"Имя: {submission.get('name')}")
    if submission.get('organization'):
        lines.append(f"Организация: {submission.get('organization')}")
    if submission.get('email'):
        lines.append(f"Email: {submission.get('email')}")
    if submission.get('phone'):
        lines.append(f"Телефон: {submission.get('phone')}")
    if submission.get('contact'):
        lines.append(f"Контакт: {submission.get('contact')}")
    if submission.get('interest'):
        lines.append(f"Интерес: {submission.get('interest')}")
    if submission.get('message'):
        lines.extend(['', 'Сообщение:', str(submission.get('message'))[:900]])
    if sheet_result.get('url'):
        lines.extend(['', f"Google Sheet: {sheet_result.get('url')}"])
    if email_result.get('to'):
        lines.append(f"Email-уведомление: {email_result.get('to')}")
    return '\n'.join(lines)


def send_telegram_alert(config, submission, sheet_result, email_result):
    token = load_bot_token_from_env(str(config.get('telegram_alert_env_path') or ''))
    chat_id = int(config.get('telegram_alert_chat_id') or 0)
    thread_id = int(config.get('telegram_alert_thread_id') or 0)
    if not token or not chat_id:
        return {'mode': 'unavailable'}
    payload = {
        'chat_id': str(chat_id),
        'text': make_telegram_text(submission, sheet_result, email_result),
        'disable_web_page_preview': 'true',
    }
    if thread_id:
        payload['message_thread_id'] = str(thread_id)
    data = urllib.parse.urlencode(payload).encode('utf-8')
    request = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode('utf-8') or '{}')
        return {'mode': 'sent', 'ok': bool(body.get('ok')), 'message_id': (body.get('result') or {}).get('message_id')}
    except Exception as exc:
        return {'mode': 'failed', 'error': str(exc)}


class PrototypeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self.config = get_config()
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    def log_message(self, fmt, *args):
        sys.stdout.write((fmt % args) + '\n')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/health'):
            return self.respond_json({'ok': True, 'time': datetime.now().isoformat(), 'site_root': str(SITE_ROOT)})
        if self.path.startswith('/api/site-data'):
            data = load_json(SITE_CONTENT_FILE, {})
            sheet_state = ensure_sheet(self.config)
            data.setdefault('meta', {})['formsTarget'] = sheet_state.get('url', '')
            return self.respond_json(data)
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith('/api/forms'):
            self.send_error(HTTPStatus.NOT_FOUND, 'Unknown API endpoint')
            return
        length = int(self.headers.get('Content-Length', '0') or '0')
        raw = self.rfile.read(length) if length else b''
        ctype = self.headers.get('Content-Type', '')
        payload = {}
        if 'application/json' in ctype:
            payload = json.loads(raw.decode('utf-8') or '{}')
        else:
            payload = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in parse_qs(raw.decode('utf-8')).items()}
        submission = {
            'created_at': datetime.now().isoformat(timespec='seconds'),
            'form_type': payload.get('formType') or payload.get('form_type') or 'generic_form',
            'source_page': payload.get('sourcePage') or payload.get('source_page') or self.headers.get('Referer', ''),
            'source_page_url': payload.get('sourcePageUrl') or payload.get('source_page_url') or self.headers.get('Referer', ''),
            'event_title': payload.get('event_title') or payload.get('eventTitle') or '',
            'event_date': payload.get('event_date') or payload.get('eventDate') or '',
            'event_url': payload.get('event_url') or payload.get('eventUrl') or '',
            'request_kind': form_type_label(payload.get('formType') or payload.get('form_type') or 'generic_form'),
            'role': payload.get('role', ''),
            'name': payload.get('name', ''),
            'email': payload.get('email', ''),
            'phone': payload.get('phone', ''),
            'contact': payload.get('contact', ''),
            'organization': payload.get('organization', ''),
            'interest': payload.get('interest', ''),
            'message': payload.get('message', ''),
            'payment_stage': payload.get('payment_stage') or payload.get('paymentStage') or 'Ожидает ручного follow-up',
            'payload': payload,
            'payload_json': json.dumps(payload, ensure_ascii=False),
        }
        append_jsonl(SUBMISSIONS_FILE, submission)
        sheet_result = append_sheet_row(self.config, submission)
        email_result = send_or_draft_email(self.config, submission)
        telegram_result = send_telegram_alert(self.config, submission, sheet_result, email_result)
        return self.respond_json({
            'ok': True,
            'submission': submission,
            'sheet': sheet_result,
            'email': email_result,
            'telegram': telegram_result,
        })

    def respond_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)


def main():
    handler = partial(PrototypeHandler, directory=str(SITE_ROOT))
    with ThreadingHTTPServer((HOST, PORT), handler) as server:
        print(f'МИИИИПС local API server: http://{HOST}:{PORT}/index.html', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()
