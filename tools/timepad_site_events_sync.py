#!/usr/bin/env python3
"""Sync public Timepad events into the MIIIIPS static site.

The script uses the public Timepad pages of the Institute organization, then
generates deterministic event pages, calendar files, SEO image names, page
manifests and AEO packages. It intentionally treats Timepad as an intake source,
while the static site remains the canonical published layer.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image


SCRIPT_PATH = Path(__file__).resolve()
ROOT_CANDIDATES = [SCRIPT_PATH.parents[index] for index in range(1, min(len(SCRIPT_PATH.parents), 6))]
ROOT = next(
    (
        candidate
        for candidate in ROOT_CANDIDATES
        if (candidate / "projects" / "telegram_materials_bot" / "site_publisher.py").exists()
    ),
    SCRIPT_PATH.parents[1],
)
BOT_ROOT = ROOT / "projects" / "telegram_materials_bot"
PUBLIC_BASE = "https://miiiips.ru"
TIMEPAD_BASE = "https://miiiips.timepad.ru"
TIMEPAD_ORG_ID = "479377"
DEFAULT_SITE_ROOTS = [
    ROOT / "share" / "stitch_site_prototype" / "clickable_site_v1_2",
    ROOT / "miiiips-live-publish",
]

sys.path.insert(0, str(BOT_ROOT))
import site_publisher as sp  # noqa: E402


SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MIIIIPS Timepad site sync",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    }
)

MONTHS_RU = {
    1: "января",
    2: "февраля",
    3: "марта",
    4: "апреля",
    5: "мая",
    6: "июня",
    7: "июля",
    8: "августа",
    9: "сентября",
    10: "октября",
    11: "ноября",
    12: "декабря",
}


def get(url: str) -> requests.Response:
    response = SESSION.get(url, timeout=45)
    response.raise_for_status()
    return response


def meta(soup: BeautifulSoup, property_name: str) -> str:
    node = soup.find("meta", property=property_name) or soup.find("meta", attrs={"name": property_name})
    return html.unescape((node.get("content") or "").strip()) if node else ""


def scrape_timepad_ids(max_pages: int = 10) -> list[str]:
    ids: list[str] = []
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        url = f"{TIMEPAD_BASE}/events/" if page == 1 else f"{TIMEPAD_BASE}/events/?page={page}"
        soup = BeautifulSoup(get(url).text, "html.parser")
        page_ids: list[str] = []
        for link in soup.select('a[href*="/event/"]'):
            href = link.get("href") or ""
            match = re.search(r"/event/(\d+)/", href)
            title = link.get_text(" ", strip=True)
            if not match or not title or title == "Далее":
                continue
            event_id = match.group(1)
            page_ids.append(event_id)
            if event_id not in seen:
                ids.append(event_id)
                seen.add(event_id)
        if page > 1 and not page_ids:
            break
        next_link = soup.find("a", string=re.compile(r"^\s*Следующая|^\s*2\s*$|^\s*3\s*$"))
        if page > 1 and not next_link:
            # Timepad currently returns the final page without a next pager.
            break
    return ids


def event_url(timepad_id: str) -> str:
    return f"{TIMEPAD_BASE}/event/{timepad_id}/"


def parse_topic(og_title: str) -> str:
    title = og_title.split(" / ")[0].strip()
    match = re.search(r"[Лл]екция\s+\"(.+?)\"", title)
    if match:
        return html.unescape(match.group(1)).strip()
    match = re.search(r"\"(.+?)\"", title)
    if match:
        return html.unescape(match.group(1)).strip()
    return re.sub(r"\s+-\s+20\d{2}-\d{2}-\d{2}.*$", "", title).strip()


def unfold_ics(text: str) -> list[str]:
    lines: list[str] = []
    for raw in text.replace("\r\n", "\n").split("\n"):
        if raw.startswith((" ", "\t")) and lines:
            lines[-1] += raw[1:]
        elif raw:
            lines.append(raw)
    return lines


def parse_ics_datetime(line: str) -> datetime:
    _, stamp = line.split(":", 1)
    stamp = stamp.strip()
    if stamp.endswith("Z"):
        return datetime.strptime(stamp, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc).astimezone(
            timezone(timedelta(hours=3))
        )
    return datetime.strptime(stamp, "%Y%m%dT%H%M%S").replace(tzinfo=timezone(timedelta(hours=3)))


def parse_timepad_ics(timepad_id: str) -> dict[str, Any]:
    text = get(f"{TIMEPAD_BASE}/event/export_ical/{timepad_id}/").text
    data: dict[str, Any] = {}
    for line in unfold_ics(text):
        if line.startswith("DTSTART"):
            data["start_dt"] = parse_ics_datetime(line)
        elif line.startswith("DTEND"):
            data["end_dt"] = parse_ics_datetime(line)
        elif line.startswith("LOCATION"):
            data["location"] = html.unescape(line.split(":", 1)[1].replace("\\,", ",").replace("\\n", " ")).strip()
    if "start_dt" not in data or "end_dt" not in data:
        raise RuntimeError(f"Timepad ICS has no DTSTART/DTEND for event {timepad_id}")
    return data


def xp(value: str) -> bytes:
    return (value or "").encode("utf-16le") + b"\x00\x00"


def is_lecture(topic: str) -> bool:
    return "социально-образовательная программа" not in topic.lower() and "soft skills" not in topic.lower()


def series_for_topic(topic: str) -> tuple[str, str, list[str], list[str], str, str]:
    lower = topic.lower()
    if lower.startswith("эмоциональный интеллект"):
        return (
            "Эмоциональный интеллект",
            "эмоционального интеллекта",
            ["emotional_intelligence", "psychology"],
            ["Эмоциональный интеллект", "Психология"],
            "public_lecture",
            "Публичная лекция",
        )
    if not is_lecture(topic):
        return (
            "Социально-образовательные программы",
            "социально-образовательных программ",
            ["emotional_intelligence", "psychology"],
            ["Эмоциональный интеллект", "Психология"],
            "public_event",
            "Отдельное мероприятие",
        )
    return (
        "Психология",
        "психологии отношений",
        ["psychology", "emotional_intelligence"],
        ["Психология", "Эмоциональный интеллект"],
        "public_lecture",
        "Публичная лекция",
    )


def clean_venue(location: str, topic: str) -> str:
    lower = topic.lower()
    if lower.startswith("эмоциональный интеллект") and is_lecture(topic):
        return "Парк ЧерМянка, Москва"
    if not is_lecture(topic):
        return location or "Москва"
    return 'Культурный центр "Полярный", Москва'


def seo_image_filename(topic: str, date_iso: str, timepad_id: str) -> str:
    slug = sp.slugify_latin(topic, fallback=f"event-{timepad_id}")[:72].strip("-")
    return f"{date_iso}_{slug}_psiholog-tatyana-munn-mgu_miiiips_photo-{timepad_id}.jpg"


def build_exif(topic: str, series_label: str, date_str: str, venue: str, source_url: str) -> Image.Exif:
    title = f"{topic}. Психолог Татьяна Мунн МГУ. МИИИИПС"
    keywords = [
        topic,
        series_label,
        "психолог Татьяна Мунн МГУ",
        "Татьяна Мунн МГУ",
        "спикер по эмоциональному интеллекту Татьяна Мунн",
        "эмоциональный интеллект",
        "психология",
        "лекции по психологии",
        "мероприятия МИИИИПС",
        "МИИИИПС",
        venue,
    ]
    exif = Image.Exif()
    exif[270] = f"{topic}. Speaker: Tatiana Moonn, MSU psychologist. MIIIIPS."
    exif[315] = "Tatiana Moonn"
    exif[33432] = "Tatiana Moonn; MIIIIPS"
    exif[40091] = xp(title)
    exif[40092] = xp(
        f"{topic}. Дата: {date_str}. Площадка: {venue}. Источник: {source_url}. "
        "Автор: Татьяна Мунн, психолог МГУ; Tatiana Moonn."
    )
    exif[40093] = xp("Татьяна Мунн, психолог МГУ; Tatiana Moonn; МИИИИПС")
    exif[40094] = xp("; ".join(dict.fromkeys(keywords)))
    exif[40095] = xp(f"{topic}. {series_label}. Татьяна Мунн МГУ. МИИИИПС")
    return exif


def save_seo_image(
    site_root: Path,
    image_url: str,
    topic: str,
    date_iso: str,
    date_str: str,
    venue: str,
    series_label: str,
    source_url: str,
    timepad_id: str,
) -> str:
    image_dir = site_root / "assets" / "images" / "lectures"
    image_dir.mkdir(parents=True, exist_ok=True)
    target_name = seo_image_filename(topic, date_iso, timepad_id)
    target_path = image_dir / target_name
    raw = get(image_url).content
    image = Image.open(BytesIO(raw)).convert("RGB")
    image.save(
        target_path,
        "JPEG",
        quality=92,
        optimize=True,
        exif=build_exif(topic, series_label, date_str, venue, source_url),
    )
    return f"assets/images/lectures/{target_name}"


def write_ics(site_root: Path, event_id: str, title: str, start_dt: datetime, end_dt: datetime, venue: str, page_url: str) -> str:
    target_dir = site_root / "assets" / "calendar"
    target_dir.mkdir(parents=True, exist_ok=True)
    rel = f"assets/calendar/{event_id}.ics"
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MIIIIPS//Events//RU",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        f"UID:{event_id}@miiiips.ru",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART;TZID=Europe/Moscow:{start_dt.strftime('%Y%m%dT%H%M%S')}",
        f"DTEND;TZID=Europe/Moscow:{end_dt.strftime('%Y%m%dT%H%M%S')}",
        f"SUMMARY:{title}",
        f"LOCATION:{venue}",
        f"DESCRIPTION:Событие на сайте: {page_url}",
        f"URL:{page_url}",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
    ]
    (site_root / rel).write_text("\n".join(lines), encoding="utf-8")
    return rel


def build_intro(topic: str, series_label: str, venue: str, start_dt: datetime, end_dt: datetime) -> list[str]:
    date_ru = f"{start_dt.day} {MONTHS_RU[start_dt.month]} {start_dt.year} года"
    if series_label == "Социально-образовательные программы":
        return [
            (
                f"Мероприятие «{topic}» начинается {date_ru} на площадке {venue}. "
                "Ведущая — Татьяна Мунн, психолог МГУ и эксперт в области эмоционального интеллекта."
            ),
            (
                "Программа помогает подросткам развивать саморегуляцию, коммуникацию, самостоятельность, "
                "эмоциональную устойчивость и навыки взаимодействия в группе."
            ),
        ]
    if series_label == "Эмоциональный интеллект":
        second = (
            "Цикл помогает разобраться, как эмоциональный интеллект влияет на здоровье, отношения, обучение, "
            "цифровую среду и способность поддерживать устойчивое состояние."
        )
    else:
        second = (
            "Цикл помогает разобраться, как устроены близкие отношения: выбор партнёра, знакомство, любовь, "
            "долгие отношения, кризисы, личные границы и конфликты."
        )
    return [
        (
            f"Лекция «{topic}» проходит {date_ru} с {start_dt.strftime('%H:%M')} до {end_dt.strftime('%H:%M')} "
            f"на площадке {venue}. Лектор — Татьяна Мунн, психолог МГУ и эксперт в области эмоционального интеллекта."
        ),
        second,
    ]


def build_key_points(topic: str, series_label: str, venue: str, source_url: str) -> list[dict[str, str]]:
    if series_label == "Социально-образовательные программы":
        return [
            {"title": "Фокус программы", "body": f"Тема события — «{topic}» в рамках образовательной работы с подростками."},
            {"title": "Ведущая", "body": "Татьяна Мунн — психолог МГУ, спикер по эмоциональному интеллекту и ведущая программ МИИИИПС."},
            {"title": "Площадка", "body": venue},
            {"title": "Источник", "body": f"Регистрация и первичный анонс опубликованы на Timepad: {source_url}"},
        ]
    return [
        {"title": "Тема встречи", "body": f"Фокус лекции — «{topic}» в контексте цикла «{series_label}»."},
        {"title": "Лектор", "body": "Татьяна Мунн — психолог МГУ, спикер и эксперт по эмоциональному интеллекту."},
        {"title": "Площадка", "body": venue},
        {"title": "Источник", "body": f"Регистрация и первичный анонс опубликованы на Timepad: {source_url}"},
    ]


def make_keywords(topic: str, series_label: str, venue: str) -> list[str]:
    return [
        topic,
        series_label,
        "Татьяна Мунн",
        "Татьяна Мунн МГУ",
        "психолог Татьяна Мунн МГУ",
        "спикер по эмоциональному интеллекту Татьяна Мунн",
        "эмоциональный интеллект",
        "психология",
        "мероприятия МИИИИПС",
        "МИИИИПС",
        venue,
        sp.slugify_latin(f"{topic} psiholog tatyana munn mgu miiiips"),
    ]


def build_event_payload(site_root: Path, timepad_id: str, soup: BeautifulSoup, ics: dict[str, Any], image_rel: str) -> dict[str, Any]:
    url = event_url(timepad_id)
    topic = parse_topic(meta(soup, "og:title"))
    og_description = meta(soup, "og:description")
    start_dt: datetime = ics["start_dt"]
    end_dt: datetime = ics["end_dt"]
    series_label, series_label_genitive, directions, direction_labels, event_type, event_type_label = series_for_topic(topic)
    venue = clean_venue(str(ics.get("location") or ""), topic)
    event_id = f"{sp.slugify_latin(topic)}-{start_dt.strftime('%d%m%Y')}"
    page_name = f"event-{event_id}.html"
    page_url = f"{PUBLIC_BASE}/{page_name}"
    date_str = start_dt.strftime("%d.%m.%Y")
    public_title = f'Бесплатная лекция "{topic}"' if event_type == "public_lecture" else topic
    summary = og_description or f"{public_title} пройдет {date_str} на площадке {venue}."
    calendar_file = write_ics(site_root, event_id, public_title, start_dt, end_dt, venue, page_url)
    keywords = make_keywords(topic, series_label, venue)
    return {
        "id": event_id,
        "title": public_title,
        "type": event_type,
        "typeLabel": event_type_label,
        "status": "upcoming",
        "statusLabel": "Анонс",
        "start": start_dt.strftime("%Y-%m-%dT%H:%M:%S+03:00"),
        "end": end_dt.strftime("%Y-%m-%dT%H:%M:%S+03:00"),
        "venue": venue,
        "speaker": "Татьяна Мунн",
        "opponent": f'Цикл "{series_label}"' if event_type == "public_lecture" else "Социально-образовательная программа",
        "directions": directions,
        "directionLabels": direction_labels,
        "summary": summary,
        "detailPage": page_name,
        "registrationPage": url,
        "calendarFile": calendar_file,
        "timepad": url,
        "timepadOrgId": TIMEPAD_ORG_ID,
        "theme": "teal",
        "linkedCourse": "ei-core",
        "linkedResearch": "sandbox-hub",
        "linkedPublication": "article-softskills-lab",
        "materials": ["timepad", "public-program", "calendar", "seo-image", "video-slot-reserved"],
        "image": image_rel,
        "imageCaption": "Фото мероприятия",
        "imageAlt": f"{topic}. Психолог Татьяна Мунн МГУ. МИИИИПС",
        "pageManifestUrl": f"{PUBLIC_BASE}/assets/data/page-manifests/{event_id}.json",
        "pageUrl": page_url,
        "feedbackUrl": f"{PUBLIC_BASE}/event-feedback-{event_id}.html",
        "seoKeywords": keywords,
        "sourceLinks": [url],
        "sourceLink": url,
        "previewVideo": "",
        "previewVideoTitle": f"Видео-анонс: {topic}",
        "_topic": topic,
        "_date_str": date_str,
        "_start_time": start_dt.strftime("%H:%M"),
        "_end_time": end_dt.strftime("%H:%M"),
        "_series_label": series_label,
        "_series_label_genitive": series_label_genitive,
    }


def render_page(site_root: Path, event: dict[str, Any]) -> None:
    event_id = str(event["id"])
    topic = str(event["_topic"])
    series_label = str(event["_series_label"])
    page_url = str(event["pageUrl"])
    image_rel = str(event["image"])
    image_url = f"{PUBLIC_BASE}/{image_rel}"
    schema = sp.build_page_schema_json_ld(
        title=str(event["title"]),
        lead=str(event["summary"]),
        date_str=str(event["_date_str"]),
        venue=str(event["venue"]),
        page_public_url=page_url,
        photo_public_url=image_url,
        series_label=series_label,
        lecturer="Татьяна Мунн",
        source_link=str(event["timepad"]),
        source_links=list(event["sourceLinks"]),
        seo_keywords=list(event["seoKeywords"]),
        page_manifest_url=str(event["pageManifestUrl"]),
        preview_video_title=str(event["previewVideoTitle"]),
        start_time=str(event["_start_time"]),
        end_time=str(event["_end_time"]),
    )
    start_dt = datetime.fromisoformat(str(event["start"]))
    end_dt = datetime.fromisoformat(str(event["end"]))
    html_text = sp.build_page_html(
        event_id=event_id,
        title=str(event["title"]),
        lead=str(event["summary"]),
        date_str=str(event["_date_str"]),
        venue=str(event["venue"]),
        lecturer="Татьяна Мунн",
        overview_title=topic,
        intro=build_intro(topic, series_label, str(event["venue"]), start_dt, end_dt),
        key_points=build_key_points(topic, series_label, str(event["venue"]), str(event["timepad"])),
        photo_rel=image_rel,
        series_label=series_label,
        series_label_genitive=str(event["_series_label_genitive"]),
        feedback_page=f"event-feedback-{event_id}.html",
        source_link=str(event["timepad"]),
        source_links=list(event["sourceLinks"]),
        page_public_url=page_url,
        photo_public_url=image_url,
        page_manifest_url=str(event["pageManifestUrl"]),
        agent_brief_url=f"{PUBLIC_BASE}/assets/data/aeo-seo/packages/{event_id}.json",
        content_pack_url=f"{PUBLIC_BASE}/assets/data/aeo-seo/packages/{event_id}.json",
        answer_summary=sp.event_answer_summary(event),
        primary_entity=sp.event_primary_entity(event),
        schema_json_ld=schema,
        seo_keywords=list(event["seoKeywords"]),
        preview_video_rel="",
        preview_video_title=str(event["previewVideoTitle"]),
        status_label="Анонс",
    )
    actions = (
        '<div class="hero-actions">'
        f'<a class="btn secondary" href="{html.escape(str(event["calendarFile"]))}">Добавить в календарь</a>'
        f'<a class="btn primary" href="{html.escape(str(event["timepad"]))}" target="_blank" rel="noreferrer">Регистрация на Timepad</a>'
        '<a class="btn secondary" href="#topics">К ключевым положениям</a>'
        f'<a class="btn secondary" href="event-feedback-{html.escape(event_id)}.html">Оставить отзыв</a>'
        "</div>"
    )
    html_text = re.sub(
        r'<div class="hero-actions"><a class="btn secondary" href="conferences\.html">.*?</div>',
        actions,
        html_text,
        count=1,
        flags=re.S,
    )
    (site_root / str(event["detailPage"])).write_text(html_text, encoding="utf-8")


def public_event(event: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in event.items() if not key.startswith("_")}


def write_manifest_and_package(site_root: Path, event: dict[str, Any]) -> None:
    clean = public_event(event)
    event_id = str(clean["id"])
    manifest_dir = site_root / "assets" / "data" / "page-manifests"
    package_dir = site_root / "assets" / "data" / "aeo-seo" / "packages"
    manifest_dir.mkdir(parents=True, exist_ok=True)
    package_dir.mkdir(parents=True, exist_ok=True)
    (manifest_dir / f"{event_id}.json").write_text(
        json.dumps(sp.build_event_manifest_payload(clean, PUBLIC_BASE), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (package_dir / f"{event_id}.json").write_text(
        json.dumps(sp.build_aeo_seo_package_payload(clean, PUBLIC_BASE), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def upsert_events(site_root: Path, new_events: list[dict[str, Any]]) -> list[tuple[str, str]]:
    events_path = site_root / "assets" / "data" / "events.json"
    payload = json.loads(events_path.read_text(encoding="utf-8"))
    events = payload.get("events", [])
    by_id = {event.get("id"): event for event in events if isinstance(event, dict)}
    renamed: list[tuple[str, str]] = []
    for event in new_events:
        clean = public_event(event)
        existing = by_id.get(clean["id"])
        if existing:
            old_image = str(existing.get("image") or "")
            if old_image and old_image != clean.get("image"):
                renamed.append((old_image, str(clean.get("image") or "")))
            existing.update(clean)
        else:
            events.append(clean)
            by_id[clean["id"]] = clean
    events.sort(key=lambda item: (str(item.get("start") or ""), str(item.get("id") or "")))
    payload["events"] = events
    events_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return renamed


def update_index_files(site_root: Path) -> None:
    events_path = site_root / "assets" / "data" / "events.json"
    (site_root / "image-sitemap.xml").write_text(sp.build_image_sitemap_xml(events_path, PUBLIC_BASE), encoding="utf-8")
    (site_root / "llms.txt").write_text(sp.build_llms_txt(events_path, PUBLIC_BASE), encoding="utf-8")
    (site_root / "assets" / "data" / "conferences.json").write_text(
        sp.build_conference_index_json(events_path, PUBLIC_BASE), encoding="utf-8"
    )
    sp.write_page_manifests(site_root, PUBLIC_BASE, events_path)
    sp.write_marketing_index_files(site_root, PUBLIC_BASE, events_path)


def cleanup_renamed_assets(site_root: Path, renamed: list[tuple[str, str]]) -> None:
    if not renamed:
        return
    text_suffixes = {".html", ".json", ".js", ".xml", ".txt", ".md", ".ics"}
    for old_rel, new_rel in renamed:
        if not old_rel or not new_rel:
            continue
        for path in site_root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in text_suffixes:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if old_rel in text:
                path.write_text(text.replace(old_rel, new_rel), encoding="utf-8")
        old_path = site_root / old_rel
        if old_path.exists():
            still_referenced = False
            for path in site_root.rglob("*"):
                if not path.is_file() or path.suffix.lower() not in text_suffixes:
                    continue
                try:
                    if old_rel in path.read_text(encoding="utf-8"):
                        still_referenced = True
                        break
                except UnicodeDecodeError:
                    continue
            if not still_referenced:
                old_path.unlink()


def build_events_for_site(site_root: Path, timepad_ids: list[str], min_date: datetime, max_year: int) -> list[dict[str, Any]]:
    generated: list[dict[str, Any]] = []
    for timepad_id in timepad_ids:
        url = event_url(timepad_id)
        soup = BeautifulSoup(get(url).text, "html.parser")
        ics = parse_timepad_ics(timepad_id)
        start_dt: datetime = ics["start_dt"]
        if start_dt.date() < min_date.date() or start_dt.year > max_year:
            continue
        topic = parse_topic(meta(soup, "og:title"))
        series_label, _, _, _, _, _ = series_for_topic(topic)
        venue = clean_venue(str(ics.get("location") or ""), topic)
        image_url = meta(soup, "og:image")
        if not image_url:
            raise RuntimeError(f"No og:image for Timepad event {timepad_id}")
        image_rel = save_seo_image(
            site_root=site_root,
            image_url=image_url,
            topic=topic,
            date_iso=start_dt.strftime("%Y-%m-%d"),
            date_str=start_dt.strftime("%d.%m.%Y"),
            venue=venue,
            series_label=series_label,
            source_url=url,
            timepad_id=timepad_id,
        )
        event = build_event_payload(site_root, timepad_id, soup, ics, image_rel)
        generated.append(event)
        render_page(site_root, event)
        write_manifest_and_package(site_root, event)
    return generated


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", action="append", type=Path, default=[], help="Static site root to update.")
    parser.add_argument("--min-date", default="2026-04-27", help="First Timepad event date to publish, YYYY-MM-DD.")
    parser.add_argument("--max-year", type=int, default=2026, help="Last calendar year to include.")
    parser.add_argument("--max-pages", type=int, default=10, help="Max Timepad listing pages to scan.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    site_roots = args.site_root or DEFAULT_SITE_ROOTS
    min_date = datetime.fromisoformat(args.min_date).replace(tzinfo=timezone(timedelta(hours=3)))
    timepad_ids = scrape_timepad_ids(args.max_pages)
    result: dict[str, Any] = {"timepadIds": timepad_ids, "sites": {}}
    for raw_site_root in site_roots:
        site_root = raw_site_root.resolve()
        if not (site_root / "assets" / "data" / "events.json").exists():
            raise RuntimeError(f"Site root has no events.json: {site_root}")
        generated = build_events_for_site(site_root, timepad_ids, min_date, args.max_year)
        renamed = upsert_events(site_root, generated)
        update_index_files(site_root)
        cleanup_renamed_assets(site_root, renamed)
        result["sites"][str(site_root)] = {
            "generatedCount": len(generated),
            "generatedIds": [event["id"] for event in generated],
            "renamedAssets": renamed,
        }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
