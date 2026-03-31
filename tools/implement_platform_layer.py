from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "assets" / "data"


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def append_script(soup: BeautifulSoup, src: str) -> None:
    if soup.find("script", src=src):
        return
    body = soup.body or soup
    tag = soup.new_tag("script", src=src)
    body.append(tag)


def insert_after(target, fragment: str) -> None:
    frag = BeautifulSoup(fragment, "html.parser")
    last = target
    for node in list(frag.contents):
        last.insert_after(node)
        last = node


def patch_accounts() -> None:
    path = ROOT / "accounts.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    for old in soup.select("#account-profile-summary, #account-profile-switcher"):
        old.decompose()
    hero = soup.select_one("main section.hero.shell")
    if hero:
        new_section = BeautifulSoup(
            """
<section class="section shell">
  <span class="badge">Профиль участника</span>
  <h2>Единый маршрут участника</h2>
  <p class="lead">Выберите профиль и проверьте, как меняются доступные направления, история событий, исследовательские треки и учебные маршруты.</p>
  <div class="grid two">
    <div id="account-profile-summary"></div>
    <div class="card">
      <h3>Сменить профиль</h3>
      <p>Переключение показывает, как одна и та же платформа выглядит для разных ролей института.</p>
      <div class="cta-row" id="account-profile-switcher"></div>
    </div>
  </div>
</section>
""",
            "html.parser",
        )
        hero.insert_after(new_section)
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_role_pages() -> None:
    replacements = {
        "account-author.html": [
            (
                "Структура кабинета опирается на проект АвтостатьиКумскова: не генерация рукописи, а прозрачный маршрут статьи, journal verification, антиплагиат, профиль 5.3.3, evidence-first и clean-feed между проектами.",
                "Кабинет автора помогает вести материал от идеи и черновика до редакционной доработки, публикации и связки с другими направлениями института.",
            ),
            ("Pipeline", "Маршрут публикации"),
            (
                "Автору нужен не хаос из файлов, а понятный кабинет с шагами и доказательствами.",
                "Автору нужен понятный маршрут: от черновика и подбора площадки до готового текста и публичной страницы.",
            ),
            (
                "Черновик, версия рукописи, сопроводительные файлы, текущий статус отправки.",
                "Черновик, сопроводительные материалы и текущее состояние рукописи собраны в одном месте.",
            ),
            (
                "Подтвержденный журнал, требования, доступ, тип подачи, ссылки на источники.",
                "Подходящая площадка, требования направления и логика подготовки к публикации.",
            ),
            (
                "Антиплагиат, проверка структуры, профиль 5.3.3, цитирования, литература, внутренние дубли.",
                "Проверка структуры, логики текста, ссылок и качества материала перед выпуском.",
            ),
            ("Evidence-first", "Правила работы"),
            (
                "Мы перенесли в кабинет ключевые рабочие правила из АвтостатьиКумскова.",
                "Кабинет сохраняет единые правила подготовки материалов, чтобы публикационный маршрут был прозрачным и управляемым.",
            ),
            (
                "AuthorID, TrackID, ArticleID, JournalID, SubmissionID как основа для связности.",
                "У каждой статьи есть своя история: автор, направление, версия материала и площадка публикации.",
            ),
            (
                "manual_gate, blocked_access, не подтверждено, нужна ручная проверка.",
                "Статусы кабинета показывают, когда материал готов к выпуску, а когда ему нужна дополнительная доработка.",
            ),
            (
                "HTML/JSON-досье, отчеты по проблемам, manual queue и closure report.",
                "Автор видит комментарии редактора, состав публикационного пакета и следующий шаг по материалу.",
            ),
        ],
        "account-editor.html": [
            (
                "Роль для экспертного и редакционного сопровождения: проверка пакета автора, review-замечания, manual gate, готовность к подаче и контроль требований журнала.",
                "Роль для экспертного и редакционного сопровождения: проверка материала, замечания по доработке, готовность к выпуску и контроль качества публикации.",
            ),
            ("Ready queue", "Очередь на выпуск"),
            ("Manual gate", "Ручная сверка"),
            ("Needs fix", "Нужна доработка"),
            (
                "Скачать review-заметки, маршрут публикации и регламент.",
                "Скачать материалы выпуска, маршрут публикации и рабочий регламент редактора.",
            ),
        ],
        "account-coordinator.html": [
            (
                "Координационный слой: заявки, гранты, дайджесты и маршруты участников.",
                "Координационный кабинет: заявки, гранты и маршруты участников института.",
            ),
            (
                "Эта роль собирает входящий поток с сайта: заявки на вступление, публикации, курс ЭИ, гранты и партнёрские запросы. Здесь сходятся дедлайны, документы и next steps.",
                "Эта роль собирает входящий поток с сайта: заявки на вступление, публикации, образовательные маршруты, гранты и партнёрские запросы. Здесь сходятся дедлайны, документы и решения по маршрутизации.",
            ),
            ("Утренний дайджест", "Ежедневная сводка"),
            (
                "Все формы сайта автоматически попадают в Sheets, email и локальный JSONL-журнал.",
                "Все входящие заявки собираются в один управляемый поток, чтобы их можно было быстро распределить по ролям и направлениям.",
            ),
        ],
    }
    role_map = {
        "account-author.html": "author",
        "account-student.html": "student",
        "account-supervisor.html": "supervisor",
        "account-editor.html": "editor",
        "account-coordinator.html": "coordinator",
    }
    for rel, role in role_map.items():
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        for old, new in replacements.get(rel, []):
            text = text.replace(old, new)
        soup = BeautifulSoup(text, "html.parser")
        if soup.body and not soup.body.get("data-role-page"):
            soup.body["data-role-page"] = role
        hero = soup.find("section", class_="hero")
        if hero and not soup.find(id="role-profile-summary"):
            insert_after(
                hero,
                """
<section class="section shell">
  <span class="badge">Маршрут участника</span>
  <div class="grid two">
    <div id="role-profile-summary"></div>
    <div id="role-route-summary"></div>
  </div>
</section>
""",
            )
        append_script(soup, "platform-shell.js")
        path.write_text(str(soup), encoding="utf-8")


def patch_course() -> None:
    path = ROOT / "course-ei.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    hero = soup.find("section", class_="hero")
    if hero and not soup.find(id="course-shell-status"):
        insert_after(
            hero,
            """
<section class="grid cards section">
  <article class="card" id="course-shell-status"></article>
  <article class="card" id="course-factory-status"></article>
</section>
""",
        )
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_grants() -> None:
    path = ROOT / "grants-teams.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main")
    first_section = main.find("section") if main else None
    if first_section and not soup.find(id="grant-shell-status"):
        insert_after(
            first_section,
            """
<section class="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div class="bg-surface-container-lowest p-8 border-l-4 border-primary shadow-sm" id="grant-shell-status"></div>
  <div class="bg-surface-container-lowest p-8 border-l-4 border-secondary shadow-sm" id="grant-research-status"></div>
</section>
""",
        )
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_conferences() -> None:
    path = ROOT / "conferences.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    content = soup.select_one(".events-content")
    if content and not soup.find(id="event-shell-status"):
        content.insert(0, BeautifulSoup('<section id="event-shell-status" style="margin-bottom:28px"></section>', "html.parser"))
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_research() -> None:
    path = ROOT / "research-sandbox.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    sections = soup.find_all("section", class_="section")
    anchor = sections[0] if sections else soup.find("section", class_="hero")
    if anchor and not soup.find(id="research-shell-status"):
        insert_after(
            anchor,
            """
<section class="section grid-2">
  <article class="card panel" id="research-shell-status"></article>
  <div id="research-case-list"></div>
</section>
""",
        )
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_publications() -> None:
    path = ROOT / "publications.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main")
    header = main.find("header") if main else None
    if header and not soup.find(id="editorial-shell-status"):
        insert_after(header, '<section class="mb-20"><div id="editorial-shell-status"></div></section>')
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def patch_biomechanics() -> None:
    path = ROOT / "biomechanics-rowing.html"
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    hero = soup.find("section", class_="hero")
    if hero and not soup.find(string=lambda s: s and "Кейс связан с общей исследовательской средой" in s):
        insert_after(
            hero,
            """
<section class="section">
  <div class="grid-2">
    <article class="card panel">
      <span class="eyebrow">Исследовательский маршрут</span>
      <h2>Кейс связан с общей исследовательской средой</h2>
      <p>Материалы по биомеханике гребли входят в общий исследовательский контур института и могут усиливать грантовые, образовательные и публикационные маршруты.</p>
      <div class="cta-row">
        <a class="btn" href="research-sandbox.html">Перейти в исследовательскую среду</a>
        <a class="btn secondary" href="grants-teams.html">Связь с грантами</a>
      </div>
    </article>
    <article class="card panel">
      <span class="eyebrow">Публикационный контур</span>
      <p>Кейс можно разворачивать в отчёт, демонстрационный материал, статью или исследовательскую заметку, не теряя связи с автором и направлением.</p>
    </article>
  </div>
</section>
""",
        )
    append_script(soup, "platform-shell.js")
    path.write_text(str(soup), encoding="utf-8")


def main() -> None:
    patch_accounts()
    patch_role_pages()
    patch_course()
    patch_grants()
    patch_conferences()
    patch_research()
    patch_publications()
    patch_biomechanics()


if __name__ == "__main__":
    main()
