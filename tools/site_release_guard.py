from __future__ import annotations

import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    'accounts.html', 'account-author.html', 'account-student.html', 'account-supervisor.html',
    'account-editor.html', 'account-coordinator.html', 'course-ei.html', 'grants-teams.html',
    'conferences.html', 'research-sandbox.html', 'publications.html', 'biomechanics-rowing.html'
]
BANNED = ['manual_gate','blocked_access','jsonl','manifest','package','workflow','review-заметки','prototype','metadata','guard','ready_for_page','next steps','closure report','authorid','trackid','journalid','submissionid']
PLACEHOLDERS = ['будет добавлена позже','временно недоступ']
errors = []
for rel in TARGETS:
    soup = BeautifulSoup((ROOT / rel).read_text(encoding='utf-8'), 'html.parser')
    for tag in soup(['script', 'style']):
        tag.extract()
    text = soup.get_text(' ', strip=True).lower()
    for token in BANNED:
        if token in text:
            errors.append(f'{rel}: banned token: {token}')
    for token in PLACEHOLDERS:
        if token in text:
            errors.append(f'{rel}: placeholder text: {token}')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('site_release_guard: ok')
