# Codex Chat History

Append-only project history for `miiiips-live-publish`.

## 2026-05-03 — Tatiana Moonn/Kumskova Entity SEO

- Project: MIIIIPS public site (`miiiips.ru`).
- Workstream: author/entity SEO and AEO bridge for Татьяна Мунн / Кумскова Татьяна Михайловна.
- User request: continue SEO where useful and implement available parts of the five-point entity-linking plan on MIIIIPS and Timepad.
- Decisions:
  - Use a public author profile and machine-readable Person graph instead of hidden keyword text.
  - Keep the old participant id `kuntskova-tatyana-mikhailovna` for compatibility, but correct the visible name to `Кумскова Татьяна Михайловна` and add `canonicalPersonId`.
  - Link controlled profiles through `sameAs`: moonn.ru, Timepad, Яндекс Услуги, МГУ Истина, PsyJournals and the MIIIIPS profile.
- Changed files:
  - `author-tatyana-munn-kumskova.html`
  - `person.json`
  - `assets/data/people/tatyana-munn-kumskova.json`
  - `assets/data/platform-profiles.json`
  - `assets/data/site-content.json`
  - `assets/data/media-registry.json`
  - `media-story-tatyana-munn-editor.html`
  - `llms.txt`
  - `robots.txt`
  - `sitemap.xml`
  - `docs/publication-compliance/2026-05-03-tatyana-munn-entity-seo.json`
- Open questions:
  - After deployment, request indexing in Google Search Console and Yandex Webmaster.
  - After visual access is provided, synchronize Яндекс Услуги and МГУ Истина text manually.
  - Timepad speaker blocks must be updated through the Timepad contour or API token.
- Risks:
  - Do not use hidden SEO text; public identity bridge must remain visible and editorially natural.
  - Keep external profile URLs synchronized if any platform changes its profile path.

## 2026-05-03 — Timepad Speaker Block Rollout And Tilda Media Boundary

- Project: Moonn / MIIIIPS public SEO bridge.
- Workstream: external platform entity synchronization.
- User request: replace SEO-named images in Tilda blocks from `manifest.csv` and update Timepad events using the provided Timepad API token.
- Decisions:
  - Timepad: use a narrow `description_html` patch instead of republishing full events, to avoid changing tickets, dates, posters and registration settings.
  - Tilda: do not use undocumented internal editor endpoints for production image replacement. Official Tilda API is export/sync oriented and exposes `getprojectslist`, `getprojectinfo`, `getpageslist`, `getpage`, `getpagefull`, `getpageexport`, `getpagefullexport`; it does not expose a supported media-upload/block-replacement method.
- Actions:
  - Timepad dry-run found 34 target events and 0 access errors.
  - Timepad live rollout updated 30 event descriptions with the visible speaker block linking Татьяна Мунн / Кумскова Татьяна Михайловна to `moonn.ru`, Timepad and MIIIIPS author profile.
  - 4 remaining Timepad events hit API HTTP 429 rate limit before update.
  - Rollout report written to `docs/timepad-tatyana-speaker-block-rollout-2026-05-03.json`.
- Incident:
  - Symptom: Timepad API returned HTTP 429 during batch update and verification.
  - Root cause: too many Timepad GET/POST calls in one short window.
  - Resolution: stop batch hammering, preserve partial report, retry the remaining four events after the API rate window resets.
  - Follow-up rule: future Timepad batch updates must throttle requests and verify in chunks.
- Open questions:
  - Finish the four rate-limited Moonn Timepad emotional-intelligence events: 3944877, 3944878, 3944880, 3944881.
  - If Tilda source image replacement is still required, use visual Tilda editor/upload workflow or a documented Tilda-supported import path, not unofficial internal endpoints.

## 2026-05-03 — Heartbeat Resume Confirmed / Timepad Rollout Completed

- Project: Moonn / MIIIIPS / Timepad SEO bridge.
- Workstream: autonomous SEO follow-up supervisor.
- Trigger: Codex heartbeat `finish-timepad-speaker-block-rollout`.
- Result:
  - Heartbeat resumed the thread automatically after the assistant turn.
  - Remaining Timepad events `3944877`, `3944878`, `3944880`, `3944881` were retried after the rate-limit window.
  - All four were updated and verified with the visible speaker block.
  - Rollout report now contains `34` events and `0` failed verifications.
- Report:
  - `docs/timepad-tatyana-speaker-block-rollout-2026-05-03.json`
- Follow-up rule:
  - For future Timepad batches, update in throttled chunks and verify changed items first; avoid immediate full rereads if Timepad starts returning `HTTP 429`.

## 2026-05-03 — SEO/AEO Legacy Event Quarantine

- Project: Moonn / MIIIIPS public SEO bridge.
- Workstream: autonomous SEO follow-up supervisor.
- Trigger: user paused paid video lectures and asked to return to SEO/AEO automation.
- Decisions:
  - Paid video lecture rollout is paused until a verified video registry exists: article/SKU, title, date, source, final link and access status.
  - Existing heartbeat automation was updated instead of creating a second thread heartbeat.
  - A draft-like event page with internal task wording was treated as a legacy/test artifact, not rewritten into invented public facts.
- Changed files:
  - `assets/data/events.json`
  - `assets/data/page-manifests/index.json`
  - `assets/data/aeo-seo/index.json`
  - `assets/data/aeo-seo/index.md`
  - `assets/data/aeo-seo/kinds/public_lecture.json`
  - `assets/data/aeo-seo/packages/index.json`
  - `llms.txt`
  - `sitemap.xml`
  - `image-sitemap.xml`
  - `event-ideya-takaya-chto-ya-registr-4fec521510-17042026.html`
  - `event-feedback-ideya-takaya-chto-ya-registr-4fec521510-17042026.html`
  - `docs/seo-aeo-legacy-event-quarantine-2026-05-03.json`
- Removed files:
  - `assets/data/page-manifests/ideya-takaya-chto-ya-registr-4fec521510-17042026.json`
  - `assets/data/aeo-seo/packages/ideya-takaya-chto-ya-registr-4fec521510-17042026.json`
- Verified:
  - Internal phrase scan no longer finds the leaked draft wording in public HTML or machine indexes.
  - JSON validation passed for updated event/AEO/page-manifest files.
  - `site_smoke_test.py` returned HTTP 200 for checked pages and assets.
- Incident:
  - Symptom: internal task wording leaked into public SEO/AEO surfaces and a live HTML page.
  - Root cause: a draft event was promoted into generated page manifests, AEO packages, sitemap, image sitemap and `llms.txt` without a public-content gate.
  - Resolution: removed it from indexable machine layers, deleted its generated sidecar JSON files, added `noindex,nofollow,noarchive` to the legacy HTML pages and replaced visible wording with neutral archive copy.
  - Follow-up rule: before closing SEO/AEO work, scan public HTML and machine indexes for internal task language and quarantine/remove unverified test pages from indexable surfaces.
