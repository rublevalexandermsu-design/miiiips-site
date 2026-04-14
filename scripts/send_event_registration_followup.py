from __future__ import annotations

import argparse
import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from string import Template

from PIL import Image, ImageDraw, ImageFont
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_PATH = ROOT / "docs" / "email" / "event-registration-followup.html"
LOGO_PATH = ROOT / "assets" / "images" / "journal" / "miiiips-journal-logo.svg"
EVENT_IMAGE_PATH = ROOT / "assets" / "images" / "lectures" / "miiiips-tatyana-munn-psihologiya-otnosheniy-muzhchina-20042026.jpg"
DEFAULT_CONFIG_PATH = ROOT / "local_api_config.json"
DEFAULT_RENDERED_PATH = ROOT / "docs" / "email" / "event-registration-followup.rendered.html"
SCOPES = [
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send",
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def get_creds(credentials_path: Path, token_path: Path) -> Credentials:
    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None
        if not creds:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            creds = flow.run_local_server(port=0, open_browser=True)
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def render_template(output_path: Path, values: dict) -> str:
    template_text = TEMPLATE_PATH.read_text(encoding="utf-8")
    rendered = Template(template_text).safe_substitute(values)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered, encoding="utf-8")
    return rendered


def find_font(candidates: list[str], size: int):
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except Exception:
                pass
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size=size)
    except Exception:
        return ImageFont.load_default()


def build_brand_png() -> bytes:
    width, height = 720, 240
    image = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((10, 10, width - 10, height - 10), radius=28, fill=(255, 255, 255, 255), outline=(15, 90, 70, 36), width=2)
    draw.rounded_rectangle((32, 32, 140, 208), radius=24, fill=(15, 90, 70, 255))
    draw.rounded_rectangle((46, 46, 126, 192), radius=18, fill=(239, 232, 214, 255))
    brand_font = find_font([r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\timesbd.ttf"], 48)
    small_font = find_font([r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\calibri.ttf"], 18)
    draw.text((86, 84), "М", font=brand_font, fill=(15, 90, 70, 255), anchor="mm")
    draw.text((178, 54), "МИИИИПС", font=small_font, fill=(15, 90, 70, 255))
    draw.text((178, 88), "Институт глобализации", font=brand_font, fill=(22, 59, 51, 255))
    draw.text((178, 146), "Регистрация, журнал, лекции и личные консультации", font=small_font, fill=(96, 113, 107, 255))
    buffer = __import__("io").BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def build_event_png() -> bytes:
    return EVENT_IMAGE_PATH.read_bytes()


def build_message(from_email: str, to_email: str, subject: str, html: str, text: str, brand_png: bytes, event_png: bytes):
    message = MIMEMultipart("related")
    message["To"] = to_email
    message["From"] = from_email
    message["Subject"] = subject

    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(text, "plain", "utf-8"))
    alternative.attach(MIMEText(html, "html", "utf-8"))
    message.attach(alternative)

    brand = MIMEImage(brand_png, _subtype="png")
    brand.add_header("Content-ID", "<brandmark>")
    brand.add_header("Content-Disposition", "inline", filename="miiiips-brand.png")
    message.attach(brand)

    event = MIMEImage(event_png, _subtype="jpeg")
    event.add_header("Content-ID", "<eventhero>")
    event.add_header("Content-Disposition", "inline", filename="lecture-banner.jpg")
    message.attach(event)

    return message


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a polished event-registration follow-up email.")
    parser.add_argument("--to", default="moonn.official@yandex.ru")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG_PATH))
    parser.add_argument("--subject", default='Спасибо за регистрацию на лекцию "Психология ОТНОШЕНИЙ. Психология МУЖЧИНЫ"')
    parser.add_argument("--output-html", default=str(DEFAULT_RENDERED_PATH))
    args = parser.parse_args()

    config = load_json(Path(args.config))
    credentials_path = Path(config.get("gmail_credentials") or r"C:\пайто н тесты\курсэмоциональный интеллект\credentials.json")
    token_path = Path(config.get("gmail_token") or r"C:\пайто н тесты\курсэмоциональный интеллект\token_gmail.json")
    creds = get_creds(credentials_path, token_path)
    service = build("gmail", "v1", credentials=creds)
    from_email = service.users().getProfile(userId="me").execute().get("emailAddress", "")

    event_url = "https://moonn.timepad.ru/event/3921611/"
    local_event_url = "https://miiiips.ru/event-psihologiya-otnosheniy-muzhchina-20042026.html"
    registration_cta = "mailto:moonn.official@yandex.ru?subject=%D0%97%D0%B0%D0%BF%D0%B8%D1%81%D1%8C%20%D0%BD%D0%B0%20%D0%BA%D0%BE%D0%BD%D1%81%D1%83%D0%BB%D1%8C%D1%82%D0%B0%D1%86%D0%B8%D1%8E"

    values = {
        "brand_name": "МИИИИПС",
        "brand_tagline": "Институт глобализации",
        "hero_title": "Спасибо за регистрацию на бесплатную лекцию.",
        "hero_body": "Вы записались на встречу \"Психология ОТНОШЕНИЙ. Психология МУЖЧИНЫ\" с Татьяной Мунн. Ждём вас 20 апреля в культурном центре \"Полярный\".",
        "event_url": html_escape(event_url),
        "local_event_url": html_escape(local_event_url),
        "registration_cta": html_escape(registration_cta),
        "event_date": "20 апреля 2026, 19:00–21:00",
        "event_place": "Культурный центр «Полярный», Москва, метро Бабушкинская.",
        "cta_one": "Открыть регистрацию",
        "cta_two": "Страница лекции",
        "cta_three": "Записаться на консультацию",
        "offer_title": "Для участников встречи — личная консультация со скидкой. Первые 3 места по специальной цене.",
        "offer_body": "Если захотите продолжить тему после лекции, можно записаться на личную консультацию с Татьяной Мунн. Просто ответьте на это письмо или нажмите кнопку записи.",
        "speaker_name": "Татьяна Мунн",
        "speaker_role": "Главный редактор и автор коммуникационного маршрута МИИИИПС",
        "speaker_email": "moonn.official@yandex.ru",
        "small_note": "Если изображения не загрузились, письмо всё равно остаётся понятным: регистрация подтверждена, дата и место указаны, а консультация доступна по ссылке.",
    }

    rendered = render_template(Path(args.output_html), values)
    brand_png = build_brand_png()
    event_png = build_event_png()
    plain_text = "\n".join([
        'Спасибо за регистрацию на бесплатную лекцию.',
        '',
        'Вы записались на встречу "Психология ОТНОШЕНИЙ. Психология МУЖЧИНЫ" с Татьяной Мунн.',
        '20 апреля 2026, 19:00–21:00',
        'Культурный центр "Полярный", Москва, метро Бабушкинская.',
        '',
        'Для участников встречи доступна личная консультация со скидкой. Первые 3 места по специальной цене.',
        'Написать в ответ на письмо или открыть ссылку записи на консультацию.',
        '',
        f'Регистрация: {event_url}',
        f'Страница лекции: {local_event_url}',
    ])

    msg = build_message(from_email, args.to, args.subject, rendered, plain_text, brand_png, event_png)
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()

    print(json.dumps({
        "ok": True,
        "to": args.to,
        "from": from_email,
        "subject": args.subject,
        "message_id": sent.get("id"),
        "thread_id": sent.get("threadId"),
        "rendered_html": str(Path(args.output_html)),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
