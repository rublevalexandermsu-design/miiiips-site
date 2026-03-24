from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import quote_plus

import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets' / 'data' / 'live-feeds.json'

GOOGLE_NEWS = 'https://news.google.com/rss/search?q={query}&hl=ru&gl=RU&ceid=RU:ru'
QUERIES = {
    'psychologyTrends': 'психология тренды OR эмоциональный интеллект OR психология обучения',
    'educationPolicy': 'высшее образование закон OR студенты OR дополнительное образование OR вуз',
    'conferenceUpdates': 'конференция психология искусственный интеллект OR конференция спортивная психология OR конференция эмоциональный интеллект',
    'sportAiUpdates': 'спорт искусственный интеллект исследование OR спортивная аналитика OR спортивная психология технологии',
}
MOONN_URL = 'https://moonn.ru/'
TELEGRAM_URL = 'https://t.me/s/moonn_official'
CROSSREF_URL = 'https://api.crossref.org/works?rows={rows}&sort=published&order=desc&query.title={query}'


def clean(text: str) -> str:
    text = unescape(text or '')
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fetch_rss_items(query: str, limit: int = 6) -> list[dict]:
    url = GOOGLE_NEWS.format(query=quote_plus(query))
    response = requests.get(url, timeout=30, headers={'User-Agent': 'Mozilla/5.0'})
    response.raise_for_status()
    root = ET.fromstring(response.text)
    items = []
    for node in root.findall('.//item')[:limit]:
        items.append({
            'title': clean(node.findtext('title', '')),
            'url': clean(node.findtext('link', '')),
            'source': clean(node.findtext('source', 'Google News')),
            'published': clean(node.findtext('pubDate', '')),
            'summary': clean(node.findtext('description', '')),
        })
    return items


def format_crossref_date(parts: list | None) -> str:
    if not parts:
        return ''
    flat = parts[0] if parts and isinstance(parts[0], list) else parts
    try:
        flat = [int(x) for x in flat]
    except Exception:
        return ''
    while len(flat) < 3:
        flat.append(1)
    try:
        return datetime(flat[0], flat[1], flat[2]).date().isoformat()
    except Exception:
        return ''


def fetch_crossref_items(query: str, limit: int = 6) -> list[dict]:
    url = CROSSREF_URL.format(rows=limit, query=quote_plus(query))
    response = requests.get(url, timeout=30, headers={'User-Agent': 'Mozilla/5.0'})
    response.raise_for_status()
    payload = response.json().get('message', {}).get('items', [])
    items = []
    for node in payload[:limit]:
        title = clean(' '.join(node.get('title', [])[:1]))
        if not title:
            continue
        authors = []
        for author in node.get('author', [])[:3]:
            family = clean(author.get('family', ''))
            given = clean(author.get('given', ''))
            full = ' '.join(part for part in [given, family] if part).strip()
            if full:
                authors.append(full)
        journal = clean(' '.join(node.get('container-title', [])[:1]))
        summary = ' · '.join(filter(None, [', '.join(authors), journal]))[:260]
        items.append({
            'title': title[:180],
            'url': node.get('URL', ''),
            'source': journal or clean(node.get('publisher', 'Crossref')) or 'Crossref',
            'published': format_crossref_date((node.get('issued', {}) or {}).get('date-parts')),
            'summary': summary,
        })
    return items


def fetch_moonn_updates(limit: int = 6) -> list[dict]:
    html = requests.get(MOONN_URL, timeout=30, headers={'User-Agent': 'Mozilla/5.0'}).text
    matches = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, flags=re.S | re.I)
    seen = set()
    updates = []
    for href, raw_text in matches:
        text = clean(raw_text)
        if not text:
            continue
        if 'Татьяна Мунн' not in text and 'Новости:' not in text and 'лекц' not in text.lower() and 'выступ' not in text.lower():
            continue
        if href.startswith('/'):
            href = 'https://moonn.ru' + href
        key = (href, text)
        if key in seen:
            continue
        seen.add(key)
        updates.append({
            'title': text[:180],
            'url': href,
            'source': 'moonn.ru',
            'published': '',
            'summary': text[:260],
        })
        if len(updates) >= limit:
            break
    return updates




def fetch_telegram_updates(limit: int = 6) -> list[dict]:
    html = requests.get(TELEGRAM_URL, timeout=30, headers={'User-Agent': 'Mozilla/5.0'}).text
    matches = re.findall(r'<div class="tgme_widget_message_wrap.*?<div class="tgme_widget_message_text[^>]*>(.*?)</div>.*?<a class="tgme_widget_message_date" href="([^"]+)"', html, flags=re.S)
    updates = []
    for raw_text, href in matches:
        text = clean(raw_text)
        if not text:
            continue
        lowered = text.lower()
        if 'pinned a photo' in lowered:
            continue
        if not any(token in lowered for token in ['лекц', 'выступ', 'timepad', 'психолог', 'меропр', 'конференц']):
            continue
        updates.append({
            'title': text[:180],
            'url': href,
            'source': 'Telegram',
            'published': '',
            'summary': text[:260],
        })
        if len(updates) >= limit:
            break
    return updates


def main() -> int:
    psychology = fetch_rss_items(QUERIES['psychologyTrends'])
    policy = fetch_rss_items(QUERIES['educationPolicy'])
    conferences = fetch_rss_items(QUERIES['conferenceUpdates'])
    sport_ai = fetch_rss_items(QUERIES['sportAiUpdates'])
    publications = fetch_crossref_items('emotional intelligence psychology artificial intelligence sport', limit=6)
    moonn = fetch_moonn_updates()
    telegram = fetch_telegram_updates()
    ticker = []
    seen = set()
    for item in moonn[:2] + telegram[:2] + conferences[:2] + publications[:2] + psychology[:2] + sport_ai[:2] + policy[:2]:
        key = item.get('url') or item.get('title')
        if not key or key in seen:
            continue
        seen.add(key)
        ticker.append({
            'title': item['title'],
            'url': item['url'],
            'source': item['source'],
        })
    payload = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'ticker': ticker,
        'psychologyTrends': psychology,
        'educationPolicy': policy,
        'conferenceUpdates': conferences,
        'sportAiUpdates': sport_ai,
        'openPublications': publications,
        'moonnUpdates': moonn,
        'telegramUpdates': telegram,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Wrote', OUT)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
