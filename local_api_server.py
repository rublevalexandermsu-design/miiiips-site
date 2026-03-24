from __future__ import annotations

import base64
import json
import os
import sys
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
    sheet_name = config.get('sheet_name', 'Заявки')
    if not spreadsheet_id:
        spreadsheet = sheets.spreadsheets().create(body={
            'properties': {'title': spreadsheet_title},
            'sheets': [{'properties': {'title': sheet_name}}],
        }).execute()
        spreadsheet_id = spreadsheet['spreadsheetId']
        state['spreadsheet_id'] = spreadsheet_id
        save_json(STATE_FILE, state)
        header = [[
            'created_at', 'form_type', 'source_page', 'role', 'name', 'email', 'organization', 'interest',
            'message', 'payload_json'
        ]]
        sheets.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=f'{sheet_name}!A1',
            valueInputOption='USER_ENTERED',
            insertDataOption='INSERT_ROWS',
            body={'values': header},
        ).execute()
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
    row = [[
        submission.get('created_at', ''),
        submission.get('form_type', ''),
        submission.get('source_page', ''),
        submission.get('role', ''),
        submission.get('name', ''),
        submission.get('email', ''),
        submission.get('organization', ''),
        submission.get('interest', ''),
        submission.get('message', ''),
        json.dumps(submission.get('payload', {}), ensure_ascii=False),
    ]]
    sheets.spreadsheets().values().append(
        spreadsheetId=sheet_state['spreadsheet_id'],
        range=f"{sheet_state['sheet_name']}!A1",
        valueInputOption='USER_ENTERED',
        insertDataOption='INSERT_ROWS',
        body={'values': row},
    ).execute()
    return {k: v for k, v in sheet_state.items() if k != 'service'}


def make_email_body(submission, target_email):
    lines = [
        'Новая заявка с сайта МИИИИПС',
        '',
        f"Тип формы: {submission.get('form_type', '')}",
        f"Страница: {submission.get('source_page', '')}",
        f"Роль: {submission.get('role', '')}",
        f"Имя: {submission.get('name', '')}",
        f"Email: {submission.get('email', '')}",
        f"Организация: {submission.get('organization', '')}",
        f"Интерес: {submission.get('interest', '')}",
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
    subject = f"[МИИИИПС] Новая заявка: {submission.get('form_type', 'site-form')}"
    body = make_email_body(submission, target_email)
    message = make_gmail_message(profile_email, target_email, subject, body)
    try:
        result = gmail.users().messages().send(userId='me', body=message).execute()
        return {'mode': 'sent', 'id': result.get('id'), 'to': target_email or profile_email}
    except HttpError:
        draft = gmail.users().drafts().create(userId='me', body={'message': message}).execute()
        return {'mode': 'draft', 'id': draft.get('id'), 'to': target_email or profile_email}


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
            'role': payload.get('role', ''),
            'name': payload.get('name', ''),
            'email': payload.get('email', ''),
            'organization': payload.get('organization', ''),
            'interest': payload.get('interest', ''),
            'message': payload.get('message', ''),
            'payload': payload,
        }
        append_jsonl(SUBMISSIONS_FILE, submission)
        sheet_result = append_sheet_row(self.config, submission)
        email_result = send_or_draft_email(self.config, submission)
        return self.respond_json({
            'ok': True,
            'submission': submission,
            'sheet': sheet_result,
            'email': email_result,
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
