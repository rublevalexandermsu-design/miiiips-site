# Event Publication Workflow

This is the canonical workflow for publishing MIIIIPS event pages and their downstream communication artifacts.

## Scope

Use this workflow for institute event pages, especially Monday and Wednesday lecture pages that are built from a media package with photo, audio/video, transcript and calendar data.

## Required Inputs

- Canonical event package under `assets/data/event-packages/<event-id>/`.
- Event title, date, time, speaker, venue and format.
- Source photo from the event package or verified Drive intake, saved as a Latin SEO-safe site asset.
- Audio/video transcript or a documented transcript blocker.
- Preview video as a local site asset when used publicly; do not expose Google Drive as the visible video link.
- Moonn paid lecture route when a Telegram sales follow-up is required.

## Site Publication Steps

1. Resolve the correct Git repository and deploy branch before editing.
2. Create or update the event package with source provenance, transcript, media paths and verification notes.
3. Generate or update the event HTML page from the established page template.
4. Update downstream site data:
   - `assets/data/events.json`;
   - page manifest;
   - AEO/SEO package;
   - calendar `.ics`;
   - image sitemap and related indexes when image paths changed.
5. Run structural checks for JSON, links, image paths and public text.
6. Verify the actual live URL after deployment, not only the local file.

## Telegram Follow-Up Steps

Telegram is a required downstream step after live event publication, not a separate optional task.

1. Start only after the live site page and site calendar entry are verified.
2. Create `telegram-followup-draft.md` in the event package with a human-readable draft derived from the transcript.
3. Create `telegram-followup-message.html` with Telegram-ready HTML:
   - use `<b>`, `<i>`, `<u>` and `<a href="...">visible link text</a>`;
   - keep visible photo-caption text under `1024` characters unless sending as a separate text post;
   - do not show raw long URLs in the visible post;
   - do not include Drive links, local paths or internal workflow language.
4. Create or update `telegram-followup-packet.json` with:
   - event id, title and date;
   - source transcript, photo and live MIIIIPS page;
   - Moonn paid lecture route and verification status;
   - four standing Moonn routes;
   - caption file, media policy, approval status and proof paths.
5. Verify Moonn routes before composing the final caption:
   - lecture purchase route must point to the concrete paid lecture/card;
   - `https://moonn.ru/lectures1` is not a direct checkout by default;
   - do not reuse unrelated Tilda `#order` products;
   - if the concrete paid route is missing, stop and mark the packet blocked.
6. Include the four standing Moonn routes:
   - `https://moonn.ru/podrostkovyy-lager-psihologiya`;
   - `https://moonn.ru/psypodgotovka1`;
   - direct consultation order route from `moonn.ru`;
   - `https://moonn.ru/otzivi?ostavit-otzyv=1&source=homepage_reviews_banner#moonn-review-funnel`.
7. Send a private Telegram preview with the event photo and embedded links.
8. Save private preview proof in the event package.
9. Stop before channel publication until explicit user approval.
10. After approval, publish to `https://t.me/moonn_official`.
11. Verify the channel post visually:
   - event photo is attached;
   - links are embedded as blue visible text;
   - no raw URLs are visible except when deliberately required;
   - no Drive links are visible.
12. Save channel proof screenshot in the event package.
13. Update `telegram-followup-packet.json`, `docs/codex-chat-history.md` and any event manifest with the final send status.

## Completion Gate

The event is not complete until all relevant layers are synchronized:

- event package;
- public HTML page;
- `events.json`;
- calendar `.ics`;
- page manifest;
- AEO/SEO JSON;
- image sitemap when changed;
- live browser result;
- Telegram draft/packet;
- private Telegram preview proof;
- channel post proof after approval.

If any layer is missing or blocked, report the exact blocker and do not mark the workflow complete.

## Incident Rule

If a future event page is published without the Telegram draft packet, private preview, or post-approval channel proof, record it as an event publication incident and update this workflow instead of treating it as a one-off omission.
