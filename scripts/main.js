/* =====================================================================
   Настя & Тима — Save the Date
   Vanilla JS: countdown · scroll reveals · conditional fields · RSVP flow
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     0. Config
     --------------------------------------------------------------- */
  // Google Apps Script web app URL (see backend/SETUP.md).
  // Empty string = backend not connected, the form runs in demo mode.
  var RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbwCydr_mmS4g2u8XyMkvn8sho-JBBhentxk_WK219Cjd2rP92rCPEipoO6ybgtrRC0/exec";

  /* ---------------------------------------------------------------
     1. Countdown to the wedding day (12 Sep 2026, 12:30, Minsk UTC+3)
     --------------------------------------------------------------- */
  function initCountdown() {
    var target = new Date("2026-09-12T12:30:00+03:00").getTime();
    var grid = document.getElementById("countdown-grid");
    var done = document.getElementById("countdown-done");
    if (!grid) return;

    var fields = {
      days: grid.querySelector('[data-unit="days"]'),
      hours: grid.querySelector('[data-unit="hours"]'),
      minutes: grid.querySelector('[data-unit="minutes"]'),
      seconds: grid.querySelector('[data-unit="seconds"]')
    };

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        grid.hidden = true;
        if (done) done.hidden = false;
        clearInterval(timer);
        return;
      }
      var sec = Math.floor(diff / 1000);
      fields.days.textContent = Math.floor(sec / 86400);
      fields.hours.textContent = pad(Math.floor((sec % 86400) / 3600));
      fields.minutes.textContent = pad(Math.floor((sec % 3600) / 60));
      fields.seconds.textContent = pad(sec % 60);
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------
     2. Reveal-on-scroll (IntersectionObserver, graceful fallback)
     --------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !items.length) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     3. Conditional form fields (show "other"/allergy inputs on demand)
     --------------------------------------------------------------- */
  function initConditionalFields(form) {
    var triggers = form.querySelectorAll("[data-reveals]");

    function panelFor(key) {
      return form.querySelector('[data-conditional="' + key + '"]');
    }

    function sync() {
      // Radio groups: a panel is shown only while its specific trigger is checked.
      triggers.forEach(function (trigger) {
        var panel = panelFor(trigger.getAttribute("data-reveals"));
        if (!panel) return;
        var show;
        if (trigger.type === "radio") {
          // any radio in the same group might be selected
          var checked = form.querySelector('input[name="' + trigger.name + '"]:checked');
          show = checked === trigger;
        } else {
          show = trigger.checked;
        }
        panel.hidden = !show;
      });
    }

    // Hide all conditional panels up front (progressive enhancement: visible without JS)
    form.querySelectorAll("[data-conditional]").forEach(function (p) { p.hidden = true; });
    form.addEventListener("change", sync);
    sync();
  }

  /* ---------------------------------------------------------------
     3b. Attendance gate: the attending-only fields (transfer, menu,
         allergy, drinks, wishes) stay hidden until the guest picks an
         attending option; hidden again (and cleared) if they decline.
     --------------------------------------------------------------- */
  function initAttendanceToggle(form) {
    var block = document.getElementById("rsvp-attending");
    if (!block) return;
    var DECLINE = "К сожалению, не смогу присутствовать";

    function apply() {
      var checked = form.querySelector('input[name="attendance"]:checked');
      var attending = !!checked && checked.value !== DECLINE;
      block.hidden = !attending;
      if (attending) return;
      // Hidden (nothing chosen yet, or declined): clear so no stale choices linger.
      block.querySelectorAll('input[type="text"], textarea').forEach(function (el) { el.value = ""; });
      block.querySelectorAll("input:checked").forEach(function (el) { el.checked = false; });
      block.querySelectorAll("[data-conditional]").forEach(function (p) { p.hidden = true; });
    }

    form.addEventListener("change", function (e) {
      if (e.target.name === "attendance") apply();
    });
    apply();
  }

  /* ---------------------------------------------------------------
     4. RSVP form: validation + idle → loading → success
     --------------------------------------------------------------- */
  function initRsvp() {
    var form = document.getElementById("rsvp-form");
    if (!form) return;

    initConditionalFields(form);
    initAttendanceToggle(form);

    var successPanel = document.getElementById("rsvp-success");
    var successName = document.getElementById("success-name");

    function fieldWrap(el) { return el.closest(".field"); }

    function showError(key, show) {
      var msg = form.querySelector('[data-error-for="' + key + '"]');
      if (msg) msg.hidden = !show;
    }

    function clearError(wrap, key) {
      if (wrap) wrap.classList.remove("field--invalid");
      showError(key, false);
    }

    function validate() {
      var ok = true;

      // Name (required, non-empty)
      var name = form.elements["name"];
      if (!name.value.trim()) {
        fieldWrap(name).classList.add("field--invalid");
        showError("guest-name", true);
        ok = false;
      } else {
        clearError(fieldWrap(name), "guest-name");
      }

      // Attendance (required radio group)
      var attendance = form.querySelector('input[name="attendance"]:checked');
      var attendanceField = document.getElementById("attendance-field");
      if (!attendance) {
        attendanceField.classList.add("field--invalid");
        showError("attendance", true);
        ok = false;
      } else {
        attendanceField.classList.remove("field--invalid");
        showError("attendance", false);
      }

      return ok;
    }

    // Live-clear errors as the guest fixes them
    form.addEventListener("input", function (e) {
      if (e.target.name === "name" && e.target.value.trim()) {
        clearError(fieldWrap(e.target), "guest-name");
      }
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "attendance") {
        document.getElementById("attendance-field").classList.remove("field--invalid");
        showError("attendance", false);
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: silently "succeed" for bots without doing anything real
      if (form.elements["company"] && form.elements["company"].value) {
        return;
      }

      if (!validate()) {
        var firstInvalid = form.querySelector(".field--invalid");
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      form.setAttribute("data-state", "loading");

      var payload = serialize(form);
      submit(payload).then(function () {
        var name = (form.elements["name"].value || "").trim();
        if (successName && name) successName.textContent = name;
        form.hidden = true;
        if (successPanel) {
          successPanel.hidden = false;
          successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }).catch(function () {
        form.setAttribute("data-state", "idle");
        alert("Не удалось отправить анкету. Пожалуйста, попробуйте ещё раз.");
      });
    });

    // Turns the form into a plain object. Checkboxes that share a name
    // (menu, drinks) are collected into an array via getAll(); honeypot is dropped.
    function serialize(form) {
      var fd = new FormData(form);
      var multi = { menu: true, drinks: true };
      var data = {};
      Object.keys(multi).forEach(function (key) {
        data[key] = fd.getAll(key);
      });
      fd.forEach(function (value, key) {
        if (multi[key] || key === "company") return;
        data[key] = value;
      });
      return data;
    }

    function submit(payload) {
      // Demo mode: no backend configured — just simulate the request.
      if (!RSVP_ENDPOINT) {
        return new Promise(function (resolve) { setTimeout(resolve, 1100); });
      }
      // Apps Script: send as text/plain to avoid the CORS preflight it can't
      // handle; mode:"no-cors" → the promise resolves once the request is sent.
      return fetch(RSVP_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    }
  }

  /* --------------------------- bootstrap --------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initCountdown();
    initReveal();
    initRsvp();
  });
})();
