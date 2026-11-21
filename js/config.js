/* ============================================================================
   PORTFOLIO CONFIG  —  edit this file to update the whole site.
   Everything the room, dialogue, modals and resume show lives here.
   ========================================================================== */

window.PORTFOLIO = {
  /* ------------------------------------------------------------------ */
  profile: {
    name: "Mohamed Nasr",
    alias: "Tronex",
    handle: "MohammedDev69",
    role: "Full-Stack Developer",
    tagline: "I build web apps, realtime platforms & Discord bots.",
    location: "Alexandria, Egypt",
    timezone: "Africa/Cairo",
    availability: "Open to work — remote & on-site",
    email: "mohammed1.nasr.elshreef@gmail.com",
    github: "https://github.com/MohammedDev69",
    // Leave a link empty ("") and the UI will simply hide it — no dead links.
    linkedin: "https://www.linkedin.com/in/mohamed-elshreef-dev/",
    twitter: "",
    discord: "",
    website: "",
  },

  /* ------------------------------------------------------------------ */
  npc: {
    name: "Mohamed Nasr",
    title: "Full-Stack Developer",
    level: "99",
  },

  /* ------------------------------------------------------------------ */
  dialogue: {
    greeting:
      "Welcome to my interactive portfolio! I'm a developer. What would you like to know about me?",
    idle:
      "Still here? Take your time — the coffee is fresh. Pick a topic, or just walk around the room.",
    choices: [
      {
        id: "experience",
        label: "Experience & Career",
        answer:
          "Self-taught full-stack developer since 2022, based in Alexandria, Egypt. I design and ship complete products: Next.js + NestJS storefronts, realtime dashboards on Supabase, and production Discord bots in Node and Python.\n\nI care about clean architecture, good developer experience, and things that actually ship.",
        action: { label: "VIEW FULL TIMELINE", type: "modal", value: "resume" },
      },
      {
        id: "projects",
        label: "Show me your Projects!",
        answer:
          "Everything public lives on GitHub — 9 repositories: a full digital-goods store, a visual desktop automation tool, OCR-powered verification bots and more. Opening the live feed now.",
        action: { label: "OPEN PROJECTS", type: "modal", value: "projects" },
      },
      {
        id: "stack",
        label: "My Tech Stack",
        answer:
          "TypeScript and JavaScript first, Python for automation. Frontend: Next.js, React, Tailwind. Backend: NestJS, Node, Prisma, PostgreSQL, Supabase. Bots: discord.js, discord.py. Tooling: Docker, GitHub Actions, Playwright. Always learning.",
        action: { label: "OPEN SKILLS", type: "modal", value: "skills" },
      },
      {
        id: "contact",
        label: "How to Contact you?",
        answer:
          "Email is the fastest route — the address is in the contact window and one click copies it. LinkedIn works too, and GitHub is always open.",
        action: { label: "OPEN CONTACT", type: "modal", value: "contact" },
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  experience: [
    {
      role: "Freelance Full-Stack Developer",
      company: "Independent / Remote",
      period: "2023 — Present",
      location: "Alexandria, Egypt",
      summary:
        "End-to-end product work: architecture, typed APIs, frontend, deployment and maintenance.",
      bullets: [
        "Built gamers-matrix, a digital-goods storefront (Next.js + NestJS + Prisma + Paymob) inside a Turborepo monorepo.",
        "Shipped auth, role-based access and realtime dashboards on Supabase/PostgreSQL.",
        "Automated operations with Python tooling, OCR pipelines and GitHub Actions workflows.",
      ],
      stack: ["Next.js", "NestJS", "TypeScript", "Prisma", "Supabase"],
    },
    {
      role: "Discord Bot Developer & Automation",
      company: "Independent",
      period: "2022 — 2024",
      location: "Remote",
      summary:
        "Production bots for verification, moderation, ticketing and payment flows.",
      bullets: [
        "Built discord-yt-sub-verifier: screenshot subscription checks via OpenCV + Tesseract inside a Dockerised bot.",
        "Shipped keyword obfuscation, automod with persistent warnings, tickets and self-roles.",
        "Operated a multi-bot manager with full slash-command and prefix-command parity.",
      ],
      stack: ["discord.js", "discord.py", "Docker", "OpenCV", "Node.js"],
    },
  ],

  education: [
    {
      title: "Self-Taught Full-Stack Engineering",
      org: "Continuous, project-based learning",
      period: "2022 — Present",
      detail:
        "TypeScript, Node.js, React/Next.js, NestJS, PostgreSQL, cloud deployment and CI/CD — learned by shipping real products.",
    },
  ],

  /* Certifications are optional: add { name, issuer, year, url } entries and
     the bookshelf window will render them automatically. */
  certifications: [],

  /* ------------------------------------------------------------------ */
  /* Fallback projects — used if the GitHub API is rate-limited/offline.  */
  projects: [
    {
      name: "gamers-matrix",
      description:
        "Digital goods store for game keys and top-ups, with checkout, admin tooling and Paymob payments.",
      language: "TypeScript",
      stars: 0,
      forks: 1,
      topics: ["nextjs", "nestjs", "prisma", "supabase", "ecommerce"],
      url: "https://github.com/MohammedDev69/gamers-matrix",
    },
    {
      name: "flowmatic",
      description:
        "Visual desktop automation with drag-and-drop workflows and global hotkeys. Python + PySide6.",
      language: "Python",
      stars: 0,
      forks: 0,
      topics: ["automation", "pyside6", "python", "qt6", "no-code"],
      url: "https://github.com/MohammedDev69/flowmatic",
    },
    {
      name: "discord-yt-sub-verifier",
      description:
        "Production Discord bot that verifies YouTube subscriptions from screenshots using OCR.",
      language: "Python",
      stars: 0,
      forks: 0,
      topics: ["discord-py", "ocr", "opencv", "docker"],
      url: "https://github.com/MohammedDev69/discord-yt-sub-verifier",
    },
    {
      name: "opencode-apikeys",
      description:
        "Zero-dependency Node CLI that stores multiple API keys per OpenCode provider and switches the active one.",
      language: "JavaScript",
      stars: 0,
      forks: 0,
      topics: ["cli", "nodejs", "developer-tools", "api-keys"],
      url: "https://github.com/MohammedDev69/opencode-apikeys",
    },
    {
      name: "discord-word-obfuscator",
      description:
        "Keyword obfuscation, automod with persistent warnings, order tickets and self-roles.",
      language: "JavaScript",
      stars: 0,
      forks: 0,
      topics: ["discord-js", "automod", "nodejs"],
      url: "https://github.com/MohammedDev69/discord-word-obfuscator",
    },
    {
      name: "spin-wheel-bot",
      description:
        "Discord bot with an animated canvas spin-wheel prize system driven by slash commands.",
      language: "JavaScript",
      stars: 0,
      forks: 0,
      topics: ["discord-bot", "canvas", "nodejs"],
      url: "https://github.com/MohammedDev69/spin-wheel-bot",
    },
    {
      name: "active-developer-badge-bot",
      description:
        "Automated Discord service for the Active Developer Badge: multi-bot manager, tickets and payments.",
      language: "JavaScript",
      stars: 0,
      forks: 0,
      topics: ["discord", "discord-js", "nodejs"],
      url: "https://github.com/MohammedDev69/active-developer-badge-bot",
    },
    {
      name: "actions-rdp",
      description:
        "Ephemeral Windows RDP sessions on GitHub Actions runners with Tailscale remote access.",
      language: "PowerShell",
      stars: 0,
      forks: 0,
      topics: ["github-actions", "rdp", "tailscale", "windows"],
      url: "https://github.com/MohammedDev69/actions-rdp",
    },
  ],

  /* ------------------------------------------------------------------ */
  techStack: [
    {
      group: "Languages",
      items: [
        { name: "TypeScript", level: 5 },
        { name: "JavaScript", level: 5 },
        { name: "Python", level: 4 },
        { name: "SQL", level: 4 },
        { name: "HTML / CSS", level: 5 },
      ],
    },
    {
      group: "Frontend",
      items: [
        { name: "React", level: 5 },
        { name: "Next.js", level: 5 },
        { name: "Tailwind CSS", level: 5 },
        { name: "Radix / shadcn", level: 4 },
      ],
    },
    {
      group: "Backend",
      items: [
        { name: "Node.js", level: 5 },
        { name: "NestJS", level: 4 },
        { name: "Express", level: 4 },
        { name: "Prisma", level: 4 },
        { name: "REST / WebSockets", level: 4 },
      ],
    },
    {
      group: "Data & Cloud",
      items: [
        { name: "PostgreSQL", level: 4 },
        { name: "Supabase", level: 4 },
        { name: "Neon", level: 3 },
        { name: "Vercel", level: 4 },
      ],
    },
    {
      group: "Bots & Automation",
      items: [
        { name: "discord.js", level: 5 },
        { name: "discord.py", level: 4 },
        { name: "Playwright", level: 4 },
        { name: "OpenCV / Tesseract", level: 4 },
        { name: "PySide6 / Qt", level: 3 },
      ],
    },
    {
      group: "DevOps & Tools",
      items: [
        { name: "Git / GitHub", level: 5 },
        { name: "GitHub Actions", level: 4 },
        { name: "Docker", level: 4 },
        { name: "Linux / Bash", level: 4 },
        { name: "PowerShell", level: 4 },
      ],
    },
  ],

  skillLabels: { 5: "Advanced", 4: "Proficient", 3: "Working", 2: "Learning", 1: "Exploring" },

  /* ------------------------------------------------------------------ */
  contact: {
    heading: "Let's build something.",
    blurb:
      "I'm available for full-stack product work, Discord bots and automation. Tell me what you're making — I'll reply within a day.",
    links: [
      { id: "email", label: "Email", value: "mohammed1.nasr.elshreef@gmail.com", url: "mailto:mohammed1.nasr.elshreef@gmail.com" },
      { id: "linkedin", label: "LinkedIn", value: "in/mohamed-elshreef-dev", url: "https://www.linkedin.com/in/mohamed-elshreef-dev/" },
      { id: "github", label: "GitHub", value: "@MohammedDev69", url: "https://github.com/MohammedDev69" },
      { id: "location", label: "Based in", value: "Alexandria, Egypt", url: "" },
    ],
  },

  /* ------------------------------------------------------------------ */
  resume: {
    // Optional: point this at a pre-rendered PDF (e.g. "assets/cv.pdf") and the
    // resume window offers a real download instead of the print dialog.
    pdf: "",
    summary:
      "Full-stack developer building production web platforms and automation. I ship complete products — typed APIs, realtime data, polished interfaces and CI/CD — and I care about code that stays maintainable after launch.",
    highlights: [
      "5+ years shipping TypeScript / JavaScript and Python projects",
      "End-to-end ownership: schema, API, UI, deployment",
      "Production Discord bots and OCR/automation pipelines",
    ],
    projects: [
      {
        name: "gamers-matrix",
        stack: "Next.js · NestJS · Prisma · Supabase · Paymob",
        description:
          "Digital-goods e-commerce platform with checkout, order management and an admin dashboard inside a Turborepo monorepo.",
      },
      {
        name: "flowmatic",
        stack: "Python · PySide6 · Qt6",
        description:
          "Visual desktop automation builder: drag-and-drop workflow graph, global hotkeys and a local runner.",
      },
      {
        name: "discord-yt-sub-verifier",
        stack: "Python · discord.py · OpenCV · Tesseract · Docker",
        description:
          "Subscription verification bot that reads screenshots with OCR and grants roles automatically.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Character sheets. Drop the generated PNGs at these paths and they are
     sliced automatically into 4 rows x 4 frames. Missing files fall back
     to the built-in procedural characters. */
  sprites: {
    npcSheet: "assets/mohamed-spritesheet.png",
    playerSheet: "assets/visitor-spritesheet.png",
    npcPortrait: null, // optional square portrait PNG; null = crop Mohamed's front frame
    targetHeight: 40,
    smoothing: false,  // true = soft (painted sheets), false = crisp pixels
    keyBlack: "auto",  // "auto" | "never": remove an opaque black background
    keyThreshold: 30,  // raise only if the sheet background is not pure black
    swapLeftRight: false, // true if walking left shows the character facing right
    rowOrder: ["down", "left", "right", "up"], // sheet rows, top to bottom
  },

  /* ------------------------------------------------------------------ */
  /* Easter eggs. Seven things happen in this room if you poke at it.
     `hint` is what the SECRETS window shows while the egg is still locked. */
  secrets: {
    banner: "Seven things in this room do something extra. No trophy for finding them — only bragging rights.",
    finale: "Every secret found. Mohamed is now LV.100 and the room knows it.",
    entries: [
      {
        id: "konami",
        name: "DEV MODE",
        hint: "An old cheat code still works here: up, up, down, down, left, right, left, right, B, A.",
      },
      {
        id: "cat",
        name: "CAT PERSON",
        hint: "The cat is asleep. Insist — five times.",
      },
      {
        id: "lamp",
        name: "NIGHT OWL",
        hint: "The desk lamp has a switch. Walk up to it and press E.",
      },
      {
        id: "hire",
        name: "RECRUITER DETECTED",
        hint: "Type the four letters every developer wants to read.",
      },
      {
        id: "idle",
        name: "STILL HERE?",
        hint: "Stop moving for half a minute and watch yourself.",
      },
      {
        id: "octocat",
        name: "OCTOCAT",
        hint: "Poke the avatar in the header until it gives in.",
      },
      {
        id: "marathon",
        name: "MARATHON",
        hint: "Walk 2000 pixels. Yes, it is a lot of steps.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  github: {
    username: "MohammedDev69",
    profileUrl: "https://github.com/MohammedDev69",
    reposUrl: "https://api.github.com/users/MohammedDev69/repos?per_page=100&sort=updated",
    cacheKey: "mn_portfolio_repos_v1",
    cacheTtl: 10 * 60 * 1000,
    maxProjects: 8,
  },

  /* ------------------------------------------------------------------ */
  /* Arabic content — mirrored onto the English content above by js/i18n.js
     when the visitor switches language. English stays the default and the
     source of truth; anything you leave out here simply stays English.
     UI chrome strings (buttons, HUD, window headings) live in js/i18n.js. */
  i18n: {
    ar: {
      profile: {
        name: "محمد نصر",
        role: "مبرمج متكامل (Full-Stack)",
        tagline: "أبني تطبيقات الويب والمنصّات اللحظية وبوتات ديسكورد.",
        location: "الإسكندرية، مصر",
        availability: "متاح للعمل — عن بُعد أو من المكتب",
      },

      dialogue: {
        greeting:
          "أهلاً بك في البورتفوليو التفاعلي! أنا مبرمج متكامل. ما الذي تودّ معرفته عنّي؟",
        idle:
          "ما زلت هنا؟ خُذ وقتك — القهوة طازجة. اختر موضوعاً، أو تجوّل في الغرفة.",
        choices: [
          {
            id: "experience",
            label: "خبرتي ومسيرتي المهنية",
            answer:
              "مبرمج متكامل تعلّمت ذاتياً منذ 2022، مقيم في الإسكندرية بمصر. أصمّم وأُطلق منتجات كاملة: متاجر Next.js + NestJS، ولوحات لحظية على Supabase، وبوتات ديسكورد إنتاجية بلغات Node وPython.\n\nأهتم بالمعمارية النظيفة، وتجربة المطوّر الجيدة، وبالأشياء التي تُطلَق فعلاً.",
            action: { label: "عرض المسيرة الكاملة", type: "modal", value: "resume" },
          },
          {
            id: "projects",
            label: "أرِني مشاريعك!",
            answer:
              "كل ما هو عام موجود على جيت هاب — 9 مستودعات: متجر منتجات رقمية كامل، أداة أتمتة مكتبية مرئية، بوتات تحقّق بتقنية OCR وغيرها. أفتح التغذية المباشرة الآن.",
            action: { label: "فتح المشاريع", type: "modal", value: "projects" },
          },
          {
            id: "stack",
            label: "تقنياتي",
            answer:
              "TypeScript وJavaScript أولاً، وPython للأتمتة. الواجهة: Next.js وReact وTailwind. الخادم: NestJS وNode وPrisma وPostgreSQL وSupabase. البوتات: discord.js وdiscord.py. الأدوات: Docker وGitHub Actions وPlaywright. أتعلّم دائماً.",
            action: { label: "فتح المهارات", type: "modal", value: "skills" },
          },
          {
            id: "contact",
            label: "كيف أتواصل معك؟",
            answer:
              "البريد الإلكتروني أسرع وسيلة — العنوان في نافذة التواصل وبنقرة واحدة يُنسخ. لينكد إن متاح أيضاً، وجيت هاب مفتوح دائماً.",
            action: { label: "فتح التواصل", type: "modal", value: "contact" },
          },
        ],
      },

      experience: [
        {
          role: "مطوّر متكامل مستقل",
          company: "مستقل / عن بُعد",
          period: "2023 — حتى الآن",
          location: "الإسكندرية، مصر",
          summary:
            "عمل متكامل على المنتج: المعمارية، واجهات برمجية مُنمّطة، الواجهة الأمامية، النشر والصيانة.",
          bullets: [
            "بنيت gamers-matrix، متجر منتجات رقمية (Next.js + NestJS + Prisma + Paymob) داخل monorepo بـ Turborepo.",
            "أطلقت المصادقة وإدارة الصلاحيات ولوحات لحظية على Supabase/PostgreSQL.",
            "أتمتت العمليات بأدوات Python وخطوط معالجة OCR وسير عمل GitHub Actions.",
          ],
        },
        {
          role: "مطوّر بوتات ديسكورد وأتمتة",
          company: "مستقل",
          period: "2022 — 2024",
          location: "عن بُعد",
          summary: "بوتات إنتاجية للتحقّق والإشراف والتذاكر وتدفّقات الدفع.",
          bullets: [
            "بنيت discord-yt-sub-verifier: فحص اشتراكات عبر لقطات الشاشة بـ OpenCV + Tesseract داخل بوت يعمل في Docker.",
            "أطلقت إخفاء الكلمات المفتاحية وإشرافاً تلقائياً بتحذيرات دائمة وتذاكر وأدوار ذاتية.",
            "أدرت مدير بوتات متعدد بتكافؤ كامل بين أوامر الشرطة المائلة وأوامر البادئة.",
          ],
        },
      ],

      education: [
        {
          title: "هندسة متكاملة ذاتية التعلّم",
          org: "تعلّم مستمر قائم على المشاريع",
          period: "2022 — حتى الآن",
          detail:
            "TypeScript وNode.js وReact/Next.js وNestJS وPostgreSQL والنشر السحابي وCI/CD — عبر إطلاق منتجات حقيقية.",
        },
      ],

      projects: [
        { name: "gamers-matrix", description: "متجر منتجات رقمية لمفاتيح الألعاب وشحنها، مع الدفع وإدارة الطلبات ولوحة تحكّم، ومدفوعات Paymob." },
        { name: "flowmatic", description: "أتمتة مكتبية مرئية بسحب وإفلات لسير العمل ومفاتيح اختصار عامة. Python + PySide6." },
        { name: "discord-yt-sub-verifier", description: "بوت ديسكورد إنتاجي يتحقّق من اشتراكات يوتيوب عبر لقطات الشاشة باستخدام OCR." },
        { name: "opencode-apikeys", description: "أداة سطر أوامر Node بلا اعتماديات تخزّن مفاتيح API متعددة لكل مزوّد في OpenCode وتُبدّل بينها." },
        { name: "discord-word-obfuscator", description: "إخفاء الكلمات المفتاحية وإشراف تلقائي بتحذيرات دائمة وتذاكر طلبات وأدوار ذاتية." },
        { name: "spin-wheel-bot", description: "بوت ديسكورد بعجلة جوائز متحركة على Canvas تُدار بأوامر الشرطة المائلة." },
        { name: "active-developer-badge-bot", description: "خدمة ديسكورد آلية لشارة المطوّر النشط: مدير بوتات متعدد وتذاكر ومدفوعات." },
        { name: "actions-rdp", description: "جلسات RDP ويندوز مؤقتة على مشغّلات GitHub Actions مع وصول عن بُعد عبر Tailscale." },
      ],

      techStack: [
        { group: "اللغات" },
        { group: "الواجهة الأمامية" },
        { group: "الخادم" },
        { group: "البيانات والسحابة" },
        { group: "البوتات والأتمتة" },
        { group: "DevOps والأدوات" },
      ],

      skillLabels: { 5: "متقدّم", 4: "متمكّن", 3: "عملي", 2: "يتعلّم", 1: "يستكشف" },

      contact: {
        heading: "لنبنِ شيئاً معاً.",
        blurb:
          "متاح للعمل على منتجات متكاملة، وبوتات ديسكورد، والأتمتة. أخبرني بما تبنيه — سأرد خلال يوم.",
        links: [
          { id: "email", label: "البريد الإلكتروني" },
          { id: "linkedin", label: "لينكد إن" },
          { id: "github", label: "جيت هاب" },
          { id: "location", label: "المقر", value: "الإسكندرية، مصر" },
        ],
      },

      resume: {
        summary:
          "مبرمج متكامل يبني منصّات ويب إنتاجية وأتمتة. أُطلق منتجات كاملة — واجهات برمجية مُنمّطة، بيانات لحظية، واجهات مصقولة وCI/CD — وأهتم بكود يبقى قابلاً للصيانة بعد الإطلاق.",
        highlights: [
          "خبرة تتجاوز 5 سنوات في إطلاق مشاريع TypeScript/JavaScript وPython",
          "ملكية شاملة من البداية للنهاية: قاعدة البيانات، الـ API، الواجهة، النشر",
          "بوتات ديسكورد إنتاجية وخطوط OCR وأتمتة",
        ],
        projects: [
          {
            name: "gamers-matrix",
            description:
              "منصّة تجارة إلكترونية للمنتجات الرقمية مع الدفع وإدارة الطلبات ولوحة تحكّم داخل monorepo بـ Turborepo.",
          },
          {
            name: "flowmatic",
            description:
              "أداة بناء أتمتة مكتبية مرئية: رسم سير عمل بالسحب والإفلات، ومفاتيح اختصار عامة، ومشغّل محلي.",
          },
          {
            name: "discord-yt-sub-verifier",
            description:
              "بوت تحقّق من الاشتراكات يقرأ لقطات الشاشة بـ OCR ويمنح الأدوار تلقائياً.",
          },
        ],
      },

      secrets: {
        banner: "سبعة أشياء في هذه الغرفة تفعل شيئاً إضافياً. لا كأس للفائز — فقط حق الافتخار.",
        finale: "وجدت كل الأسرار. محمد الآن بالمستوى 100 والغرفة تعرف ذلك.",
        entries: [
          { id: "konami", name: "وضع المطوّر", hint: "لا تزال شيفرة قديمة تعمل هنا: أعلى، أعلى، أسفل، أسفل، يسار، يمين، يسار، يمين، B، A." },
          { id: "cat", name: "عاشق القطط", hint: "القطة نائمة. ألحّ عليها — خمس مرات." },
          { id: "lamp", name: "بومة الليل", hint: "لمصباح المكتب مفتاح. اقترب منه واضغط E." },
          { id: "hire", name: "اكتُشف المُوظِّف", hint: "اكتب بالحروف اللاتينية الكلمة التي يتمنّى كل مبرمج سماعها: hire." },
          { id: "idle", name: "ما زلت هنا؟", hint: "توقّف عن الحركة نصف دقيقة وراقب نفسك." },
          { id: "octocat", name: "الأوكتوكات", hint: "انقر على الصورة في الترويسة حتى تستسلم." },
          { id: "marathon", name: "الماراثون", hint: "امشِ 2000 بكسل. نعم، خطوات كثيرة." },
        ],
      },
    },
  },
};
