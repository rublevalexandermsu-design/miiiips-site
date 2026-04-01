from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'assets' / 'data'


def load(name: str):
    return json.loads((DATA / name).read_text(encoding='utf-8'))


def fail(errors: list[str], message: str):
    errors.append(message)


def main() -> int:
    errors: list[str] = []

    profiles = load('platform-profiles.json')
    courses = load('course-registry.json')
    grants = load('grant-registry.json')
    publications = load('publication-registry.json')
    research_cases = load('research-case-registry.json')
    research_meta = load('research-metadata.json')
    user_events = load('user-event-history.json')
    events = load('events.json')
    editorial = load('editorial-pipeline.json')

    profile_items = profiles.get('profiles', [])
    role_templates = profiles.get('roleTemplates', {})
    lifecycle_states = set(profiles.get('lifecycleStates', []))
    if not role_templates:
        fail(errors, 'platform-profiles.json: missing roleTemplates')
    if not lifecycle_states:
        fail(errors, 'platform-profiles.json: missing lifecycleStates')

    publication_ids = {item['id'] for item in publications.get('publications', [])}
    course_ids = {item['id'] for item in courses.get('courses', [])}
    grant_ids = {item['id'] for item in grants.get('grants', [])}
    case_ids = {item['id'] for item in research_cases.get('cases', [])}
    event_ids = {item['id'] for item in events.get('events', [])}
    metadata_ids = {item['id'] for item in research_meta.get('profiles', [])}

    required_profile_keys = {'id', 'roles', 'directions', 'status', 'route', 'courses', 'events', 'publications', 'researchTracks', 'grants', 'permissions', 'milestones'}
    for profile in profile_items:
        missing = required_profile_keys - set(profile)
        if missing:
            fail(errors, f"profile {profile.get('id')}: missing keys {sorted(missing)}")
        if profile.get('status') not in lifecycle_states:
            fail(errors, f"profile {profile.get('id')}: unknown lifecycle status {profile.get('status')}")
        for role in profile.get('roles', []):
            if role not in role_templates:
                fail(errors, f"profile {profile.get('id')}: unknown role template {role}")
        for active in profile.get('courses', {}).get('active', []):
            found = any(active == inst.get('id') for course in courses.get('courses', []) for inst in course.get('instances', []))
            if not found:
                fail(errors, f"profile {profile.get('id')}: unknown active course instance {active}")
        for rec in profile.get('grants', {}).get('recommended', []):
            if rec not in grant_ids:
                fail(errors, f"profile {profile.get('id')}: unknown recommended grant {rec}")
        for owned in profile.get('publications', {}).get('owned', []):
            if owned not in publication_ids:
                fail(errors, f"profile {profile.get('id')}: unknown publication {owned}")
        for item in profile.get('researchTracks', []):
            if item.get('id') not in case_ids:
                fail(errors, f"profile {profile.get('id')}: unknown research track {item.get('id')}")

    for course in courses.get('courses', []):
        for linked in course.get('linkedEvents', []):
            if linked not in event_ids:
                fail(errors, f"course {course['id']}: unknown linked event {linked}")
        for linked in course.get('linkedResearch', []):
            if linked not in case_ids:
                fail(errors, f"course {course['id']}: unknown linked research {linked}")
        if 'accessRules' not in course or 'progressRules' not in course or 'nextStepRules' not in course:
            fail(errors, f"course {course['id']}: missing flow rules")

    if 'sourceRegistry' not in grants:
        fail(errors, 'grant-registry.json: missing sourceRegistry')
    for grant in grants.get('grants', []):
        if 'sourceConfig' not in grant:
            fail(errors, f"grant {grant['id']}: missing sourceConfig")
        for linked in grant.get('linkedResearch', []):
            if linked not in case_ids:
                fail(errors, f"grant {grant['id']}: unknown linked research {linked}")
        for linked in grant.get('linkedPublications', []):
            if linked not in publication_ids:
                fail(errors, f"grant {grant['id']}: unknown linked publication {linked}")

    if 'roleResponsibilities' not in editorial:
        fail(errors, 'editorial-pipeline.json: missing roleResponsibilities')
    if 'contentContracts' not in editorial:
        fail(errors, 'editorial-pipeline.json: missing contentContracts')

    required_pub_keys = {'sourceType', 'direction', 'reviewState', 'ownerRole', 'publicCard', 'seoState', 'linkedEntities', 'page'}
    for item in publications.get('publications', []):
        missing = required_pub_keys - set(item)
        if missing:
            fail(errors, f"publication {item['id']}: missing keys {sorted(missing)}")
        for linked in item.get('linkedEntities', []):
            if linked not in event_ids and linked not in grant_ids and linked not in case_ids and linked not in course_ids and linked not in publication_ids and not str(linked).endswith('.html'):
                fail(errors, f"publication {item['id']}: unresolved linked entity {linked}")

    for case in research_cases.get('cases', []):
        required_case = {'authors', 'direction', 'artifacts', 'page', 'publicationRoute', 'state'}
        missing = required_case - set(case)
        if missing:
            fail(errors, f"case {case['id']}: missing keys {sorted(missing)}")
        if case.get('publicationRoute') not in publication_ids:
            fail(errors, f"case {case['id']}: unknown publication route {case.get('publicationRoute')}")
        if case.get('grantLink') and case.get('grantLink') not in grant_ids:
            fail(errors, f"case {case['id']}: unknown grant link {case.get('grantLink')}")
        if case.get('courseLink') and case.get('courseLink') not in course_ids:
            fail(errors, f"case {case['id']}: unknown course link {case.get('courseLink')}")
        if case['id'] not in metadata_ids:
            fail(errors, f"case {case['id']}: missing research metadata profile")

    for event_profile in user_events.get('profiles', []):
        if event_profile.get('profileId') not in {p['id'] for p in profile_items}:
            fail(errors, f"user-event-history: unknown profile {event_profile.get('profileId')}")
        for field in ('attended', 'upcoming'):
            for event_id in event_profile.get(field, []):
                if event_id not in event_ids:
                    fail(errors, f"user-event-history: unknown event {event_id} in {field}")
        for pub_id in event_profile.get('derivedOutputs', []):
            if pub_id not in publication_ids:
                fail(errors, f"user-event-history: unknown derived output {pub_id}")

    for event in events.get('events', []):
        for key, collection in (
            ('linkedCourse', course_ids),
            ('linkedResearch', case_ids),
            ('linkedPublication', publication_ids),
        ):
            value = event.get(key)
            if value and value not in collection:
                fail(errors, f"event {event['id']}: unknown {key} {value}")
        if 'materials' not in event or not event.get('materials'):
            fail(errors, f"event {event['id']}: missing materials")

    if errors:
        for error in errors:
            print(error)
        return 1

    print('site_data_guard: ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
