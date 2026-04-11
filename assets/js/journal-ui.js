(function () {
  const STORAGE_KEY = 'journal-lang';

  function setLanguage(lang) {
    const normalized = lang === 'en' ? 'en' : 'ru';
    document.body.dataset.lang = normalized;
    document.documentElement.lang = normalized === 'en' ? 'en' : 'ru';
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch (error) {
      // ignore storage failures in static prototype
    }
    document.querySelectorAll('[data-lang-switch]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.langSwitch === normalized);
      button.setAttribute('aria-pressed', button.dataset.langSwitch === normalized ? 'true' : 'false');
    });
  }

  function initLanguage() {
    const params = new URLSearchParams(location.search);
    const queryLang = params.get('lang');
    let preferred = queryLang;
    if (!preferred) {
      try {
        preferred = localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        preferred = null;
      }
    }
    setLanguage(preferred || 'ru');
    document.querySelectorAll('[data-lang-switch]').forEach(function (button) {
      button.addEventListener('click', function () {
        const next = button.dataset.langSwitch || 'ru';
        setLanguage(next);
        const url = new URL(location.href);
        url.searchParams.set('lang', next);
        history.replaceState({}, '', url.toString());
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initLanguage);
})();
