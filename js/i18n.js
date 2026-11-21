/* ============================================================================
   I18N  —  language switching (English default, Arabic optional).

   The site is English-first. Every string that is NOT part of the content in
   js/config.js lives in the dictionary below. Content translations live in the
   `i18n.ar` block of js/config.js so the "edit one file" promise still holds.

   Switching a language:
     1. writes the chosen language back onto the SAME window.PORTFOLIO object
        (in place, so modules that captured a reference still see it), and
     2. sets <html lang/dir> plus a body class for RTL/styling.

   The tiny 5x7 canvas font is ASCII-only, so on-canvas prompts stay English;
   everything rendered as HTML is fully translated.
   ========================================================================== */
window.I18N = (function () {
  "use strict";

  var KEY = "mn_lang_v1";
  var LANGS = ["en", "ar"];
  var P = window.PORTFOLIO || {};

  /* Top-level config keys that have an Arabic mirror under i18n.ar. The
     `npc` block and `github` block are structural, not shown as copy. */
  var TRANSLATABLE = [
    "profile", "dialogue", "experience", "education", "certifications",
    "projects", "techStack", "skillLabels", "contact", "resume", "secrets",
  ];

  /* A pristine, deep copy of the English content. Kept apart from
     window.PORTFOLIO (which is mutated in place) so switching back to English
     always restores exactly the authored strings. */
  var BASE = {};
  TRANSLATABLE.forEach(function (k) {
    if (P[k] !== undefined) BASE[k] = clone(P[k]);
  });

  var lang = "en";
  var listeners = [];

  /* ---------------------------------------------------------------- */
  function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }

  /* Mutate `target` so it structurally matches `source`, keeping target's
     identity. This is what lets referencing modules keep working: the objects
     and arrays they hold are updated in place, never replaced. */
  function assignInPlace(target, source) {
    if (source === undefined) return target;
    if (Array.isArray(source)) {
      if (!Array.isArray(target)) return source;
      for (var i = 0; i < source.length; i++) {
        if (source[i] !== undefined) target[i] = assignInPlace(target[i], source[i]);
      }
      return target;
    }
    if (source && typeof source === "object") {
      if (!target || typeof target !== "object" || Array.isArray(target)) return clone(source);
      for (var k in source) {
        if (Object.prototype.hasOwnProperty.call(source, k)) {
          target[k] = assignInPlace(target[k], source[k]);
        }
      }
      return target;
    }
    return source;
  }

  function arContent() {
    return (P.i18n && P.i18n.ar) || {};
  }

  /* Wipe every translatable key back to English, then paint Arabic on top.
     Always mutates window.PORTFOLIO in place. */
  function applyContent() {
    var overlay = lang === "ar" ? arContent() : null;
    TRANSLATABLE.forEach(function (k) {
      if (P[k] === undefined && BASE[k] === undefined) return;
      P[k] = assignInPlace(P[k], BASE[k]);
      if (overlay && overlay[k] !== undefined) {
        P[k] = assignInPlace(P[k], overlay[k]);
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Dictionary — everything hard-coded in ui.js / game.js / secrets.js
     / index.html. {placeholders} are filled by t(key, vars).            */
  var DICT = {
    en: {
      "brand.name": "MOHAMED NASR",
      "brand.sub": "FULL-STACK DEVELOPER <i>/</i> ALEXANDRIA, EG",
      "btn.github": "GITHUB",
      "btn.resume": "SKIP TO CLASSIC RESUME",
      "chrome.title": "ROOM.EXE <b>—</b> MOHAMED&nbsp;NASR",
      "chrome.online": "ONLINE",
      "hud.music": "MUSIC",
      "hud.sfx": "SFX",
      "hud.secrets": "SECRETS",
      "state.on": "ON",
      "state.off": "OFF",
      "hint.move": "MOVE",
      "hint.talk": "TALK &amp; INSPECT",
      "loader.text": "LOADING CHARACTERS",
      "foot.copy": "© {year} MOHAMED NASR",
      "foot.mid": "BUILT WITH CANVAS + VANILLA JS · NO FRAMEWORKS, NO BROKEN IMAGES",

      "aria.github": "Open GitHub profile",
      "aria.howto": "How to play",
      "aria.fullscreen": "Full screen (F)",
      "aria.lang": "Change language",
      "aria.audio": "Audio settings",
      "aria.music": "Toggle 8-bit music",
      "aria.sfx": "Toggle sound effects",
      "aria.secrets": "Eight secrets are hidden in this room",
      "aria.moveUp": "Move up",
      "aria.moveDown": "Move down",
      "aria.moveLeft": "Move left",
      "aria.moveRight": "Move right",
      "aria.interact": "Interact",

      "a11y.skip": "Skip to text version",
      "a11y.textBack": "Back to the interactive room",

      "tour.hello": "Hi — Mohamed here. This whole room is my portfolio. Want me to walk you around? It takes about thirty seconds.",
      "tour.yes": "YES, SHOW ME AROUND",
      "tour.no": "NO, I'LL EXPLORE ALONE",
      "tour.bubble": "!",
      "tour.next": "NEXT STOP",
      "tour.skip": "END THE TOUR",
      "tour.open": "OPEN {name}",
      "tour.poke": "PET THE CAT",
      "tour.s1": "These two monitors are my projects — everything I have shipped, newest first. The repos live on GitHub, so the list updates itself.",
      "tour.s2": "This is the bookshelf, which is really my inventory: TypeScript and Node first, then NestJS, Prisma and Postgres on the back end, and the front-end stack on the top shelf.",
      "tour.s3": "The board on the wall is my GitHub badge. It pulls my real repositories and my language mix, so it is never out of date.",
      "tour.s4": "The mailbox holds my contact details — email, LinkedIn and GitHub. One click copies the email address.",
      "tour.s5": "And here is the part most visitors miss: this room hides eight easter eggs. This cat is one of them — pet it five times and see. Another one answers to the four letters of \"hire\"... but that is all I am telling you.",
      "tour.s5poke": "See? Purring. Off you go — the rest are yours to find.",
      "tour.end": "That is the grand tour. Walk anywhere, press E or click on anything that glows, and Esc closes whatever is open. Enjoy the room!",
      "tour.done": "START EXPLORING",
      "tour.seeSecrets": "SHOW ME THE SECRET LIST",

      "choice.close": "CLOSE",
      "choice.back": "BACK",

      "help.kicker": "QUICK START",
      "help.title": "How to play",
      "help.move": "Walk around the room. Arrow keys work too.",
      "help.talk": "Talk to Mohamed or inspect the furniture you are facing.",
      "help.choose": "Pick a dialogue topic. Arrow keys + Enter also work.",
      "help.esc": "Close any window or conversation.",
      "help.tap": "On mobile, use the D-pad and the A button. Tap objects to walk to them.",
      "help.this": "This window. Reopen it any time from the corner.",
      "help.secrets": "Eight secrets are hidden in this room. The SECRETS chip in the top-left corner keeps score and holds the hints.",
      "help.note": "The room, the furniture and the characters are drawn on a 384×224 canvas. The characters come from hand-drawn sprite sheets. Audio is synthesised with WebAudio.",

      "proj.kicker": "SELECTED WORK · LIVE FROM GITHUB",
      "proj.title": "Things I have shipped",
      "proj.syncing": "SYNCING...",
      "proj.refresh": "REFRESH",
      "proj.allrepos": "ALL REPOS ON GITHUB ↗",
      "proj.live": "● LIVE",
      "proj.cached": "● CACHED",
      "proj.offline": "● OFFLINE COPY",
      "proj.count": "{n} PUBLIC PROJECTS",
      "proj.empty": "No public repositories found. Try refreshing.",
      "proj.nodesc": "No description yet.",
      "proj.code": "Code",

      "time.now": "just now",
      "time.m": "{n}m ago",
      "time.h": "{n}h ago",
      "time.d": "{n}d ago",
      "time.mo": "{n}mo ago",
      "time.y": "{n}y ago",

      "gh.kicker": "VERIFIED DEVELOPER · SINCE 2022",
      "gh.stat.repos": "REPOS",
      "gh.stat.focus": "FOCUS",
      "gh.stat.base": "BASE",
      "gh.stat.focusV": "FULL-STACK",
      "gh.stat.baseV": "ALEXANDRIA",
      "gh.everything": "Everything is public.",
      "gh.everythingDesc": "Source code, commits and experiments — no private showcase.",
      "gh.open": "OPEN GITHUB PROFILE ↗",
      "gh.loading": "Loading repositories...",

      "sk.kicker": "INVENTORY · EQUIPPED GEAR",
      "sk.title": "Tech stack &amp; skills",
      "sk.items": "{n} ITEMS",
      "sk.certs": "CERTIFICATIONS",
      "sk.empty": "EMPTY SLOT",
      "sk.emptyHint": "Add your certifications in <code>js/config.js</code>",
      "sk.note": "Ratings are a self-assessment: Advanced = daily driver, Proficient = shipped production work, Working = comfortable.",

      "ct.kicker": "MAILBOX · ONE TAP AWAY",
      "ct.open": "OPEN ↗",
      "ct.copy": "COPY",
      "ct.preferEmail": "Prefer a form? Email is the form. Include the project, scope and timeline and I will reply within a day.",
      "ct.githubRoute": "GitHub is the current contact route. Add an email address in js/config.js to show it here.",

      "rs.toolbar": "Standard resume · A4 · print ready",
      "rs.print": "PRINT / SAVE PDF",
      "rs.download": "DOWNLOAD CV (PDF)",
      "rs.newtab": "OPEN IN NEW TAB",
      "rs.summary": "Summary",
      "rs.experience": "Experience",
      "rs.projects": "Selected Projects",
      "rs.skills": "Technical Skills",
      "rs.education": "Education &amp; Training",
      "rs.certs": "Certifications",
      "rs.certsFallback": "Portfolio, source code and references available on request.",
      "rs.updated": "Updated {date}",

      "sec.undiscovered": "UNDISCOVERED",
      "sec.note": "Progress is saved in this browser only.",
      "sec.complete": "100% COMPLETE",
      "sec.percent": "{n} percent found",
      "sec.badge": "Secrets found: {n} of {total}. Opens the secrets window.",
      "sec.toast": "★ SECRET {n}/{total} — {name}",
      "sec.toastAll": "★★ ALL SECRETS FOUND — LV.100 ★★",
      "sec.purr": "*purrrrrr*  ({n}/5)",
      "sec.consoleTitle": "You opened the console. Respect.",
      "sec.consoleBody": "{n} secrets are hidden in this room — open the SECRETS chip in the HUD for hints.",
      "sec.found": "{n} / {total} found",

      "toast.copied": "Copied to clipboard",
      "toast.copyfail": "Copy failed — select manually",
      "toast.email": "Email copied — {email}",
      "toast.musicOn": "8-bit soundtrack on",
      "toast.musicOff": "Music muted",
      "toast.sfxOn": "Sound effects on",
      "toast.sfxOff": "Sound effects muted",
      "toast.artFail": "Character art could not be loaded.",
      "toast.lightsOn": "Lights on.",
      "toast.lightsOff": "Lights off — the monitors do the rest.",
      "toast.wish": "You wished upon a shooting star.",
      "toast.walkCloser": "Walk closer to an object first.",
      "toast.savePdf": "In the print dialog, pick “Save as PDF” as the destination.",
      "toast.textMode": "Plain-text version. The room is still there.",
    },

    ar: {
      "brand.name": "محمد نصر",
      "brand.sub": "مبرمج متكامل <i>/</i> الإسكندرية، مصر",
      "btn.github": "جيت هاب",
      "btn.resume": "الانتقال إلى السيرة الذاتية",
      "chrome.title": "ROOM.EXE <b>—</b> محمد&nbsp;نصر",
      "chrome.online": "متصل",
      "hud.music": "الموسيقى",
      "hud.sfx": "المؤثرات",
      "hud.secrets": "الأسرار",
      "state.on": "مفعّل",
      "state.off": "مغلق",
      "hint.move": "تحرّك",
      "hint.talk": "تحدّث وافحص",
      "loader.text": "جارٍ تحميل الشخصيات",
      "foot.copy": "© {year} محمد نصر",
      "foot.mid": "مبني بـ Canvas وJavaScript خالص · بلا مكتبات، بلا صور مكسورة",

      "aria.github": "فتح حساب جيت هاب",
      "aria.howto": "طريقة اللعب",
      "aria.fullscreen": "شاشة كاملة (F)",
      "aria.lang": "تغيير اللغة",
      "aria.audio": "إعدادات الصوت",
      "aria.music": "تشغيل/إيقاف الموسيقى",
      "aria.sfx": "تشغيل/إيقاف المؤثرات الصوتية",
      "aria.secrets": "ثمانية أسرار مخبّأة في هذه الغرفة",
      "aria.moveUp": "حرّك لأعلى",
      "aria.moveDown": "حرّك لأسفل",
      "aria.moveLeft": "حرّك لليسار",
      "aria.moveRight": "حرّك لليمين",
      "aria.interact": "تفاعل",

      "a11y.skip": "الانتقال إلى النسخة النصية",
      "a11y.textBack": "الرجوع إلى الغرفة التفاعلية",

      "tour.hello": "أهلاً — محمد هنا. هذه الغرفة كلها بورتفوليو خاصتي. تحب أتمشّى معك وأعرّفك عليها؟ الموضوع نصف دقيقة.",
      "tour.yes": "نعم، عرّفني على المكان",
      "tour.no": "لا، سأستكشف بنفسي",
      "tour.bubble": "!",
      "tour.next": "المحطة التالية",
      "tour.skip": "إنهاء الجولة",
      "tour.open": "افتح {name}",
      "tour.poke": "المس القطة",
      "tour.s1": "هاتان الشاشتان فيهما مشاريعي — كل ما أنجزته، الأحدث أولاً. المستودعات على جيت هاب فالقائمة تُحدَّث وحدها.",
      "tour.s2": "هذا رفّ الكتب، وهو في الحقيقة حقيبتي: TypeScript وNode أولاً، ثم NestJS وPrisma وPostgres في الخادم، وواجهات الويب في الرفّ الأعلى.",
      "tour.s3": "اللوحة على الحائط هي حسابي على جيت هاب. تسحب مستودعاتي الحقيقية وتوزيع اللغات، فتبقى محدّثة دائماً.",
      "tour.s4": "صندوق البريد فيه وسائل التواصل — البريد ولينكد إن وجيت هاب. بنقرة واحدة يُنسخ عنوان البريد.",
      "tour.s5": "وهنا الجزء الذي يفوت معظم الزوار: الغرفة تخفي ثمانية أسرار. هذه القطة أحدها — المسها خمس مرات وشاهد. وسرّ آخر يستجيب لأربعة حروف: hire... لكن هذا كل ما سأقوله.",
      "tour.s5poke": "أرأيت؟ إنها تخرخر. اذهب الآن — الباقي عليك أن تجده.",
      "tour.end": "هذه هي الجولة كاملة. تجوّل في أي مكان، واضغط E أو انقر على أي شيء يلمع، وEsc يغلق أي نافذة. استمتع بالغرفة!",
      "tour.done": "ابدأ الاستكشاف",
      "tour.seeSecrets": "أرني قائمة الأسرار",

      "choice.close": "إغلاق",
      "choice.back": "رجوع",

      "help.kicker": "بداية سريعة",
      "help.title": "طريقة اللعب",
      "help.move": "تجوّل في الغرفة. مفاتيح الأسهم تعمل أيضاً.",
      "help.talk": "تحدّث مع محمد أو افحص الأثاث الذي تواجهه.",
      "help.choose": "اختر موضوعاً للحوار. الأسهم + Enter تعمل أيضاً.",
      "help.esc": "أغلق أي نافذة أو محادثة.",
      "help.tap": "على الجوال، استخدم الأسهم وزر A. انقر الأجسام لتسير إليها.",
      "help.this": "هذه النافذة. أعد فتحها في أي وقت من الزاوية.",
      "help.secrets": "ثمانية أسرار مخبّأة في هذه الغرفة. شريحة الأسرار في الأعلى تحفظ العدّاد وتحمل التلميحات.",
      "help.note": "الغرفة والأثاث والشخصيات مرسومة على لوحة 384×224. الشخصيات من أوراق رسم يدوية. الصوت مُولّد بـ WebAudio.",

      "proj.kicker": "أعمال مختارة · مباشر من جيت هاب",
      "proj.title": "مشاريع أطلقتها",
      "proj.syncing": "جارٍ المزامنة...",
      "proj.refresh": "تحديث",
      "proj.allrepos": "كل المستودعات على جيت هاب ↗",
      "proj.live": "● مباشر",
      "proj.cached": "● من الذاكرة",
      "proj.offline": "● نسخة بلا اتصال",
      "proj.count": "{n} مشروع عام",
      "proj.empty": "لا توجد مستودعات عامة. جرّب التحديث.",
      "proj.nodesc": "لا يوجد وصف بعد.",
      "proj.code": "كود",

      "time.now": "الآن",
      "time.m": "منذ {n} دقيقة",
      "time.h": "منذ {n} ساعة",
      "time.d": "منذ {n} يوم",
      "time.mo": "منذ {n} شهر",
      "time.y": "منذ {n} سنة",

      "gh.kicker": "مبرمج موثّق · منذ 2022",
      "gh.stat.repos": "مستودعات",
      "gh.stat.focus": "التخصص",
      "gh.stat.base": "المقر",
      "gh.stat.focusV": "متكامل",
      "gh.stat.baseV": "الإسكندرية",
      "gh.everything": "كل شيء عام.",
      "gh.everythingDesc": "الكود والالتزامات والتجارب — بلا معروض خاص.",
      "gh.open": "فتح حساب جيت هاب ↗",
      "gh.loading": "جارٍ تحميل المستودعات...",

      "sk.kicker": "الحقيبة · العتاد المجهّز",
      "sk.title": "التقنيات والمهارات",
      "sk.items": "{n} عنصر",
      "sk.certs": "الشهادات",
      "sk.empty": "مكان فارغ",
      "sk.emptyHint": "أضف شهاداتك في <code>js/config.js</code>",
      "sk.note": "التقييم شخصي: متقدّم = استخدام يومي، متمكّن = عمل إنتاجي مُطلق، عملي = مرتاح فيه.",

      "ct.kicker": "البريد · على بُعد نقرة",
      "ct.open": "فتح ↗",
      "ct.copy": "نسخ",
      "ct.preferEmail": "تفضّل نموذجاً؟ البريد هو النموذج. اذكر المشروع والنطاق والجدول الزمني وسأرد خلال يوم.",
      "ct.githubRoute": "جيت هاب هو وسيلة التواصل الحالية. أضف بريداً في js/config.js ليظهر هنا.",

      "rs.toolbar": "سيرة ذاتية قياسية · A4 · جاهزة للطباعة",
      "rs.print": "طباعة / حفظ PDF",
      "rs.download": "تحميل السيرة الذاتية (PDF)",
      "rs.newtab": "فتح في تبويب جديد",
      "rs.summary": "الملخّص",
      "rs.experience": "الخبرة",
      "rs.projects": "مشاريع مختارة",
      "rs.skills": "المهارات التقنية",
      "rs.education": "التعليم والتدريب",
      "rs.certs": "الشهادات",
      "rs.certsFallback": "البورتفوليو والكود والمراجع متاحة عند الطلب.",
      "rs.updated": "آخر تحديث {date}",

      "sec.undiscovered": "لم يُكتشف",
      "sec.note": "التقدّم محفوظ في هذا المتصفح فقط.",
      "sec.complete": "مكتمل 100%",
      "sec.percent": "تم العثور على {n} بالمئة",
      "sec.badge": "الأسرار المكتشفة: {n} من {total}. يفتح نافذة الأسرار.",
      "sec.toast": "★ سر {n}/{total} — {name}",
      "sec.toastAll": "★★ تم العثور على كل الأسرار — المستوى 100 ★★",
      "sec.purr": "*خرخرة*  ({n}/5)",
      "sec.consoleTitle": "فتحت الـ console. احترام.",
      "sec.consoleBody": "{n} أسرار مخبّأة في هذه الغرفة — افتح شريحة الأسرار في الواجهة للتلميحات.",
      "sec.found": "{n} / {total} مكتشَف",

      "toast.copied": "تم النسخ",
      "toast.copyfail": "تعذّر النسخ — حدّد يدوياً",
      "toast.email": "تم نسخ البريد — {email}",
      "toast.musicOn": "الموسيقى الثمانية تعمل",
      "toast.musicOff": "الموسيقى صامتة",
      "toast.sfxOn": "المؤثرات الصوتية تعمل",
      "toast.sfxOff": "المؤثرات الصوتية صامتة",
      "toast.artFail": "تعذّر تحميل رسوم الشخصيات.",
      "toast.lightsOn": "أُضيء المصباح.",
      "toast.lightsOff": "أُطفئ الضوء — الشاشات تكفي.",
      "toast.wish": "تمنّيت أمنية على شهاب.",
      "toast.walkCloser": "اقترب من جسم أولاً.",
      "toast.savePdf": "في نافذة الطباعة اختر «حفظ كـ PDF» كوجهة.",
      "toast.textMode": "النسخة النصية. الغرفة ما زالت موجودة.",
    },
  };

  /* ---------------------------------------------------------------- */
  function t(key, vars) {
    var table = DICT[lang] || DICT.en;
    var s = table[key];
    if (s === undefined) s = DICT.en[key];
    if (s === undefined) return key;
    if (vars) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] !== undefined ? vars[name] : m;
      });
    }
    return s;
  }

  function byLang(l) { return l === "ar" ? "ar" : "en"; }
  function current() { return lang; }
  function other() { return lang === "ar" ? "en" : "ar"; }
  function isRTL() { return lang === "ar"; }

  /* Look up a value in a specific language's content (config), with the
     English content as the fallback for keys an Arabic author left out. */
  function content(l) {
    if (byLang(l) === "ar") return arContent();
    return BASE;
  }

  /* ---------------------------------------------------------------- */
  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](lang); } catch (e) { /* a bad listener never breaks a switch */ }
    }
  }

  /* Translate any [data-i18n] / [data-i18n-aria] node in the document. */
  function localizeDom(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-i18n]");
    Array.prototype.forEach.call(nodes, function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    var aria = scope.querySelectorAll("[data-i18n-aria]");
    Array.prototype.forEach.call(aria, function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    var title = scope.querySelectorAll("[data-i18n-title]");
    Array.prototype.forEach.call(title, function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
  }

  function setLang(next, opts) {
    lang = byLang(next);
    applyContent();
    var el = document.documentElement;
    el.setAttribute("lang", lang);
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    if (document.body) document.body.classList.toggle("lang-ar", lang === "ar");
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
    if (!opts || !opts.silent) emit();
  }

  function toggle() { setLang(lang === "ar" ? "en" : "ar"); }

  function onChange(fn) { if (typeof fn === "function") listeners.push(fn); }

  function init() {
    var saved = "en";
    try { saved = localStorage.getItem(KEY) || "en"; } catch (e) {}
    setLang(saved, { silent: true });
  }

  /* Apply the remembered language as early as possible (scripts sit at the
     end of <body>, so the shell markup already exists) to avoid an English
     flash when an Arabic visitor returns. */
  init();
  if (document.body) document.body.classList.toggle("lang-ar", lang === "ar");
  localizeDom();

  return {
    init: init,
    setLang: setLang,
    toggle: toggle,
    lang: current,
    other: other,
    isRTL: isRTL,
    t: t,
    dict: DICT,
    content: content,
    localizeDom: localizeDom,
    onChange: onChange,
    LANGS: LANGS,
  };
})();
