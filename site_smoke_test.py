import json, subprocess, sys, time, urllib.request
from pathlib import Path

site = Path(__file__).resolve().parent
server = subprocess.Popen([sys.executable, str(site / 'local_api_server.py')])
base = 'http://127.0.0.1:3007/'
results = {'pages': [], 'assets': [], 'forms': []}
try:
    time.sleep(3)
    urls = ['api/health','api/site-data'] + sorted([p.name for p in site.glob('*.html')])
    for url in urls:
        with urllib.request.urlopen(base + url) as resp:
            results['pages'].append({'url': url, 'status': resp.status})
    for asset in sorted((site / 'assets' / 'docs').glob('*.pdf')):
        with urllib.request.urlopen(base + 'assets/docs/' + asset.name) as resp:
            results['assets'].append({'file': asset.name, 'status': resp.status})
    payloads = [
        {'formType':'join_application','sourcePage':'join.html','role':'Соискатель','name':'Smoke Join','email':'join@example.com','organization':'Test','interest':'ИИ','message':'smoke'},
        {'formType':'partnership_request','sourcePage':'contacts-partners.html','role':'Партнёр','name':'Smoke Partner','email':'partner@example.com','organization':'Lab','interest':'Научный обмен','message':'partnership'},
        {'formType':'audit_request','sourcePage':'audit-request.html','role':'Автор','name':'Smoke Audit','email':'audit@example.com','organization':'Project','interest':'Аудит исследовательской идеи','message':'audit'},
        {'formType':'course_enrollment','sourcePage':'course-ei-program.html','role':'Студент','name':'Smoke Course','email':'course@example.com','organization':'Student','interest':'ЭИ','message':'course'}
    ]
    for payload in payloads:
        req = urllib.request.Request(base + 'api/forms', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            results['forms'].append({'form': payload['formType'], 'status': resp.status, 'email': body.get('email',{}).get('mode'), 'sheet': body.get('sheet',{}).get('mode')})
finally:
    server.kill()

out = site / '_smoke_test_report.json'
out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(results, ensure_ascii=False, indent=2))
