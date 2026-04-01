from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'assets' / 'data'


def load(name: str):
    return json.loads((DATA / name).read_text(encoding='utf-8-sig'))


def fail(errors, message):
    errors.append(message)


def main() -> int:
    errors = []
    profiles = load('platform-profiles.json')
    courses = load('course-registry.json')
    grants = load('grant-registry.json')
    grant_apps = load('grant-application-registry.json')
    publications = load('publication-registry.json')
    research_cases = load('research-case-registry.json')
    research_meta = load('research-metadata.json')
    user_events = load('user-event-history.json')
    events = load('events.json')
    editorial = load('editorial-pipeline.json')
    ingest = load('editorial-ingest.json')

    participants = profiles.get('participants', [])
    role_templates = profiles.get('roleTemplates', {})
    lifecycle_states = set(profiles.get('lifecycleStates', []))
    default_profile = profiles.get('defaultProfileId')
    if not participants:
        fail(errors, 'platform-profiles.json: missing participants')
    if not role_templates:
        fail(errors, 'platform-profiles.json: missing roleTemplates')
    if not lifecycle_states:
        fail(errors, 'platform-profiles.json: missing lifecycleStates')
    participant_ids = {p['id'] for p in participants}
    if default_profile not in participant_ids:
        fail(errors, 'platform-profiles.json: invalid defaultProfileId')

    publication_ids = {item['id'] for item in publications.get('publications', [])}
    course_ids = {item['id'] for item in courses.get('courses', [])}
    course_instance_ids = {inst['id'] for item in courses.get('courses', []) for inst in item.get('instances', [])}
    grant_ids = {item['id'] for item in grants.get('grants', [])}
    case_ids = {item['id'] for item in research_cases.get('cases', [])}
    event_ids = {item['id'] for item in events.get('events', [])}
    metadata_ids = {item['id'] for item in research_meta.get('profiles', [])}
    ingest_ids = {item['id'] for item in ingest.get('sources', [])}

    required_profile_keys = {'id','roles','directions','status','route','courses','events','publications','researchTracks','grants','permissions','milestones'}
    for profile in participants:
        missing = required_profile_keys - set(profile)
        if missing:
            fail(errors, f"profile {profile.get('id')}: missing keys {sorted(missing)}")
        if profile.get('status') not in lifecycle_states:
            fail(errors, f"profile {profile.get('id')}: unknown lifecycle status {profile.get('status')}")
        for role in profile.get('roles', []):
            if role not in role_templates:
                fail(errors, f"profile {profile.get('id')}: unknown role template {role}")
        for active in profile.get('courses', {}).get('active', []) + profile.get('courses', {}).get('completed', []):
            if active not in course_instance_ids:
                fail(errors, f"profile {profile.get('id')}: unknown course instance {active}")
        for key in ('enrollmentState','accessState','paymentState','certificateState'):
            if key not in profile.get('courses', {}):
                fail(errors, f"profile {profile.get('id')}: missing courses.{key}")
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
        if 'accessRules' not in course or 'progressRules' not in course or 'nextStepRules' not in course:
            fail(errors, f"course {course['id']}: missing flow rules")
        if not isinstance(course.get('priceModel'), dict):
            fail(errors, f"course {course['id']}: invalid priceModel")
        for instance in course.get('instances', []):
            for key in ('paymentState','enrollmentState','accessState','certificateState'):
                if key not in instance:
                    fail(errors, f"course {course['id']}: instance {instance.get('id')} missing {key}")
        for linked in course.get('linkedEvents', []):
            if linked not in event_ids:
                fail(errors, f"course {course['id']}: unknown linked event {linked}")
        for linked in course.get('linkedResearch', []):
            if linked not in case_ids:
                fail(errors, f"course {course['id']}: unknown linked research {linked}")

    if 'sourceRegistry' not in grants:
        fail(errors, 'grant-registry.json: missing sourceRegistry')
    for grant in grants.get('grants', []):
        for pid in grant.get('profileFit', {}):
            if pid not in participant_ids:
                fail(errors, f"grant {grant['id']}: unknown profileFit participant {pid}")
    for app in grant_apps.get('applications', []):
        if app.get('participantId') not in participant_ids:
            fail(errors, f"grant application {app.get('id')}: unknown participantId")
        if app.get('grantId') not in grant_ids:
            fail(errors, f"grant application {app.get('id')}: unknown grantId")

    if 'roleResponsibilities' not in editorial or 'contentContracts' not in editorial:
        fail(errors, 'editorial-pipeline.json: missing roleResponsibilities or contentContracts')
    for source in ingest.get('sources', []):
        if source.get('ownerId') not in participant_ids:
            fail(errors, f"editorial source {source.get('id')}: unknown ownerId")
        if source.get('linkedPublication') and source.get('linkedPublication') not in publication_ids:
            fail(errors, f"editorial source {source.get('id')}: unknown linkedPublication")
        if source.get('linkedEvent') and source.get('linkedEvent') not in event_ids:
            fail(errors, f"editorial source {source.get('id')}: unknown linkedEvent")
        if source.get('linkedResearch') and source.get('linkedResearch') not in case_ids:
            fail(errors, f"editorial source {source.get('id')}: unknown linkedResearch")

    for item in publications.get('publications', []):
        required_pub_keys = {'sourceType','sourceId','direction','reviewState','ownerRole','ownerId','publicCard','seoState','linkedEntities','page'}
        missing = required_pub_keys - set(item)
        if missing:
            fail(errors, f"publication {item['id']}: missing keys {sorted(missing)}")
        if item.get('sourceId') not in ingest_ids:
            fail(errors, f"publication {item['id']}: unknown sourceId")
        if item.get('ownerId') not in participant_ids:
            fail(errors, f"publication {item['id']}: unknown ownerId")

    for case in research_cases.get('cases', []):
        required_case = {'authors','direction','artifacts','page','publicationRoute','state','evidenceState','reviewCompleteness','publicationReadiness','lifecycle'}
        missing = required_case - set(case)
        if missing:
            fail(errors, f"case {case['id']}: missing keys {sorted(missing)}")
        if case.get('publicationRoute') not in publication_ids:
            fail(errors, f"case {case['id']}: unknown publication route")
        if case.get('grantLink') and case.get('grantLink') not in grant_ids:
            fail(errors, f"case {case['id']}: unknown grant link")
        if case.get('courseLink') and case.get('courseLink') not in course_ids:
            fail(errors, f"case {case['id']}: unknown course link")
        if case['id'] not in metadata_ids:
            fail(errors, f"case {case['id']}: missing research metadata")

    for event_profile in user_events.get('profiles', []):
        if event_profile.get('profileId') not in participant_ids:
            fail(errors, f"user-event-history: unknown profile {event_profile.get('profileId')}")
        for field in ('attended','upcoming','registrations'):
            for event_id in event_profile.get(field, []):
                if event_id not in event_ids:
                    fail(errors, f"user-event-history: unknown event {event_id} in {field}")
        for pub_id in event_profile.get('derivedOutputs', []):
            if pub_id not in publication_ids:
                fail(errors, f"user-event-history: unknown derived output {pub_id}")

    for event in events.get('events', []):
        for key, collection in (('linkedCourse', course_ids), ('linkedResearch', case_ids), ('linkedPublication', publication_ids)):
            value = event.get(key)
            if value and value not in collection:
                fail(errors, f"event {event['id']}: unknown {key} {value}")
        if not event.get('materials'):
            fail(errors, f"event {event['id']}: missing materials")

    if errors:
        for error in errors:
            print(error)
        return 1
    print('site_data_guard: ok')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
