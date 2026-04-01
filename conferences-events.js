(function () {
  const DATA_PATH = "assets/data/events.json";
  const THEME_MAP = {
    emerald: "linear-gradient(135deg, rgba(11,27,24,.98) 0%, rgba(16,73,61,.95) 100%)",
    teal: "linear-gradient(135deg, rgba(17,39,34,.98) 0%, rgba(11,93,84,.92) 100%)",
    blue: "linear-gradient(135deg, rgba(20,29,53,.98) 0%, rgba(25,77,121,.92) 100%)",
    olive: "linear-gradient(135deg, rgba(17,30,24,.98) 0%, rgba(77,104,49,.9) 100%)"
  };
  const MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  function safe(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function parseDate(value) {
    return new Date(value);
  }

  function toDayKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatMeta(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = MONTHS[date.getMonth()].toLowerCase();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return day + " " + month + " · " + hh + ":" + mm;
  }

  function loadInitialState(events) {
    const params = new URLSearchParams(location.search);
    const selectedDate = params.get("date") || "";
    const search = params.get("q") || "";
    const firstDate = selectedDate ? new Date(selectedDate + "T00:00:00") : parseDate(events[0].start);
    return {
      currentMonth: new Date(firstDate.getFullYear(), firstDate.getMonth(), 1),
      selectedDate: selectedDate,
      search: search,
      types: new Set(params.get("types") ? params.get("types").split(",") : documentFilterValues(".event-type-filter")),
      statuses: new Set(params.get("statuses") ? params.get("statuses").split(",") : documentFilterValues(".event-status-filter")),
      directions: new Set(params.get("directions") ? params.get("directions").split(",") : documentFilterValues(".event-direction-filter")),
      quickView: params.get("quick") !== "0"
    };
  }

  function documentFilterValues(selector) {
    return Array.from(document.querySelectorAll(selector)).map(function (input) {
      return input.value;
    });
  }

  function syncControls(state) {
    document.querySelectorAll(".event-type-filter").forEach(function (input) {
      input.checked = state.types.has(input.value);
    });
    document.querySelectorAll(".event-status-filter").forEach(function (input) {
      input.checked = state.statuses.has(input.value);
    });
    document.querySelectorAll(".event-direction-filter").forEach(function (input) {
      input.checked = state.directions.has(input.value);
    });
    const quick = document.getElementById("events-quick-view");
    if (quick) quick.checked = state.quickView;
    const search = document.getElementById("events-search");
    if (search) search.value = state.search;
  }

  function updateUrl(state) {
    const params = new URLSearchParams();
    if (state.selectedDate) params.set("date", state.selectedDate);
    if (state.search) params.set("q", state.search);
    params.set("types", Array.from(state.types).join(","));
    params.set("statuses", Array.from(state.statuses).join(","));
    params.set("directions", Array.from(state.directions).join(","));
    params.set("quick", state.quickView ? "1" : "0");
    history.replaceState({}, "", "conferences.html?" + params.toString());
  }

  function matchesFilters(event, state) {
    const date = parseDate(event.start);
    const haystack = [
      event.title,
      event.summary,
      event.speaker,
      event.opponent,
      event.venue,
      (event.directionLabels || []).join(" ")
    ].join(" ").toLowerCase();
    const searchPass = !state.search || haystack.includes(state.search.toLowerCase());
    const typePass = state.types.has(event.type);
    const statusPass = state.statuses.has(event.status);
    const directionPass = (event.directions || []).some(function (direction) {
      return state.directions.has(direction);
    });
    const datePass = !state.selectedDate || toDayKey(date) === state.selectedDate;
    return searchPass && typePass && statusPass && directionPass && datePass;
  }

  function renderCards(events, state) {
    const target = document.getElementById("events-results");
    if (!target) return;
    const filtered = events.filter(function (event) {
      return matchesFilters(event, state);
    });
    const note = document.getElementById("events-results-note");
    if (note) {
      note.textContent = "Найдено событий: " + filtered.length + ". Фильтры, поиск и календарь помогают быстро находить нужные встречи.";
    }
    if (!filtered.length) {
      target.innerHTML = '<div class="results-empty">По текущим фильтрам событий нет. Снимите часть ограничений или переключите месяц.</div>';
      return;
    }
    target.innerHTML = filtered.map(function (event) {
      const date = parseDate(event.start);
      const quickClass = state.quickView ? "compact" : "full";
      const directionLine = safe((event.directionLabels || []).join(" · "));
      const registrationLink = event.status !== "past" && event.registrationPage
        ? '<a class="btn secondary" href="' + safe(event.registrationPage) + '">Регистрация</a>'
        : "";
      const calendarLink = event.status !== "past" && event.calendarFile
        ? '<a class="btn secondary" href="' + safe(event.calendarFile) + '">В календарь</a>'
        : "";
      return [
        '<article class="event-card ' + quickClass + '" style="background:' + safe(THEME_MAP[event.theme] || THEME_MAP.emerald) + ';">',
        '<div class="event-meta"><span class="event-pill">' + safe(event.statusLabel) + '</span><span>' + safe(event.typeLabel) + '</span><span>' + safe(formatMeta(date)) + '</span></div>',
        '<div class="stack">',
        '<h3 class="event-title">' + safe(event.title) + '</h3>',
        '<p class="event-summary">' + safe(event.summary) + '</p>',
        !state.quickView ? '<p class="event-summary">Площадка: ' + safe(event.venue) + '</p>' : "",
        '</div>',
        '<div class="event-people">',
        '<div><span>Докладчик</span>' + safe(event.speaker) + '</div>',
        '<div><span>Формат</span>' + safe(event.opponent) + '</div>',
        !state.quickView ? '<div><span>Направление</span>' + directionLine + '</div>' : "",
        !state.quickView ? '<div><span>Площадка</span>' + safe(event.venue) + '</div>' : "",
        '</div>',
        '<div class="event-actions">',
        '<a class="btn primary" href="' + safe(event.detailPage) + '">Подробнее</a>',
        registrationLink,
        calendarLink,
        '</div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderCalendar(events, state) {
    const label = document.getElementById("calendar-label");
    const grid = document.getElementById("calendar-grid");
    if (!label || !grid) return;
    label.textContent = MONTHS[state.currentMonth.getMonth()] + " " + state.currentMonth.getFullYear();
    const firstDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1);
    const lastDay = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const eventDays = new Set(events.map(function (event) {
      return toDayKey(parseDate(event.start));
    }));
    const cells = [];
    for (var i = 0; i < startWeekday; i += 1) {
      cells.push('<span class="is-empty"></span>');
    }
    for (var day = 1; day <= lastDay.getDate(); day += 1) {
      const cellDate = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), day);
      const key = toDayKey(cellDate);
      const classes = [];
      if (state.selectedDate === key) classes.push("active");
      if (eventDays.has(key)) classes.push("has-events");
      cells.push(
        '<button type="button" class="' + classes.join(" ") + '" data-day="' + key + '">' + day + "</button>"
      );
    }
    while (cells.length % 7 !== 0) {
      cells.push('<span class="is-empty"></span>');
    }
    grid.innerHTML = cells.join("");
    grid.querySelectorAll("button[data-day]").forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-day") || "";
        state.selectedDate = state.selectedDate === key ? "" : key;
        updateUrl(state);
        renderCalendar(events, state);
        renderCards(events, state);
      });
    });
  }

  function bindFilters(events, state) {
    document.querySelectorAll(".event-type-filter").forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.checked) state.types.add(input.value); else state.types.delete(input.value);
        updateUrl(state);
        renderCards(events, state);
      });
    });
    document.querySelectorAll(".event-status-filter").forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.checked) state.statuses.add(input.value); else state.statuses.delete(input.value);
        updateUrl(state);
        renderCards(events, state);
      });
    });
    document.querySelectorAll(".event-direction-filter").forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.checked) state.directions.add(input.value); else state.directions.delete(input.value);
        updateUrl(state);
        renderCards(events, state);
      });
    });
    const quick = document.getElementById("events-quick-view");
    if (quick) {
      quick.addEventListener("change", function () {
        state.quickView = quick.checked;
        updateUrl(state);
        renderCards(events, state);
      });
    }
    const search = document.getElementById("events-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value.trim();
        updateUrl(state);
        renderCards(events, state);
      });
    }
    const prev = document.getElementById("calendar-prev");
    const next = document.getElementById("calendar-next");
    if (prev) {
      prev.addEventListener("click", function () {
        state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
        renderCalendar(events, state);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
        renderCalendar(events, state);
      });
    }
  }

  async function loadEvents() {
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Cannot load events.json");
    }
    const payload = await response.json();
    return payload.events || [];
  }

  async function init() {
    try {
      const events = await loadEvents();
      if (!events.length) return;
      const state = loadInitialState(events);
      syncControls(state);
      bindFilters(events, state);
      renderCalendar(events, state);
      renderCards(events, state);
      updateUrl(state);
    } catch (error) {
      const target = document.getElementById("events-results");
      if (target) {
        target.innerHTML = '<div class="results-empty">Не удалось загрузить список мероприятий. Обновите страницу чуть позже.</div>';
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
