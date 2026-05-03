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
