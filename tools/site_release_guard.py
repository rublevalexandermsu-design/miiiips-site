from __future__ import annotations

import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_TARGETS = [
    'accounts.html','account-author.html','account-student.html','account-supervisor.html','account-editor.html','account-coordinator.html',
    'course-ei.html','course-ei-program.html','course-certificate-ei.html','payment-demo.html','grants-teams.html','conferences.html',
    'research-sandbox.html','publications.html','biomechanics-rowing.html'
]
BANNED = ['jsonl','manifest','workflow','prototype','metadata','guard','ready_for_page','next steps','closure report','manual queue','clean-feed','blocked_access','manual_gate','demo-flow']
PLACEHOLDERS = ['будет добавлена позже','временно недоступ','список появится по мере наполнения маршрута']
REQUIRED_SCRIPT_PAGES = {
    'accounts.html': ['account-profile-summary','account-profile-switcher','account-quick-routes','account-operational-dashboard'],
    'account-author.html': ['role-profile-summary','role-route-summary','role-next-actions'],
    'account-student.html': ['role-profile-summary','role-route-summary','role-next-actions'],
    'account-supervisor.html': ['role-profile-summary','role-route-summary','role-next-actions'],
    'account-editor.html': ['role-profile-summary','role-route-summary','role-next-actions'],
    'account-coordinator.html': ['role-profile-summary','role-route-summary','role-next-actions'],
    'course-ei.html': ['course-shell-status','course-factory-status','course-linked-surfaces'],
    'grants-teams.html': ['grant-shell-status','grant-research-status','grant-application-state'],
    'conferences.html': ['event-shell-status','event-route-status'],
    'research-sandbox.html': ['research-shell-status','research-case-list'],
    'publications.html': ['editorial-shell-status','publication-route-summary','publication-card-list'],
    'biomechanics-rowing.html': ['rowing-case-evidence','rowing-case-status','rowing-case-route']
}
ROUTE_KEYS = {'page','route','public_page','grant_surface','course_surface','detailPage','paymentRoute','certificatePage'}


def load_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding='utf-8-sig'))


def check_public_copy(errors):
    for rel in PUBLIC_TARGETS:
        soup = BeautifulSoup((ROOT / rel).read_text(encoding='utf-8-sig'), 'html.parser')
        for tag in soup(['script','style']):
            tag.extract()
        text = soup.get_text(' ', strip=True).lower()
        for token in BANNED:
            if token in text:
                errors.append(f'{rel}: banned token in visible copy: {token}')
        for token in PLACEHOLDERS:
            if token in text:
                errors.append(f'{rel}: placeholder text in visible copy: {token}')


def check_mounts(errors):
    for rel, mounts in REQUIRED_SCRIPT_PAGES.items():
        raw = (ROOT / rel).read_text(encoding='utf-8-sig')
        if 'platform-shell.js' not in raw:
            errors.append(f'{rel}: missing platform-shell.js include')
        soup = BeautifulSoup(raw, 'html.parser')
        for mount in mounts:
            if not soup.find(id=mount):
                errors.append(f'{rel}: missing mount #{mount}')


def route_exists(candidate: str) -> bool:
    if not candidate or candidate.startswith('http') or candidate.startswith('#'):
        return True
    return (ROOT / candidate.split('?', 1)[0]).exists()


def walk_routes(value, collector):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ROUTE_KEYS and isinstance(item, str):
                collector.append(item)
            else:
                walk_routes(item, collector)
    elif isinstance(value, list):
        for item in value:
            walk_routes(item, collector)


def check_route_consistency(errors):
    for rel in [
        'assets/data/platform-profiles.json','assets/data/course-registry.json','assets/data/grant-registry.json',
        'assets/data/grant-application-registry.json','assets/data/editorial-ingest.json','assets/data/publication-registry.json',
        'assets/data/research-case-registry.json','assets/data/research-metadata.json','assets/data/events.json'
    ]:
        routes = []
        walk_routes(load_json(rel), routes)
        for route in routes:
            if not route_exists(route):
                errors.append(f'{rel}: broken route reference: {route}')


def check_data_consistency(errors):
    profiles = load_json('assets/data/platform-profiles.json')
    courses = load_json('assets/data/course-registry.json')['courses']
    grants = load_json('assets/data/grant-registry.json')['grants']
    grant_apps = load_json('assets/data/grant-application-registry.json')['applications']
    editorial = load_json('assets/data/editorial-pipeline.json')
    ingest = load_json('assets/data/editorial-ingest.json')['sources']
    publications = load_json('assets/data/publication-registry.json')['publications']
    cases = load_json('assets/data/research-case-registry.json')['cases']
    metadata = load_json('assets/data/research-metadata.json')['profiles']
    events = load_json('assets/data/events.json')['events']
    event_history = load_json('assets/data/user-event-history.json')['profiles']

    participants = profiles.get('participants', [])
    if not participants:
        errors.append('platform-profiles.json: missing participants')
    if profiles.get('defaultProfileId') not in {p['id'] for p in participants}:
        errors.append('platform-profiles.json: invalid defaultProfileId')

    participant_ids = {p['id'] for p in participants}
    course_ids = {c['id'] for c in courses}
    course_instance_ids = {i['id'] for c in courses for i in c.get('instances', [])}
    grant_ids = {g['id'] for g in grants}
    publication_ids = {p['id'] for p in publications}
    case_ids = {c['id'] for c in cases}
    event_ids = {e['id'] for e in events}
    metadata_ids = {m['id'] for m in metadata}
    ingest_ids = {s['id'] for s in ingest}

    for p in participants:
        required = {'id','roles','directions','status','route','courses','events','publications','researchTracks','grants','permissions','milestones'}
        missing = required - set(p)
        if missing:
            errors.append(f"platform-profiles.json: {p.get('id')} missing {sorted(missing)}")
        for item in p.get('courses', {}).get('active', []) + p.get('courses', {}).get('completed', []):
            if item not in course_instance_ids:
                errors.append(f"platform-profiles.json: {p['id']} unknown course instance {item}")
        for pub in p.get('publications', {}).get('owned', []):
            if pub not in publication_ids:
                errors.append(f"platform-profiles.json: {p['id']} unknown publication {pub}")
        for track in p.get('researchTracks', []):
            if track.get('id') not in case_ids:
                errors.append(f"platform-profiles.json: {p['id']} unknown research track {track.get('id')}")
        for grant in p.get('grants', {}).get('eligible', []):
            if grant not in grant_ids:
                errors.append(f"platform-profiles.json: {p['id']} unknown grant {grant}")
        for key in ('enrollmentState','accessState','paymentState','certificateState'):
            if key not in p.get('courses', {}):
                errors.append(f"platform-profiles.json: {p['id']} missing courses.{key}")

    for course in courses:
        if not isinstance(course.get('priceModel'), dict):
            errors.append(f"course-registry.json: {course['id']} priceModel must be object")
        for inst in course.get('instances', []):
            for key in ('paymentState','enrollmentState','accessState','certificateState'):
                if key not in inst:
                    errors.append(f"course-registry.json: {course['id']} instance {inst.get('id')} missing {key}")
        for linked in course.get('linkedEvents', []):
            if linked not in event_ids:
                errors.append(f"course-registry.json: {course['id']} unknown event {linked}")
        for linked in course.get('linkedResearch', []):
            if linked not in case_ids:
                errors.append(f"course-registry.json: {course['id']} unknown research {linked}")

    for grant in grants:
        for pid in grant.get('profileFit', {}).keys():
            if pid not in participant_ids:
                errors.append(f"grant-registry.json: {grant['id']} unknown profileFit participant {pid}")

    for app in grant_apps:
        if app.get('participantId') not in participant_ids:
            errors.append(f"grant-application-registry.json: unknown participant {app.get('participantId')}")
        if app.get('grantId') not in grant_ids:
            errors.append(f"grant-application-registry.json: unknown grant {app.get('grantId')}")

    if 'roleResponsibilities' not in editorial or 'contentContracts' not in editorial:
        errors.append('editorial-pipeline.json: missing responsibilities/contracts')

    for source in ingest:
        if source.get('ownerId') not in participant_ids:
            errors.append(f"editorial-ingest.json: {source['id']} unknown ownerId")
        if source.get('linkedPublication') and source['linkedPublication'] not in publication_ids:
            errors.append(f"editorial-ingest.json: {source['id']} unknown linkedPublication")
        if source.get('linkedEvent') and source['linkedEvent'] not in event_ids:
            errors.append(f"editorial-ingest.json: {source['id']} unknown linkedEvent")
        if source.get('linkedResearch') and source['linkedResearch'] not in case_ids:
            errors.append(f"editorial-ingest.json: {source['id']} unknown linkedResearch")

    for pub in publications:
        for key in ('sourceId','ownerId','publicCard','seoState','linkedEntities','page'):
            if key not in pub:
                errors.append(f"publication-registry.json: {pub['id']} missing {key}")
        if pub.get('sourceId') not in ingest_ids:
            errors.append(f"publication-registry.json: {pub['id']} unknown sourceId")
        if pub.get('ownerId') not in participant_ids:
            errors.append(f"publication-registry.json: {pub['id']} unknown ownerId")

    for case in cases:
        for key in ('evidenceState','reviewCompleteness','publicationReadiness','lifecycle'):
            if key not in case:
                errors.append(f"research-case-registry.json: {case['id']} missing {key}")
        if case['id'] not in metadata_ids:
            errors.append(f"research-case-registry.json: {case['id']} missing metadata")
        if case.get('publicationRoute') not in publication_ids:
            errors.append(f"research-case-registry.json: {case['id']} unknown publicationRoute")

    for item in event_history:
        if item.get('profileId') not in participant_ids:
            errors.append(f"user-event-history.json: unknown profile {item.get('profileId')}")
        for ev in item.get('attended', []) + item.get('upcoming', []) + item.get('registrations', []):
            if ev not in event_ids:
                errors.append(f"user-event-history.json: unknown event {ev}")
        for pub in item.get('derivedOutputs', []):
            if pub not in publication_ids:
                errors.append(f"user-event-history.json: unknown derived output {pub}")

    for event in events:
        if not event.get('materials'):
            errors.append(f"events.json: {event['id']} missing materials")
        for key, collection in [('linkedCourse', course_ids), ('linkedResearch', case_ids), ('linkedPublication', publication_ids)]:
            if event.get(key) and event.get(key) not in collection:
                errors.append(f"events.json: {event['id']} unknown {key} {event.get(key)}")


def main() -> int:
    errors = []
    check_public_copy(errors)
    check_mounts(errors)
    check_route_consistency(errors)
    check_data_consistency(errors)
    if errors:
        print('\n'.join(errors))
        return 1
    print('site_release_guard: ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
