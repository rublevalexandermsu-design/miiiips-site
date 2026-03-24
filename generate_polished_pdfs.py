
from pathlib import Path
import tempfile
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / 'assets' / 'docs'
FONT_REGULAR = r'C:\Windows\Fonts\arial.ttf'
FONT_BOLD = r'C:\Windows\Fonts\arialbd.ttf'
pdfmetrics.registerFont(TTFont('ArialCustom', FONT_REGULAR))
pdfmetrics.registerFont(TTFont('ArialCustomBold', FONT_BOLD))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleRu', parent=styles['Title'], fontName='ArialCustomBold', fontSize=24, leading=28, textColor=colors.HexColor('#00342b'), spaceAfter=8, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='SubRu', parent=styles['Normal'], fontName='ArialCustom', fontSize=11, leading=15, textColor=colors.HexColor('#52635d'), spaceAfter=8))
styles.add(ParagraphStyle(name='HeadingRu', parent=styles['Heading2'], fontName='ArialCustomBold', fontSize=16, leading=20, textColor=colors.HexColor('#00342b'), spaceAfter=8))
styles.add(ParagraphStyle(name='BodyRu', parent=styles['BodyText'], fontName='ArialCustom', fontSize=10.5, leading=15, textColor=colors.HexColor('#1a1c1c'), spaceAfter=6))
styles.add(ParagraphStyle(name='KickerRu', parent=styles['BodyText'], fontName='ArialCustomBold', fontSize=9, leading=11, textColor=colors.HexColor('#7d5700'), spaceAfter=4))

PACK = {
    'miiiips_admission_guide.pdf': {
        'title': 'Правила приема и участия в программах МИИИИПС',
        'subtitle': 'Краткий маршрут для абитуриентов, слушателей, авторов и исследовательских участников.',
        'bullets': ['Кто может подать заявку и как выбрать подходящий трек.', 'Какие документы нужны на первом этапе и что можно прислать позже.', 'Как проходят подтверждение, интервью и подключение к кабинету.'],
        'table': [('Шаг','Что делаем','Срок'), ('1','Оставляем заявку на сайте и выбираем направление','1 день'), ('2','Получаем письмо и подтверждение маршрута','1-2 дня'), ('3','Подключаемся к кабинету и материалам','до 3 дней')],
        'chart': ([1,2,3], [45, 32, 23], ['Заявка','Собеседование','Старт']),
    },
    'miiiips_ethics_principles.pdf': {
        'title': 'Принципы академической этики и научного сопровождения',
        'subtitle': 'Документ фиксирует, как институт работает с ИИ, авторством, редактурой и исследовательской ответственностью.',
        'bullets': ['ИИ не подменяет автора и не создает научную работу вместо исследователя.', 'Каждый материал проходит человеческую верификацию, редактуру и смысловую проверку.', 'Институт поддерживает прозрачность данных, маршрутов и статусов согласования.'],
        'table': [('Принцип','Что это значит','Практика'), ('Авторство','Финальная ответственность у автора','Фиксация версий и комментариев'), ('Проверка','Ни один текст не идет без ручного review','Manual gate и changelog'), ('Прозрачность','Статусы понятны всем участникам','Кабинеты и журналы изменений')],
        'chart': ([1,2,3], [60, 25, 15], ['Этика','Проверка','Публикация']),
    },
    'miiiips_work_format_guide.pdf': {
        'title': 'Как оформлять материалы для совместной работы',
        'subtitle': 'Единый формат файлов, документов, комментариев и входящих материалов для сайта и исследовательских треков.',
        'bullets': ['Собираем документы по ролям: автор, соискатель, научный руководитель, координатор.', 'Для таблиц, графиков и больших текстов используем единые правила именования и версии.', 'В кабинетах всегда сохраняется следующий шаг и пакет прикрепленных материалов.'],
        'table': [('Материал','Формат','Комментарий'), ('Текст','Google Docs / DOCX','С включенным changelog'), ('Таблица','Google Sheets / XLSX','С заголовками и единицами измерения'), ('Презентация','PDF / PPTX','С финальной версией для показа')],
        'chart': ([1,2,3], [35, 40, 25], ['Документы','Таблицы','Слайды']),
    },
    'miiiips_publication_route.pdf': {
        'title': 'Маршрут публикации: от заявки до подачи в журнал',
        'subtitle': 'Сводный документ для авторов, редакторов и координаторов публикационного контура.',
        'bullets': ['Заявка попадает в кабинет автора и в таблицу координации.', 'Маршрут включает проверку требований журнала, review и manual gate.', 'Каждый этап имеет видимый статус и комментарии по доработке.'],
        'table': [('Этап','Статус','Результат'), ('Проверка журнала','evidence-first','Подтвержденные требования'), ('Редактура','needs fix / ready','Список правок'), ('Подача','approved','Финальный пакет материалов')],
        'chart': ([1,2,3], [20, 50, 30], ['Проверка','Редактура','Подача']),
    },
    'miiiips_grants_brief.pdf': {
        'title': 'Грантовый маршрут и сборка исследовательской команды',
        'subtitle': 'Краткая схема для участников грантового контура и координаторов программ.',
        'bullets': ['Отбор возможностей идет по темам, срокам, требованиям и роли участника.', 'Каждая заявка имеет свой digest, дедлайны, документы и пакет материалов.', 'Координатор видит путь команды, а участник — свой следующий шаг.'],
        'table': [('Роль','Фокус','Артефакты'), ('Участник','Профиль и интересы','CV, тезисы, письмо'), ('Координатор','Сборка заявки','Дедлайны, checklist'), ('Эксперт','Оценка и верификация','Комментарии и рекомендации')],
        'chart': ([1,2,3], [30, 40, 30], ['Поиск','Подготовка','Подача']),
    },
    'miiiips_ei_course_program.pdf': {
        'title': 'Программа курса «Эмоциональный интеллект»',
        'subtitle': 'Флагманская программа Татьяны Мунн: переговоры, саморегуляция, исследовательский и прикладной трек.',
        'bullets': ['Модуль 1: эмоциональная саморегуляция и наблюдение за когнитивными реакциями.', 'Модуль 2: переговоры, коммуникация, интеллектуальная устойчивость.', 'Модуль 3: перенос практики в исследовательскую, управленческую и образовательную среду.'],
        'table': [('Модуль','Фокус','Результат'), ('1','Саморегуляция','Личный рабочий протокол'), ('2','Переговоры','Сценарии сложного диалога'), ('3','Практика','План внедрения и сопровождения')],
        'chart': ([1,2,3], [33, 33, 34], ['Основа','Переговоры','Внедрение']),
    },
    'miiiips_audit_report_demo.pdf': {
        'title': 'Демо-отчет: аудит сайта и пользовательских маршрутов',
        'subtitle': 'Материал показывает, как институт оформляет внутренние аудиты продукта и цифровых сценариев.',
        'bullets': ['Проверяем сценарии пользователя, формы, кабинеты, документы и скачивания.', 'Собираем список критичных, средних и косметических замечаний.', 'Фиксируем приоритеты доработки и обновляем дорожную карту следующей волны.'],
        'table': [('Проверка','Статус','Комментарий'), ('Навигация','OK','Ключевые страницы связаны'), ('Формы','OK','Google Sheets + Gmail работают'), ('Мобильная версия','В работе','Нужна отдельная волна адаптации')],
        'chart': ([1,2,3], [55, 30, 15], ['Готово','В работе','Следующий этап']),
    },
}

def make_chart(title, labels, values):
    fig, ax = plt.subplots(figsize=(6.5, 2.4), dpi=150)
    fig.patch.set_facecolor('#f7f5ef')
    ax.set_facecolor('#f7f5ef')
    bars = ax.bar(labels, values, color=['#004d40','#1b6f63','#b38a28'])
    ax.set_title(title, fontsize=11, color='#00342b', pad=10)
    ax.spines[['top','right']].set_visible(False)
    ax.spines['left'].set_color('#9aa6a1')
    ax.spines['bottom'].set_color('#9aa6a1')
    ax.tick_params(axis='x', labelsize=9)
    ax.tick_params(axis='y', labelsize=8, colors='#52635d')
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, val + 1, str(val), ha='center', va='bottom', fontsize=8, color='#00342b')
    tmp = Path(tempfile.mkstemp(suffix='.png')[1])
    plt.tight_layout()
    fig.savefig(tmp, bbox_inches='tight')
    plt.close(fig)
    return tmp

def build_pdf(path: Path, data: dict):
    doc = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm)
    story = []
    story.append(Paragraph('МИИИИПС', styles['KickerRu']))
    story.append(Paragraph(data['title'], styles['TitleRu']))
    story.append(Paragraph(data['subtitle'], styles['SubRu']))
    story.append(Spacer(1, 8))

    summary_table = Table([
        ['Документ', data['title']],
        ['Версия', 'Демо-пакет сайта · март 2026'],
        ['Контур', 'Публичный сайт / кабинеты / маршруты / документы'],
    ], colWidths=[42*mm, 120*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e8f1ee')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cad4cf')),
        ('FONTNAME', (0,0), (-1,-1), 'ArialCustom'),
        ('FONTNAME', (0,0), (0,-1), 'ArialCustomBold'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1a1c1c')),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph('Ключевые акценты', styles['HeadingRu']))
    for bullet in data['bullets']:
        story.append(Paragraph('• ' + bullet, styles['BodyRu']))
    story.append(Spacer(1, 8))

    chart = make_chart('Сводный маршрут', data['chart'][2], data['chart'][1])
    story.append(Image(str(chart), width=165*mm, height=58*mm))
    story.append(Spacer(1, 10))

    story.append(Paragraph('Структура работы', styles['HeadingRu']))
    table = Table(data['table'], colWidths=[42*mm, 58*mm, 72*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#00342b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'ArialCustomBold'),
        ('FONTNAME', (0,1), (-1,-1), 'ArialCustom'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cad4cf')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f7f5ef')]),
        ('PADDING', (0,0), (-1,-1), 7),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(table)
    story.append(Spacer(1, 12))
    story.append(Paragraph('Комментарий', styles['HeadingRu']))
    story.append(Paragraph('Этот PDF сформирован как презентационный документ для проверки UX сайта: скачивание, открытие, читабельность текста, работа шрифтов и корректность материалов. В следующей волне такие документы можно будет наполнять уже реальными данными из кабинетов, Google Sheets, публикационного и грантового контура.', styles['BodyRu']))

    doc.build(story)
    try:
        chart.unlink(missing_ok=True)
    except Exception:
        pass

for filename, payload in PACK.items():
    build_pdf(DOCS / filename, payload)
print('Generated', len(PACK), 'pdf files')
