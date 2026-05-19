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

## 2026-05-03 — SEO/AEO Reindex Packet

- Project: Moonn / MIIIIPS public SEO bridge.
- Workstream: autonomous SEO follow-up supervisor.
- Trigger: user asked to create the next automation and begin the remaining SEO work.
- Decisions:
  - Continue the existing heartbeat automation instead of creating parallel reminders.
  - Convert the next indexing step into a reusable machine-first URL packet, not a chat-only checklist.
  - Keep public deploy/merge, reviews publication, Yandex Services editing, MSU Istina editing and paid-video/payment work behind the appropriate approval/access gates.
- Created files:
  - `docs/seo-aeo-reindex-url-packet-2026-05-03.json`
  - `docs/seo-aeo-reindex-url-packet-2026-05-03.md`
- Current PR status:
  - PR #11: `https://github.com/rublevalexandermsu-design/miiiips-site/pull/11`
  - Branch: `codex/miiiips-tatyana-entity-seo`
  - GitHub merge state: `CLEAN`
  - Status checks: none reported by GitHub at packet creation time.
- Open questions / blockers:
  - Merge/deploy PR #11 after public publication gate.
  - Request indexing in GSC/Yandex Webmaster after live deploy verification.
  - Pre-deploy live check: `https://miiiips.ru/`, `image-sitemap.xml` and `llms.txt` return `200`; `sitemap.xml`, `author-tatyana-munn-kumskova.html` and `person.json` still return `404`, which is expected until PR #11 is deployed but must be verified before indexing.
  - Synchronize Yandex Services and MSU Istina through visual/editor access.
  - Do not publish reviews screenshots/text or paid-video products until the separate compliance/data gates are complete.

## 2026-05-03 — Yandex Services Reviews Page Planning

- Project: Moonn / MIIIIPS public SEO bridge.
- Workstream: autonomous SEO follow-up supervisor / Moonn reviews page.
- Trigger: heartbeat resumed the SEO/AEO supervisor loop.
- Decisions:
  - Do not create a screenshot dump of Yandex Services reviews.
  - Use a structured review registry with source URL, review-level URL if available, date, rating, category, approved excerpt/summary, proof status and publication approval.
  - Screenshots are optional supporting evidence only after personal-data, platform-policy and copyright checks.
  - Keep the first step as a plan and data contract; do not publish review text, screenshots, reviewer names or avatars automatically.
- Created files:
  - `docs/moonn-yandex-services-reviews-page-plan-2026-05-03.json`
  - `docs/moonn-yandex-services-reviews-page-plan-2026-05-03.md`
- Sources checked:
  - Yandex review rules: `https://yandex.ru/support2/reviews/ru/rules?lang=ru`
  - Yandex Business review management: `https://yandex.ru/support/business-priority/ru/manage/reviews`
  - Yandex Webmaster scores/reviews: `https://yandex.ru/support/webmaster/ru/service/scores-and-reviews`
  - 152-FZ and 38-FZ baseline links from the existing publication compliance gate.
- Open questions / blockers:
  - Need visual access to Yandex Services reviews.
  - Need to verify whether individual review permalinks exist.
  - Need approval for screenshot policy, reviewer name/avatar policy and target Moonn URL.

## 2026-05-04 — SEO/AEO Supervisor Final Check

- Project: Moonn / MIIIIPS / Timepad SEO bridge.
- Workstream: autonomous SEO follow-up supervisor.
- Trigger: heartbeat completion rule.
- Decision:
  - Stop the recurring SEO heartbeat after final checkpoint because no further safe low-risk SEO edits remain without access or approval gates.
- Created files:
  - `docs/seo-aeo-supervisor-final-check-2026-05-04.md`
- Completed safe work:
  - MIIIIPS author/entity bridge PR prepared.
  - Timepad speaker block rollout completed.
  - Reindex URL packet prepared.
  - Legacy/test SEO artifact quarantined.
  - Reviews page plan prepared.
  - Moonn live SEO audit, patch packets and JSON-LD blocks prepared in the Moonn repo.
  - Moonn Yandex Services review URL canonicalized in the Moonn repo.
- Residual blockers:
  - PR #11 merge/deploy and live verification.
  - GSC/Yandex Webmaster indexing access.
  - Tilda supported editor path for live SEO/H1/JSON-LD application.
  - Yandex Services reviews access and personal-data/platform/legal gate.
  - MSU Istina profile access.
  - Paid-video registry and payment/provider approval.

## 2026-05-04 — Direct Event Publication: Psychology of Dating

- Project: MIIIIPS public site.
- Workstream: `miiiips-event-publication`.
- Branch: `codex/miiiips-event-psychology-dating-20260504`.
- Trigger: user asked to bypass the unstable Telegram intake bot and publish the 04.05.2026 lecture directly from Google Drive assets and a local audio recording.
- Event:
  - Title: `Психология знакомств`.
  - Speaker: `Татьяна Мунн`.
  - Date/time: `2026-05-04T19:00:00+03:00`.
  - Page: `event-psihologiya-znakomstva-04052026.html`.
- Decisions:
  - Reused the existing canonical page and registry entry instead of creating a duplicate page.
  - Stored Drive-derived photo and video as site assets with stable Latin filenames; kept Drive IDs and source folder in the event package provenance.
  - Did not commit the 94 MB source audio binary; stored transcript, segment log and source manifest in the event package.
  - Updated the public page from announcement status to archive/event-result status and kept public text editorial, not internal/technical.
- Created or updated files:
  - `event-psihologiya-znakomstva-04052026.html`
  - `assets/images/lectures/2026-05-04_psihologiya-znakomstva_psiholog-tatyana-munn-mgu_miiiips_photo-google-drive.png`
  - `assets/media/event-previews/2026-05-04_psihologiya-znakomstva-preview.mp4`
  - `assets/data/event-packages/psihologiya-znakomstva-04052026/transcript.md`
  - `assets/data/event-packages/psihologiya-znakomstva-04052026/transcript.segments.jsonl`
  - `assets/data/event-packages/psihologiya-znakomstva-04052026/source-manifest.json`
  - `assets/data/event-packages/psihologiya-znakomstva-04052026/verification-report.json`
  - `assets/data/page-manifests/psihologiya-znakomstva-04052026.json`
  - `assets/data/aeo-seo/packages/psihologiya-znakomstva-04052026.json`
  - `assets/data/events.json`
  - `assets/calendar/psihologiya-znakomstva-04052026.ics`
  - `image-sitemap.xml`
  - `llms.txt`
  - `assets/data/aeo-seo/index.md`
  - AEO/page-manifest index JSON files.
- Verification:
  - JSON parse passed for `events.json`, page manifest, AEO package and index JSON files.
  - Video probe: `assets/media/event-previews/2026-05-04_psihologiya-znakomstva-preview.mp4` is H.264/AAC, duration `112.919311` seconds, video frame `1440x1440`.
  - Browser media smoke: image loaded with natural size `3840x2160`; video loaded with duration `112.919311`, `readyState=4`; after programmatic play and 10 seconds, `currentTime=9.565508`, `paused=false`, `videoWidth=1440`, `videoHeight=1440`.
  - Screenshots saved in the event package: `verification-before-play.png`, `verification-after-10s.png`.
  - `site_smoke_test.py` returned HTTP 200 for the event page and the broader static page set.
- Existing unrelated blockers:
  - `tools/site_data_guard.py` and `tools/site_release_guard.py` still fail on older unrelated `events.json` records with missing `materials` and stale linked-course/publication references. The new `psihologiya-znakomstva-04052026` event is not among those failures.
- Follow-up rule:
  - For event pages with user-provided Drive media, create/update one canonical event package with `source-manifest.json`, transcript, media provenance and verification report before declaring completion.

## 2026-05-19 — Live Fix: Long-Term Relationships Event

- Project: MIIIIPS public site.
- Workstream: `miiiips-event-publication`.
- Branch: `codex/miiiips-event-psychology-dating-20260504`, then live deploy through `main`.
- Trigger: user opened the live page for `Психология длительных отношений` and found the placeholder video block plus an old Timepad-style image instead of the Google Drive event photo.
- Event:
  - Title: `Психология длительных отношений`.
  - Speaker: `Татьяна Мунн`.
  - Date/time: `2026-05-18T19:00:00+03:00`.
  - Page: `event-psihologiya-dlitelnyh-otnosheniy-18052026.html`.
- Decisions:
  - Use the Drive-derived auditorium photo as the only public event image with a Latin SEO-safe filename.
  - Use local H.264 preview video from `assets/media/event-previews/`, not a visible Google Drive link.
  - Keep Drive source URLs in the internal event package provenance, not in the public HTML/page manifest/AEO JSON for this event.
  - Deploy must go through `main` because `.github/workflows/pages.yml` publishes GitHub Pages only on pushes to `main`.
- Created or updated files:
  - `event-psihologiya-dlitelnyh-otnosheniy-18052026.html`
  - `event-feedback-psihologiya-dlitelnyh-otnosheniy-18052026.html`
  - `assets/images/lectures/2026-05-18-psihologiya-dlitelnyh-otnosheniy-ponedelnichnaya-spiker-po-10045c07.jpg`
  - `assets/media/event-previews/2026-05-18_psihologiya-dlitelnyh-otnosheniy-preview-h264.mp4`
  - `assets/media/event-previews/2026-05-18_psihologiya-dlitelnyh-otnosheniy-preview-poster.png`
  - `assets/data/events.json`
  - `assets/data/page-manifests/psihologiya-dlitelnyh-otnosheniy-18052026.json`
  - `assets/data/aeo-seo/packages/psihologiya-dlitelnyh-otnosheniy-18052026.json`
  - `image-sitemap.xml`
- Incident:
  - Symptom: live page still showed `Видео-анонс появится позже` and the wrong image.
  - Root cause: corrected artifacts existed in the local prototype, but were not propagated to `miiiips-live-publish/main`; GitHub Pages deploys only from `main`.
  - Resolution: move corrected event assets and downstream JSON into the live publish repo, remove old duplicate image, add event `materials`, then publish via `main`.
  - Follow-up rule: before reporting a site event complete, verify the actual deploy branch from `.github/workflows/pages.yml`, then check the live URL for image, video, JSON and absence of placeholder/Drive leakage.
- Existing unrelated blockers:
  - `tools/site_release_guard.py` still fails on older unrelated `events.json` records with missing `materials` and stale `data-fusion` links. The current event is no longer among those guard failures.

## 2026-05-19 — Event Workflow Extension: Telegram Follow-Up

- Project: MIIIIPS public site / Moonn communication funnel.
- Workstream: `miiiips-event-publication` + `telegram-followup-post`.
- Trigger: user requested that every published Monday lecture also produces a Telegram channel post after the site page and calendar are live.
- Decision:
  - Extend the fixed Monday lecture template instead of creating a separate ad hoc Telegram process.
  - Telegram publication is a downstream step after live URL verification, not a replacement for site publication.
  - Post text must be derived from the transcript, use the event photo, link to the paid lecture route on Moonn, and include four standing Moonn offers: teen psychology camp, exam-prep course, consultations, and review page.
  - Stop before sending the Telegram post and wait for user approval.
- Created files:
  - `assets/data/event-packages/psihologiya-dlitelnyh-otnosheniy-18052026/telegram-followup-draft.md`
  - `assets/data/event-packages/psihologiya-dlitelnyh-otnosheniy-18052026/telegram-followup-packet.json`
- Updated files:
  - `docs/monday-event-template.md`
- Verified facts:
  - `https://moonn.ru/events_tp` lists `Психология ДЛИТЕЛЬНЫХ ОТНОШЕНИЙ` for `18.05.2026`.
  - `https://moonn.ru/lectures1` is a general lecture archive/purchase-instruction page, but a specific paid card for `Психология длительных отношений` was not found.
  - Standing Moonn links found: `https://moonn.ru/podrostkovyy-lager-psihologiya`, `https://moonn.ru/psypodgotovka1`, `https://moonn.ru/psiholog-konsultacii-moskva`, `https://moonn.ru/otzivi?ostavit-otzyv=1&source=homepage_reviews_banner#moonn-review-funnel`.
- Incident / follow-up rule:
  - Symptom: event publication workflow previously stopped at site/calendar and did not create a channel follow-up draft.
  - Root cause: Telegram follow-up was not encoded as a required downstream artifact in the event template.
  - Resolution: add `telegram-followup-draft.md` and `telegram-followup-packet.json` as required post-publication artifacts.
  - Follow-up rule: every future Monday lecture publication must end with a Telegram draft packet and explicit approval gate before channel posting.
