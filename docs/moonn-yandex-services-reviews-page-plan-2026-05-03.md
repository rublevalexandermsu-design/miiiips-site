# Moonn Reviews Page Plan — Yandex Services

Status: plan only, no publication  
Created: 2026-05-03  
Workstream: `moonn-yandex-services-reviews-seo`  
Source profile: `https://uslugi.yandex.ru/profile/TatyanaKumskovatatyanamunn-948629`

## Decision

Do not build the page as a raw screenshot dump. The stronger architecture is a verified review registry:

- source profile URL;
- review-level URL if Yandex exposes one;
- date/rating/category;
- short approved excerpt or public summary;
- internal proof screenshot if needed;
- explicit publication approval flag;
- schema.org output for `Review`, `AggregateRating`, `Person`, `ProfessionalService`, `FAQPage` and `BreadcrumbList`.

Screenshots can be added later only after approval and platform/personal-data review.

## Candidate Page

URL candidate: `https://moonn.ru/reviews`  
Title candidate: `Отзывы о консультациях и лекциях Татьяны Мунн`

SEO/AEO intents:

- `отзывы Татьяна Мунн`
- `Татьяна Мунн психолог отзывы`
- `Кумскова Татьяна Михайловна отзывы`
- `психолог МГУ консультация отзывы`
- `эмоциональный интеллект отзывы`

## Public Structure

1. Editorial intro linking Татьяна Мунн, Кумскова Татьяна Михайловна, МГУ, эмоциональный интеллект and Moonn.
2. Aggregate source block: where reviews come from and how they are verified.
3. Review cards grouped by service type:
   - consultations;
   - lectures;
   - emotional intelligence;
   - adolescent psychology;
   - relationships.
4. CTA to Yandex Services profile and relevant Moonn pages.
5. FAQ for AI/search:
   - where the reviews are from;
   - how to verify them;
   - how to book a consultation;
   - how lectures and courses differ.

## Evidence Policy

Preferred: direct source links/permalinks for each review.

If Yandex does not provide review-level permalinks:

- link every card to the public Yandex Services profile;
- store internal screenshots as private proof;
- publish only short excerpts or summaries after approval;
- avoid reviewer avatars and full names by default.

## Image Policy

Default: avoid publishing screenshots.  
If screenshots are approved:

- use latin filenames only;
- strip unnecessary browser chrome and unrelated personal data;
- export WebP/JPEG with stable SEO names, for example:
  `yandex-services-review-tatyana-moonn-consultation-2026-05-03-001.webp`;
- use short visible captions, and keep detailed context in `alt`, image sitemap and schema.

Alt template:
`Подтвержденный отзыв о консультации Татьяны Мунн на Яндекс Услугах`

## Compliance Risks

- Personal data: names, avatars, profile links and review text may identify people.
- Platform policy: Yandex may limit external reuse of reviews/screenshots.
- Copyright/database rights: bulk copied reviews are riskier than short excerpts with links.
- Advertising claims: avoid guarantees and exaggerated claims.
- Psychology/health sensitivity: avoid medical promises and treatment guarantees.

## Sources Checked

- Yandex review rules: `https://yandex.ru/support2/reviews/ru/rules?lang=ru`
- Yandex Business review management: `https://yandex.ru/support/business-priority/ru/manage/reviews`
- Yandex Webmaster scores/reviews: `https://yandex.ru/support/webmaster/ru/service/scores-and-reviews`
- 152-FZ personal data baseline: `https://www.consultant.ru/document/cons_doc_LAW_61801/`
- 38-FZ advertising baseline: `https://www.consultant.ru/document/cons_doc_LAW_58968/`

## Next Safe Steps

1. Open Yandex Services reviews through the correct visual account.
2. Check whether individual review permalinks exist.
3. Build a private pilot manifest for 10 reviews, without publication.
4. Classify reviews by service category and topic.
5. Prepare a Tilda draft page with placeholders and schema.
6. Publish only after approval of text, screenshot policy and personal-data handling.
7. Request indexing only after live QA and compliance gate.

## Blockers

- Need visual access to Yandex Services reviews.
- Need decision on reviewer name/avatar policy.
- Need decision on screenshot publication policy.
- Need confirmation whether review-level permalinks exist.
- Need target decision: new `/reviews` page or retrofit of an existing Moonn reviews page.
