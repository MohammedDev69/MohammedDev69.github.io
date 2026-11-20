/* All artwork is generated from pixel matrices at runtime — no image files,
   so there is nothing to break. */
window.Sprites = (function () {
  "use strict";

  var W = 24, H = 24; /* character sprite box */

  /* ---------------------------------------------------------------- */
  /* Palettes                                                          */
  /* ---------------------------------------------------------------- */
  var NPC_PAL = {
    H: "#171114", h: "#2b1e21", j: "#413034",
    S: "#c68b5f", s: "#a86b45", l: "#dda57c",
    E: "#21150f", B: "#14161b", b: "#20242c",
    D: "#14161b", d: "#20242c", T: "#14161b", t: "#20242c", u: "#0c0d11",
    P: "#1a1d25", p: "#262b36", O: "#0b0c0f",
    A: "#343b4a",
  };

  /* Visitor: warm rust overshirt, charcoal trousers, simple brown hair.
     No white accessories or stray pixels; the copper stitch is the only accent. */
  var PLAYER_PAL = {
    H: "#35251f", h: "#4a3329", j: "#614638",
    S: "#c88c64", s: "#a96f4e", l: "#dda982",
    E: "#2c1a14", B: "#72513c", b: "#8d6547",
    D: "#80503f", d: "#9b624c", T: "#202838", t: "#30394d", u: "#503329",
    P: "#202838", p: "#30394d", O: "#101218",
    A: "#d28b52",
  };

  /* Wider pixel characters with distinct silhouettes and layered clothing.
     Each row is padded to the same width for clean, predictable silhouettes. */
  var BODY = {
    down: [
      "........HHHHHHHH............",
      "......HHHHHHHHHHHH..........",
      ".....HHHHHHHHHHHHHH.........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHSSSSSSSSSSHHH........",
      "....HHSSSSSSSSSSSSHH.........",
      "....HHSSSSSSSSSSSSHH.........",
      "....HHSSSESSSSSESSHH.........",
      "....HHSSSESSSSSESSHH.........",
      "....HHSSSSSSSSSSSSHH.........",
      ".....HSSSSSDDSSSSSH..........",
      "......SSSSSDDSSSSS...........",
      ".......SSSSSSSSSS............",
      ".......DDDDDDDDDD............",
      "......DDDDDDDDDDDD...........",
      ".....DDDDDDDDDDDDDD..........",
      ".....DDDDDDDDDDDDDD..........",
      "....TTTTTTTTTTTTTTTT.........",
      "...TTTTTTTTTTTTTTTTTT........",
      "...TTTTTTTTTTTTTTTTTT........",
      "....TTTTTTTTTTTTTTTT.........",
      "....PPP......PPP.............",
      "...PPPP......PPPP............",
    ],
    up: [
      "........HHHHHHHH............",
      "......HHHHHHHHHHHH..........",
      ".....HHHHHHHHHHHHHH.........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      "....HHHHHHHHHHHHHHHH........",
      ".....HHHHHHHHHHHHHH.........",
      "......HHSSHHHHSSHH...........",
      ".......SSSSSSSSSS............",
      ".......SSSSSSSSSS............",
      ".......DDDDDDDDDD............",
      "......DDDDDDDDDDDD...........",
      ".....DDDDDDDDDDDDDD..........",
      ".....DDDDDDDDDDDDDD..........",
      "....TTTTTTTTTTTTTTTT.........",
      "...TTTTTTTTTTTTTTTTTT........",
      "...TTTTTTTTTTTTTTTTTT........",
      "....TTTTTTTTTTTTTTTT.........",
      "....PPP......PPP.............",
      "...PPPP......PPPP............",
    ],
    side: [
      "......HHHHHHHH................",
      "....HHHHHHHHHHHH..............",
      "...HHHHHHHHHHHHHH.............",
      "...HHHHHHHHHHHHHHHH...........",
      "...HHHHHHHHHHHHHHHH...........",
      "...HHHHSSSSSSSSSSSSHH.........",
      "...HHSSSSSSSSSSSSSSSH.........",
      "...HHSSSSSSSSSSSSSSSH.........",
      "...HHSSSSESSSSSSSSSSH.........",
      "...HHSSSSESSSSSSSSSSH.........",
      "...HHSSSSSSSSSSSSSSSH.........",
      "....HSSSSSSDDSSSSSSSH..........",
      ".....SSSSSSDDSSSSSSS............",
      "......SSSSSSSSSSSS..............",
      "......DDDDDDDDDDDD..............",
      ".....DDDDDDDDDDDDDD.............",
      ".....DDDDDDDDDDDDDD.............",
      "....TTTTTTTTTTTTTTTT............",
      "...TTTTTTTTTTTTTTTTTT...........",
      "...TTTTTTTTTTTTTTTTTT...........",
      "....TTTTTTTTTTTTTTTT............",
      ".....PPP.......PPP..............",
      "....PPPP.......PPPP.............",
      "................................",
    ],
  };

  /* ---------------------------------------------------------------- */
  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  function canvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    return c;
  }

  function drawMatrix(g, rows, pal, ox, oy) {
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      /* Center every scanline in the 32px transparent sprite canvas. */
      var rowX = Math.floor((32 - row.length) / 2);
      for (var c = 0; c < row.length; c++) {
        var col = pal[row.charAt(c)];
        if (col) px(g, rowX + c, oy + r, 1, 1, col);
      }
    }
  }

  /* Add a 1px dark silhouette so characters read against busy furniture. */
  function outline(src, color) {
    var g = src.getContext("2d");
    var w = src.width, h = src.height;
    var img = g.getImageData(0, 0, w, h);
    var d = img.data;
    var out = g.createImageData(w, h);
    var o = out.data;
    var rgb = hexToRgb(color);

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        if (d[i + 3] > 0) {
          o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3];
          continue;
        }
        var edge = false;
        if (x > 0 && d[i - 4 + 3] > 0) edge = true;
        if (x < w - 1 && d[i + 4 + 3] > 0) edge = true;
        if (y > 0 && d[i - w * 4 + 3] > 0) edge = true;
        if (y < h - 1 && d[i + w * 4 + 3] > 0) edge = true;
        if (edge) {
          o[i] = rgb[0]; o[i + 1] = rgb[1]; o[i + 2] = rgb[2]; o[i + 3] = 255;
        }
      }
    }
    g.putImageData(out, 0, 0);
    return src;
  }

  function hexToRgb(hex) {
    var v = hex.replace("#", "");
    return [parseInt(v.substr(0, 2), 16), parseInt(v.substr(2, 2), 16), parseInt(v.substr(4, 2), 16)];
  }

  /* ---------------------------------------------------------------- */
  /* Legs                                                              */
  /* ---------------------------------------------------------------- */
  function legsDown(g, frame, pal, oy) {
    var step = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    var lx = 7 - step, rx = 14 + step;
    /* dark center seam and two trouser legs */
    px(g, 7, oy + 18, 11, 2, pal.P);
    px(g, lx, oy + 19, 4, 3, pal.P);
    px(g, rx, oy + 19, 4, 3, pal.P);
    px(g, lx, oy + 20, 1, 2, pal.p);
    px(g, rx, oy + 20, 1, 2, pal.p);
    /* compact shoes, wholly inside the sprite canvas */
    px(g, lx - 1, oy + 22, 5, 2, pal.O);
    px(g, rx - 1, oy + 22, 5, 2, pal.O);
    px(g, lx, oy + 22, 3, 1, "#33333a");
    px(g, rx, oy + 22, 3, 1, "#33333a");
  }

  function legsSide(g, frame, pal, oy, mirror) {
    var swing = frame === 1 ? 2 : frame === 3 ? -2 : 0;
    var back = 8 - Math.round(swing / 2);
    var front = 13 + swing;
    if (mirror) {
      back = W - back - 4;
      front = W - front - 4;
    }
    px(g, 7, oy + 18, 11, 2, pal.P);
    px(g, back, oy + 19, 4, 3, pal.P);
    px(g, front, oy + 19, 4, 3, pal.P);
    px(g, back, oy + 20, 1, 2, pal.p);
    px(g, front, oy + 20, 1, 2, pal.p);
    px(g, back - 1, oy + 22, 5, 2, pal.O);
    px(g, front - 1, oy + 22, 5, 2, pal.O);
    px(g, back, oy + 22, 3, 1, "#33333a");
    px(g, front, oy + 22, 3, 1, "#33333a");
  }

  /* ---------------------------------------------------------------- */
  /* Character baking                                                  */
  /* ---------------------------------------------------------------- */
  var SW = 32, SH = 32, OX = 4, OY = 2;

  function bakeCharacter(pal, opts) {
    opts = opts || {};
    var frames = { down: [], up: [], left: [], right: [] };
    var views = [
      { key: "down", rows: "down", side: false, mirror: false },
      { key: "up", rows: "up", side: false, mirror: false },
      { key: "right", rows: "side", side: true, mirror: false },
      { key: "left", rows: "side", side: true, mirror: true },
    ];

    for (var d = 0; d < views.length; d++) {
      var view = views[d];
      for (var f = 0; f < 4; f++) {
        var c = canvas(SW, SH);
        var g = c.getContext("2d");
        var target = g;
        var work = c;
        var bob = (f === 1 || f === 3) ? -1 : 0;

        if (view.mirror) {
          work = canvas(SW, SH);
          target = work.getContext("2d");
        }
        target.imageSmoothingEnabled = false;
        drawMatrix(target, BODY[view.rows], pal, OX, OY + bob);
        if (view.side) legsSide(target, f, pal, OY + bob, false);
        else legsDown(target, f, pal, OY + bob);
        if (opts.decorate) opts.decorate(target, view.side ? "side" : view.key, pal);

        if (view.mirror) {
          g.save();
          g.translate(SW, 0);
          g.scale(-1, 1);
          g.drawImage(work, 0, 0);
          g.restore();
        }

        outline(c, opts.outline || "#101218");
        frames[view.key].push(c);
      }
    }
    return frames;
  }

  /* Mohamed's face details: textured curls, brows, eyes, nose, and a trimmed
     beard. Coordinates are deliberately grouped into readable pixel clusters. */
  function decorateNpc(g, dir, pal) {
    if (dir === "down") {
      /* Curl texture catches a little warm light. */
      px(g, 12, 4, 2, 1, pal.h); px(g, 17, 3, 2, 1, pal.j);
      px(g, 21, 4, 2, 1, pal.h); px(g, 9, 6, 2, 1, pal.j);
      px(g, 25, 7, 1, 2, pal.h);
      /* eyes / brows */
      px(g, 11, 10, 4, 1, pal.H); px(g, 19, 10, 4, 1, pal.H);
      px(g, 12, 11, 2, 1, "#21150f"); px(g, 20, 11, 2, 1, "#21150f");
      px(g, 13, 11, 1, 1, "#dda57c"); px(g, 21, 11, 1, 1, "#dda57c");
      /* nose and trimmed mustache */
      px(g, 16, 12, 2, 3, "#b67955");
      px(g, 13, 15, 4, 1, pal.H); px(g, 17, 15, 4, 1, pal.H);
      /* cheek beard, jaw and chin */
      px(g, 10, 15, 3, 3, pal.H); px(g, 21, 15, 3, 3, pal.H);
      px(g, 12, 17, 11, 2, pal.H);
      px(g, 14, 18, 7, 1, pal.h);
      px(g, 15, 19, 5, 1, pal.H);
      /* neck-to-black-tee line */
      px(g, 12, 22, 3, 1, pal.t); px(g, 19, 22, 3, 1, pal.t);
    } else if (dir === "side") {
      px(g, 13, 4, 2, 1, pal.h); px(g, 18, 3, 2, 1, pal.j);
      px(g, 22, 5, 2, 1, pal.h);
      px(g, 20, 10, 3, 1, pal.H);
      px(g, 21, 11, 1, 1, "#21150f");
      px(g, 22, 13, 2, 3, "#a86b45");
      px(g, 21, 15, 3, 3, pal.H);
      px(g, 17, 17, 6, 2, pal.H);
      px(g, 15, 18, 5, 1, pal.h);
    } else {
      /* back curls and a shaped neckline */
      px(g, 10, 4, 3, 1, pal.h); px(g, 15, 3, 3, 1, pal.j);
      px(g, 20, 4, 3, 1, pal.h);
      px(g, 12, 17, 2, 1, pal.j); px(g, 20, 17, 2, 1, pal.j);
      px(g, 12, 22, 2, 1, pal.t); px(g, 20, 22, 2, 1, pal.t);
    }
  }

  /* Tiny garment details use the outfit palette only, so no isolated white
     dots can read as accidental marks. */
  function decoratePlayer(g, dir, pal) {
    if (dir === "down") {
      /* centered jacket placket, buttons, and folded collar */
      px(g, 19, OY + 17, 2, 1, pal.u);
      px(g, 19, OY + 19, 1, 1, pal.A);
      px(g, 19, OY + 21, 1, 1, pal.A);
      px(g, 14, OY + 15, 3, 1, pal.d);
      px(g, 18, OY + 15, 3, 1, pal.d);
    } else if (dir === "side") {
      /* compact shoulder seam */
      px(g, 20, OY + 16, 1, 3, pal.u);
      px(g, 19, OY + 16, 2, 1, pal.A);
    } else if (dir === "up") {
      px(g, 15, OY + 18, 1, 3, pal.u);
      px(g, 15, OY + 19, 1, 1, pal.A);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Portrait (32x32)                                                  */
  /* ---------------------------------------------------------------- */
  var PORTRAIT = [
    "1111111111",
    "1111111111111111",
    "1122222222222211",
    "112222222222222211",
    "11222222222222222211",
    "1122222222222222222211",
    "112222222222222222222211",
    "112222222222222222222211",
    "112277777777777777222211",
    "112777777777777777772211",
    "112777777777777777772211",
    "112771111777777111177211",
    "117799ab777777ba9977211",
    "11777777777777777777211",
    "11777887777777777777211",
    "11777887777667777777211",
    "11777887777667777777211",
    "11777887777667777777211",
    "11777777766666777777211",
    "1177cccccccccccccc77211",
    "117cccccccmmmmcccc77211",
    "117cccccccccccccccc7211",
    "117cccccccccccccccc7211",
    "11cccccccccccccccccc7211",
    "11cccccccccccccccccc7211",
    "1ccccccccccccccccccc7211",
    "1ccccccccccccccccccc7211",
    "1cccccccccccccccccc7211",
    ".cccccccccccccccccc721..",
    "..cccccccccccccccc721...",
    "fffffff55555555555fffffff",
    "ffffffffffffffffffffffffffffffff",
  ];

  var PPAL = {
    "1": "#0e0a0c", "2": "#1a1216", "3": "#241a1f", "4": "#33262c",
    "5": "#8a5a3c", "6": "#a86b45", "7": "#c68b5f", "8": "#dda57c",
    "9": "#efe4d8", a: "#2a1810", b: "#0b0705",
    c: "#1a1113", d: "#2a1e20", e: "#3a2b2d",
    m: "#6b3d33", f: "#0c0e12", g: "#191d25",
  };

  function centeredRows(rows, width) {
    return rows.map(function (row) {
      var content = row.replace(/^\.+/, "").replace(/\.+$/, "");
      if (content.length >= width) return content.slice(0, width);
      var pad = width - content.length;
      var left = Math.floor(pad / 2);
      return new Array(left + 1).join(".") + content + new Array(pad - left + 1).join(".");
    });
  }

  var P_ROWS = centeredRows(PORTRAIT, 32);
  var P_MAP = P_ROWS.map(function (r) {
    return r.split("").map(function (ch) { return PPAL[ch] || null; });
  });

  function renderPortrait(g, scale, opts) {
    opts = opts || {};
    scale = scale || 1;
    if (sheetPortrait) {
      g.save();
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.clearRect(0, 0, 32 * scale, 32 * scale);
      g.drawImage(sheetPortrait, 0, 0, 32 * scale, 32 * scale);
      g.restore();
      return;
    }
    g.clearRect(0, 0, 32 * scale, 32 * scale);
    function box(x, y, w, h, color) {
      g.fillStyle = color;
      g.fillRect(x * scale, y * scale, w * scale, h * scale);
    }

    /* Dark studio backdrop and shoulders */
    box(0, 0, 32, 32, "#121722");
    box(2, 22, 28, 10, "#20242c");
    box(5, 20, 22, 12, "#14161b");
    box(3, 26, 26, 6, "#101218");
    box(1, 31, 30, 1, "#343b4a");

    /* Neck */
    box(12, 20, 8, 5, "#a86b45");
    box(13, 20, 6, 3, "#c68b5f");
    box(11, 23, 10, 2, "#33262b");

    /* Face silhouette, warm mid-tone with a lighter cheek plane */
    box(8, 7, 16, 13, "#a86b45");
    box(7, 9, 18, 8, "#a86b45");
    box(9, 5, 14, 15, "#c68b5f");
    box(10, 7, 12, 10, "#dda57c");
    box(8, 10, 2, 5, "#a86b45");
    box(22, 10, 2, 5, "#a86b45");
    box(10, 17, 12, 3, "#a86b45");

    /* Textured short hair, built in chunky curls */
    box(8, 4, 16, 4, "#171114");
    box(6, 6, 20, 3, "#171114");
    box(7, 4, 3, 3, "#241a1e");
    box(11, 3, 3, 3, "#241a1e");
    box(15, 2, 3, 4, "#241a1e");
    box(19, 3, 3, 3, "#241a1e");
    box(23, 5, 3, 3, "#171114");
    box(6, 8, 2, 5, "#171114");
    box(24, 8, 2, 5, "#171114");

    /* Brows and eyes */
    box(10, 10, 5, 1, "#33211b");
    box(18, 10, 5, 1, "#33211b");
    box(11, 12, 3, 1, "#21150f");
    box(19, 12, 3, 1, "#21150f");
    if (opts.blink) {
      box(10, 12, 5, 1, "#a86b45");
      box(18, 12, 5, 1, "#a86b45");
    }
    /* Nose and cheeks */
    box(15, 12, 2, 4, "#b67955");
    box(14, 15, 4, 1, "#a86b45");
    box(9, 15, 2, 1, "#c68b5f");
    box(21, 15, 2, 1, "#c68b5f");

    /* Trimmed beard and connected mustache */
    box(10, 16, 12, 3, "#302126");
    box(9, 15, 3, 3, "#302126");
    box(20, 15, 3, 3, "#302126");
    box(11, 15, 4, 2, "#241a1e");
    box(17, 15, 4, 2, "#241a1e");
    box(13, 18, 6, 1, "#493137");
    box(12, 19, 8, 1, "#241a1e");

    /* Black tee collar */
    box(12, 23, 3, 2, "#0b0c0f");
    box(17, 23, 3, 2, "#0b0c0f");
    box(13, 24, 6, 2, "#14161b");

    if (opts.talk) {
      box(14, 18, 4, 1, "#dda57c");
      box(15, 19, 2, 1, "#8f5a3a");
    }
  }

  /* ================================================================ */
  /* Imported sprite sheets                                           */
  /* ================================================================ */
  var FRAME_W = 32, FRAME_H = 48;
  var sheetPortrait = null;

  function padFrames(set) {
    var out = { down: [], up: [], left: [], right: [] };
    var dirs = ["down", "up", "left", "right"];
    for (var d = 0; d < dirs.length; d++) {
      var dir = dirs[d];
      for (var f = 0; f < set[dir].length; f++) {
        var src = set[dir][f];
        var c = canvas(FRAME_W, FRAME_H);
        var g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(src, 0, FRAME_H - src.height);
        out[dir].push(c);
      }
    }
    return out;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Missing sprite sheet: " + src)); };
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
    for (var b = 0; b < cells.length; b++) {
      if (cells[b].bounds) bottoms.push(cells[b].bounds.bottom);
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

  function buildSheetPortrait(img, opts) {
    opts = opts || {};
    var cw = Math.floor((img.naturalWidth || img.width) / 4);
    var ch = Math.floor((img.naturalHeight || img.height) / 4);
    var cell = canvas(cw, ch);
    var cg = cell.getContext("2d");
    cg.imageSmoothingEnabled = false;
    cg.drawImage(img, 0, 0, cw, ch, 0, 0, cw, ch);
    var data = keyBlack(cell);
    var b = alphaBounds(data.data, cw, ch);
    if (!b) return null;

    var size = 96;
    var out = canvas(size, size);
    var g = out.getContext("2d");
    var bg = g.createRadialGradient(size * 0.5, size * 0.35, 6, size * 0.5, size * 0.5, size * 0.8);
    bg.addColorStop(0, "#222c3e");
    bg.addColorStop(0.6, "#131a26");
    bg.addColorStop(1, "#0a0e15");
    g.fillStyle = bg;
    g.fillRect(0, 0, size, size);

    /* head + shoulders crop */
    var side = Math.min(b.w * 0.92, b.h * 0.56);
    var sx = b.x + (b.w - side) / 2;
    var sy = b.y + b.h * 0.015;
    var sh = side;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(cell, sx, sy, side, sh, 0, 0, size, size);

    /* bottom fade so the portrait melts into the dialogue frame */
    var fade = g.createLinearGradient(0, size * 0.72, 0, size);
    fade.addColorStop(0, "rgba(10,14,21,0)");
    fade.addColorStop(1, "rgba(10,14,21,0.85)");
    g.fillStyle = fade;
    g.fillRect(0, size * 0.7, size, size * 0.3);

    return out;
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

  function usePortraitImage(img) {
    var size = 96;
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

  function loadSheets(cfg) {
    cfg = cfg || {};
    var jobs = [];

    if (cfg.npcSheet) {
      jobs.push(loadImage(cfg.npcSheet).then(function (img) {
        var parsed = parseSheet(img, cfg);
        if (parsed.frames.down.length) {
          api.npc = parsed.frames;
          api.npcSource = "sheet";
          warnIfOpaque(parsed.frames, "npcSheet");
        }
        if (!sheetPortrait) sheetPortrait = buildSheetPortrait(img, cfg);
      }));
    }

    if (cfg.playerSheet) {
      jobs.push(loadImage(cfg.playerSheet).then(function (img) {
        var parsed = parseSheet(img, cfg);
        if (parsed.frames.down.length) {
          api.player = parsed.frames;
          api.playerSource = "sheet";
          warnIfOpaque(parsed.frames, "playerSheet");
        }
      }));
    }

    if (cfg.npcPortrait) {
      jobs.push(loadImage(cfg.npcPortrait).then(function (img) {
        usePortraitImage(img);
      }));
    }

    return Promise.allSettled(jobs).then(function (results) {
      var loaded = results.some(function (r) { return r.status === "fulfilled"; });
      api.ready = true;
      return loaded;
    });
  }

  /* ---------------------------------------------------------------- */
  var api = {
    palettes: { npc: NPC_PAL, player: PLAYER_PAL },
    frameW: FRAME_W,
    frameH: FRAME_H,
    build: function () {
      api.npc = padFrames(bakeCharacter(NPC_PAL, { decorate: decorateNpc, outline: "#120e12" }));
      api.player = padFrames(bakeCharacter(PLAYER_PAL, { decorate: decoratePlayer, outline: "#11131a" }));
      api.npcSource = "procedural";
      api.playerSource = "procedural";
      api.ready = true;
    },
    loadSheets: loadSheets,
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
