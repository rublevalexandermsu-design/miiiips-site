# SEO/AEO Reindex URL Packet — 2026-05-03

Project: Moonn / MIIIIPS SEO-AEO rollout  
Workstream: `tatyana-munn-kumskova-entity-seo`  
Branch: `codex/miiiips-tatyana-entity-seo`  
PR: https://github.com/rublevalexandermsu-design/miiiips-site/pull/11

## Status

- PR #11 is open, not draft and GitHub reports `mergeStateStatus: CLEAN`.
- No required status checks were reported by GitHub at packet creation time.
- Public indexing requests should start only after PR merge, deploy and live URL verification.
- Paid video lecture work remains paused until a verified video registry exists.

## Pre-Deploy Live Check

- `https://miiiips.ru/` — `200`
- `https://miiiips.ru/image-sitemap.xml` — `200`
- `https://miiiips.ru/llms.txt` — `200`
- `https://miiiips.ru/sitemap.xml` — `404`, expected `200` after PR #11 deploy.
- `https://miiiips.ru/author-tatyana-munn-kumskova.html` — `404`, expected `200` after PR #11 deploy.
- `https://miiiips.ru/person.json` — `404`, expected `200` after PR #11 deploy.

Decision: current live site has not received the PR #11 entity bridge yet. Do not request indexing for new URLs until deploy verification returns `200`.

## Submit Sitemaps After Deploy

- `https://miiiips.ru/sitemap.xml`
- `https://miiiips.ru/image-sitemap.xml`
- `https://moonn.ru/sitemap.xml`

## Priority 1: Entity Bridge

Request indexing first:

- `https://miiiips.ru/`
- `https://miiiips.ru/author-tatyana-munn-kumskova.html`
- `https://miiiips.ru/person.json`
- `https://miiiips.ru/llms.txt`
- `https://miiiips.ru/sitemap.xml`
- `https://miiiips.ru/image-sitemap.xml`
- `https://miiiips.ru/assets/data/people/tatyana-munn-kumskova.json`

Purpose: connect `Татьяна Мунн`, `Кумскова Татьяна Михайловна`, MSU, Moonn, MIIIIPS, Timepad, Yandex Services, MSU Istina and PsyJournals as one public expert entity.

## Priority 2: MIIIIPS Lecture Cluster

- `https://miiiips.ru/event-kak-nayti-idealnogo-partnera-27042026.html`
- `https://miiiips.ru/event-psihologiya-znakomstva-04052026.html`
- `https://miiiips.ru/event-psihologiya-lyubvi-11052026.html`
- `https://miiiips.ru/event-psihologiya-dlitelnyh-otnosheniy-18052026.html`
- `https://miiiips.ru/event-krizisy-v-otnosheniyah-25052026.html`
- `https://miiiips.ru/event-kak-detstvo-vliyaet-na-nashi-otnosheniya-01062026.html`
- `https://miiiips.ru/event-psihologiya-lyubvi-k-sebe-08062026.html`
- `https://miiiips.ru/event-psihologiya-lichnyh-granits-15062026.html`
- `https://miiiips.ru/event-psihologiya-konfliktov-22062026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-v-otnosheniyah-29062026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-zdorove-14072026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-duhovnoe-razvitie-21072026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-otnosheniya-28072026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-lyubov-k-sebe-04082026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-hronicheskaya-ustalost-11082026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-tsifrovaya-sreda-18082026.html`
- `https://miiiips.ru/event-emotsionalnyy-intellekt-i-obuchenie-25082026.html`

## Priority 3: Moonn Core Pages

Inspect and request indexing only after confirming unique metadata, canonical and no accidental `noindex`:

- `https://moonn.ru/`
- `https://moonn.ru/events_tp`
- `https://moonn.ru/lectures1`
- `https://moonn.ru/psiholog-moskva-online`
- `https://moonn.ru/psiholog-konsultacii-moskva`
- `https://moonn.ru/uslugi_depression`
- `https://moonn.ru/emotional-intelligence/articles/benefits-of-ei`
- `https://moonn.ru/emotional-intelligence/knowledge-base/empathy`
- `https://moonn.ru/emotional-intelligence/knowledge-base/nonviolent-communication`

## External Entity Profiles

- Timepad: `https://moonn.timepad.ru/events/` — speaker block rollout completed for 34 events.
- Yandex Services: `https://uslugi.yandex.ru/profile/TatyanaKumskovatatyanamunn-948629` — needs visual/editor access to synchronize visible wording.
- MSU Istina: `https://istina.msu.ru/workers/816305440/` — needs visual/editor access if profile text can be changed.
- PsyJournals: `https://psyjournals.ru/authors/15337` — authority source for sameAs/provenance.

## Manual Checklist

1. Merge PR #11 after publication gate.
2. Verify live 200 responses for author page, `person.json`, `llms.txt`, sitemap and image sitemap. Pre-deploy live check found `sitemap.xml`, author page and `person.json` still returning `404`.
3. Submit/refresh MIIIIPS sitemaps in GSC and Yandex Webmaster.
4. Request indexing for Priority 1 URLs.
5. Request indexing for Priority 2 lecture/event URLs.
6. Inspect Moonn Priority 3 URLs and classify: fix content, 301, keep noindex, open to index, or strengthen SEO content.
7. Record indexing request dates and tool responses in the SEO work log.

## Blockers

- GSC/Yandex Webmaster indexing requests require access in the correct Chrome profile or connector access.
- Yandex Services profile synchronization requires visual access and approval for public text.
- MSU Istina profile synchronization requires access and confirmation that profile text/links can be edited.
- Reviews page needs a separate personal-data/copyright/platform-policy gate before screenshots or review text are published.
- Paid video lectures need a verified video registry before Tilda product/payment work resumes.
