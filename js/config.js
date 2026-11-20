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
    // Add your real address here; no placeholder email is shown publicly.
    email: "",
    github: "https://github.com/MohammedDev69",
    // Leave a link empty ("") and the UI will simply hide it — no dead links.
    linkedin: "",
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
        labelAr: "خلفيتي وخبرتي",
        answer:
          "Self-taught full-stack developer since 2022, based in Alexandria, Egypt. I design and ship complete products: Next.js + NestJS storefronts, realtime dashboards on Supabase, and production Discord bots in Node and Python.\n\nI care about clean architecture, good developer experience, and things that actually ship.",
        action: { label: "VIEW FULL TIMELINE", type: "modal", value: "resume" },
      },
      {
        id: "projects",
        label: "Show me your Projects!",
        labelAr: "معرض أعمالي",
        answer:
          "Everything public lives on GitHub — 9 repositories: a full digital-goods store, a visual desktop automation tool, OCR-powered verification bots and more. Opening the live feed now.",
        action: { label: "OPEN PROJECTS", type: "modal", value: "projects" },
      },
      {
        id: "stack",
        label: "My Tech Stack",
        labelAr: "مهاراتي البرمجية",
        answer:
          "TypeScript and JavaScript first, Python for automation. Frontend: Next.js, React, Tailwind. Backend: NestJS, Node, Prisma, PostgreSQL, Supabase. Bots: discord.js, discord.py. Tooling: Docker, GitHub Actions, Playwright. Always learning.",
        action: { label: "OPEN SKILLS", type: "modal", value: "skills" },
      },
      {
        id: "contact",
        label: "How to Contact you?",
        labelAr: "تواصل معي",
        answer:
          "Ping me on GitHub. Add your email and social links to js/config.js if you prefer to be contacted elsewhere." ,
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
      { id: "github", label: "GitHub", value: "@MohammedDev69", url: "https://github.com/MohammedDev69" },
      { id: "location", label: "Based in", value: "Alexandria, Egypt", url: "" },
    ],
  },

  /* ------------------------------------------------------------------ */
  resume: {
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
    npcPortrait: "assets/mohamed-portrait.png",
    targetHeight: 40,
    smoothing: false,  // true = soft (painted sheets), false = crisp pixels
    keyBlack: "auto",  // "auto" | "never": remove an opaque black background
    keyThreshold: 30,  // raise only if the sheet background is not pure black
    swapLeftRight: false, // true if walking left shows the character facing right
    rowOrder: ["down", "left", "right", "up"], // sheet rows, top to bottom
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
};
