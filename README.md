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
| Move | `WASD` / arrow keys | D-pad, top-left |
| Talk / inspect | `E`, `Space`, `Enter` | `A` button or tap the object |
| Pick a dialogue topic | `1`–`4`, arrows + `Enter` | tap a choice |
| Close a window | `Esc` | tap the ✕ or the backdrop |

Clicking or tapping any object walks the visitor over to it and interacts when
he arrives.

## Files

```
index.html          markup: shell, dialogue box, window host, HUD
css/style.css       arcade cabinet shell, windows, dialogue, resume, print
js/config.js        ALL content: profile, dialogue, projects, skills, resume
js/pixel-font.js    5x7 bitmap font drawn with fillRect
js/sprites.js       procedural pixel characters + PNG sprite-sheet importer
js/room.js          baked room art, furniture, lighting, particles
js/game.js          loop, movement, collision, interactions, rendering order
js/secrets.js       the seven easter eggs: triggers, progress, SECRETS window
js/audio.js         WebAudio chiptune loop and sound effects
assets/             optional hand-drawn character sheets (see assets/README.md)
tools/sprite-lab.html  dev-only sheet preview: slices, walk cycle, portrait
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
- `secrets` — the seven easter eggs: their names and the hints shown while locked

Projects are fetched live from
`https://api.github.com/users/MohammedDev69/repos` and cached in
`localStorage` for ten minutes. If the request fails, the window falls back to
the `projects` list in the config and labels itself "OFFLINE COPY".

## Character art

The room, furniture, effects and the two characters are drawn procedurally at
runtime, so the site can never break an image. To use hand-drawn art instead,
drop the two PNG sheets into `assets/` — see `assets/README.md` for the exact
grid the importer expects. Missing files fall back to the built-in character,
which is why the site keeps working either way.

When the sheets are present, Mohamed's greeting portrait is cropped from the
top of his front frame, and `sprites.swapLeftRight` / `sprites.rowOrder` in
`js/config.js` fix a sheet whose side views or row order came out differently
without touching the art. `tools/sprite-lab.html` previews a sheet's slices,
walk cycle and portrait before it is shipped.

The room stays behind a short boot screen until the sheet art is resolved, so
the built-in characters are never shown first and the art never visibly swaps.
If the files are missing or fail to load, the boot screen clears anyway and the
built-in characters are used — the site can never get stuck loading.

## Easter eggs

Seven secrets are hidden in the room and tracked by the SECRETS chip in the
top-left HUD. Progress is stored in `localStorage`, and the chip opens a window
that lists what is still missing with a hint for each.

| Secret | Trigger | Reward |
| --- | --- | --- |
| DEV MODE | Konami code: ↑↑↓↓←→←→BA | Collision boxes, interaction zones, stand points and a live FPS/position readout |
| CAT PERSON | Pet the sleeping cat five times | The cat wakes up and follows you around |
| NIGHT OWL | Switch the desk lamp off | The room goes dark, lit only by the lamp and the monitors |
| RECRUITER DETECTED | Type `hire` | Hearts, and a very obvious hint |
| STILL HERE? | Stand still for 30 seconds | The visitor yawns |
| OCTOCAT | Poke the header avatar seven times | An octocat moves in next to the desk |
| MARATHON | Walk 2000 pixels | A permanent speed boost |

Find all seven and the room calls Mohamed LV.100, which the dialogue window
picks up. Triggers, names and hints all live in the `secrets` block of
`js/config.js`; the logic is in `js/secrets.js` and the rewards in
`js/game.js` (`onSecret`).

## Accessibility and quality floor

- Full keyboard play, visible focus rings, `Esc` closes anything.
- Touch D-pad plus tap-to-interact and tap-to-walk.
- `prefers-reduced-motion` disables animation.
- The resume window prints to a clean A4 page via `@media print`.
- Audio is synthesised, off by default, and toggled from the HUD.

## Notes

- The email and social links in `js/config.js` are empty on purpose so no
  placeholder address is published. Add yours and the mailbox shows a copy
  button automatically.
- `actions-rdp` in the project list is included for completeness; review it for
  secrets before sharing that repository publicly.
