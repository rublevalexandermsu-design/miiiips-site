(async () => {
  const configUrl = "assets/data/internal-compliance/compliance-config.json";
  const registryUrl = "assets/data/internal-compliance/reporting-registry.json";
  const byId = (id) => document.getElementById(id);
  const dashboardRoot = byId("dashboardRoot");
  const footerRoot = byId("footerRoot");
  const authOverlay = byId("authOverlay");
  const authState = byId("authState");
  const passwordInput = byId("passwordInput");
  const unlockButton = byId("unlockButton");
  const refreshStateButton = byId("refreshStateButton");

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Не удалось загрузить ${url}: ${response.status}`);
    return response.json();
  }

  function formatDate(dateString) {
    if (!dateString) return "Уточняется";
    const date = new Date(`${dateString}T00:00:00+03:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(date);
  }

  function statusMarkup(level, text) {
    const className = level === "danger" ? "danger" : level === "warn" ? "warn" : "";
    return `<span class="tag ${className}">${text}</span>`;
  }

  function classifyDueDate(dateString) {
    if (!dateString) return { level: "warn", label: "Нужно уточнить" };
    const today = new Date();
    const due = new Date(`${dateString}T23:59:59+03:00`);
    const diffDays = Math.floor((due - today) / 86400000);
    if (diffDays < 0) return { level: "danger", label: "Срок уже прошёл" };
    if (diffDays <= 30) return { level: "warn", label: "Подходит срок" };
    return { level: "ok", label: "В запасе" };
  }

  async function deriveHash(password, salt, iterations) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations, hash: "SHA-256" }, keyMaterial, 256);
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(bits))));
  }

  function showDashboard() {
    dashboardRoot.classList.remove("hidden");
    footerRoot.classList.remove("hidden");
    authOverlay.classList.add("hidden");
  }

  function renderSummary(obligations) {
    const summaryGrid = byId("summaryGrid");
    const derived = obligations.map((item) => classifyDueDate(item.due_date));
    const overdue = derived.filter((item) => item.level === "danger").length;
    const dueSoon = derived.filter((item) => item.level === "warn").length;
    const conditional = obligations.filter((item) => item.regime_specific).length;
    summaryGrid.innerHTML = [
      ["Обязательных контуров", String(obligations.length), "status-ok"],
      ["С просроченным сроком", String(overdue), overdue ? "status-danger" : "status-ok"],
      ["Подходят в ближайшие 30 дней", String(dueSoon), dueSoon ? "status-warn" : "status-ok"],
      ["Условных по режиму", String(conditional), "status-warn"]
    ].map(([label, value, cls]) => `<article class="card summary-card"><small>${label}</small><strong class="${cls}">${value}</strong></article>`).join("");
  }

  function renderTimeline(obligations) {
    byId("timelineBody").innerHTML = obligations.slice().sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || ""))).map((item) => {
      const status = classifyDueDate(item.due_date);
      return `<tr><td>${formatDate(item.due_date)}</td><td><strong>${item.title}</strong><br/><span style="color:var(--muted)">${item.notes || ""}</span></td><td>${item.authority}</td><td>${item.condition_label || "Всегда"}</td><td>${statusMarkup(status.level, status.label)}</td></tr>`;
    }).join("");
  }

  function renderCards(targetId, items, keyMap) {
    byId(targetId).innerHTML = items.map((item) => `<div class="${keyMap.className}"><span class="label">${item[keyMap.eyebrow]}</span><strong>${item[keyMap.title]}</strong><p>${item[keyMap.body]}</p>${keyMap.extra ? keyMap.extra(item) : ""}</div>`).join("");
  }

  function renderSources(sources) {
    byId("sourceBody").innerHTML = sources.map((source) => `<tr><td><strong>${source.title}</strong></td><td>${source.scope}</td><td><a href="${source.url}" target="_blank" rel="noreferrer">Открыть источник</a></td></tr>`).join("");
  }

  function renderRisks(risks) {
    byId("riskList").innerHTML = risks.map((item) => `<div class="bullet-item"><strong style="display:block;margin-bottom:8px;font:700 22px/1.05 Newsreader,serif;">${item.title}</strong><p>${item.body}</p></div>`).join("");
  }

  try {
    const [config, registry] = await Promise.all([loadJson(configUrl), loadJson(registryUrl)]);
    if (config.dashboard?.title) byId("dashboardTitle").textContent = config.dashboard.title;
    if (config.dashboard?.lead) byId("dashboardLead").textContent = config.dashboard.lead;
    renderSummary(registry.obligations || []);
    renderTimeline(registry.obligations || []);
    renderCards("docGrid", config.document_tracks || [], { className: "doc-card", eyebrow: "scope", title: "title", body: "body", extra: (item) => `<p style="margin-top:10px;"><span class="tag">${item.folder}</span></p>` });
    renderCards("integrationGrid", config.integrations || [], { className: "integration-card", eyebrow: "title", title: "summary", body: "body", extra: (item) => {
      const label = item.status === "active" ? "Активно" : item.status === "planned" ? "Запланировано" : "Требует внимания";
      const level = item.status === "active" ? "ok" : item.status === "planned" ? "warn" : "danger";
      return `<p style="margin-top:10px;">${statusMarkup(level, label)}</p>`;
    }});
    renderSources(registry.sources || []);
    renderRisks(config.open_questions || []);

    const auth = config.auth || {};
    const sessionKey = auth.sessionKey || "miiiips_internal_compliance_v1";
    const authReady = Boolean(auth.hash && auth.salt);
    if (!authReady) {
      authState.textContent = "Пароль пока не задан. Страница уже собрана, но вход будет активирован после того, как я добавлю hash в конфиг.";
      authState.className = "auth-state note";
    } else {
      authState.textContent = auth.hint || "Введите пароль для входа во внутренний контур.";
      if (sessionStorage.getItem(sessionKey) === auth.hash) showDashboard();
    }

    unlockButton.addEventListener("click", async () => {
      if (!authReady) return;
      unlockButton.disabled = true;
      try {
        const hash = await deriveHash(passwordInput.value, auth.salt, auth.iterations || 150000);
        if (hash !== auth.hash) {
          authState.textContent = "Пароль не совпал.";
          authState.className = "auth-state error";
          return;
        }
        sessionStorage.setItem(sessionKey, auth.hash);
        showDashboard();
      } finally {
        unlockButton.disabled = false;
      }
    });

    refreshStateButton.addEventListener("click", () => window.location.reload());
  } catch (error) {
    authState.textContent = `Не удалось собрать внутренний контур: ${error.message}`;
    authState.className = "auth-state error";
  }
})();
