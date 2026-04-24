(function () {
  const DATA_PATH = "assets/data/events.json";
  const INTEGRATIONS_PATH = "assets/data/site-integrations.json";
  const DEFAULT_MAIL_FALLBACK = "mailto:rublevalexanderus@gmail.com";
  const page = (location.pathname.split('/').pop() || 'event-request.html').toLowerCase();
  let integrationsPromise = null;

  const INTENTS = {
    video: {
      eyebrow: "Видео мероприятия",
      title: "Получить видео мероприятия",
      lead: "Оставьте заявку, если вам нужен доступ к видеозаписи для личного просмотра, внутреннего обучения команды или дальнейшей аналитической работы с материалом встречи.",
      formTitle: "Заявка на доступ к видеозаписи",
      submitLabel: "Запросить видео",
      interestLabel: "Как вы планируете использовать видео",
      interestPlaceholder: "Например: личный просмотр, методический разбор, обучение команды, подготовка к конференции",
      messageLabel: "Что важно по заявке",
      messagePlaceholder: "Укажите, для кого нужен доступ, нужен ли быстрый ответ и интересуют ли вас условия оплаты.",
      note: "После заявки команда увидит запрос, зафиксирует его в таблице сайта и пришлёт следующий шаг по доступу к записи и условиям оплаты.",
      formType: "event_video_request"
    },
    purchase: {
      eyebrow: "Покупка полной лекции",
      title: "Купить полную лекцию",
      lead: "Оставьте заявку, если вам нужен полный доступ к записи лекции для личного просмотра, команды или внутреннего обучения. Команда института пришлёт следующий шаг по оплате и доступу к материалу.",
      formTitle: "Заявка на покупку полной лекции",
      submitLabel: "Купить лекцию",
      interestLabel: "Как вы планируете использовать лекцию",
      interestPlaceholder: "Например: личный просмотр, методический разбор, обучение команды, архив",
      messageLabel: "Что важно по заявке",
      messagePlaceholder: "Укажите, для кого нужен доступ, нужен ли быстрый ответ и интересуют ли вас условия оплаты.",
      note: "После заявки команда увидит запрос, зафиксирует его в таблице сайта и пришлёт следующий шаг по оплате и доступу к полному материалу.",
      formType: "event_purchase_request"
    },
    invite: {
      eyebrow: "Приглашение лектора",
      title: "Пригласить лектора на своё событие",
      lead: "Если тема откликнулась и вы хотите прочитать её у себя в компании, вузе, исследовательском центре или на конференции, оставьте заявку. Команда института быстро увидит запрос и свяжется с вами.",
      formTitle: "Заявка на приглашение лектора",
      submitLabel: "Отправить заявку",
      interestLabel: "Какой формат вас интересует",
      interestPlaceholder: "Например: корпоративная лекция, конференция, закрытый семинар, университетский курс",
      messageLabel: "Опишите задачу и площадку",
      messagePlaceholder: "Укажите желаемую тему, аудиторию, формат, город, предполагаемые даты и всё, что важно для первого разговора.",
      note: "Такая заявка попадает сразу в рабочий контур института: команда получает уведомление, письмо и запись в таблице сайта.",
      formType: "event_speaker_invite"
    }
  };

  function safe(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  async function loadIntegrations() {
    if (!integrationsPromise) {
      integrationsPromise = fetch(INTEGRATIONS_PATH, { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("integrations missing");
          return response.json();
        })
        .catch(function () {
          return {
            forms: {
              publicApiBase: "",
              googleAppsScriptWebAppUrl: "",
              localApiBase: "http://127.0.0.1:3007",
              mailtoFallback: DEFAULT_MAIL_FALLBACK
            },
            payments: {
              videoPaymentEnabled: false,
              videoPaymentLabel: "Оплата будет подключена отдельным шагом после подтверждения заявки"
            }
          };
        });
    }
    return integrationsPromise;
  }

  function apiCandidates(config) {
    const candidates = [];
    const forms = (config && config.forms) || {};
    if (forms.publicApiBase) candidates.push(String(forms.publicApiBase).replace(/\/+$/, ""));
    if (location.origin && location.origin.startsWith('http')) candidates.push(location.origin);
    if (forms.localApiBase) candidates.push(String(forms.localApiBase).replace(/\/+$/, ""));
    else candidates.push('http://127.0.0.1:3007');
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function formatDate(date) {
    if (!date) return "Уточняется";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return String(date);
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    return parsed.getDate() + " " + months[parsed.getMonth()] + " " + parsed.getFullYear() + " · " + hh + ":" + mm;
  }

  function genericEvent() {
    return {
      id: "generic-event",
      title: "Мероприятие института",
      summary: "Оставьте заявку, и команда института свяжется с вами по следующему шагу.",
      start: "",
      detailPage: "conferences.html"
    };
  }

  async function loadEvents() {
    const response = await fetch(DATA_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("Cannot load events.json");
    const payload = await response.json();
    return payload.events || [];
  }

  function prepareMailto(payload, config) {
    const mailFallback = ((config && config.forms && config.forms.mailtoFallback) || DEFAULT_MAIL_FALLBACK).trim() || DEFAULT_MAIL_FALLBACK;
    const subject = encodeURIComponent("Заявка с сайта МИИИИПС: " + (payload.formType === "event_video_request" ? "получить видео" : "пригласить лектора"));
    const body = encodeURIComponent([
      "Новая заявка с сайта МИИИИПС",
      "",
      "Тип: " + payload.formType,
      "Событие: " + (payload.event_title || ""),
      "Дата: " + (payload.event_date || ""),
      "Ссылка на событие: " + (payload.event_url || ""),
      "Имя: " + (payload.name || ""),
      "Организация: " + (payload.organization || ""),
      "Email: " + (payload.email || ""),
      "Контакт: " + (payload.contact || ""),
      "Интерес: " + (payload.interest || ""),
      "",
      "Сообщение:",
      payload.message || ""
    ].join("\n"));
    return mailFallback + "?subject=" + subject + "&body=" + body;
  }

  async function submitToGoogleAppsScript(webAppUrl, payload) {
    await fetch(webAppUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: true, mode: "no-cors" };
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const eventId = params.get("event") || "generic-event";
    const intentKey = params.get("intent") || "video";
    const intent = INTENTS[intentKey] || INTENTS.video;
    const integrations = await loadIntegrations();
    const events = await loadEvents().catch(function () { return []; });
    const event = events.find(function (item) { return item.id === eventId; }) || genericEvent();

    document.getElementById("intent-eyebrow").textContent = intent.eyebrow;
    document.getElementById("intent-title-side").textContent = intent.title;
    document.getElementById("request-title").textContent = intent.title;
    document.getElementById("request-lead").textContent = intent.lead;
    document.getElementById("form-title").textContent = intent.formTitle;
    document.getElementById("submit-label").textContent = intent.submitLabel;
    document.getElementById("interest-label").firstChild.textContent = intent.interestLabel;
    document.querySelector('[name="interest"]').placeholder = intent.interestPlaceholder;
    document.getElementById("interest-label").querySelector('input').placeholder = intent.interestPlaceholder;
    document.getElementById("interest-label").querySelector('input').setAttribute('placeholder', intent.interestPlaceholder);
    document.getElementById("interest-label").setAttribute("data-label", intent.interestLabel);
    document.getElementById("intent-note-side").textContent = intent.note;
    document.getElementById("event-title-side").textContent = event.title || genericEvent().title;
    document.getElementById("event-date-side").textContent = event.start ? formatDate(event.start) : "Уточняется";
    document.getElementById("back-to-event").href = event.detailPage || "conferences.html";
    document.getElementById("back-to-event-secondary").href = event.detailPage || "conferences.html";
    const messageLabel = document.getElementById("interest-label").previousElementSibling;
    if (messageLabel) {
      messageLabel.firstChild.textContent = intent.messageLabel;
      messageLabel.querySelector('textarea').placeholder = intent.messagePlaceholder;
    }

    const paymentLabelNode = document.getElementById("payment-stage-label");
      if (intentKey === "video" || intentKey === "purchase") {
        paymentLabelNode.classList.remove("miiiips-hidden");
        const paymentSelect = paymentLabelNode.querySelector('select');
        if (paymentSelect && integrations && integrations.payments && integrations.payments.videoPaymentLabel && !integrations.payments.videoPaymentEnabled) {
          paymentSelect.insertAdjacentHTML("afterend", '<div class="note" style="margin-top:8px;">' + safe(integrations.payments.videoPaymentLabel) + '</div>');
        }
      }

    const form = document.getElementById("event-request-form");
    const statusNode = document.getElementById("form-status");
    form.querySelector('[name="event_id"]').value = event.id || "";
    form.querySelector('[name="event_title"]').value = event.title || "";
    form.querySelector('[name="event_date"]').value = event.start ? formatDate(event.start) : "";
    form.querySelector('[name="event_url"]').value = event.detailPage ? new URL(event.detailPage, location.href).href : location.href;
    form.querySelector('[name="intent"]').value = intentKey;
    form.querySelector('[name="formType"]').value = intent.formType;
    if (intentKey !== "video") {
      form.querySelector('[name="paymentStage"]').value = "";
    }

    form.addEventListener("submit", async function (submitEvent) {
      submitEvent.preventDefault();
      const fd = new FormData(form);
      const payload = {};
      fd.forEach(function (value, key) { payload[key] = value; });
      payload.sourcePage = page;
      payload.sourcePageUrl = location.href;
      payload.role = intentKey === "video" ? "Запрос видео" : intentKey === "purchase" ? "Покупка полной лекции" : "Приглашение лектора";
      payload.requestKind = intentKey;
      statusNode.textContent = "Отправляем заявку...";
      try {
        let delivered = false;
        for (const base of apiCandidates(integrations)) {
          try {
            const response = await fetch(base + "/api/forms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("bad response");
            await response.json();
            delivered = true;
            break;
          } catch (error) {
            delivered = false;
          }
        }
        if (!delivered && integrations && integrations.forms && integrations.forms.googleAppsScriptWebAppUrl) {
          await submitToGoogleAppsScript(integrations.forms.googleAppsScriptWebAppUrl, payload);
          delivered = true;
        }
        if (!delivered) throw new Error("all api routes failed");
        statusNode.textContent = "Заявка отправлена. Команда института получит письмо, уведомление и запись в таблице.";
        setTimeout(function () {
          location.href = "application-success.html?flow=event-request";
        }, 700);
      } catch (error) {
        statusNode.textContent = "Прямой маршрут сейчас недоступен. Откроем резервный email-маршрут, чтобы заявка не потерялась.";
        window.location.href = prepareMailto(payload, integrations);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
