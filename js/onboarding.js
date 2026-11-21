/* ============================================================================
   ONBOARDING  —  two things that make the room usable by everyone:

   1. TEXT MODE. The portfolio is a canvas, so the "skip to text version" link
      reveals the semantic copy of the same content (#text-version in
      index.html). That is also what a visitor without JavaScript gets, and
      what a screen reader can read. Deep-linkable with #text-version.

   2. ARRIVAL GREETING + GUIDED TOUR. No popup, no modal: the visitor walks
      straight into the room, Mohamed turns around, a speech bubble appears and
      he asks whether he should show the place around. Answer "yes" and he walks
      the visitor from station to station — projects, stack, GitHub, contact —
      opening each one on the way, and finishes with a playful pointer at the
      seven easter eggs. Answer "no" and the room is yours.

   The whole conversation is one scripted dialogue (UI.playScript), so it can be
   re-translated mid-step and it never fights the room for control: the game
   keeps simulating during the tour, only the visitor's own input is parked.
   ========================================================================== */
window.Onboarding = (function () {
  "use strict";

  var MET_KEY = "mn_met_v1";

  var article = null;
  var greeted = false;
  var running = false;

  function t(key, vars) { return window.I18N.t(key, vars); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------------------------------------------------------- */
  /* text mode                                                         */
  /* ---------------------------------------------------------------- */
  function isTextMode() {
    return document.body.classList.contains("text-mode");
  }

  function enterTextMode(opts) {
    if (!article) return;
    document.body.classList.add("text-mode");
    article.hidden = false;
    if (!opts || !opts.keepScroll) {
      window.scrollTo(0, 0);
    }
    article.setAttribute("tabindex", "-1");
    try { article.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#text-version");
    }
  }

  function exitTextMode() {
    if (!article) return;
    document.body.classList.remove("text-mode");
    article.hidden = true;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }

  function bindTextMode() {
    article = document.getElementById("text-version");
    if (!article) return;

    var skip = document.querySelector(".skip-link");
    if (skip) {
      skip.addEventListener("click", function (e) {
        e.preventDefault();
        enterTextMode();
        if (window.UI && window.UI.toast) window.UI.toast(t("toast.textMode"));
      });
    }

    var back = article.querySelector(".fb-back a");
    if (back) {
      back.addEventListener("click", function (e) {
        e.preventDefault();
        exitTextMode();
      });
    }

    if (window.location.hash === "#text-version") {
      enterTextMode({ keepScroll: true });
    }
  }

  /* ---------------------------------------------------------------- */
  /* the tour                                                          */
  /* ---------------------------------------------------------------- */
  /* Where Mohamed stands and where he parks the visitor, per station. The
     visitor's spot is the station's own `stand` from js/room.js; Mohamed steps
     to the side so he never covers what he is talking about. */
  var STEPS = [
    { key: "s1", text: "tour.s1", open: "projects", title: "PROJECTS.EXE",
      npc: { x: 250, y: 108 }, player: { x: 216, y: 100 } },
    { key: "s2", text: "tour.s2", open: "skills", title: "INVENTORY.SKILLS",
      npc: { x: 84, y: 114 }, player: { x: 52, y: 108 } },
    { key: "s3", text: "tour.s3", open: "github", title: "GITHUB.BADGE",
      npc: { x: 96, y: 76 }, player: { x: 122, y: 66 } },
    { key: "s4", text: "tour.s4", open: "contact", title: "MAIL.EXE",
      npc: { x: 140, y: 198 }, player: { x: 108, y: 200 } },
    { key: "s5", text: "tour.s5", open: null, poke: true,
      npc: { x: 216, y: 188 }, player: { x: 248, y: 178 } },
  ];

  /* The conversation currently on screen, so a language switch can re-label it
     without restarting the step (and without losing the pending answer). */
  var phase = null;        /* "hello" | "step" | "poke" | "end" */
  var phaseStep = null;

  function stepButtons(step) {
    var b = [];
    if (step.poke) {
      b.push({ value: "poke", label: t("tour.poke"), cls: "choice--action" });
    } else if (step.open) {
      b.push({ value: "open", label: t("tour.open", { name: step.title }), cls: "choice--action" });
    }
    b.push({ value: "next", label: t("tour.next"), cls: "choice--action" });
    b.push({ value: "skip", label: t("tour.skip"), cls: "choice--ghost", arrow: false });
    return b;
  }

  function endButtons() {
    return [
      { value: "done", label: t("tour.done"), cls: "choice--action" },
      { value: "secrets", label: t("tour.seeSecrets"), cls: "choice--ghost", arrow: false },
    ];
  }

  function currentCopy() {
    if (phase === "hello") {
      return {
        text: t("tour.hello"),
        labels: [t("tour.yes"), t("tour.no")],
      };
    }
    if (phase === "poke") {
      return { text: t("tour.s5poke"), labels: [t("tour.next")] };
    }
    if (phase === "end") {
      return { text: t("tour.end"), labels: [t("tour.done"), t("tour.seeSecrets")] };
    }
    if (phase === "step" && phaseStep) {
      return {
        text: t(phaseStep.text),
        labels: stepButtons(phaseStep).map(function (b) { return b.label; }),
      };
    }
    return null;
  }

  function showStep(step) {
    phase = "step";
    phaseStep = step;
    var buttons = stepButtons(step);
    return window.UI.playScript(t(step.text), buttons);
  }

  function waitForModalClose() {
    return new Promise(function (resolve) {
      var tries = 0;
      var timer = window.setInterval(function () {
        tries++;
        if (!window.UI.isModalOpen() || tries > 1500) {
          window.clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  }

  function finishTour(aborted) {
    running = false;
    phase = null;
    phaseStep = null;
    if (window.Game && window.Game.tour) window.Game.tour.set(false);
    window.UI.setGamePauseWhileBlocking(true);
    return aborted ? "aborted" : "done";
  }

  function farewell() {
    phase = "end";
    return window.UI.playScript(t("tour.end"), endButtons()).then(function (value) {
      window.UI.closeDialogue();
      if (value === "secrets") window.UI.openModal("secrets");
      return finishTour(false);
    });
  }

  function runStep(index) {
    if (!running) return Promise.resolve("aborted");
    if (index >= STEPS.length) return farewell();

    var step = STEPS[index];
    if (window.Game.tour) window.Game.tour.bubble(t("tour.bubble"), 1400);

    return window.Game.tour.move(step.npc, step.player).then(function () {
      if (!running) return "aborted";
      if (window.Game.tour) window.Game.tour.bubble(null);
      return showStep(step).then(function (value) {
        if (value === null) return finishTour(true);        /* Esc / closed */
        if (value === "skip") return farewell();

        if (value === "poke") {
          if (window.Game.interact) window.Game.interact("cat");
          if (window.Game.spawn) window.Game.spawn(8, 248, 168, "heart");
          return wait(700).then(function () {
            if (!running) return "aborted";
            phase = "poke";
            return window.UI.playScript(t("tour.s5poke"), [
              { value: "next", label: t("tour.next"), cls: "choice--action" },
            ]).then(function () {
              return runStep(index + 1);
            });
          });
        }

        if (value === "open") {
          window.UI.openModal(step.open);
          return waitForModalClose().then(function () {
            if (!running) return "aborted";
            return wait(260).then(function () { return runStep(index + 1); });
          });
        }

        return wait(180).then(function () { return runStep(index + 1); });
      });
    });
  }

  function startTour() {
    if (running) return Promise.resolve("running");
    running = true;
    markMet();
    /* the room must keep walking while Mohamed talks */
    window.UI.setGamePauseWhileBlocking(false);
    if (window.Game && window.Game.tour) window.Game.tour.set(true);
    return runStep(0);
  }

  /* ---------------------------------------------------------------- */
  /* arrival                                                           */
  /* ---------------------------------------------------------------- */
  function met() {
    try { return window.localStorage.getItem(MET_KEY) === "1"; } catch (e) { return false; }
  }

  function markMet() {
    try { window.localStorage.setItem(MET_KEY, "1"); } catch (e) { /* private mode */ }
  }

  function sayHello() {
    if (greeted || met() || isTextMode()) return;
    if (!window.Game || !window.Game.greet) return;
    greeted = true;
    /* a beat after the room reveals itself, so the visitor sees where they are
       standing before Mohamed starts talking */
    window.setTimeout(function () {
      if (isTextMode()) return;
      if (!window.Game.greet(t("tour.bubble"))) return;
      markMet();
      phase = "hello";
      window.UI.playScript(t("tour.hello"), [
        { value: "yes", label: t("tour.yes"), cls: "choice--action" },
        { value: "no", label: t("tour.no"), cls: "choice--ghost", arrow: false },
      ]).then(function (value) {
        if (value === "yes") startTour();
        else window.UI.closeDialogue();
      });
    }, 620);
  }

  function bindGreeting() {
    /* js/game.js fires this once the character art has resolved and the room is
       on screen (see reveal() there). */
    document.addEventListener("room:ready", sayHello);
    /* fallback: in case the event fired before this script ran, the loader's
       is-done class is the same signal */
    var tries = 0;
    var timer = window.setInterval(function () {
      tries++;
      var loader = document.getElementById("stage-loader");
      if ((loader && loader.classList.contains("is-done")) || tries > 60) {
        window.clearInterval(timer);
        sayHello();
      }
    }, 200);
  }

  /* ---------------------------------------------------------------- */
  function init() {
    bindTextMode();
    bindGreeting();

    /* keep the sentence on screen in the visitor's language */
    if (window.I18N && window.I18N.onChange) {
      window.I18N.onChange(function () {
        if (!phase) return;
        var copy = currentCopy();
        if (!copy) return;
        if (window.UI.isDialogueOpen() && window.UI.relabelScript) {
          window.UI.relabelScript(copy.text, copy.labels);
        }
      });
    }
  }

  return {
    init: init,
    markMet: markMet,
    met: met,
    enterTextMode: enterTextMode,
    exitTextMode: exitTextMode,
    startTour: startTour,
    running: function () { return running; },
    /* handy while developing: Onboarding.reset() brings the greeting back */
    reset: function () {
      greeted = false;
      running = false;
      phase = null;
      try { window.localStorage.removeItem(MET_KEY); } catch (e) { /* ignore */ }
    },
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  window.Onboarding.init();
});
