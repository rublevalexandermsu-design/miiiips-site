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
