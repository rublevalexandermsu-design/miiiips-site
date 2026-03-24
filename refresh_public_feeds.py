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
}
MOONN_URL = 'https://moonn.ru/'
TELEGRAM_URL = 'https://t.me/s/moonn_official'


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
    moonn = fetch_moonn_updates()
    telegram = fetch_telegram_updates()
    ticker = []
    for item in moonn[:2] + telegram[:2] + psychology[:3] + policy[:2]:
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
        'moonnUpdates': moonn,
        'telegramUpdates': telegram,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Wrote', OUT)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
