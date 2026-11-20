# Character sheets

Drop the two generated PNG files here with these exact names:

| File | Content |
| --- | --- |
| `mohamed-spritesheet.png` | Mohamed Nasr — 4x4 walk sheet |
| `visitor-spritesheet.png` | The playable visitor — 4x4 walk sheet |
| `mohamed-portrait.png` | Optional. Dialogue portrait, square PNG. If it is missing, the portrait is cropped from the top of Mohamed's front frame. |

## Sheet rules the loader expects

- A single transparent PNG, **exactly 4 columns x 4 rows** (16 frames).
- Every cell the same size. 1024 x 1536 works well (256 x 384 per cell).
- No grid lines, no labels, no borders between cells.
- Feet aligned to the same ground line inside every cell.

Rows, top to bottom:

1. facing down (towards the viewer)
2. facing left
3. facing right
4. facing up (away from the viewer)

Columns, left to right:

1. idle
2. walk, left foot forward
3. walk, passing
4. walk, right foot forward

## What the game does with them

1. Slices the grid into 16 cells.
2. Keys out a pure-black background (`keyBlack: "auto"` in `js/config.js`).
   The loader first samples the four corners: if they are already transparent
   it keys nothing, so dark clothing survives. For an opaque black background
   raise `keyThreshold` if the black is not pure, or set `keyBlack: "never"`
   to disable keying completely.
3. Trims each frame and locks every frame to one shared ground line (the median
   of the cell bottoms, so a single odd pose cannot lift the rest).
4. Scales every frame to `targetHeight` (40 px) inside a 32 x 48 frame.
5. Crops Mohamed's front frame into the 96 x 96 dialogue portrait.

## If the art does not follow the row order

Set these in the `sprites` block of `js/config.js` instead of editing the
image or the code:

| Setting | Use it when |
| --- | --- |
| `rowOrder: ["down", "left", "right", "up"]` | The rows are in a different order — list all four directions in the order the sheet actually uses, top row first. |
| `swapLeftRight: true` | Walking left shows the character facing right (the two side rows are the other way round). |

`tools/sprite-lab.html` reproduces both previews live: drop a sheet in, tick
the options, and copy the resulting `sprites` block.

If a file is missing or unreadable, the game silently keeps its built-in
procedural pixel characters, so the site never shows a broken image.
