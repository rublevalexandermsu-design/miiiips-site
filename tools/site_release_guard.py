from __future__ import annotations

import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_TARGETS = [
    'accounts.html',
    'account-author.html',
    'account-student.html',
    'account-supervisor.html',
    'account-editor.html',
    'account-coordinator.html',
    'course-ei.html',
    'grants-teams.html',
    'conferences.html',
    'research-sandbox.html',
    'publications.html',
    'biomechanics-rowing.html'
]
BANNED = [
    'jsonl', 'manifest', 'workflow', 'prototype', 'metadata', 'guard', 'ready_for_page',
    'next steps', 'closure report', 'authorid', 'trackid', 'journalid', 'submissionid',
    'manual queue', 'clean-feed', 'demo-flow', 'blocked_access', 'manual_gate'
]
PLACEHOLDERS = [
    'будет добавлена позже',
    'временно недоступ',
    'список появится по мере наполнения маршрута'
]
REQUIRED_SCRIPT_PAGES = {
    'accounts.html': ['account-profile-summary', 'account-profile-switcher', 'account-quick-routes', 'account-operational-dashboard'],
    'account-author.html': ['role-profile-summary', 'role-route-summary', 'role-next-actions'],
    'account-student.html': ['role-profile-summary', 'role-route-summary', 'role-next-actions'],
    'account-supervisor.html': ['role-profile-summary', 'role-route-summary', 'role-next-actions'],
    'account-editor.html': ['role-profile-summary', 'role-route-summary', 'role-next-actions'],
    'account-coordinator.html': ['role-profile-summary', 'role-route-summary', 'role-next-actions'],
    'course-ei.html': ['course-shell-status', 'course-factory-status', 'course-linked-surfaces'],
    'grants-teams.html': ['grant-shell-status', 'grant-research-status', 'grant-application-state'],
    'conferences.html': ['event-shell-status', 'event-route-status'],
    'research-sandbox.html': ['research-shell-status', 'research-case-list'],
    'publications.html': ['editorial-shell-status', 'publication-route-summary'],
    'biomechanics-rowing.html': ['rowing-case-evidence', 'rowing-case-status', 'rowing-case-route']
}
ROUTE_KEYS = {'page', 'route', 'public_page', 'grant_surface', 'course_surface', 'detailPage'}


def load_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def check_public_copy(errors: list[str]) -> None:
    for rel in PUBLIC_TARGETS:
        soup = BeautifulSoup((ROOT / rel).read_text(encoding='utf-8'), 'html.parser')
        for tag in soup(['script', 'style']):
            tag.extract()
        text = soup.get_text(' ', strip=True).lower()
        for token in BANNED:
            if token in text:
                errors.append(f'{rel}: banned token in visible copy: {token}')
        for token in PLACEHOLDERS:
            if token in text:
                errors.append(f'{rel}: placeholder text in visible copy: {token}')


def check_mounts_and_runtime(errors: list[str]) -> None:
    for rel, mounts in REQUIRED_SCRIPT_PAGES.items():
        path = ROOT / rel
        raw = path.read_text(encoding='utf-8')
        if 'platform-shell.js' not in raw:
            errors.append(f'{rel}: missing platform-shell.js include')
        soup = BeautifulSoup(raw, 'html.parser')
        for mount in mounts:
            if not soup.find(id=mount):
                errors.append(f'{rel}: missing mount #{mount}')


def route_exists(candidate: str) -> bool:
    if not candidate or candidate.startswith('http') or candidate.startswith('#'):
        return True
    candidate = candidate.split('?', 1)[0]
    return (ROOT / candidate).exists()


def walk_routes(value, collector: list[str]):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ROUTE_KEYS and isinstance(item, str):
                collector.append(item)
            else:
                walk_routes(item, collector)
    elif isinstance(value, list):
        for item in value:
            walk_routes(item, collector)


def check_route_consistency(errors: list[str]) -> None:
    route_sources = [
        'assets/data/platform-profiles.json',
        'assets/data/course-registry.json',
        'assets/data/grant-registry.json',
        'assets/data/publication-registry.json',
        'assets/data/research-case-registry.json',
        'assets/data/research-metadata.json',
        'assets/data/events.json'
    ]
    for rel in route_sources:
        payload = load_json(rel)
        routes: list[str] = []
        walk_routes(payload, routes)
        for route in routes:
            if not route_exists(route):
                errors.append(f'{rel}: broken route reference: {route}')


def check_data_consistency(errors: list[str]) -> None:
    profiles = load_json('assets/data/platform-profiles.json')['profiles']
    courses = load_json('assets/data/course-registry.json')['courses']
    grants = load_json('assets/data/grant-registry.json')['grants']
    publications = load_json('assets/data/publication-registry.json')['publications']
    cases = load_json('assets/data/research-case-registry.json')['cases']
    metadata = load_json('assets/data/research-metadata.json')
    events = load_json('assets/data/events.json')['events']
    event_history = load_json('assets/data/user-event-history.json')['profiles']

    course_ids = {item['id'] for item in courses}
    course_instance_ids = {inst['id'] for item in courses for inst in item.get('instances', [])}
    grant_ids = {item['id'] for item in grants}
    publication_ids = {item['id'] for item in publications}
    case_ids = {item['id'] for item in cases}
    event_ids = {item['id'] for item in events}
    profile_ids = {item['id'] for item in profiles}

    for profile in profiles:
        for event_id in profile.get('events', {}).get('attended', []):
            if event_id not in event_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing attended event {event_id}")
        for event_id in profile.get('events', {}).get('upcoming', []):
            if event_id not in event_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing upcoming event {event_id}")
        for pub_id in profile.get('publications', {}).get('owned', []):
            if pub_id not in publication_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing publication {pub_id}")
        for track in profile.get('researchTracks', []):
            track_id = track['id'] if isinstance(track, dict) else track
            if track_id not in case_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing research track {track_id}")
        for grant_id in profile.get('grants', {}).get('eligible', []):
            if grant_id not in grant_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing grant {grant_id}")
        for item in profile.get('courses', {}).get('active', []):
            if item not in course_instance_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing active course instance {item}")
        for item in profile.get('courses', {}).get('completed', []):
            if item not in course_instance_ids:
                errors.append(f"platform-profiles.json: {profile['id']} references missing completed course instance {item}")
        if not profile.get('permissions'):
            errors.append(f"platform-profiles.json: {profile['id']} missing permissions")
        if not profile.get('milestones'):
            errors.append(f"platform-profiles.json: {profile['id']} missing milestones")

    for course in courses:
        if not course.get('modules'):
            errors.append(f"course-registry.json: {course['id']} missing modules")
        for linked_event in course.get('linkedEvents', []):
            if linked_event not in event_ids:
                errors.append(f"course-registry.json: {course['id']} references missing event {linked_event}")
        for linked_research in course.get('linkedResearch', []):
            if linked_research not in case_ids:
                errors.append(f"course-registry.json: {course['id']} references missing research case {linked_research}")

    for grant in grants:
        for case_id in grant.get('linkedResearch', []):
            if case_id not in case_ids:
                errors.append(f"grant-registry.json: {grant['id']} references missing research case {case_id}")
        for pub_id in grant.get('linkedPublications', []):
            if pub_id not in publication_ids and not route_exists(pub_id):
                errors.append(f"grant-registry.json: {grant['id']} references missing publication or page {pub_id}")

    for publication in publications:
        if not publication.get('publicCard'):
            errors.append(f"publication-registry.json: {publication['id']} missing publicCard")
        for linked in publication.get('linkedEntities', []):
            if linked not in event_ids and linked not in grant_ids and linked not in case_ids and linked not in course_ids and not route_exists(linked):
                errors.append(f"publication-registry.json: {publication['id']} has unknown linked entity {linked}")

    for case in cases:
        for key in ('authors', 'artifacts', 'publicationRoute', 'state'):
            if not case.get(key):
                errors.append(f"research-case-registry.json: {case['id']} missing {key}")
        if case.get('publicationRoute') not in publication_ids:
            errors.append(f"research-case-registry.json: {case['id']} references missing publication route {case.get('publicationRoute')}")
        if case.get('grantLink') and case['grantLink'] not in grant_ids:
            errors.append(f"research-case-registry.json: {case['id']} references missing grant {case['grantLink']}")
        if case.get('courseLink') and case['courseLink'] not in course_ids:
            errors.append(f"research-case-registry.json: {case['id']} references missing course {case['courseLink']}")

    metadata_profiles = metadata.get('profiles', [])
    metadata_profile_ids = {item['id'] for item in metadata_profiles}
    for case in cases:
        if case['id'] not in metadata_profile_ids:
            errors.append(f"research-metadata.json: missing metadata profile for case {case['id']}")

    for item in event_history:
        if item['profileId'] not in profile_ids:
            errors.append(f"user-event-history.json: unknown profile {item['profileId']}")
        for event_id in item.get('attended', []) + item.get('upcoming', []):
            if event_id not in event_ids:
                errors.append(f"user-event-history.json: unknown event {event_id}")
        for pub_id in item.get('derivedOutputs', []):
            if pub_id not in publication_ids:
                errors.append(f"user-event-history.json: unknown derived output {pub_id}")


def main() -> int:
    errors: list[str] = []
    check_public_copy(errors)
    check_mounts_and_runtime(errors)
    check_route_consistency(errors)
    check_data_consistency(errors)
    if errors:
        print('\n'.join(errors))
        return 1
    print('site_release_guard: ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
