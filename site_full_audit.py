from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests

SITE_ROOT = Path(__file__).resolve().parent
BASES = {
    "local": "http://127.0.0.1:3007/",
    "github_pages": "https://rublevalexandermsu-design.github.io/miiiips-site/",
}

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.buttons = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs.get('href'))
        if tag == 'button':
            self.buttons.append({k:v for k,v in attrs.items()})


def is_internal(link: str, base: str) -> bool:
    if not link or link.startswith(('#','mailto:','tel:','javascript:','data:')):
        return False
    parsed = urlparse(urljoin(base, link))
    base_host = urlparse(base).netloc
    return parsed.netloc == base_host


def normalize(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path or '/'
    if path == '':
        path = '/'
    return parsed._replace(fragment='', query='').geturl()


def audit(base_name: str, base_url: str):
    seed = [urljoin(base_url, page) for page in [
        'index.html','about.html','research.html','social-projects.html','education-ai.html','publications.html',
        'grants-teams.html','conferences.html','join.html','knowledge-base.html','scientific-supervision.html',
        'contacts-partners.html','course-ei.html','course-ei-catalog.html','course-ei-program.html','course-ei-library.html',
        'course-ei-lectures.html','news-feed.html','payment-demo.html','accounts.html','account-author.html',
        'account-student.html','account-supervisor.html','account-editor.html','account-coordinator.html'
    ]]
    seen = set()
    queue = seed[:]
    report = {'base': base_name, 'ok': [], 'broken': [], 'external': [], 'buttons_with_onclick': []}
    session = requests.Session()
    while queue:
        url = normalize(queue.pop(0))
        if url in seen:
            continue
        seen.add(url)
        try:
            resp = session.get(url, timeout=15)
            status = resp.status_code
        except Exception as exc:
            report['broken'].append({'url': url, 'error': str(exc)})
            continue
        if status != 200:
            report['broken'].append({'url': url, 'status': status})
            continue
        report['ok'].append(url)
        ctype = resp.headers.get('content-type','')
        if 'text/html' not in ctype:
            continue
        parser = LinkParser()
        parser.feed(resp.text)
        for btn in parser.buttons:
            if 'onclick' in btn:
                report['buttons_with_onclick'].append({'url': url, 'onclick': btn['onclick'][:120]})
        for link in parser.links:
            if is_internal(link, base_url):
                full = normalize(urljoin(base_url, link))
                if full not in seen and full not in queue:
                    queue.append(full)
            elif link.startswith(('http://','https://')):
                report['external'].append({'from': url, 'to': link})
    return report

if __name__ == '__main__':
    out = {name: audit(name, base) for name, base in BASES.items()}
    path = SITE_ROOT / '_full_audit_report.json'
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: {'ok': len(v['ok']), 'broken': len(v['broken']), 'onclick_buttons': len(v['buttons_with_onclick'])} for k,v in out.items()}, ensure_ascii=False, indent=2))
    print(f'Report written to: {path}')
