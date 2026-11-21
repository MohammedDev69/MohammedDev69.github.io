/* Character art comes from the hand-drawn sprite sheets in assets/.
   There is no procedural character any more: the sheets ARE the characters.
   If one sheet fails to load the other covers both roles, and if neither
   loads the room still runs (just without the two figures). */
window.Sprites = (function () {
  "use strict";

  var FRAME_W = 32, FRAME_H = 48;
  var sheetPortrait = null;

  /* ---------------------------------------------------------------- */
  /* Canvas helpers                                                    */
  /* ---------------------------------------------------------------- */
  function canvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    /* every sheet canvas is read back at least once (keying + bounds) */
    var g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    return c;
  }

  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  /* One silent retry with a cache-buster: a half-cached deploy is the only
     realistic way a sheet goes missing, and a reload fixes that. */
  function loadImage(src, attempt) {
    attempt = attempt || 0;
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () {
        if (attempt < 1) {
          var bust = src + (src.indexOf("?") > -1 ? "&" : "?") + "r=" + Date.now();
          loadImage(bust, attempt + 1).then(resolve, reject);
          return;
        }
        reject(new Error("Missing sprite sheet: " + src));
      };
      img.src = src;
    });
  }

  /* Pure-black keying only. Anything with a little real colour survives, so
     a black t-shirt and dark hair are never eaten by the key. */
  function keyBlack(cv, threshold) {
    var g = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    var img = g.getImageData(0, 0, w, h);
    var d = img.data;
    var corners = [0, (w - 1) * 4, (h - 1) * w * 4, (w * h - 1) * 4];
    var opaque = 0;
    for (var i = 0; i < corners.length; i++) if (d[corners[i] + 3] > 220) opaque++;
    if (opaque < 3) return img; /* already transparent */
    var limit = threshold || 30;
    for (var p = 0; p < d.length; p += 4) {
      if (d[p] + d[p + 1] + d[p + 2] <= limit) d[p + 3] = 0;
    }
    g.putImageData(img, 0, 0);
    return img;
  }

  /* Alpha bounds with a small noise guard so a stray pixel cannot shift the
     character's feet away from the floor. */
  function alphaBounds(data, w, h) {
    var minX = w, minY = h, maxX = -1, maxY = -1;
    var rowCounts = new Uint16Array(h);
    var colCounts = new Uint16Array(w);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 18) {
          rowCounts[y]++; colCounts[x]++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    var guard = 2;
    for (var yy = maxY; yy >= minY; yy--) {
      if (rowCounts[yy] >= guard) { maxY = yy; break; }
    }
    for (var xx = maxX; xx >= minX; xx--) {
      if (colCounts[xx] >= guard) { maxX = xx; break; }
    }
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, bottom: maxY };
  }

  /* ---------------------------------------------------------------- */
  /* Sheet slicing                                                     */
  /* ---------------------------------------------------------------- */
  /* Slice a 4x4 sheet into direction frames. Row order: down, left, right, up.
     Columns: idle, step A, passing, step B. */
  function parseSheet(img, opts) {
    opts = opts || {};
    var cols = 4, rows = 4;
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var cw = Math.floor(iw / cols);
    var ch = Math.floor(ih / rows);
    if (!cw || !ch) throw new Error("Sprite sheet is empty");

    var cells = [];
    var maxH = 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = canvas(cw, ch);
        var g = cell.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
        var keyed = opts.keyBlack === "never"
          ? g.getImageData(0, 0, cw, ch)
          : keyBlack(cell, opts.keyThreshold);
        var b = alphaBounds(keyed.data, cw, ch);
        if (b && b.h > maxH) maxH = b.h;
        cells.push({ canvas: cell, bounds: b, col: c, row: r });
      }
    }

    var target = opts.targetHeight || 40;
    var scale = Math.min(target / maxH, FRAME_W / cw, FRAME_H / ch);
    var smooth = !!opts.smoothing;

    /* One ground line for the whole sheet, taken as the median of the cell
       bottoms so a single odd pose cannot lift every other frame. Anchoring
       all frames to it keeps the body still while the legs animate. */
    var bottoms = [];
    for (var b2 = 0; b2 < cells.length; b2++) {
      if (cells[b2].bounds) bottoms.push(cells[b2].bounds.bottom);
    }
    var baseline = maxH;
    if (bottoms.length) {
      bottoms.sort(function (a, c) { return a - c; });
      baseline = bottoms[Math.floor(bottoms.length / 2)];
    }

    var frames = { down: [], up: [], left: [], right: [] };
    /* Row order of the sheet: top row first. Override with config if the
       generated art used a different order. */
    var dirForRow = opts.rowOrder || ["down", "left", "right", "up"];

    for (var i = 0; i < cells.length; i++) {
      var cellData = cells[i];
      if (!cellData.bounds) continue;
      var frame = canvas(FRAME_W, FRAME_H);
      var fg = frame.getContext("2d");
      fg.imageSmoothingEnabled = smooth;
      fg.imageSmoothingQuality = "high";

      var drawW = cw * scale;
      var drawH = ch * scale;
      var dx = Math.round((FRAME_W - drawW) / 2);
      var dy = Math.round(FRAME_H - baseline * scale - 1);
      fg.drawImage(cellData.canvas, dx, dy, drawW, drawH);

      frames[dirForRow[cellData.row]].push(frame);
    }

    /* If the sheet drew the side views the other way round, swap the two
       side animations instead of editing the art. */
    if (opts.swapLeftRight) {
      var tmp = frames.left;
      frames.left = frames.right;
      frames.right = tmp;
    }

    return {
      frames: frames,
      cells: cells,
      scale: scale,
      cellW: cw,
      cellH: ch,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Portrait                                                          */
  /* ---------------------------------------------------------------- */
  var PORTRAIT_SIZE = 96;

  /* Crop a head-and-shoulders square out of one keyed frame, on the same
     dark plate the dialogue box uses. */
  function cropPortrait(src) {
    var data = src.getContext("2d").getImageData(0, 0, src.width, src.height).data;
    var b = alphaBounds(data, src.width, src.height);
    if (!b) return null;

    var size = PORTRAIT_SIZE;
    var out = canvas(size, size);
    var g = out.getContext("2d");
    var bg = g.createRadialGradient(size * 0.5, size * 0.35, 6, size * 0.5, size * 0.5, size * 0.8);
    bg.addColorStop(0, "#222c3e");
    bg.addColorStop(0.6, "#131a26");
    bg.addColorStop(1, "#0a0e15");
    g.fillStyle = bg;
    g.fillRect(0, 0, size, size);

    var side = Math.min(b.w * 0.92, b.h * 0.56);
    var sx = b.x + (b.w - side) / 2;
    var sy = b.y + b.h * 0.015;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(src, sx, sy, side, side, 0, 0, size, size);

    /* bottom fade so the portrait melts into the dialogue frame */
    var fade = g.createLinearGradient(0, size * 0.72, 0, size);
    fade.addColorStop(0, "rgba(10,14,21,0)");
    fade.addColorStop(1, "rgba(10,14,21,0.85)");
    g.fillStyle = fade;
    g.fillRect(0, size * 0.7, size, size * 0.3);

    return out;
  }

  /* Build the portrait straight from the sheet's top-left cell. */
  function buildSheetPortrait(img, opts) {
    var cw = Math.floor((img.naturalWidth || img.width) / 4);
    var ch = Math.floor((img.naturalHeight || img.height) / 4);
    var cell = canvas(cw, ch);
    var cg = cell.getContext("2d");
    cg.imageSmoothingEnabled = false;
    cg.drawImage(img, 0, 0, cw, ch, 0, 0, cw, ch);
    if (!(opts && opts.keyBlack === "never")) keyBlack(cell, opts && opts.keyThreshold);
    return cropPortrait(cell);
  }

  /* A dark plate on its own, used only when no character art exists at all,
     so the header avatar is never a transparent hole. */
  function emptyPlate(g, size) {
    g.clearRect(0, 0, size, size);
    var bg = g.createRadialGradient(size * 0.5, size * 0.35, size * 0.05, size * 0.5, size * 0.5, size * 0.85);
    bg.addColorStop(0, "#1b2433");
    bg.addColorStop(1, "#0a0e15");
    g.fillStyle = bg;
    g.fillRect(0, 0, size, size);
  }

  function renderPortrait(g, scale, opts) {
    scale = scale || 1;
    var size = 32 * scale;
    if (sheetPortrait) {
      g.save();
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.clearRect(0, 0, size, size);
      g.drawImage(sheetPortrait, 0, 0, size, size);
      g.restore();
      return true;
    }
    emptyPlate(g, size);
    return false;
  }

  function usePortraitImage(img) {
    var size = PORTRAIT_SIZE;
    var out = canvas(size, size);
    var g = out.getContext("2d");
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var s = Math.min(iw, ih);
    var sx = (iw - s) / 2;
    var sy = (ih - s) / 2;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, sx, sy, s, s, 0, 0, size, size);
    sheetPortrait = out;
  }

  /* A frame that is almost fully opaque means the sheet still carries a
     background. Tell the author instead of silently painting a grey box. */
  function warnIfOpaque(frames, label) {
    var frame = frames.down && frames.down[0];
    if (!frame || !window.console || !console.warn) return;
    var d = frame.getContext("2d").getImageData(0, 0, frame.width, frame.height).data;
    var opaque = 0;
    for (var i = 3; i < d.length; i += 4) if (d[i] > 18) opaque++;
    if (opaque / (frame.width * frame.height) > 0.85) {
      console.warn(
        "[sprites] " + label + " still looks opaque after keying. Export it with a " +
        "transparent background, or raise sprites.keyThreshold in js/config.js."
      );
    }
  }

  /* ---------------------------------------------------------------- */
  /* Loading                                                           */
  /* ---------------------------------------------------------------- */
  function parseInto(img, cfg, role) {
    try {
      var parsed = parseSheet(img, cfg);
      if (!parsed.frames.down.length) return;
      api[role] = parsed.frames;
      api[role + "Source"] = "sheet";
      warnIfOpaque(parsed.frames, role === "npc" ? "npcSheet" : "playerSheet");
    } catch (e) {
      if (window.console && console.warn) {
        console.warn("[sprites] " + role + " sheet could not be sliced: " + e.message);
      }
    }
  }

  /* Loads every configured file and reports what actually arrived.
     Resolves (never rejects) with { npc, player, portrait } booleans. */
  function load(cfg) {
    cfg = cfg || {};
    var jobs = [];

    if (cfg.npcSheet) {
      jobs.push(loadImage(cfg.npcSheet).then(function (img) {
        parseInto(img, cfg, "npc");
        if (!sheetPortrait) sheetPortrait = buildSheetPortrait(img, cfg);
      }).catch(function (e) { warnMissing(e); }));
    }

    if (cfg.playerSheet) {
      jobs.push(loadImage(cfg.playerSheet).then(function (img) {
        parseInto(img, cfg, "player");
      }).catch(function (e) { warnMissing(e); }));
    }

    if (cfg.npcPortrait) {
      jobs.push(loadImage(cfg.npcPortrait).then(function (img) {
        usePortraitImage(img);
      }).catch(function (e) { warnMissing(e); }));
    }

    return Promise.all(jobs).then(function () {
      /* One sheet is enough: it backs both roles, so a single missing file
         never leaves the room empty. */
      if (!api.player && api.npc) {
        api.player = api.npc;
        api.playerSource = "shared";
      }
      if (!api.npc && api.player) {
        api.npc = api.player;
        api.npcSource = "shared";
      }
      if (!sheetPortrait && api.npc && api.npc.down[0]) {
        sheetPortrait = cropPortrait(api.npc.down[0]);
      }
      api.ready = true;
      return {
        npc: !!api.npc,
        player: !!api.player,
        portrait: !!sheetPortrait,
        characters: !!api.npc && !!api.player,
      };
    });
  }

  function warnMissing(err) {
    if (window.console && console.warn) {
      console.warn("[sprites] " + (err && err.message ? err.message : err) +
        " - the room will run without that art.");
    }
  }

  /* ---------------------------------------------------------------- */
  var api = {
    frameW: FRAME_W,
    frameH: FRAME_H,
    npc: null,
    player: null,
    npcSource: "none",
    playerSource: "none",
    ready: false,
    load: load,
    parseSheet: parseSheet,
    buildPortraitFromSheet: buildSheetPortrait,
    hasPortrait: function () { return !!sheetPortrait; },
    renderPortrait: renderPortrait,
    makePortraitCanvas: function (size) {
      var c = canvas(size, size);
      var g = c.getContext("2d");
      renderPortrait(g, size / 32, {});
      return c;
    },
    px: px,
    canvas: canvas,
  };

  return api;
})();
