from __future__ import annotations

import argparse
import base64
import json
import mimetypes
from email import encoders
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.message import Message
from pathlib import Path
from string import Template

from PIL import Image, ImageDraw, ImageFont
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
TEMPLATE_PATH = ROOT / "docs" / "email" / "journal-newsletter-preview.html"
LOGO_PATH = ROOT / "assets" / "images" / "journal" / "miiiips-journal-logo.svg"
DEFAULT_CONFIG_PATH = ROOT / "local_api_config.json"
DEFAULT_RENDERED_PATH = ROOT / "docs" / "email" / "journal-newsletter-preview.rendered.html"
SCOPES = [
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send",
]


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_credentials(credentials_path: Path, token_path: Path, auth_code: str | None = None) -> tuple[Credentials | None, str]:
    if not credentials_path.exists():
        return None, "missing-credentials"

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        refreshed = False
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                refreshed = True
            except Exception:
                refreshed = False
        if not refreshed:
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
            if auth_code:
                flow.fetch_token(code=auth_code)
                creds = flow.credentials
                token_path.parent.mkdir(parents=True, exist_ok=True)
                token_path.write_text(creds.to_json(), encoding="utf-8")
            else:
                creds = flow.run_local_server(port=0, open_browser=True)
                token_path.parent.mkdir(parents=True, exist_ok=True)
                token_path.write_text(creds.to_json(), encoding="utf-8")
        else:
            token_path.parent.mkdir(parents=True, exist_ok=True)
            token_path.write_text(creds.to_json(), encoding="utf-8")

    return creds, "ready"


def html_escape(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def render_template(template_path: Path, output_path: Path, values: dict) -> str:
    template_text = template_path.read_text(encoding="utf-8")
    rendered = Template(template_text).safe_substitute(values)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered, encoding="utf-8")
    return rendered


def find_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size=size)
            except Exception:
                continue
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size=size)
    except Exception:
        return ImageFont.load_default()


def generate_logo_png() -> bytes:
    width, height = 720, 260
    img = Image.new("RGBA", (width, height), (248, 245, 238, 255))
    draw = ImageDraw.Draw(img)

    # Soft shadow panel.
    draw.rounded_rectangle((18, 18, width - 18, height - 18), radius=34, fill=(255, 255, 255, 255))
    draw.rounded_rectangle((24, 24, width - 24, height - 24), radius=30, outline=(15, 90, 70, 32), width=2)

    # Accent ribbon.
    draw.rounded_rectangle((44, 44, 156, 216), radius=28, fill=(15, 90, 70, 255))
    draw.rounded_rectangle((58, 58, 142, 200), radius=22, fill=(239, 232, 214, 255))

    mono_font = find_font(
        [
            r"C:\Windows\Fonts\georgiab.ttf",
            r"C:\Windows\Fonts\timesbd.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ],
        58,
    )
    small_font = find_font(
        [
            r"C:\Windows\Fonts\arial.ttf",
            r"C:\Windows\Fonts\calibri.ttf",
            r"C:\Windows\Fonts\tahoma.ttf",
        ],
        18,
    )
    title_font = find_font(
        [
            r"C:\Windows\Fonts\georgiab.ttf",
            r"C:\Windows\Fonts\timesbd.ttf",
        ],
        34,
    )

    draw.text((84, 84), "М", font=mono_font, fill=(15, 90, 70, 255), anchor="mm")
    draw.text((202, 58), "ЖУРНАЛ МИИИИПС", font=small_font, fill=(18, 47, 41, 255))
    draw.text((202, 92), "Наука, образование и исследования XXI века", font=title_font, fill=(18, 47, 41, 255))
    draw.text((202, 156), "Фирменная рассылка • журнал • публикации • редакция", font=small_font, fill=(90, 110, 102, 255))

    # Tiny accent line and web marker.
    draw.rounded_rectangle((202, 196, 430, 208), radius=6, fill=(95, 139, 87, 255))
    draw.text((202, 224), "miiiips.ru", font=small_font, fill=(15, 90, 70, 255))

    buffer = __import__("io").BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def build_message(subject: str, html: str, text: str, from_email: str, to_email: str, logo_png: bytes) -> Message:
    outer = MIMEMultipart("related")
    outer["Subject"] = subject
    outer["From"] = from_email
    outer["To"] = to_email

    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(text, "plain", "utf-8"))
    alternative.attach(MIMEText(html, "html", "utf-8"))
    outer.attach(alternative)

    image = MIMEImage(logo_png, _subtype="png")
    image.add_header("Content-ID", "<journallogo>")
    image.add_header("Content-Disposition", "inline", filename="miiiips-journal-logo.png")
    outer.attach(image)

    return outer


def gmail_service(credentials_path: Path, token_path: Path, auth_code: str | None = None):
    creds, info = load_credentials(credentials_path, token_path, auth_code=auth_code)
    if not creds:
        raise RuntimeError(info or "Unable to load Gmail credentials")
    return build("gmail", "v1", credentials=creds)


def main() -> int:
    parser = argparse.ArgumentParser(description="Send a branded MIIIPS newsletter preview email.")
    parser.add_argument("--to", default="moonn.official@yandex.ru", help="Recipient email address")
    parser.add_argument(
        "--subject",
        default="МИИИИПС — пример фирменной рассылки журнала",
        help="Email subject",
    )
    parser.add_argument(
        "--output-html",
        default=str(DEFAULT_RENDERED_PATH),
        help="Path where the rendered HTML preview should be saved",
    )
    parser.add_argument(
        "--config",
        default=str(DEFAULT_CONFIG_PATH),
        help="Path to local_api_config.json",
    )
    args = parser.parse_args()

    config = load_json(Path(args.config))
    credentials_path = Path(config.get("gmail_credentials") or r"C:\пайто н тесты\курсэмоциональный интеллект\credentials.json")
    token_path = Path(config.get("gmail_token") or r"C:\пайто н тесты\курсэмоциональный интеллект\token_gmail.json")
    from_email_hint = config.get("gmail_from_email", "") or ""

    values = {
        "brand_short": "ЖУРНАЛ МИИИИПС",
        "brand_name": "Наука, образование и исследования XXI века",
        "brand_tagline": "Публичный журнал института с выпусками, архивом, подачей статей и новостями.",
        "hero_title": "Фирменная рассылка института, которую не стыдно отправить авторам и партнёрам.",
        "hero_body": (
            "Это пример письма для будущих рассылок МИИИИПС: анонсы выпусков, приглашения к публикации, "
            "ссылки на журнал и быстрый маршрут к редакции. Визуально оно держится на том же зелёном языке, "
            "что и сайт журнала."
        ),
        "journal_url": "https://miiiips.ru/journal.html",
        "submission_url": "https://miiiips.ru/journal-submit.html",
        "contacts_url": "https://miiiips.ru/journal-contacts.html",
        "signature_name": "Татьяна Мунн",
        "signature_role": "Главный редактор журнала и руководитель редакционного маршрута МИИИИПС",
        "signature_email": "moonn.official@yandex.ru",
        "footer_note": (
            "Если письмо открыто без картинок, его смысл всё равно сохраняется: есть бренд, тема, контакты "
            "и кнопки для действия."
        ),
        "to_email": html_escape(args.to),
    }

    rendered = render_template(TEMPLATE_PATH, Path(args.output_html), values)
    service = gmail_service(credentials_path, token_path)

    logo_png = generate_logo_png()
    plain_text = (
        "МИИИИПС — пример фирменной рассылки журнала\n\n"
        "Открыть журнал: https://miiiips.ru/journal.html\n"
        "Подать статью: https://miiiips.ru/journal-submit.html\n"
        "Контакты редакции: https://miiiips.ru/journal-contacts.html\n\n"
        "Это письмо показывает, как может выглядеть брендированная рассылка института."
    )

    from_email = from_email_hint or service.users().getProfile(userId="me").execute().get("emailAddress", "")
    message = build_message(args.subject, rendered, plain_text, from_email, args.to, logo_png)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
    print(json.dumps({
        "ok": True,
        "message_id": sent.get("id"),
        "thread_id": sent.get("threadId"),
        "to": args.to,
        "from": from_email,
        "subject": args.subject,
        "preview_html": str(Path(args.output_html)),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
