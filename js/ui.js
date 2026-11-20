/* Dialogue box, windows (projects / github / skills / contact / resume),
   typewriter effect, GitHub API loading and small UI helpers. */
window.UI = (function () {
  "use strict";

  var C = window.PORTFOLIO;
  var $ = function (id) { return document.getElementById(id); };

  var dialogue = $("dialogue");
  var dlgText = $("dlg-text");
  var dlgChoices = $("dlg-choices");
  var dlgPortrait = $("dlg-portrait");
  var dlgAdvance = $("dlg-advance");
  var overlay = $("overlay");
  var modal = $("modal");
  var modalTitle = $("modal-title");
  var modalBody = $("modal-body");
  var toastEl = $("toast");

  var dlg = {
    open: false, typing: false, timer: null, full: "", index: 0,
    choices: [], mode: "greeting", raf: 0, lastFocus: null,
  };
  var modalType = null;
  var lastFocus = null;
  var toastTimer = null;
  var ghPromise = null;

  var TITLES = {
    projects: "PROJECTS.EXE",
    github: "GITHUB.BADGE",
    skills: "INVENTORY.SKILLS",
    contact: "MAIL.EXE",
    resume: "RESUME.PDF",
    help: "HOW_TO_PLAY.TXT",
  };

  /* ---------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function sound(name) {
    if (window.Audio8) window.Audio8.play(name);
  }

  function setBlocking(on) {
    document.body.classList.toggle("is-blocking", on);
    if (window.Game && window.Game.setPaused) window.Game.setPaused(on);
  }

  function isBlocking() {
    return dlg.open || !overlay.hidden;
  }

  /* ---------------------------------------------------------------- */
  /* Toast                                                             */
  /* ---------------------------------------------------------------- */
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  /* ---------------------------------------------------------------- */
  /* Dialogue                                                          */
  /* ---------------------------------------------------------------- */
  function portraitLoop() {
    if (!dlg.open) return;
    var blink = (Date.now() % 4300) < 150;
    var g = dlgPortrait.getContext("2d");
    g.imageSmoothingEnabled = false;
    window.Sprites.renderPortrait(g, 3, { blink: blink, talk: dlg.typing });
    dlg.raf = requestAnimationFrame(portraitLoop);
  }

  function typeText(str, done) {
    clearInterval(dlg.timer);
    dlg.full = str;
    dlg.typing = true;
    dlgText.textContent = "";
    dlgText.classList.add("is-typing");
    dlgAdvance.classList.remove("is-on");
    var i = 0;
    dlg.timer = setInterval(function () {
      i += 2;
      if (i >= str.length) {
        i = str.length;
        dlgText.textContent = str.slice(0, i);
        clearInterval(dlg.timer);
        dlg.typing = false;
        dlgText.classList.remove("is-typing");
        dlgAdvance.classList.add("is-on");
        if (done) done();
        return;
      }
      dlgText.textContent = str.slice(0, i);
      if (i % 6 === 0) sound("blip");
      dlgText.scrollTop = dlgText.scrollHeight;
    }, 18);
  }

  function finishTyping() {
    if (!dlg.typing) return false;
    clearInterval(dlg.timer);
    dlgText.textContent = dlg.full;
    dlg.typing = false;
    dlgText.classList.remove("is-typing");
    dlgAdvance.classList.add("is-on");
    if (dlg.onTyped) dlg.onTyped();
    return true;
  }

  function clearChoices() {
    dlgChoices.innerHTML = "";
    dlg.choices = [];
    dlg.index = 0;
  }

  function makeButton(opts) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "choice" + (opts.className ? " " + opts.className : "");
    if (opts.disabled) b.disabled = true;
    b.innerHTML = opts.html;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      opts.onClick();
    });
    b.addEventListener("mouseenter", function () {
      if (!b.disabled) { dlg.index = opts.index; syncChoiceFocus(); }
    });
    return b;
  }

  function renderGreeting() {
    clearChoices();
    dlg.mode = "greeting";
    C.dialogue.choices.forEach(function (choice, i) {
      var b = makeButton({
        index: i,
        html:
          '<span class="choice-key">' + (i + 1) + "</span>" +
          '<span class="choice-copy">' +
            '<span class="choice-en">' + esc(choice.label) + "</span>" +
            '<span class="choice-ar" lang="ar" dir="rtl">' + esc(choice.labelAr) + "</span>" +
          "</span>" +
          '<span class="choice-arrow">›</span>',
        onClick: function () { choose(i); },
      });
      dlgChoices.appendChild(b);
      dlg.choices.push(b);
    });
    var close = makeButton({
      index: C.dialogue.choices.length,
      className: "choice--ghost",
      html: '<span class="choice-key">ESC</span><span class="choice-copy"><span class="choice-en">CLOSE</span></span>',
      onClick: closeDialogue,
    });
    dlgChoices.appendChild(close);
    dlg.choices.push(close);
    syncChoiceFocus();
  }

  function showAnswer(choice) {
    clearChoices();
    dlg.mode = "answer";
    typeText(choice.answer, function () {
      clearChoices();
      var back = makeButton({
        index: 0,
        className: "choice--back",
        html: '<span class="choice-arrow">‹</span><span class="choice-copy"><span class="choice-en">BACK</span></span>',
        onClick: function () {
          sound("select");
          renderGreeting();
          typeText(C.dialogue.greeting);
        },
      });
      dlgChoices.appendChild(back);
      dlg.choices.push(back);

      if (choice.action) {
        var act = makeButton({
          index: 1,
          className: "choice--action",
          html: '<span class="choice-copy"><span class="choice-en">' + esc(choice.action.label) + "</span></span>" +
                '<span class="choice-arrow">→</span>',
          onClick: function () {
            sound("confirm");
            closeDialogue();
            openModal(choice.action.value);
          },
        });
        dlgChoices.appendChild(act);
        dlg.choices.push(act);
      }
      syncChoiceFocus();
    });
  }

  function syncChoiceFocus() {
    dlg.choices.forEach(function (b, i) {
      b.classList.toggle("is-focused", i === dlg.index);
    });
  }

  function choose(i) {
    var choice = C.dialogue.choices[i];
    if (!choice) return;
    sound("confirm");
    showAnswer(choice);
  }

  function openDialogue() {
    if (isBlocking()) return;
    lastFocus = document.activeElement;
    dlg.open = true;
    dlg.lastFocus = lastFocus;
    dialogue.hidden = false;
    document.body.classList.add("dialogue-open");
    dlgText.textContent = "";
    clearChoices();
    dlg.mode = "greeting";
    setBlocking(true);
    sound("open");
    renderGreeting();
    typeText(C.dialogue.greeting);
    dlgPortrait.getContext("2d").imageSmoothingEnabled = false;
    dlg.raf = requestAnimationFrame(portraitLoop);
    setTimeout(function () { dlgText.focus({ preventScroll: true }); }, 30);
  }

  function closeDialogue() {
    if (!dlg.open) return;
    dlg.open = false;
    clearInterval(dlg.timer);
    cancelAnimationFrame(dlg.raf);
    dialogue.hidden = true;
    document.body.classList.remove("dialogue-open");
    clearChoices();
    setBlocking(false);
    sound("close");
    if (dlg.lastFocus && dlg.lastFocus.focus) dlg.lastFocus.focus({ preventScroll: true });
  }

  function dialogueKey(e) {
    if (!dlg.open) return false;
    var k = e.key;
    if (k === "Escape") { e.preventDefault(); closeDialogue(); return true; }
    if (dlg.typing) {
      if (k === "Enter" || k === " " || k === "e" || k === "E") {
        e.preventDefault(); finishTyping(); return true;
      }
      return true;
    }
    if (k === "Enter" || k === " ") {
      e.preventDefault();
      var target = dlg.choices[dlg.index];
      if (target) target.click();
      return true;
    }
    if (k === "ArrowDown" || k === "ArrowRight") {
      e.preventDefault();
      dlg.index = (dlg.index + 1) % Math.max(1, dlg.choices.length);
      syncChoiceFocus(); sound("blip"); return true;
    }
    if (k === "ArrowUp" || k === "ArrowLeft") {
      e.preventDefault();
      dlg.index = (dlg.index - 1 + dlg.choices.length) % Math.max(1, dlg.choices.length);
      syncChoiceFocus(); sound("blip"); return true;
    }
    if (/^[1-9]$/.test(k)) {
      e.preventDefault();
      var n = parseInt(k, 10) - 1;
      if (dlg.mode === "greeting" && dlg.choices[n]) dlg.choices[n].click();
      return true;
    }
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* GitHub data                                                       */
  /* ---------------------------------------------------------------- */
  function readCache(key, ttl) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.time || Date.now() - obj.time > ttl) return null;
      return obj.value;
    } catch (e) { return null; }
  }

  function writeCache(key, value) {
    try { localStorage.setItem(key, JSON.stringify({ time: Date.now(), value: value })); } catch (e) {}
  }

  function normalizeRepos(list) {
    return list
      .filter(function (r) { return !r.fork && r.name.toLowerCase() !== C.github.username.toLowerCase(); })
      .sort(function (a, b) {
        if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
        return new Date(b.updated_at) - new Date(a.updated_at);
      })
      .slice(0, C.github.maxProjects)
      .map(function (r) {
        return {
          name: r.name,
          description: r.description || "No description yet.",
          language: r.language || "Code",
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          topics: (r.topics || []).slice(0, 3),
          url: r.html_url,
          updated: r.updated_at,
          homepage: r.homepage || "",
        };
      });
  }

  function fallbackProjects() {
    return C.projects.slice(0, C.github.maxProjects).map(function (p) {
      return {
        name: p.name, description: p.description, language: p.language,
        stars: p.stars || 0, forks: p.forks || 0, topics: p.topics || [],
        url: p.url, updated: null, homepage: "",
      };
    });
  }

  function loadGitHub(force) {
    if (ghPromise && !force) return ghPromise;
    if (!force) {
      var cached = readCache(C.github.cacheKey, C.github.cacheTtl);
      if (cached && cached.repos && cached.repos.length) {
        ghPromise = Promise.resolve({ repos: cached.repos, user: cached.user, source: "cache" });
        return ghPromise;
      }
    }
    ghPromise = fetch(C.github.reposUrl, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API " + res.status);
        return res.json();
      })
      .then(function (data) {
        var repos = normalizeRepos(data);
        var result = { repos: repos, user: null, source: "live" };
        writeCache(C.github.cacheKey, { repos: repos });
        return result;
      })
      .catch(function (err) {
        ghPromise = null;
        return { repos: fallbackProjects(), user: null, source: "fallback", error: err.message };
      });
    return ghPromise;
  }

  var LANG_COLORS = {
    TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572a5",
    HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", PowerShell: "#4b7bb5",
    Dockerfile: "#384d54", C: "#555555", "C++": "#f34b7d", Go: "#00add8",
  };

  function langColor(lang) {
    return LANG_COLORS[lang] || "#9aa4b8";
  }

  function timeAgo(iso) {
    if (!iso) return "";
    var d = new Date(iso).getTime();
    var diff = Math.max(0, Date.now() - d);
    var day = 86400000;
    if (diff < 3600000) return Math.max(1, Math.round(diff / 60000)) + "m ago";
    if (diff < day) return Math.round(diff / 3600000) + "h ago";
    if (diff < day * 30) return Math.round(diff / day) + "d ago";
    if (diff < day * 365) return Math.round(diff / (day * 30)) + "mo ago";
    return Math.round(diff / (day * 365)) + "y ago";
  }

  /* ---------------------------------------------------------------- */
  /* Window builders                                                   */
  /* ---------------------------------------------------------------- */
  function projectCard(p) {
    var tags = p.topics.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    return (
      '<a class="proj" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="proj-top">' +
          '<span class="proj-icon">▸</span>' +
          '<h3 class="proj-name">' + esc(p.name) + "</h3>" +
          '<span class="proj-go">↗</span>' +
        "</div>" +
        '<p class="proj-desc">' + esc(p.description) + "</p>" +
        '<div class="proj-tags">' + tags + "</div>" +
        '<div class="proj-meta">' +
          '<span class="lang"><i style="background:' + langColor(p.language) + '"></i>' + esc(p.language) + "</span>" +
          '<span class="meta-item">★ ' + p.stars + "</span>" +
          '<span class="meta-item">⑂ ' + p.forks + "</span>" +
          (p.updated ? '<span class="meta-time">' + timeAgo(p.updated) + "</span>" : "") +
        "</div>" +
      "</a>"
    );
  }

  function skeletonGrid(n) {
    var out = "";
    for (var i = 0; i < n; i++) {
      out += '<div class="proj proj--skeleton"><div class="sk sk-title"></div><div class="sk sk-line"></div>' +
             '<div class="sk sk-line short"></div><div class="sk sk-meta"></div></div>';
    }
    return out;
  }

  function buildProjects() {
    var body =
      '<div class="win-head">' +
        '<div><p class="win-kicker">SELECTED WORK · LIVE FROM GITHUB</p>' +
        '<h3 class="win-title">Things I have shipped</h3></div>' +
        '<div class="win-head-actions">' +
          '<span class="sync" id="sync-state">SYNCING…</span>' +
          '<button class="btn btn--tiny" id="gh-refresh" type="button">REFRESH</button>' +
        "</div>" +
      "</div>" +
      '<div class="proj-grid" id="proj-grid">' + skeletonGrid(6) + "</div>" +
      '<div class="win-foot">' +
        '<span id="proj-count">—</span>' +
        '<a class="btn btn--ghost btn--tiny" href="' + esc(C.profile.github) + '" target="_blank" rel="noopener noreferrer">ALL REPOS ON GITHUB ↗</a>' +
      "</div>";

    render();
    loadGitHub().then(paintProjects);

    function render() {
      modalBody.innerHTML = body;
      $("gh-refresh").addEventListener("click", function () {
        sound("select");
        $("proj-grid").innerHTML = skeletonGrid(6);
        $("sync-state").textContent = "SYNCING…";
        $("sync-state").className = "sync";
        loadGitHub(true).then(paintProjects);
      });
    }

    function paintProjects(data) {
      var grid = $("proj-grid");
      if (!grid) return;
      var sync = $("sync-state");
      var count = $("proj-count");
      if (!data.repos.length) {
        grid.innerHTML = '<div class="empty">No public repositories found. Try refreshing.</div>';
      } else {
        grid.innerHTML = data.repos.map(projectCard).join("");
      }
      if (sync) {
        if (data.source === "live") { sync.textContent = "● LIVE"; sync.className = "sync sync--live"; }
        else if (data.source === "cache") { sync.textContent = "● CACHED"; sync.className = "sync sync--cache"; }
        else { sync.textContent = "● OFFLINE COPY"; sync.className = "sync sync--off"; }
      }
      if (count) count.textContent = data.repos.length + " PUBLIC PROJECTS";
    }
  }

  function buildGithub() {
    var stats = [
      { k: "REPOS", v: "9+" },
      { k: "FOCUS", v: "FULL-STACK" },
      { k: "BASE", v: "ALEXANDRIA" },
    ];
    modalBody.innerHTML =
      '<div class="badge-card">' +
        '<div class="badge-avatar"><canvas id="badge-portrait" width="128" height="128"></canvas>' +
          '<span class="badge-dot"></span></div>' +
        '<div class="badge-info">' +
          '<p class="win-kicker">VERIFIED DEVELOPER · SINCE 2022</p>' +
          '<h3 class="win-title">' + esc(C.profile.name) + "</h3>" +
          '<p class="badge-handle">@' + esc(C.profile.handle) + "</p>" +
          '<p class="badge-bio">' + esc(C.profile.tagline) + " " + esc(C.profile.location) + ".</p>" +
          '<div class="badge-stats">' +
            stats.map(function (s) {
              return '<div class="stat"><span>' + s.k + "</span><b>" + s.v + "</b></div>";
            }).join("") +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="gh-cta">' +
        '<div><h4>Everything is public.</h4><p>Source code, commits and experiments — no private showcase.</p></div>' +
        '<a class="btn btn--amber" href="' + esc(C.profile.github) + '" target="_blank" rel="noopener noreferrer">OPEN GITHUB PROFILE ↗</a>' +
      "</div>" +
      '<div class="gh-repos" id="gh-repos"><p class="muted">Loading repositories…</p></div>';

    var g = $("badge-portrait").getContext("2d");
    g.imageSmoothingEnabled = false;
    window.Sprites.renderPortrait(g, 4, {});

    loadGitHub().then(function (data) {
      var box = $("gh-repos");
      if (!box) return;
      box.innerHTML = data.repos.slice(0, 4).map(function (p) {
        return '<a class="gh-row" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="gh-row-name">' + esc(p.name) + "</span>" +
          '<span class="gh-row-desc">' + esc(p.description) + "</span>" +
          '<span class="gh-row-lang"><i style="background:' + langColor(p.language) + '"></i>' + esc(p.language) + "</span>" +
        "</a>";
      }).join("");
    });
  }

  function buildSkills() {
    var groups = C.techStack.map(function (g) {
      var items = g.items.map(function (it) {
        var dots = "";
        for (var i = 1; i <= 5; i++) dots += '<i class="' + (i <= it.level ? "on" : "") + '"></i>';
        return '<li class="skill"><span class="skill-name">' + esc(it.name) + "</span>" +
               '<span class="skill-dots" title="' + (C.skillLabels[it.level] || "") + '">' + dots + "</span></li>";
      }).join("");
      return '<section class="skill-group"><h4>' + esc(g.group) + "</h4><ul>" + items + "</ul></section>";
    }).join("");

    var certs = C.certifications.length
      ? C.certifications.map(function (c) {
          return '<a class="cert" href="' + esc(c.url || "#") + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="cert-icon">◆</span><span><b>' + esc(c.name) + "</b><small>" + esc(c.issuer) + " · " + esc(c.year) + "</small></span></a>";
        }).join("")
      : '<div class="cert cert--empty"><span class="cert-icon">◇</span><span><b>EMPTY SLOT</b>' +
        "<small>Add your certifications in <code>js/config.js</code></small></span></div>";

    modalBody.innerHTML =
      '<div class="win-head"><div><p class="win-kicker">INVENTORY · EQUIPPED GEAR</p>' +
      '<h3 class="win-title">Tech stack &amp; skills</h3></div>' +
      '<span class="sync sync--live">● ' + C.techStack.reduce(function (n, g) { return n + g.items.length; }, 0) + " ITEMS</span></div>" +
      '<div class="skill-grid">' + groups + "</div>" +
      '<div class="cert-block"><h4>CERTIFICATIONS</h4><div class="cert-list">' + certs + "</div></div>" +
      '<p class="muted small">Ratings are a self-assessment: Advanced = daily driver, Proficient = shipped production work, Working = comfortable.</p>';
  }

  function buildContact() {
    var links = C.contact.links.filter(function (l) { return l.value; }).map(function (l) {
      var isEmail = l.id === "email";
      return '<div class="contact-row">' +
        '<span class="contact-label">' + esc(l.label) + "</span>" +
        '<span class="contact-value">' + esc(l.value) + "</span>" +
        (l.url ? '<a class="btn btn--tiny" href="' + esc(l.url) + '"' + (isEmail ? "" : ' target="_blank" rel="noopener noreferrer"') + ">OPEN ↗</a>" : "") +
        (isEmail ? '<button class="btn btn--tiny btn--amber" type="button" id="copy-email">COPY</button>' : "") +
      "</div>";
    }).join("");

    modalBody.innerHTML =
      '<div class="win-head"><div><p class="win-kicker">MAILBOX · ONE TAP AWAY</p>' +
      '<h3 class="win-title">' + esc(C.contact.heading) + "</h3></div>" +
      '<span class="sync sync--live">● ' + esc(C.profile.availability) + "</span></div>" +
      '<p class="contact-blurb">' + esc(C.contact.blurb) + "</p>" +
      '<div class="contact-list">' + links + "</div>" +
      '<div class="contact-foot">' +
        '<p class="muted small">' + (C.profile.email ? 'Prefer a form? Email is the form. Include the project, scope and timeline and I will reply within a day.' : 'GitHub is the current contact route. Add an email address in js/config.js to show it here.') + '</p>' +
      "</div>";

    var copyBtn = $("copy-email");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyText(C.profile.email, "Email copied — " + C.profile.email);
      });
    }
  }

  function buildResume() {
    var p = C.profile;
    var exp = C.experience.map(function (e) {
      return '<div class="r-job">' +
        '<div class="r-job-head"><h4>' + esc(e.role) + "</h4><span>" + esc(e.period) + "</span></div>" +
        '<p class="r-job-sub">' + esc(e.company) + " · " + esc(e.location) + "</p>" +
        "<p>" + esc(e.summary) + "</p>" +
        "<ul>" + e.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
        '<p class="r-stack">' + e.stack.map(esc).join(" · ") + "</p>" +
      "</div>";
    }).join("");

    var projs = C.resume.projects.map(function (pr) {
      return '<div class="r-proj"><div class="r-proj-head"><h4>' + esc(pr.name) + "</h4><span>" + esc(pr.stack) + "</span></div>" +
        "<p>" + esc(pr.description) + "</p></div>";
    }).join("");

    var skills = C.techStack.map(function (g) {
      return '<div class="r-skill-row"><span>' + esc(g.group) + "</span><p>" +
        g.items.map(function (i) { return esc(i.name); }).join(" · ") + "</p></div>";
    }).join("");

    var edu = C.education.map(function (e) {
      return '<div class="r-job"><div class="r-job-head"><h4>' + esc(e.title) + "</h4><span>" + esc(e.period) + "</span></div>" +
        '<p class="r-job-sub">' + esc(e.org) + "</p><p>" + esc(e.detail) + "</p></div>";
    }).join("");

    var certs = C.certifications.length
      ? C.certifications.map(function (c) { return "<li>" + esc(c.name) + " — " + esc(c.issuer) + ", " + esc(c.year) + "</li>"; }).join("")
      : "<li>Portfolio, source code and references available on request.</li>";

    var contactBits = [p.email, p.github.replace(/^https?:\/\//, ""), p.location]
      .filter(Boolean).map(esc).join("  ·  ");

    modalBody.innerHTML =
      '<div class="resume-toolbar no-print">' +
        '<span>Standard resume · A4 · print ready</span>' +
        '<button class="btn btn--tiny btn--amber" id="print-resume" type="button">PRINT / SAVE PDF</button>' +
      "</div>" +
      '<article class="resume-paper" id="resume-paper">' +
        '<header class="r-head">' +
          "<div>" +
            '<h1>' + esc(p.name) + "</h1>" +
            '<p class="r-role">' + esc(p.role) + "</p>" +
          "</div>" +
          '<div class="r-contact">' +
            "<p>" + esc(p.email) + "</p>" +
            "<p>" + esc(p.github.replace(/^https?:\/\//, "")) + "</p>" +
            "<p>" + esc(p.location) + "</p>" +
          "</div>" +
        "</header>" +
        '<section class="r-section"><h2>Summary</h2><p>' + esc(C.resume.summary) + "</p>" +
          '<ul class="r-highlights">' + C.resume.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>" +
        "</section>" +
        '<section class="r-section"><h2>Experience</h2>' + exp + "</section>" +
        '<section class="r-section"><h2>Selected Projects</h2>' + projs + "</section>" +
        '<section class="r-section"><h2>Technical Skills</h2>' + skills + "</section>" +
        '<section class="r-section"><h2>Education &amp; Training</h2>' + edu + "</section>" +
        '<section class="r-section"><h2>Certifications</h2><ul>' + certs + "</ul></section>" +
        '<footer class="r-foot"><span>' + contactBits + "</span><span>Updated " + new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + "</span></footer>" +
      "</article>";

    var printBtn = $("print-resume");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        sound("confirm");
        window.print();
      });
    }
  }

  function buildHelp() {
    modalBody.innerHTML =
      '<div class="win-head"><div><p class="win-kicker">QUICK START</p><h3 class="win-title">How to play</h3></div></div>' +
      '<div class="help-grid">' +
        '<div class="help-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><p>Walk around the room. Arrow keys work too.</p></div>' +
        '<div class="help-item"><kbd>E</kbd><kbd>SPACE</kbd><p>Talk to Mohamed or inspect the furniture you are facing.</p></div>' +
        '<div class="help-item"><kbd>1</kbd>–<kbd>4</kbd><p>Pick a dialogue topic. Arrow keys + Enter also work.</p></div>' +
        '<div class="help-item"><kbd>ESC</kbd><p>Close any window or conversation.</p></div>' +
        '<div class="help-item"><kbd>TAP</kbd><p>On mobile, use the D-pad and the A button. Tap objects to walk to them.</p></div>' +
        '<div class="help-item"><kbd>?</kbd><p>This window. Reopen it any time from the corner.</p></div>' +
      "</div>" +
      '<p class="muted small">Everything you see is drawn procedurally on a 384×224 canvas: no sprite sheets, no external images. Audio is synthesised with WebAudio.</p>';
  }

  /* ---------------------------------------------------------------- */
  /* Window shell                                                      */
  /* ---------------------------------------------------------------- */
  function openModal(type) {
    if (dlg.open) closeDialogue();
    modalType = type;
    lastFocus = document.activeElement;
    modalTitle.textContent = TITLES[type] || "WINDOW";
    modal.className = "modal" + (type === "resume" ? " modal--paper" : "");
    document.body.classList.toggle("resume-open", type === "resume");
    modalBody.innerHTML = "";
    overlay.hidden = false;
    setBlocking(true);
    sound("open");

    if (type === "projects") buildProjects();
    else if (type === "github") buildGithub();
    else if (type === "skills") buildSkills();
    else if (type === "contact") buildContact();
    else if (type === "resume") buildResume();
    else if (type === "help") buildHelp();

    modalBody.scrollTop = 0;
    overlay.classList.remove("is-in");
    requestAnimationFrame(function () { overlay.classList.add("is-in"); });

    var closeBtn = modal.querySelector("[data-close]");
    setTimeout(function () {
      if (type === "resume") { var pr = $("print-resume"); if (pr) pr.focus(); }
      else if (closeBtn) closeBtn.focus({ preventScroll: true });
    }, 60);
  }

  function closeModal() {
    if (overlay.hidden) return;
    overlay.classList.remove("is-in");
    overlay.hidden = true;
    modalType = null;
    document.body.classList.remove("resume-open");
    setBlocking(false);
    sound("close");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function copyText(text, msg) {
    function done() {
      sound("copy");
      toast(msg || "Copied to clipboard");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Copy failed — select manually"); }
    document.body.removeChild(ta);
  }

  /* ---------------------------------------------------------------- */
  function clock() {
    var el = $("clock");
    if (!el) return;
    try {
      el.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: C.profile.timezone,
      }).format(new Date());
    } catch (e) {
      el.textContent = new Date().toTimeString().slice(0, 5);
    }
  }

  function initAudioButtons() {
    var music = $("btn-music");
    var sfx = $("btn-sfx");
    function paint() {
      var mOn = window.Audio8.isMusicOn();
      var sOn = window.Audio8.isSfxOn();
      music.setAttribute("aria-pressed", String(mOn));
      music.classList.toggle("is-on", mOn);
      music.querySelector("[data-state]").textContent = mOn ? "ON" : "OFF";
      sfx.setAttribute("aria-pressed", String(sOn));
      sfx.classList.toggle("is-on", sOn);
      sfx.querySelector("[data-state]").textContent = sOn ? "ON" : "OFF";
    }
    music.addEventListener("click", function () {
      window.Audio8.toggleMusic();
      paint();
      toast(window.Audio8.isMusicOn() ? "8-bit soundtrack on" : "Music muted");
    });
    sfx.addEventListener("click", function () {
      window.Audio8.toggleSfx();
      paint();
      toast(window.Audio8.isSfxOn() ? "Sound effects on" : "Sound effects muted");
    });
    paint();
  }

  /* ---------------------------------------------------------------- */
  return {
    init: function () {
      window.Audio8.init();
      initAudioButtons();
      clock();
      setInterval(clock, 30000);
      $("year").textContent = new Date().getFullYear();

      $("btn-resume").addEventListener("click", function () { sound("select"); openModal("resume"); });
      $("btn-github").addEventListener("click", function () { sound("select"); openModal("github"); });
      $("btn-help").addEventListener("click", function () { sound("select"); openModal("help"); });

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
      });
      modal.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) closeModal();
      });
      $("dlg-close").addEventListener("click", closeDialogue);
      dlgText.addEventListener("click", function () { finishTyping(); });
      dialogue.addEventListener("click", function (e) {
        if (e.target === dialogue) closeDialogue();
      });

      document.addEventListener("keydown", function (e) {
        if (dlg.open) {
          if (dialogueKey(e)) { e.stopPropagation(); }
          return;
        }
        if (!overlay.hidden) {
          if (e.key === "Escape") { e.preventDefault(); closeModal(); }
          return;
        }
        if (e.key === "Escape") closeDialogue();
      });

      /* first gesture unlocks audio */
      var unlocked = false;
      function unlock() {
        if (unlocked) return;
        unlocked = true;
        window.Audio8.unlock();
      }
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });

      /* pause the loop when the tab is hidden */
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && window.Game) window.Game.setPaused(true, true);
      });
    },
    openDialogue: openDialogue,
    closeDialogue: closeDialogue,
    openModal: openModal,
    closeModal: closeModal,
    isBlocking: isBlocking,
    toast: toast,
    copyText: copyText,
    loadGitHub: loadGitHub,
  };
})();
