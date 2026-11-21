/* Easter eggs: what triggers them, what the room remembers, and the
   SECRETS window. Progress lives in localStorage so it survives a reload. */
window.Secrets = (function () {
  "use strict";

  var KEY = "mn_secrets_v1";
  var I18N = window.I18N;
  function t(key, vars) { return I18N.t(key, vars); }
  var C = window.PORTFOLIO || {};
  var cfg = C.secrets || {};
  var defs = cfg.entries || [];

  var found = Object.create(null);
  var badge = null;
  var badgeCount = null;
  var ready = false;

  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown",
                "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var konamiAt = 0;          /* how much of the code has been typed */
  var typed = "";            /* rolling lowercase letters, for the "hire" egg */
  var idle = 0;              /* seconds without moving */
  var IDLE_AFTER = 30;
  var walked = 0;            /* pixels travelled */
  var MARATHON = 2000;
  var pokes = 0;
  var taps = 0;
  var lastTap = 0;

  /* ---------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function def(id) {
    for (var i = 0; i < defs.length; i++) if (defs[i].id === id) return defs[i];
    return null;
  }

  function has(id) { return !!found[id]; }

  function count() {
    var n = 0;
    for (var i = 0; i < defs.length; i++) if (found[defs[i].id]) n++;
    return n;
  }

  function total() { return defs.length; }

  function complete() { return total() > 0 && count() === total(); }

  /* ---------------------------------------------------------------- */
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        for (var i = 0; i < defs.length; i++) {
          if (data && data[defs[i].id]) found[defs[i].id] = true;
        }
      }
    } catch (e) { found = Object.create(null); }
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(found)); } catch (e) { /* ignore */ }
  }

  function sound(name) {
    if (window.Audio8) window.Audio8.play(name);
  }

  function paintBadge() {
    if (!badge) return;
    var n = count();
    if (badgeCount) badgeCount.textContent = n + "/" + total();
    badge.classList.toggle("is-complete", complete());
    badge.setAttribute("aria-label", t("sec.badge", { n: n, total: total() }));
  }

  /* ---------------------------------------------------------------- */
  function unlock(id) {
    if (!def(id) || found[id]) return false;
    found[id] = true;
    save();
    paintBadge();
    sound("secret");

    var d = def(id);
    window.UI.toast(t("sec.toast", { n: count(), total: total(), name: d.name }));
    if (window.UI.refreshSecrets) window.UI.refreshSecrets();
    if (window.Game && window.Game.onSecret) window.Game.onSecret(id);

    if (complete()) {
      sound("fanfare");
      window.setTimeout(function () {
        window.UI.toast(t("sec.toastAll"));
        if (window.Game && window.Game.onSecret) window.Game.onSecret("all");
      }, 1200);
    }
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* The window                                                       */
  function panelHTML() {
    var n = count();
    var pct = total() ? Math.round((n / total()) * 100) : 0;
    var out = '<div class="sec-top">' +
      '<p class="sec-lede">' + esc(cfg.banner || "") + '</p>' +
      '<div class="sec-meter" role="img" aria-label="' + esc(t("sec.percent", { n: pct })) + '">' +
        '<span style="width:' + pct + '%"></span></div>' +
      '<p class="sec-count">' + esc(t("sec.found", { n: n, total: total() })) +
        (complete() ? ' <b>· ' + esc(t("sec.complete")) + '</b>' : "") + "</p>" +
      '</div><ul class="sec-list">';

    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var on = has(d.id);
      out += '<li class="sec' + (on ? " is-found" : "") + '">' +
        '<span class="sec-mark" aria-hidden="true">' + (on ? "★" : "?") + "</span>" +
        '<div class="sec-body">' +
          '<b class="sec-name">' + (on ? esc(d.name) : esc(t("sec.undiscovered"))) + "</b>" +
          '<span class="sec-hint">' + esc(d.hint) + "</span>" +
        "</div></li>";
    }

    out += "</ul>";
    if (complete()) {
      out += '<p class="sec-final">' + esc(cfg.finale || "") + "</p>";
    } else {
      out += '<p class="sec-note">' + esc(t("sec.note")) + "</p>";
    }
    return out;
  }

  /* ---------------------------------------------------------------- */
  /* Triggers                                                         */
  function onKey(e) {
    var tag = e.target && e.target.tagName;
    if (tag && /INPUT|TEXTAREA|SELECT/.test(tag)) return;
    var k = String(e.key || "").toLowerCase();

    /* konami code */
    var want = KONAMI[konamiAt];
    if (k === want) {
      konamiAt++;
      if (konamiAt === KONAMI.length) { konamiAt = 0; unlock("konami"); }
    } else {
      konamiAt = k === KONAMI[0] ? 1 : 0;
    }

    /* typed words */
    if (k.length === 1 && k >= "a" && k <= "z") {
      typed = (typed + k).slice(-8);
      if (typed.indexOf("hire") > -1) unlock("hire");
    }
  }

  /* the sleeping cat: five pokes and it gives up */
  function poke() {
    if (has("cat")) {
      sound("meow");
      return;
    }
    pokes++;
    if (pokes >= 5) {
      unlock("cat");
      return;
    }
    sound("meow");
    window.UI.toast(t("sec.purr", { n: pokes }));
  }

  /* the header avatar */
  function onAvatarTap() {
    var now = Date.now();
    taps = now - lastTap < 900 ? taps + 1 : 1;
    lastTap = now;
    if (taps >= 7) { taps = 0; unlock("octocat"); }
  }

  /* per-frame: distance walked and standing still */
  function tick(dt, x, y, moving, paused) {
    if (!ready || paused) return;
    if (moving) {
      idle = 0;
      walked += dt * 64;
      if (walked >= MARATHON) unlock("marathon");
    } else {
      idle += dt;
      if (idle >= IDLE_AFTER) { idle = 0; unlock("idle"); }
    }
    if (window.Game && window.Game.onIdleProgress) {
      window.Game.onIdleProgress(has("idle") ? 0 : IDLE_AFTER - idle);
    }
  }

  /* ---------------------------------------------------------------- */
  function init() {
    badge = document.getElementById("btn-secrets");
    badgeCount = document.getElementById("secret-count");
    if (badge) {
      badge.addEventListener("click", function () {
        sound("select");
        window.UI.openModal("secrets");
      });
    }

    var avatar = document.getElementById("brand-avatar");
    if (avatar) {
      avatar.addEventListener("click", onAvatarTap);
      avatar.setAttribute("role", "button");
      avatar.setAttribute("tabindex", "0");
      avatar.setAttribute("title", "Mohamed's avatar");
      avatar.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAvatarTap(); }
      });
    }

    window.addEventListener("keydown", onKey);
    load();
    ready = true;
    paintBadge();

    /* a nod to anyone who opens devtools */
    if (window.console && console.log) {
      console.log("%c MOHAMED NASR %c LV.99 — interactive portfolio ",
        "background:#ffb454;color:#141007;font-weight:bold;padding:2px 6px",
        "background:#141b26;color:#6ee7c7;padding:2px 6px");
      console.log("%c" + t("sec.consoleTitle") + "\n" +
        t("sec.consoleBody", { n: defs.length }),
        "color:#8e98a8");
    }
  }

  return {
    init: init,
    has: has,
    count: count,
    total: total,
    complete: complete,
    unlock: unlock,
    poke: poke,
    tick: tick,
    panelHTML: panelHTML,
    paint: paintBadge,
    /** remaining seconds of standing still, 0 when the egg is already found */
    idleLeft: function () {
      if (has("idle")) return 0;
      return Math.max(0, Math.ceil(IDLE_AFTER - idle));
    },
    walked: function () { return Math.floor(walked); },
  };
})();
