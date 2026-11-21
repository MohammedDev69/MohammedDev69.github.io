# Mohamed Nasr — Interactive Pixel Portfolio

A playable 2D pixel-art developer room built with HTML5 Canvas, CSS and vanilla
JavaScript. No frameworks, no sprite downloads required, no broken images.

Walk around the room as a visitor, talk to Mohamed Nasr, and open the portfolio
through the furniture: the dual-monitor rig shows projects, the wall board opens
GitHub, the bookshelf lists skills, and the mailbox holds contact details. A
"Skip to Classic Resume" button in the corner opens a clean, printable CV.

**Live:** https://mohammeddev69.github.io/

## Run it

Any static server works, or just open `index.html`:

```bash
python -m http.server 5173
# then visit http://127.0.0.1:5173/
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | `WASD` / arrow keys | D-pad in the bar below the room |
| Talk / inspect | `E`, `Space`, `Enter` | big `A` button or tap the object |
| Pick a dialogue topic | `1`–`4`, arrows + `Enter` | tap a choice |
| Close a window | `Esc` | tap the ✕ or the backdrop |
| Guided tour | tap a button in Mohamed's greeting, `Esc` to leave | same |
| Full screen | `F` | the ⤢ chip in the top-right HUD |

Clicking or tapping any object walks the visitor over to it and interacts when
he arrives, routing around the furniture rather than grinding into it.

Full screen (`F` or the ⤢ chip) drops the header and footer, grows the room to
the whole viewport and asks the browser for native full screen when it allows
it; leaving native full screen (or pressing `F` again) restores the page.

## Files

```
index.html          markup: shell, dialogue box, window host, HUD, text version
manifest.webmanifest PWA metadata (installable, themed)
robots.txt          crawler policy + sitemap pointer
sitemap.xml         the two indexable URLs
css/style.css       arcade cabinet shell, windows, dialogue, resume, print
js/config.js        ALL content: profile, dialogue, projects, skills, resume
js/i18n.js          language switch (English default, Arabic) + UI strings
js/pixel-font.js    5x7 bitmap font drawn with fillRect
js/sprites.js       procedural pixel characters + PNG sprite-sheet importer
js/room.js          baked room art, furniture, lighting, particles
js/ui.js            dialogue, windows (projects/skills/contact/resume), toasts
js/game.js          loop, movement, collision, interactions, rendering order
js/secrets.js       the eight easter eggs: triggers, progress, SECRETS window
js/audio.js         WebAudio chiptune loop and sound effects
js/onboarding.js    text-mode switch + the arrival greeting and guided tour
assets/             sprite sheets + generated icons and OG cover
tools/sprite-lab.html  dev-only sheet preview: slices, walk cycle, portrait
tools/make-assets.ps1  regenerates og-cover.png and the app icons
```

## Customise

Everything the site says lives in `js/config.js`:

- `profile` — name, role, location, availability, email and links
- `dialogue` — greeting, the four questions and their answers, per question
  `action` opens a window when the answer finishes typing
- `experience`, `education`, `certifications` — the resume timeline
- `projects` — offline fallback shown if the GitHub API is rate-limited
- `techStack` + `skillLabels` — the bookshelf inventory meters
- `contact` — mailbox rows
- `resume` — summary, highlights and selected projects
- `sprites` — character sheet paths and import options
- `secrets` — the eight easter eggs: their names and the hints shown while locked

Projects are fetched live from
`https://api.github.com/users/MohammedDev69/repos` and cached in
`localStorage` for ten minutes. If the request fails, the window falls back to
the `projects` list in the config and labels itself "OFFLINE COPY".

## Languages

English is the default. The **EN / ع** switch in the top-right corner swaps the
whole site to Arabic and back, and the choice is remembered in `localStorage`.

- UI chrome strings (buttons, HUD, window headings, toasts, help) live in the
  `DICT` object in `js/i18n.js`.
- Content translations live under `i18n.ar` in `js/config.js`, mirroring the
  English content above it. Anything left out simply stays English.
- Arabic sets the document to `dir="rtl"`; the layout uses logical CSS
  (`margin-inline`, `text-align: start`, `inset-inline-end`, …) so it mirrors
  cleanly without a second stylesheet.
- The 5x7 canvas font is ASCII-only, so the in-room prompts stay English in
  both languages — everything rendered as HTML is fully translated.

To add another language: add its dictionary to `DICT` (in `js/i18n.js`), its
content to `config.i18n`, its code to the `LANGS` list, and a button to the
`.lang-toggle` group in `index.html`.

## Character art

The two characters come from the hand-drawn sprite sheets in `assets/`:

| File | Role |
| --- | --- |
| `assets/mohamed-spritesheet.png` | Mohamed, standing by the desk |
| `assets/visitor-spritesheet.png` | The playable visitor |

They are the characters, not an optional skin: `js/sprites.js` contains no
procedural figure art at all, so there is nothing crude to fall back to.
`assets/README.md` documents the exact 4x4 grid the loader expects, and
`sprites.swapLeftRight` / `sprites.rowOrder` in `js/config.js` fix a sheet whose
side views or row order came out differently without touching the art.
`tools/sprite-lab.html` previews a sheet's slices, walk cycle and portrait.

Mohamed's dialogue portrait is cropped from the top of his front frame (or from
an optional square PNG if `sprites.npcPortrait` is set).

The room stays behind a short boot screen until the sheets resolve, so the
figures never visibly swap in. If one sheet fails it is retried once with a
cache buster, then the other sheet covers both roles; if neither loads the room
still runs, just without the two figures. The site can never get stuck loading.

## Easter eggs

Eight secrets are hidden in the room and tracked by the SECRETS chip in the
top-left HUD. Progress is stored in `localStorage`, and the chip opens a window
that lists what is still missing with a hint for each.

| Secret | Trigger | Reward |
| --- | --- | --- |
| PIXEL PARTY | Konami code: ↑↑↓↓←→←→BA | Confetti across the room, the lamp comes on and both characters cheer |
| CAT PERSON | Pet the sleeping cat five times | The cat wakes up and follows you around |
| NIGHT OWL | Switch the desk lamp off | The room goes dark, lit only by the lamp and the monitors |
| RECRUITER DETECTED | Type `hire` | Hearts, and a very obvious hint |
| STILL HERE? | Stand still for 30 seconds | The visitor yawns |
| OCTOCAT | Poke the header avatar seven times | An octocat moves in next to the desk |
| MARATHON | Walk 2000 pixels | A permanent speed boost |
| SHOOTING STAR | Walk to the window and press E | A star streaks across the night sky in the glass |

Find all eight and the room calls Mohamed LV.100, which the dialogue window
picks up. Triggers, names and hints all live in the `secrets` block of
`js/config.js`; the logic is in `js/secrets.js` and the rewards in
`js/game.js` (`onSecret`).

## Responsive

The room sizes itself from the viewport and the space the chrome needs, so it
fills a phone in portrait without ever overflowing.

- On a coarse pointer (`matchMedia("(pointer: coarse)")`, mirrored as
  `body.is-touch`) a thumb bar appears under the cabinet: a 4-way pad on one
  side and a large interact button on the other, both hidden on desktop.
- In landscape the pad detaches from the flow and floats over the black margins
  at the bottom corners, so the room keeps the full screen height.
- Everything else is fluid: `clamp()` for padding and type, `dvh`/`svh` for
  heights, safe-area insets for notches, and flexible grids that collapse to a
  single column. Verified from 320x568 up to 1440x900.
- Tap targets are at least ~40px and marked `touch-action: manipulation`, so
  double-tap zoom never fights the controls.

## Discoverability

The portfolio is a canvas app, so the same content is also published as plain
HTML — that is what social cards, search engines and assistive tech read.

- **Open Graph / Twitter cards** (`index.html` head) plus a generated
  `assets/og-cover.png`, so a shared link shows a real preview.
- **JSON-LD `Person`** markup with the role, location, languages and accounts.
- **Text version.** `#text-version` is the semantic copy of the whole
  portfolio: revealed by the "skip to text version" link (keyboard focus shows
  it), by a deep link, and automatically by `<noscript>` when JavaScript is off.
  It is the accessible read of the room and it carries the real anchor links.
- **Installable.** `manifest.webmanifest` plus `assets/icon-192/512.png` and an
  `apple-touch-icon.png`; `theme_color` matches the room.
- **`robots.txt` + `sitemap.xml`** for the crawlers.

`tools/make-assets.ps1` redraws the cover and icons with System.Drawing, so the
brand assets can be regenerated without a design tool.

## Accessibility and quality floor

- Full keyboard play, visible focus rings, `Esc` closes anything.
- A skip link, a plain-text version of every section, and labels on every icon
  button — the room is a canvas, so the text version is the real fallback.
- Touch D-pad plus tap-to-interact and tap-to-walk, with labelled controls.
- Nobody is dropped into a mystery: on a first visit Mohamed turns to the
  visitor, a speech bubble appears and he asks whether he should show the place
  around. Say yes and he walks ahead from station to station — projects, stack,
  GitHub, contact — opening each one on the way, then points playfully at the
  eight easter eggs before handing the room over. Say no and you are left alone.

## First visit

The arrival greeting and the guided tour live in `js/onboarding.js`; the copy is
in the `tour.*` keys of `js/i18n.js`, so the tour is written once and read in
both languages.

- It is a scripted dialogue (`UI.playScript`), not a modal: the character talks
  in the same dialogue box as everything else, and the room keeps simulating
  behind it. Only the visitor's input is parked while Mohamed leads.
- Mohamed walks himself (`Game.tour.move`) with the same collision rules as the
  visitor, and the visitor follows on autopilot. If a walk is ever blocked, both
  characters are placed directly, so the tour can never stall.
- Every station offers **open it** (the real window, exactly as a click would),
  **next stop**, or **end the tour**; closing a window resumes the walk.
- `Esc` anywhere ends the tour immediately and gives control back.
- It runs once per visitor (`mn_met_v1` in `localStorage`); `Onboarding.reset()`
  brings it back, and `Onboarding.startTour()` replays just the tour.
- `prefers-reduced-motion` disables animation.
- Heading, body and control type all stay at or above 10px, and the dialogue and
  windows reflow to fit any viewport without horizontal scroll.
- The resume window prints to a clean A4 page via `@media print`, and
  "open in new tab" gives a bare print-ready copy for "Save as PDF".
- Audio is synthesised, off by default, and toggled from the HUD.

## Notes

- Contact details live in `js/config.js` → `profile.email` / `profile.linkedin`
  plus the `contact.links` list. The mailbox window renders a copy button for
  the email and an open button for each link; clear a value and its row simply
  disappears, so no dead links are ever published.
- The `#text-version` article in `index.html` is a **static mirror** of the
  content in `js/config.js` (a crawler without JavaScript never runs the config).
  If you rewrite the summary, projects or experience, update both — the room is
  generated, the text version is written.
- `resume.pdf` in `js/config.js` is optional: point it at a real PDF and the
  resume window offers a direct download; leave it empty and the button opens
  the print dialog instead.
- The arrival greeting is remembered under `mn_met_v1` in `localStorage` the
  moment it is shown, so it never repeats. Clear that key (or run
  `Onboarding.reset()`) to be greeted again on the next load.
- `actions-rdp` in the project list is included for completeness; review it for
  secrets before sharing that repository publicly.
