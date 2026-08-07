(function () {
  const CONFIG_URL = 'assets/data/site-settings.json';
  const DEFAULT_SETTINGS = {
    siteName: 'МИИИИПС',
    primaryDomain: location.hostname || 'miiiips.ru',
    baseUrl: location.origin && location.origin !== 'null' ? location.origin + '/' : 'https://miiiips.ru/',
    alternateDomains: [],
    analytics: {
      ga4MeasurementId: '',
      searchConsoleVerification: '',
      insightfulPipeMcpUrl: '',
      trackOutboundLinks: true,
      trackButtonClicks: true,
      debug: false,
    },
  };

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    const out = Array.isArray(base) ? base.slice() : { ...base };
    for (const [key, value] of Object.entries(extra)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        out[key] = deepMerge(base[key], value);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  async function loadSettings() {
    try {
      const res = await fetch(new URL(CONFIG_URL, location.href).toString(), { cache: 'no-store' });
      if (!res.ok) return DEFAULT_SETTINGS;
      const json = await res.json();
      return deepMerge(DEFAULT_SETTINGS, json);
    } catch (_) {
      return DEFAULT_SETTINGS;
    }
  }

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  }

  function ensureCanonical(baseUrl) {
    if (!document.head) return;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    try {
      canonical.setAttribute('href', new URL(location.pathname + location.search, baseUrl).toString());
    } catch (_) {
      canonical.setAttribute('href', baseUrl);
    }
  }

  function ensureSearchConsoleVerification(token) {
    if (!token || !document.head) return;
    let meta = document.querySelector('meta[name="google-site-verification"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'google-site-verification');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', token);
  }

  function injectGA4(measurementId) {
    if (!measurementId || document.getElementById('miiiips-ga4-loader')) return;
    const script = document.createElement('script');
    script.id = 'miiiips-ga4-loader';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    ensureDataLayer();
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      anonymize_ip: true,
      transport_type: 'beacon',
      cookie_domain: 'auto'
    });
  }

  function track(eventName, params = {}) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      ...params,
      page_location: location.href,
      page_path: location.pathname + location.search,
      page_title: document.title
    });
  }

  function labelFor(node) {
    return (node.getAttribute('data-track-label') || node.getAttribute('aria-label') || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  }

  function bindClicks(settings) {
    document.addEventListener('click', (event) => {
      const node = event.target.closest('a, button, [role="button"]');
      if (!node) return;
      const label = labelFor(node);
      const customEvent = node.getAttribute('data-track') || node.dataset.analyticsEvent || '';
      const isLink = node.tagName === 'A';
      const href = isLink ? node.getAttribute('href') || '' : '';
      const isOutbound = isLink && href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('/') && !href.startsWith(location.origin);

      if (customEvent) {
        track(customEvent, { label, target_href: href });
        return;
      }

      if (settings.analytics.trackButtonClicks !== false && (node.matches('a.btn, button, [role="button"], .btn, .partner-logo, .doc-card, .contact-card') || node.closest('nav'))) {
        track(node.closest('nav') ? 'nav_click' : 'ui_click', { label, target_href: href });
      }

      if (isOutbound && settings.analytics.trackOutboundLinks !== false) {
        track('outbound_click', { label, target_href: href });
      }
    }, true);

    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const formName = form.getAttribute('data-track') || form.id || form.name || 'form_submit';
      track(formName, {
        form_id: form.id || '',
        form_name: form.name || '',
        form_action: form.getAttribute('action') || ''
      });
    }, true);
  }

  async function init() {
    const settings = await loadSettings();
    window.MIIIIPS_SITE_SETTINGS = settings;
    window.MIIIIPS_ANALYTICS = window.MIIIIPS_ANALYTICS || {};
    window.MIIIIPS_ANALYTICS.track = track;
    window.MIIIIPS_ANALYTICS.settings = settings;

    ensureCanonical(settings.baseUrl || DEFAULT_SETTINGS.baseUrl);
    ensureSearchConsoleVerification(settings.analytics && settings.analytics.searchConsoleVerification);

    if (settings.analytics && settings.analytics.ga4MeasurementId) {
      injectGA4(settings.analytics.ga4MeasurementId);
    }

    bindClicks(settings);

    if (settings.analytics && settings.analytics.debug) {
      console.info('[MIIIIPS observability] ready', settings);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
