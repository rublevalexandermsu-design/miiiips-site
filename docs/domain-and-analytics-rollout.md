# Domain and Analytics Rollout

## Target domain
- Primary: `miiiips.ru`
- Existing subdomain already present in the repo: `gelendzhik.miiiips.ru`

## Deployment model
- Keep the static site on GitHub Pages for now.
- Publish it under the custom domain via `CNAME`.
- This is the lowest-risk way to move off the GitHub Pages URL without changing the site architecture.

## Observability model
1. `robots.txt` and `sitemap.xml` are now part of the public site root.
2. `assets/data/site-settings.json` is the single config source for domain and analytics settings.
3. `assets/js/site-observability.js` loads GA4 only when a measurement ID is filled in.
4. Search Console verification will be added once the verification token is available.
5. `InsightfulPipe` can later be connected on top of GA4 and Search Console without changing the public site pages.

## What still needs credentials
- GA4 Measurement ID
- Search Console verification token or file
- Any InsightfulPipe connector URLs

## Why this is the right order
- domain first, because analytics on the wrong host produces split data;
- sitemap/robots next, because Search Console needs crawlable structure;
- GA4 next, because behavioral data is needed for conversion analysis;
- InsightfulPipe last, because it should read from stable sources rather than driving the site itself.
