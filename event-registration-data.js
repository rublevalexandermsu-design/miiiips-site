(function () {
  const DATA_PATH = "assets/data/events.json";

  function safe(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function formatDate(date) {
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    const parsed = new Date(date);
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    return parsed.getDate() + " " + months[parsed.getMonth()] + " " + parsed.getFullYear() + " · " + hh + ":" + mm;
  }

  function genericEvent() {
    return {
      id: "generic",
      title: "Регистрация на мероприятие МИИИИПС",
      summary: "Если событие ещё не выбрано, оставьте общий интерес. Публичный маршрут регистрации доступен через Timepad.",
      start: "2026-04-01T19:00:00+03:00",
      timepad: "https://moonn.timepad.ru/event/3334362/"
    };
  }

  async function loadEvents() {
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load events.json");
    const payload = await response.json();
    return payload.events || [];
  }

  async function init() {
    const code = new URLSearchParams(location.search).get("event") || "generic";
    const events = await loadEvents().catch(function () { return []; });
    const event = events.find(function (item) { return item.id === code; }) || genericEvent();

    document.getElementById("event-title").textContent = event.title.indexOf("Регистрация") === 0 ? event.title : "Регистрация на событие: " + event.title;
    document.getElementById("event-date").textContent = event.start ? formatDate(event.start) : "Уточняется";
    document.getElementById("event-lead").textContent = event.summary;
    document.querySelector('input[name="event_code"]').value = event.id;
    document.getElementById("event-timepad").href = event.timepad || genericEvent().timepad;
    document.getElementById("event-timepad-side").href = event.timepad || genericEvent().timepad;

    const related = document.getElementById("related-events");
    if (related) {
      related.innerHTML = events
        .filter(function (item) { return item.id !== event.id; })
        .slice(0, 3)
        .map(function (item) {
          return [
            '<a class="card" href="' + safe(item.detailPage) + '" style="padding:16px;text-decoration:none;color:inherit;">',
            '<strong style="display:block;font:700 24px/1.05 Newsreader,serif;">' + safe(item.title) + "</strong>",
            '<p style="margin-top:8px;">' + safe(formatDate(item.start)) + " · " + safe(item.typeLabel) + "</p>",
            "</a>"
          ].join("");
        })
        .join("");
    }

    const form = document.getElementById("email-registration-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;
    form.addEventListener("submit", function (submitEvent) {
      submitEvent.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        event: event.title,
        date: event.start ? formatDate(event.start) : "Уточняется",
        submittedAt: new Date().toISOString(),
        data: data
      };
      try {
        const key = "miiiips-event-signups";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
        status.textContent = "Заявка зафиксирована в демо-режиме. Сейчас откроем публичную регистрацию и затем страницу подтверждения.";
      } catch (error) {
        status.textContent = "Заявка зафиксирована. Открываем публичный маршрут регистрации.";
      }
      window.open(event.timepad || genericEvent().timepad, "_blank", "noopener");
      setTimeout(function () {
        window.location.href = "application-success.html?flow=event";
      }, 600);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
