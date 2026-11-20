/* The room: static background baked once, furniture baked per prop,
   plus a few live layers (monitor screens, steam, dust, lamp glow). */
window.Room = (function () {
  "use strict";

  var W = 384, H = 224, FLOOR = 48;
  var bg = null;
  var props = [];
  var solids = [];
  var interactables = [];
  var dust = [];
  var steam = [];

  /* ---------------------------------------------------------------- */
  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function ellipse(g, cx, cy, rx, ry, c) {
    g.fillStyle = c;
    for (var y = -ry; y <= ry; y++) {
      var span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      g.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
    }
  }

  function chamfer(g, x, y, w, h, c, cut) {
    cut = cut || 2;
    g.fillStyle = c;
    g.fillRect(x + cut, y, w - cut * 2, h);
    g.fillRect(x, y + cut, w, h - cut * 2);
  }

  function hash(a, b) {
    var h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  function bake(x, y, w, h, fn) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.translate(-x, -y);
    fn(g);
    return { canvas: c, x: x, y: y };
  }

  /* ---------------------------------------------------------------- */
  /* Background: wall, floor, rug, window, board, garland, door mat     */
  /* ---------------------------------------------------------------- */
  function buildBackground() {
    return bake(0, 0, W, H, function (g) {
      /* ---- wall ---- */
      var wall = g.createLinearGradient(0, 0, 0, FLOOR);
      wall.addColorStop(0, "#1a1f2a");
      wall.addColorStop(0.55, "#252c3a");
      wall.addColorStop(1, "#2b3343");
      px(g, 0, 0, W, FLOOR, wall);

      for (var x = 0; x < W; x += 16) {
        px(g, x, 4, 1, 30, "rgba(10,13,20,0.28)");
        px(g, x + 1, 4, 1, 30, "rgba(255,255,255,0.02)");
      }

      /* crown molding */
      px(g, 0, 0, W, 3, "#12161f");
      px(g, 0, 3, W, 1, "#3b4455");
      px(g, 0, 4, W, 1, "rgba(0,0,0,0.25)");

      /* wainscot */
      px(g, 0, 34, W, 14, "#3a2c23");
      px(g, 0, 34, W, 1, "#574130");
      px(g, 0, 35, W, 1, "rgba(0,0,0,0.25)");
      for (var wx = 0; wx < W; wx += 48) {
        px(g, wx, 37, 1, 10, "#2f231c");
        px(g, wx + 1, 37, 1, 10, "rgba(255,220,180,0.04)");
      }
      /* baseboard */
      px(g, 0, 46, W, 2, "#161b24");
      px(g, 0, 46, W, 1, "#4a3a2d");

      /* ---- floor ---- */
      px(g, 0, FLOOR, W, H - FLOOR, "#3a2a20");
      for (var row = 0; row < 13; row++) {
        var fy = FLOOR + row * 14;
        var offset = (row % 2) * 24;
        for (var fx = -48; fx < W + 48; fx += 48) {
          var xx = fx + offset;
          var hv = hash(row, xx);
          var tone = hv > 0.66 ? "#453226" : hv > 0.33 ? "#3e2c21" : "#423024";
          px(g, xx + 1, fy + 1, 46, 12, tone);
          px(g, xx + 1, fy + 1, 46, 1, "rgba(255,220,180,0.05)");
          px(g, xx, fy + 13, 48, 1, "#2b1e17");
          px(g, xx, fy + 1, 1, 12, "#33241b");
          /* wood grain */
          if (hv > 0.72) px(g, xx + 8, fy + 5, 22, 1, "rgba(0,0,0,0.10)");
          if (hv < 0.2) px(g, xx + 16, fy + 9, 14, 1, "rgba(255,255,255,0.025)");
        }
        px(g, 0, fy, W, 1, "#2f2119");
      }

      /* side walls */
      px(g, 0, FLOOR, 10, H - FLOOR, "#191d26");
      px(g, 10, FLOOR, 2, H - FLOOR, "#2b3240");
      px(g, 374, FLOOR, 10, H - FLOOR, "#191d26");
      px(g, 372, FLOOR, 2, H - FLOOR, "#2b3240");

      /* wall shadow on floor */
      var sh = g.createLinearGradient(0, FLOOR, 0, FLOOR + 14);
      sh.addColorStop(0, "rgba(0,0,0,0.45)");
      sh.addColorStop(1, "rgba(0,0,0,0)");
      px(g, 10, FLOOR, W - 20, 14, sh);

      drawRug(g);
      drawGarland(g);
      drawWindow(g);
      drawBoard(g);
      drawMat(g);
    });
  }

  function drawRug(g) {
    var x = 126, y = 116, w = 166, h = 78;
    /* soft shadow */
    ellipse(g, x + w / 2, y + h - 2, w / 2 + 4, 10, "rgba(0,0,0,0.28)");

    chamfer(g, x, y, w, h, "#4d2b26", 4);
    chamfer(g, x + 3, y + 3, w - 6, h - 6, "#6b3a30", 3);
    chamfer(g, x + 7, y + 7, w - 14, h - 14, "#5b312b", 2);

    /* border stitching */
    for (var i = x + 10; i < x + w - 10; i += 6) {
      px(g, i, y + 5, 3, 1, "#b08a5a");
      px(g, i, y + h - 6, 3, 1, "#b08a5a");
    }
    for (var j = y + 10; j < y + h - 10; j += 6) {
      px(g, x + 5, j, 1, 3, "#b08a5a");
      px(g, x + w - 6, j, 1, 3, "#b08a5a");
    }

    /* inner diamond pattern */
    for (var dy = 0; dy < 3; dy++) {
      for (var dx = 0; dx < 5; dx++) {
        var cx = x + 30 + dx * 28;
        var cy = y + 22 + dy * 20;
        px(g, cx, cy - 3, 1, 7, "#7a463b");
        px(g, cx - 3, cy, 7, 1, "#7a463b");
        px(g, cx - 1, cy - 1, 3, 3, "#8a5244");
        px(g, cx, cy, 1, 1, "#c9a878");
      }
    }

    /* fringe */
    for (var f = x + 2; f < x + w - 2; f += 4) {
      px(g, f, y - 2, 1, 2, "#7a5a3c");
      px(g, f, y + h, 1, 2, "#7a5a3c");
    }
  }

  function drawGarland(g) {
    for (var x = 0; x <= W; x += 2) {
      var y = 5 + Math.sin((x / W) * Math.PI * 2) * 2 + Math.sin((x / W) * Math.PI * 6) * 1;
      px(g, x, Math.round(y), 2, 1, "#20242e");
    }
    var colors = ["#ffcf8a", "#ffb454", "#ff9d6b", "#ffe3b0"];
    for (var bx = 12; bx < W; bx += 26) {
      var by = Math.round(5 + Math.sin((bx / W) * Math.PI * 2) * 2 + Math.sin((bx / W) * Math.PI * 6) * 1) + 2;
      px(g, bx, by, 1, 1, "#3a3a30");
      px(g, bx - 1, by + 1, 3, 2, colors[(bx / 26) % colors.length]);
      px(g, bx, by + 1, 1, 1, "#fff3d0");
      g.globalAlpha = 0.10;
      ellipse(g, bx, by + 2, 5, 4, "#ffb454");
      g.globalAlpha = 1;
    }
  }

  function drawWindow(g) {
    var x = 296, y = 6, w = 72, h = 40;
    /* curtains */
    chamfer(g, x - 6, y - 2, 12, h + 8, "#4a2a2c", 2);
    chamfer(g, x + w - 6, y - 2, 12, h + 8, "#4a2a2c", 2);
    px(g, x - 4, y + 2, 1, h + 2, "#5c3638");
    px(g, x + w + 3, y + 2, 1, h + 2, "#5c3638");
    px(g, x - 6, y + h + 2, 12, 2, "#3a2022");
    px(g, x + w - 6, y + h + 2, 12, 2, "#3a2022");

    /* frame */
    px(g, x, y, w, h, "#3f2e24");
    px(g, x, y, w, 2, "#5a4232");
    px(g, x, y, 2, h, "#4e392b");
    px(g, x + w - 2, y, 2, h, "#2e2119");
    px(g, x, y + h - 2, w, 2, "#2a1e17");

    /* sky */
    var sky = g.createLinearGradient(0, y + 2, 0, y + h - 2);
    sky.addColorStop(0, "#070d18");
    sky.addColorStop(0.6, "#0e1a2e");
    sky.addColorStop(1, "#1b2b45");
    px(g, x + 2, y + 2, w - 4, h - 4, sky);

    /* stars */
    for (var i = 0; i < 26; i++) {
      var sx = x + 4 + Math.floor(hash(i, 3) * (w - 10));
      var sy = y + 3 + Math.floor(hash(i, 9) * (h - 18));
      var a = 0.35 + hash(i, 11) * 0.65;
      g.globalAlpha = a;
      px(g, sx, sy, 1, 1, "#dfe9ff");
      g.globalAlpha = 1;
    }

    /* moon */
    ellipse(g, x + 52, y + 12, 5, 5, "#e8e2cf");
    ellipse(g, x + 54, y + 11, 4, 4, "#0b1220");
    px(g, x + 49, y + 14, 1, 1, "#cfc8b4");
    px(g, x + 51, y + 17, 1, 1, "#cfc8b4");

    /* skyline */
    px(g, x + 2, y + 26, w - 4, 10, "#0a1322");
    for (var b = 0; b < 9; b++) {
      var bh = 4 + Math.floor(hash(b, 21) * 10);
      var bw = 5 + Math.floor(hash(b, 27) * 6);
      var bx = x + 3 + b * 8;
      px(g, bx, y + 36 - bh, bw, bh, "#0c1626");
      for (var wy = y + 38 - bh; wy < y + 35; wy += 3) {
        for (var wx = bx + 1; wx < bx + bw - 1; wx += 3) {
          if (hash(wx, wy) > 0.55) px(g, wx, wy, 1, 1, "rgba(255,200,120,0.55)");
        }
      }
    }

    /* mullions */
    px(g, x + 34, y + 2, 2, h - 4, "#3f2e24");
    px(g, x + 2, y + 20, w - 4, 2, "#3f2e24");

    /* sill */
    px(g, x - 4, y + h, w + 8, 3, "#4e392b");
    px(g, x - 4, y + h, w + 8, 1, "#6b5038");

    /* moonlight spill */
    g.globalAlpha = 0.06;
    ellipse(g, x + w / 2, y + h + 8, 46, 14, "#8ab4ff");
    g.globalAlpha = 1;
  }

  function drawBoard(g) {
    var x = 94, y = 6, w = 58, h = 38;
    /* frame */
    chamfer(g, x, y, w, h, "#241a13", 2);
    chamfer(g, x + 2, y + 2, w - 4, h - 4, "#3d2c1f", 1);
    px(g, x + 4, y + 4, w - 8, h - 8, "#6b4a33");

    /* cork speckles */
    for (var i = 0; i < 40; i++) {
      var sx = x + 5 + Math.floor(hash(i, 5) * (w - 10));
      var sy = y + 5 + Math.floor(hash(i, 7) * (h - 10));
      px(g, sx, sy, 1, 1, hash(i, 13) > 0.5 ? "rgba(0,0,0,0.18)" : "rgba(255,220,170,0.12)");
    }

    /* note: HIRE */
    px(g, x + 6, y + 6, 22, 16, "#e6dcc4");
    px(g, x + 6, y + 6, 22, 1, "#f6efdc");
    px(g, x + 7, y + 9, 18, 1, "#b3a68a");
    px(g, x + 7, y + 11, 14, 1, "#b3a68a");
    px(g, x + 7, y + 13, 16, 1, "#b3a68a");
    px(g, x + 11, y + 16, 12, 4, "#1d222c");
    window.PixelFont.draw(g, "HIRE", x + 12, y + 17, { color: "#ffb454" });
    px(g, x + 16, y + 6, 2, 1, "#c0392b");

    /* note: tiny stack */
    px(g, x + 33, y + 7, 19, 13, "#cfd8c8");
    px(g, x + 33, y + 7, 19, 1, "#e2ebda");
    for (var l = 0; l < 3; l++) px(g, x + 35, y + 10 + l * 3, 13 - l * 2, 1, "#93a08e");
    px(g, x + 42, y + 7, 2, 1, "#c0392b");

    /* github badge */
    px(g, x + 6, y + 25, 46, 10, "#11151c");
    px(g, x + 6, y + 25, 46, 1, "#2b3340");
    /* little cat mark */
    px(g, x + 8, y + 27, 6, 6, "#e9e5dd");
    px(g, x + 8, y + 26, 1, 1, "#e9e5dd");
    px(g, x + 13, y + 26, 1, 1, "#e9e5dd");
    px(g, x + 9, y + 29, 1, 1, "#11151c");
    px(g, x + 12, y + 29, 1, 1, "#11151c");
    window.PixelFont.draw(g, "GITHUB", x + 17, y + 27, { color: "#e9e5dd" });
  }

  function drawMat(g) {
    var x = 164, y = 198, w = 56, h = 14;
    chamfer(g, x, y, w, h, "#3b2c22", 2);
    px(g, x + 2, y + 2, w - 4, h - 4, "#4a382c");
    px(g, x + 4, y + 4, w - 8, h - 8, "#3f2f25");
    window.PixelFont.drawCentered(g, "WELCOME", x + w / 2, y + 4, { color: "#7a6046" });
    for (var i = x + 3; i < x + w - 3; i += 4) {
      px(g, i, y - 1, 1, 1, "#5a4433");
      px(g, i, y + h, 1, 1, "#5a4433");
    }
  }

  /* ---------------------------------------------------------------- */
  /* Props                                                             */
  /* ---------------------------------------------------------------- */
  function buildBookshelf() {
    var bx = 16, by = 24, bw = 62, bh = 72;
    return bake(bx - 2, by - 4, bw + 8, bh + 12, function (g) {
      ellipse(g, bx + bw / 2, by + bh + 2, bw / 2 + 2, 5, "rgba(0,0,0,0.35)");
      px(g, bx, by, bw, bh, "#3b2a20");
      px(g, bx, by, bw, 3, "#5a4232");
      px(g, bx, by, 3, bh, "#4c3627");
      px(g, bx + bw - 3, by, 3, bh, "#2b1e17");
      px(g, bx + 3, by + 3, bw - 6, bh - 6, "#241a14");

      var shelves = [by + 20, by + 38, by + 56];
      for (var s = 0; s < shelves.length; s++) {
        var sy = shelves[s];
        px(g, bx + 3, sy, bw - 6, 2, "#4c3627");
        px(g, bx + 3, sy, bw - 6, 1, "#6b4c34");
      }

      /* books */
      var palette = ["#8a4a3a", "#3a6b6a", "#b08a4a", "#4a5a8a", "#7a3a5a", "#c9b79a", "#5a7a4a", "#8a5a2a"];
      for (var row = 0; row < 3; row++) {
        var baseY = shelves[row] - 1;
        var cursor = bx + 5;
        var n = 0;
        while (cursor < bx + bw - 8 && n < 14) {
          var hgt = 9 + Math.floor(hash(row, n) * 8);
          var wid = 2 + Math.floor(hash(row + 7, n) * 3);
          var col = palette[Math.floor(hash(row + 13, n) * palette.length)];
          if (baseY - hgt < by + 4) hgt = baseY - by - 5;
          px(g, cursor, baseY - hgt, wid, hgt, col);
          px(g, cursor, baseY - hgt, 1, hgt, "rgba(255,255,255,0.14)");
          px(g, cursor, baseY - hgt, wid, 1, "rgba(255,255,255,0.18)");
          if (wid > 2 && hash(row + 3, n) > 0.5) px(g, cursor + 1, baseY - hgt + 3, 1, hgt - 5, "rgba(0,0,0,0.25)");
          cursor += wid + 1;
          n++;
        }
        if (row === 2) {
          /* horizontal stack + tiny plant */
          px(g, bx + 42, baseY - 3, 13, 3, "#7a5a3a");
          px(g, bx + 42, baseY - 6, 12, 3, "#3a6b6a");
          px(g, bx + 43, baseY - 8, 10, 2, "#b08a4a");
        }
      }

      /* top decor: potted plant */
      px(g, bx + 8, by - 3, 7, 5, "#8a4a32");
      px(g, bx + 8, by - 3, 7, 1, "#a86b45");
      px(g, bx + 9, by - 8, 5, 5, "#3f7a52");
      px(g, bx + 7, by - 7, 4, 3, "#4f8a5f");
      px(g, bx + 12, by - 10, 4, 4, "#3a6b4a");
      /* trophy */
      px(g, bx + 40, by - 8, 6, 6, "#c9a84a");
      px(g, bx + 42, by - 10, 2, 2, "#e0c46a");
      px(g, bx + 39, by - 6, 2, 3, "#a8862f");
      px(g, bx + 45, by - 6, 2, 3, "#a8862f");
      px(g, bx + 41, by - 2, 4, 2, "#7a5a2a");

      /* name plate */
      px(g, bx + 12, by + bh - 13, 38, 8, "#2b2119");
      px(g, bx + 13, by + bh - 12, 36, 6, "#b08a4a");
      window.PixelFont.drawCentered(g, "SKILLS", bx + bw / 2, by + bh - 11, { color: "#2b2119" });
    });
  }

  function buildDesk() {
    return bake(146, 8, 142, 86, function (g) {
      ellipse(g, 216, 90, 72, 7, "rgba(0,0,0,0.38)");

      /* desk top */
      px(g, 148, 50, 136, 14, "#5d4130");
      px(g, 148, 50, 136, 2, "#7a5740");
      px(g, 148, 62, 136, 2, "#3d2a1f");
      for (var sx = 150; sx < 284; sx += 22) px(g, sx, 52, 1, 10, "#523827");
      px(g, 148, 50, 1, 14, "#7a5740");
      px(g, 283, 50, 1, 14, "#3d2a1f");

      /* front apron */
      px(g, 149, 64, 134, 22, "#4a3226");
      px(g, 149, 64, 134, 1, "#6b4a33");
      px(g, 149, 85, 134, 1, "#2e1f16");
      /* drawers */
      px(g, 236, 67, 44, 16, "#3d2a20");
      px(g, 238, 69, 40, 6, "#543a2b");
      px(g, 238, 77, 40, 5, "#543a2b");
      px(g, 254, 71, 8, 1, "#c9a86a");
      px(g, 254, 78, 8, 1, "#c9a86a");
      /* left cupboard line */
      px(g, 156, 68, 70, 14, "#432d21");
      px(g, 158, 70, 66, 10, "#4c3427");
      px(g, 190, 71, 2, 8, "#33231a");

      /* legs */
      px(g, 152, 86, 7, 5, "#33231a");
      px(g, 273, 86, 7, 5, "#33231a");
      px(g, 152, 86, 7, 1, "#4a3324");

      /* monitors */
      drawMonitor(g, 158, 12);
      drawMonitor(g, 222, 12);

      /* desk items */
      /* books stack */
      px(g, 150, 56, 12, 3, "#8a4a3a");
      px(g, 151, 53, 11, 3, "#3a6b6a");
      px(g, 150, 56, 12, 1, "#a86b55");
      /* mug */
      px(g, 170, 54, 8, 8, "#e6dcc8");
      px(g, 170, 54, 8, 1, "#f6efdc");
      px(g, 178, 56, 2, 4, "#d0c4ac");
      px(g, 171, 56, 6, 1, "#b08a6a");
      /* keyboard */
      px(g, 194, 57, 42, 6, "#161a22");
      px(g, 194, 57, 42, 1, "#2b3340");
      for (var kx = 196; kx < 234; kx += 3) {
        px(g, kx, 59, 1, 1, "#3a4356");
        px(g, kx, 61, 1, 1, "#3a4356");
      }
      px(g, 196, 62, 38, 1, "#3a4356");
      /* mouse */
      px(g, 240, 57, 6, 5, "#1c222d");
      px(g, 240, 57, 6, 1, "#2b3340");
      px(g, 242, 57, 1, 2, "#3a4356");
      /* notebook */
      px(g, 250, 56, 18, 7, "#d9c9a8");
      px(g, 250, 56, 18, 1, "#efe3c8");
      for (var nl = 0; nl < 3; nl++) px(g, 252, 58 + nl * 2, 14, 1, "#a8977a");
      /* pen */
      px(g, 270, 58, 8, 1, "#ffb454");
      px(g, 278, 58, 2, 1, "#3a4356");

      /* cables */
      px(g, 214, 60, 1, 8, "#0e1015");
      px(g, 215, 68, 4, 1, "#0e1015");
      px(g, 219, 68, 1, 6, "#0e1015");
    });
  }

  function drawMonitor(g, x, y) {
    px(g, x, y, 56, 34, "#0b0e13");
    px(g, x + 1, y + 1, 54, 32, "#1b202a");
    px(g, x + 1, y + 1, 54, 1, "#2f3746");
    px(g, x + 3, y + 3, 50, 26, "#05070a");
    px(g, x + 3, y + 3, 50, 1, "#000000");
    /* led */
    px(g, x + 51, y + 31, 1, 1, "#6ee7c7");
    /* stand */
    px(g, x + 23, y + 34, 10, 6, "#141821");
    px(g, x + 24, y + 34, 1, 6, "#2b3340");
    px(g, x + 17, y + 40, 22, 2, "#0e1117");
    px(g, x + 17, y + 40, 22, 1, "#2b3340");
  }

  function buildLamp() {
    return bake(88, 86, 34, 70, function (g) {
      ellipse(g, 104, 150, 13, 4, "rgba(0,0,0,0.35)");
      px(g, 103, 108, 2, 38, "#2b303c");
      px(g, 103, 108, 1, 38, "#465064");
      ellipse(g, 104, 148, 9, 3, "#232833");
      ellipse(g, 104, 147, 8, 2, "#323a49");
      /* shade */
      for (var i = 0; i < 12; i++) {
        var wdt = 8 + Math.floor(i * 1.1);
        px(g, 104 - wdt, 92 + i, wdt * 2, 1, i < 3 ? "#3a4152" : "#4b5367");
      }
      px(g, 96, 103, 17, 2, "#6b748c");
      px(g, 96, 103, 17, 1, "#8a93a8");
      /* bulb */
      px(g, 102, 104, 4, 3, "#ffe3b0");
      px(g, 103, 105, 2, 2, "#fff8e0");
    });
  }

  function buildPlant() {
    return bake(332, 126, 46, 58, function (g) {
      ellipse(g, 354, 179, 18, 4, "rgba(0,0,0,0.35)");
      /* leaves */
      var leaves = [
        [352, 140, 7, 10, "#2f6b4a"], [342, 148, 8, 6, "#3a7a52"],
        [360, 146, 8, 7, "#357048"], [348, 132, 5, 9, "#3f8a5f"],
        [358, 136, 5, 8, "#2c5f42"], [338, 156, 9, 5, "#336b4a"],
        [362, 156, 8, 5, "#3f7f55"], [350, 150, 10, 8, "#2a5c3f"],
      ];
      for (var i = 0; i < leaves.length; i++) {
        var l = leaves[i];
        ellipse(g, l[0], l[1], l[2], l[3], l[4]);
      }
      for (var j = 0; j < leaves.length; j++) {
        var m = leaves[j];
        px(g, m[0] - 1, m[1] + 1, 2, m[3], "rgba(0,0,0,0.12)");
      }
      /* pot */
      px(g, 342, 162, 24, 4, "#8a4a32");
      px(g, 344, 166, 20, 12, "#7a3f2b");
      px(g, 345, 166, 2, 12, "#96573c");
      px(g, 342, 162, 24, 1, "#a86b45");
      px(g, 344, 177, 20, 1, "#5e2f20");
      px(g, 346, 163, 16, 2, "#3a241a");
    });
  }

  function buildMailbox() {
    return bake(50, 168, 56, 48, function (g) {
      ellipse(g, 76, 212, 22, 4, "rgba(0,0,0,0.35)");
      /* post */
      px(g, 73, 194, 6, 18, "#4a3324");
      px(g, 73, 194, 2, 18, "#5e4330");
      px(g, 68, 210, 16, 3, "#33231a");
      /* box */
      px(g, 58, 180, 36, 18, "#6b4a33");
      chamfer(g, 58, 174, 36, 10, "#7a5740", 3);
      px(g, 58, 176, 36, 1, "#8f6a4a");
      px(g, 58, 196, 36, 2, "#4a3324");
      px(g, 58, 180, 1, 16, "#8a6244");
      px(g, 93, 180, 1, 16, "#3d2a1f");
      /* slot */
      px(g, 63, 182, 26, 3, "#2b1e17");
      px(g, 63, 182, 26, 1, "#1a1210");
      /* envelope */
      px(g, 64, 172, 22, 12, "#e6dcc4");
      px(g, 64, 172, 22, 1, "#f6efdc");
      px(g, 64, 183, 22, 1, "#b8ab8e");
      px(g, 65, 174, 9, 1, "#c9bda0");
      px(g, 76, 174, 9, 1, "#c9bda0");
      px(g, 64, 176, 22, 1, "#c9bda0");
      /* flag */
      px(g, 96, 180, 2, 10, "#7a2e2a");
      px(g, 98, 180, 6, 4, "#c0392b");
      px(g, 98, 180, 6, 1, "#e05545");
      /* label */
      px(g, 63, 188, 26, 7, "#4a3324");
      window.PixelFont.drawCentered(g, "MAIL", 76, 188, { color: "#e6dcc4" });
    });
  }

  function buildCat() {
    return bake(226, 146, 42, 26, function (g) {
      ellipse(g, 247, 168, 15, 4, "rgba(0,0,0,0.25)");
      ellipse(g, 248, 161, 14, 6, "#3b3b46");
      ellipse(g, 248, 160, 12, 5, "#454552");
      ellipse(g, 235, 158, 6, 5, "#3b3b46");
      ellipse(g, 235, 157, 5, 4, "#4a4a58");
      /* ears */
      px(g, 231, 152, 2, 3, "#3b3b46");
      px(g, 238, 152, 2, 3, "#3b3b46");
      px(g, 231, 153, 1, 1, "#5a4a4a");
      px(g, 238, 153, 1, 1, "#5a4a4a");
      /* face */
      px(g, 232, 157, 2, 1, "#1d1d24");
      px(g, 237, 157, 2, 1, "#1d1d24");
      px(g, 235, 159, 1, 1, "#c98d7a");
      /* stripes */
      px(g, 245, 157, 4, 1, "#2c2c36");
      px(g, 250, 159, 4, 1, "#2c2c36");
      px(g, 244, 163, 5, 1, "#2c2c36");
      /* tail */
      px(g, 259, 162, 4, 1, "#3b3b46");
      px(g, 262, 159, 1, 3, "#3b3b46");
      px(g, 261, 157, 1, 2, "#3b3b46");
      /* paws */
      px(g, 241, 165, 4, 1, "#4a4a58");
      px(g, 233, 164, 4, 1, "#4a4a58");
    });
  }

  function buildProps() {
    var shelf = buildBookshelf();
    var desk = buildDesk();
    var lamp = buildLamp();
    var plant = buildPlant();
    var mailbox = buildMailbox();
    var cat = buildCat();

    props = [
      { y: 96, draw: function (ctx) { ctx.drawImage(shelf.canvas, shelf.x, shelf.y); } },
      {
        y: 90,
        draw: function (ctx, t) {
          ctx.drawImage(desk.canvas, desk.x, desk.y);
          drawScreens(ctx, t);
          drawSteam(ctx, t);
        },
      },
      { y: 150, draw: function (ctx) { ctx.drawImage(lamp.canvas, lamp.x, lamp.y); } },
      {
        y: 168,
        draw: function (ctx, t) {
          var breathe = Math.sin(t * 1.6) > 0 ? 1 : 0;
          ctx.save();
          ctx.translate(0, -breathe);
          ctx.drawImage(cat.canvas, cat.x, cat.y);
          ctx.restore();
        },
      },
      { y: 180, draw: function (ctx) { ctx.drawImage(plant.canvas, plant.x, plant.y); } },
      { y: 212, draw: function (ctx) { ctx.drawImage(mailbox.canvas, mailbox.x, mailbox.y); } },
    ];
  }

  /* ---- live screen content ---------------------------------------- */
  function drawScreens(ctx, t) {
    /* left: code editor */
    var lx = 161, ly = 15;
    ctx.fillStyle = "#0b1018";
    ctx.fillRect(lx, ly, 50, 26);
    ctx.fillStyle = "#141b26";
    ctx.fillRect(lx, ly, 50, 4);
    ctx.fillStyle = "#ff6b6b"; ctx.fillRect(lx + 2, ly + 1, 1, 1);
    ctx.fillStyle = "#ffb454"; ctx.fillRect(lx + 4, ly + 1, 1, 1);
    ctx.fillStyle = "#6ee7c7"; ctx.fillRect(lx + 6, ly + 1, 1, 1);

    var code = [
      [0, 10, "#7aa2f7"], [0, 16, "#9ece6a"], [2, 12, "#e0af68"],
      [2, 20, "#7aa2f7"], [4, 8, "#565f89"], [4, 22, "#9ece6a"],
      [2, 14, "#bb9af7"], [0, 6, "#7aa2f7"],
    ];
    for (var i = 0; i < code.length; i++) {
      var y = ly + 7 + i * 2;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(lx + 2, y, 2, 1);
      ctx.fillStyle = code[i][2];
      ctx.fillRect(lx + 7 + code[i][0], y, code[i][1], 1);
    }
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = "#e9e5dd";
      ctx.fillRect(lx + 24, ly + 21, 4, 1);
    }

    /* right: terminal */
    var rx = 225, ry = 15;
    ctx.fillStyle = "#08110d";
    ctx.fillRect(rx, ry, 50, 26);
    ctx.fillStyle = "#101b16";
    ctx.fillRect(rx, ry, 50, 4);
    ctx.fillStyle = "#3a6b52"; ctx.fillRect(rx + 2, ry + 1, 1, 1);
    ctx.fillStyle = "#2f5a45"; ctx.fillRect(rx + 4, ry + 1, 1, 1);
    window.PixelFont.draw(ctx, "MN@DEV", rx + 3, ry + 6, { color: "#6ee7a0" });
    window.PixelFont.draw(ctx, "> BUILD", rx + 3, ry + 14, { color: "#a8e6b8" });
    /* progress */
    ctx.fillStyle = "#16321f"; ctx.fillRect(rx + 3, ry + 22, 42, 2);
    var pw = Math.floor(42 * (0.55 + 0.45 * Math.abs(Math.sin(t * 0.5))));
    ctx.fillStyle = "#6ee7a0"; ctx.fillRect(rx + 3, ry + 22, pw, 2);
    ctx.fillStyle = "rgba(110,231,160,0.25)"; ctx.fillRect(rx + 3, ry + 24, 42, 1);

    /* scanline flicker */
    ctx.fillStyle = "rgba(120,190,255," + (0.015 + 0.015 * Math.sin(t * 9)) + ")";
    ctx.fillRect(158, 12, 120, 34);
  }

  function drawSteam(ctx, t) {
    for (var i = 0; i < 3; i++) {
      var p = steam[i];
      if (!p) continue;
      var a = Math.max(0, 1 - p.life / p.max);
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = "#e8e2d6";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      ctx.globalAlpha = a * 0.25;
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) + 1, 2, 1);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Overlay lighting + particles                                      */
  /* ---------------------------------------------------------------- */
  function drawOverlay(ctx, t) {
    /* lamp glow */
    ctx.globalCompositeOperation = "lighter";
    var pulse = 0.92 + Math.sin(t * 1.3) * 0.08;
    var lg = ctx.createRadialGradient(104, 112, 6, 104, 118, 96);
    lg.addColorStop(0, "rgba(255,178,92," + (0.20 * pulse) + ")");
    lg.addColorStop(0.45, "rgba(255,150,70,0.07)");
    lg.addColorStop(1, "rgba(255,140,60,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 60, 250, 164);

    var mg = ctx.createRadialGradient(216, 34, 8, 216, 46, 110);
    mg.addColorStop(0, "rgba(110,190,255,0.10)");
    mg.addColorStop(1, "rgba(90,160,255,0)");
    ctx.fillStyle = mg;
    ctx.fillRect(120, 0, 200, 140);

    var wg = ctx.createRadialGradient(332, 42, 8, 332, 48, 100);
    wg.addColorStop(0, "rgba(130,175,255,0.08)");
    wg.addColorStop(1, "rgba(110,150,255,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(250, 0, 134, 150);

    ctx.globalCompositeOperation = "source-over";

    /* vignette */
    var vg = ctx.createRadialGradient(192, 118, 70, 192, 118, 250);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(0.72, "rgba(4,5,9,0.18)");
    vg.addColorStop(1, "rgba(3,4,7,0.62)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    /* dust */
    ctx.fillStyle = "#ffe9c4";
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      ctx.globalAlpha = d.a * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + d.ph)));
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function update(dt, t) {
    /* dust drift */
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.y -= d.vy * dt;
      d.x += Math.sin(t * 0.6 + d.ph) * 3 * dt;
      if (d.y < 52) { d.y = 216; d.x = 14 + Math.random() * 356; }
    }
    /* steam */
    for (var s = 0; s < steam.length; s++) {
      var p = steam[s];
      p.life += dt;
      p.y -= 9 * dt;
      p.x += Math.sin(p.life * 3 + s) * 4 * dt;
      if (p.life > p.max) {
        steam[s] = { x: 174 + Math.random() * 3, y: 54, life: 0, max: 1.6 + Math.random() };
      }
    }
  }

  /* ---------------------------------------------------------------- */
  var api = {
    W: W, H: H,
    get solids() { return solids; },
    get props() { return props; },
    get interactables() { return interactables; },
    init: function () {
      bg = buildBackground();
      buildProps();

      dust = [];
      for (var i = 0; i < 26; i++) {
        dust.push({
          x: 14 + Math.random() * 356,
          y: 52 + Math.random() * 164,
          vy: 2 + Math.random() * 5,
          a: 0.08 + Math.random() * 0.22,
          ph: Math.random() * 6.28,
        });
      }
      steam = [];
      for (var s = 0; s < 3; s++) {
        steam.push({ x: 174 + Math.random() * 3, y: 54, life: Math.random() * 1.5, max: 1.6 + Math.random() });
      }

      solids = [
        { x: 14, y: 86, w: 68, h: 10 },
        { x: 146, y: 56, w: 140, h: 34 },
        { x: 94, y: 140, w: 22, h: 10 },
        { x: 336, y: 166, w: 38, h: 12 },
        { x: 54, y: 194, w: 46, h: 20 },
      ];

      interactables = [
        {
          id: "npc", name: "MOHAMED NASR", label: "TALK",
          hit: { x: 288, y: 84, w: 26, h: 30 },
          zone: { x: 276, y: 94, w: 52, h: 40 },
          stand: { x: 300, y: 134 },
          prompt: { x: 301, y: 80 },
        },
        {
          id: "desk", name: "DUAL-MONITOR RIG", label: "PROJECTS",
          hit: { x: 148, y: 10, w: 136, h: 80 },
          zone: { x: 136, y: 88, w: 164, h: 24 },
          stand: { x: 216, y: 100 },
          prompt: { x: 216, y: 6 },
        },
        {
          id: "board", name: "GITHUB BOARD", label: "OPEN",
          hit: { x: 92, y: 4, w: 62, h: 42 },
          zone: { x: 84, y: 52, w: 82, h: 24 },
          stand: { x: 122, y: 66 },
          prompt: { x: 123, y: 2 },
        },
        {
          id: "shelf", name: "BOOKSHELF", label: "SKILLS",
          hit: { x: 14, y: 22, w: 66, h: 76 },
          zone: { x: 4, y: 92, w: 90, h: 22 },
          stand: { x: 52, y: 102 },
          prompt: { x: 47, y: 20 },
        },
        {
          id: "mailbox", name: "MAILBOX", label: "CONTACT",
          hit: { x: 52, y: 168, w: 50, h: 48 },
          zone: { x: 44, y: 186, w: 76, h: 28 },
          stand: { x: 108, y: 200 },
          prompt: { x: 76, y: 166 },
        },
        {
          id: "cat", name: "SLEEPING CAT", label: "PET",
          hit: { x: 226, y: 148, w: 40, h: 24 },
          zone: { x: 218, y: 162, w: 62, h: 24 },
          stand: { x: 248, y: 178 },
          prompt: { x: 247, y: 146 },
        },
      ];
    },
    drawBase: function (ctx) { ctx.drawImage(bg.canvas, 0, 0); },
    update: update,
    drawOverlay: drawOverlay,
  };

  return api;
})();
