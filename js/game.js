/* Game loop: movement, collision, camera-less room rendering, interactions. */
window.Game = (function () {
  "use strict";

  var W = 384, H = 224;
  var I18N = window.I18N;
  function t(key, vars) { return I18N.t(key, vars); }
  var canvas, ctx;
  var uiPaused = false;
  var lastTs = 0;
  var time = 0;
  var isTouch = false;
  var active = null;
  var keys = Object.create(null);
  var walkTarget = null;      /* where the visitor is heading (drawn as a marker) */
  var path = [];              /* the remaining waypoints of that walk */
  var pendingInteract = null; /* the object to open once the walk arrives */
  var pendingZone = null;     /* ...and the zone that counts as "arrived" */
  var stuckFor = 0;           /* seconds spent without getting closer */
  var stuckFrom = Infinity;   /* distance to the current waypoint last frame */
  var steps = 0;
  var spritesReady = false;   /* flips once the character art source is final */
  var MIN_BOOT_MS = 450;      /* keeps the boot screen from blinking away */
  var BOOT_TIMEOUT_MS = 6000; /* never hold the room hostage to a slow file */

  var parts = [];             /* hearts, sparks, confetti */
  var pet = null;             /* the cat, once it follows you */
  var emote = null;           /* the little bubble above the visitor */
  var npcEmote = null;        /* the bubble above Mohamed when he greets you */
  var legend = false;         /* every secret found */
  var lastDt = 0.016;         /* for the DEV MODE readout */

  var player = {
    x: 192, y: 190, dir: "up", moving: false, frame: 0, anim: 0, speed: 64,
  };
  var BASE_SPEED = 64;
  var npc = { x: 301, y: 112, dir: "down", frame: 0, anim: 0, moving: false };

  /* Guided tour state (driven by js/onboarding.js). While a tour runs the room
     keeps simulating: Mohamed walks himself, the visitor follows on autopilot,
     the two never collide, and proximity prompts are muted. */
  var npcPath = [];           /* the waypoints Mohamed is walking */
  var npcGhost = false;       /* the NPC stops blocking the visitor */
  var tourMode = false;       /* hides prompts/cursor while Mohamed guides */
  var tourMove = null;        /* the move currently being awaited */

  /* ---------------------------------------------------------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hitbox(x, y) {
    return { x: x - 5, y: y - 7, w: 10, h: 7 };
  }

  /* The walkable box of the room. Collision, pathfinding and the click targets
     all use these four numbers. */
  var ROOM = { x0: 12, y0: 56, x1: 372, y1: 214 };

  /* Solid geometry only: the 10x7 footprint against the furniture and walls. */
  function solidsBlocked(x, y) {
    var hb = hitbox(x, y);
    if (hb.x < ROOM.x0 || hb.x + hb.w > ROOM.x1) return true;
    if (hb.y < ROOM.y0 || hb.y + hb.h > ROOM.y1) return true;
    var solids = Room.solids;
    for (var i = 0; i < solids.length; i++) {
      if (aabb(hb, solids[i])) return true;
    }
    return false;
  }

  /* A spot the visitor can actually stand on. */
  function standable(x, y) { return !solidsBlocked(x, y); }

  function npcBox() { return { x: npc.x - 7, y: npc.y - 7, w: 14, h: 7 }; }

  /* Mohamed steps aside instead of turning into a wall. */
  function nudgeNpc(px, py) {
    var dx = npc.x - px, dy = npc.y - py;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = npc.x + (dx / len) * 1.6;
    var ny = npc.y + (dy / len) * 1.6;
    if (!solidsBlocked(nx, ny)) { npc.x = nx; npc.y = ny; }
    else if (!solidsBlocked(npc.x, ny)) { npc.y = ny; }
    else if (!solidsBlocked(nx, npc.y)) { npc.x = nx; }
  }

  function blocked(x, y) {
    if (solidsBlocked(x, y)) return true;
    if (npcGhost) return false;
    return aabb(hitbox(x, y), npcBox());
  }

  /* The same test from Mohamed's point of view. */
  function npcBlocked(x, y) {
    if (solidsBlocked(x, y)) return true;
    if (npcGhost) return false;
    return aabb(hitbox(x, y), hitbox(player.x, player.y));
  }

  /* One step, axis by axis, so the visitor slides along furniture instead of
     stopping dead at it. Returns whether anything actually moved. */
  function moveBy(dx, dy) {
    var moved = false;
    if (dx) {
      var nx = player.x + dx;
      if (!solidsBlocked(nx, player.y)) {
        if (blocked(nx, player.y)) nudgeNpc(nx, player.y);
        if (!blocked(nx, player.y)) { player.x = nx; moved = true; }
      }
    }
    if (dy) {
      var ny = player.y + dy;
      if (!solidsBlocked(player.x, ny)) {
        if (blocked(player.x, ny)) nudgeNpc(player.x, ny);
        if (!blocked(player.x, ny)) { player.y = ny; moved = true; }
      }
    }
    return moved;
  }

  /* ---------------------------------------------------------------- */
  /* NAVIGATION. A coarse grid (8px cells) over the walkable box, with
     Dijkstra run from the visitor's own cell. A click therefore becomes a
     real route around the furniture — the lamp base, the shelf, the
     mailbox and the desk — instead of a straight line that grinds.       */
  var CELL = 8;
  var DX = [1, -1, 0, 0, 1, 1, -1, -1];
  var DY = [0, 0, 1, -1, 1, -1, 1, -1];
  var NAV = { cols: 0, rows: 0, grid: null };

  function cellX(c) { return ROOM.x0 + c * CELL + CELL / 2; }
  function cellY(r) { return ROOM.y0 + r * CELL + CELL / 2; }
  function cellCol(x) { return Math.floor((x - ROOM.x0) / CELL); }
  function cellRow(y) { return Math.floor((y - ROOM.y0) / CELL); }
  function inNav(c, r) { return c >= 0 && r >= 0 && c < NAV.cols && r < NAV.rows; }

  function buildNav() {
    NAV.cols = Math.max(1, Math.floor((ROOM.x1 - ROOM.x0) / CELL));
    NAV.rows = Math.max(1, Math.floor((ROOM.y1 - ROOM.y0) / CELL));
    NAV.grid = new Uint8Array(NAV.cols * NAV.rows);
    for (var r = 0; r < NAV.rows; r++) {
      for (var c = 0; c < NAV.cols; c++) {
        NAV.grid[r * NAV.cols + c] = standable(cellX(c), cellY(r)) ? 1 : 0;
      }
    }
  }

  /* Closest walkable cell to a point, spiralling outwards. */
  function nearestCell(x, y) {
    if (!NAV.grid) return -1;
    var cols = NAV.cols;
    var c0 = cellCol(x), r0 = cellRow(y);
    if (inNav(c0, r0) && NAV.grid[r0 * cols + c0]) return r0 * cols + c0;
    var span = Math.max(cols, NAV.rows);
    for (var rad = 1; rad <= span; rad++) {
      var best = -1, bestD = Infinity;
      for (var r = r0 - rad; r <= r0 + rad; r++) {
        for (var c = c0 - rad; c <= c0 + rad; c++) {
          if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== rad) continue;
          if (!inNav(c, r) || !NAV.grid[r * cols + c]) continue;
          var wx = cellX(c) - x, wy = cellY(r) - y;
          var d = wx * wx + wy * wy;
          if (d < bestD) { bestD = d; best = r * cols + c; }
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  function nearestSpot(x, y) {
    var k = nearestCell(x, y);
    if (k < 0) return null;
    var cols = NAV.cols, c = k % cols, r = (k - c) / cols;
    return { x: cellX(c), y: cellY(r) };
  }

  /* Is the straight segment walkable for the visitor? */
  function lineClear(x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(len / 3));
    for (var i = 1; i <= steps; i++) {
      var k = i / steps;
      if (!standable(x0 + dx * k, y0 + dy * k)) return false;
    }
    return true;
  }

  /* Route from (fx, fy) to (tx, ty). When `zone` is given, the walk ends on a
     spot inside it, so the thing you clicked is actually reachable. Returns an
     array of waypoints (empty = already there) or null. */
  function navRoute(fx, fy, tx, ty, zone) {
    tx = clamp(tx, ROOM.x0 + 4, ROOM.x1 - 4);
    ty = clamp(ty, ROOM.y0 + 4, ROOM.y1 - 4);

    /* straight shot: shortest, smoothest, and the common case */
    if (standable(tx, ty) && lineClear(fx, fy, tx, ty)) return [{ x: tx, y: ty }];

    var cols = NAV.cols, rows = NAV.rows, grid = NAV.grid;
    if (!grid) return null;
    var total = cols * rows;
    var start = nearestCell(fx, fy);
    if (start < 0) return null;

    var dist = new Float32Array(total);
    var prev = new Int32Array(total);
    var done = new Uint8Array(total);
    for (var i = 0; i < total; i++) { dist[i] = Infinity; prev[i] = -1; }

    var heap = [start];
    var hd = [0];
    dist[start] = 0;

    function swap(a, b) {
      var t = heap[a]; heap[a] = heap[b]; heap[b] = t;
      var u = hd[a]; hd[a] = hd[b]; hd[b] = u;
    }
    function push(k, d) {
      heap.push(k); hd.push(d);
      var i2 = heap.length - 1;
      while (i2 > 0) {
        var p = (i2 - 1) >> 1;
        if (hd[p] <= hd[i2]) break;
        swap(p, i2);
        i2 = p;
      }
    }
    function pop() {
      var top = heap[0];
      var last = heap.pop(), lastD = hd.pop();
      if (heap.length) {
        heap[0] = last;
        hd[0] = lastD;
        var i3 = 0;
        for (;;) {
          var l = i3 * 2 + 1, r2 = l + 1, m = i3;
          if (l < heap.length && hd[l] < hd[m]) m = l;
          if (r2 < heap.length && hd[r2] < hd[m]) m = r2;
          if (m === i3) break;
          swap(m, i3);
          i3 = m;
        }
      }
      return top;
    }

    while (heap.length) {
      var k = pop();
      if (done[k]) continue;
      done[k] = 1;
      var c = k % cols, r = (k - c) / cols;
      for (var d = 0; d < 8; d++) {
        var nc = c + DX[d], nr = r + DY[d];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        var nk = nr * cols + nc;
        if (!grid[nk] || done[nk]) continue;
        var diag = DX[d] !== 0 && DY[d] !== 0;
        /* no cutting corners between two blocked cells */
        if (diag && (!grid[r * cols + nc] || !grid[nr * cols + c])) continue;
        var nd = dist[k] + (diag ? 1.41421356 : 1);
        if (nd < dist[nk] - 1e-6) { dist[nk] = nd; prev[nk] = k; push(nk, nd); }
      }
    }

    /* the best reachable cell: inside the zone when there is one, and as close
       to the exact point as possible */
    var goal = -1, bestScore = Infinity;
    for (var g = 0; g < total; g++) {
      if (!isFinite(dist[g])) continue;
      var gc = g % cols, gr = (g - gc) / cols;
      var wx = cellX(gc), wy = cellY(gr);
      var score = Math.abs(wx - tx) + Math.abs(wy - ty);
      if (zone && rectDist(wx, wy, zone) > 0) score += 10000;
      if (score < bestScore) { bestScore = score; goal = g; }
    }
    if (goal < 0) return null;

    var chain = [];
    for (var node = goal; node >= 0; node = prev[node]) {
      chain.push(node);
      if (node === start) break;
    }
    chain.reverse();

    var points = [];
    for (var q = 1; q < chain.length; q++) {
      var c4 = chain[q] % cols, r4 = (chain[q] - c4) / cols;
      points.push({ x: cellX(c4), y: cellY(r4) });
    }
    /* land on the exact spot when it is standable and the last hop is clear */
    if (standable(tx, ty)) {
      var lastPoint = points.length ? points[points.length - 1] : { x: fx, y: fy };
      if (lineClear(lastPoint.x, lastPoint.y, tx, ty)) points.push({ x: tx, y: ty });
    }
    return points;
  }

  /* ---------------------------------------------------------------- */
  /* Walking a route                                                     */
  function startRoute(x, y, zone, interactId) {
    var points = navRoute(player.x, player.y, x, y, zone);
    if (!points) { endRoute(false); walkTarget = null; return false; }

    path = points;
    stuckFor = 0;
    stuckFrom = Infinity;
    pendingInteract = interactId || null;
    pendingZone = interactId ? (zone || null) : null;

    if (!points.length) {
      /* already standing there */
      walkTarget = null;
      if (pendingInteract) endRoute(true);
      return true;
    }
    walkTarget = { x: x, y: y };
    return true;
  }

  function endRoute(arrived) {
    path = [];
    walkTarget = null;
    stuckFor = 0;
    stuckFrom = Infinity;
    player.moving = false;
    var id = pendingInteract;
    pendingInteract = null;
    pendingZone = null;
    if (arrived && id) interact(id);
  }

  function followPath(dt) {
    var node = path[0];
    if (!node) { endRoute(true); return; }

    var dx = node.x - player.x, dy = node.y - player.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 2.2) {
      player.x = node.x;
      player.y = node.y;
      path.shift();
      player.moving = true;
      stuckFor = 0;
      stuckFrom = Infinity;
      if (!path.length) endRoute(true);
      return;
    }

    var len = dist || 1;
    var step = Math.min(dist, player.speed * dt);
    var moved = moveBy((dx / len) * step, (dy / len) * step);
    setDir(dx, dy);
    player.moving = true;

    if (dist < stuckFrom - 0.2) {
      stuckFrom = dist;
      stuckFor = 0;
      return;
    }

    stuckFor += dt;
    if (stuckFor < 0.45) return;

    /* wedged: drop this waypoint and re-plan from where we actually are */
    stuckFor = 0;
    stuckFrom = Infinity;
    path.shift();
    if (!path.length) { endRoute(true); return; }
    if (!moved && walkTarget) {
      var rest = navRoute(player.x, player.y, walkTarget.x, walkTarget.y, pendingZone);
      if (rest && rest.length) path = rest;
      else if (!rest) endRoute(true);
    }
  }

  function setDir(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx > 0 ? "right" : "left";
    else player.dir = dy > 0 ? "down" : "up";
  }

  function rectDist(x, y, r) {
    var dx = Math.max(r.x - x, 0, x - (r.x + r.w));
    var dy = Math.max(r.y - y, 0, y - (r.y + r.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  function nearest() {
    var best = null, bestD = 1e9;
    var list = Room.interactables;
    for (var i = 0; i < list.length; i++) {
      var d = rectDist(player.x, player.y, list[i].zone);
      if (d < bestD) { bestD = d; best = list[i]; }
    }
    return bestD <= 0 ? best : null;
  }

  /* ---------------------------------------------------------------- */
  /* Mohamed walking himself: used by the guided tour so he can lead the
     visitor from station to station. He follows the same grid route. */
  function updateNpc(dt) {
    if (!npcPath.length) {
      if (npc.moving) { npc.moving = false; npc.frame = 0; npc.anim = 0; }
      return;
    }

    var node = npcPath[0];
    var tx = node.x - npc.x;
    var ty = node.y - npc.y;
    var dist = Math.sqrt(tx * tx + ty * ty);

    if (dist <= 2.2) {
      npc.x = node.x;
      npc.y = node.y;
      npcPath.shift();
      if (!npcPath.length) { npc.moving = false; npc.frame = 0; npc.anim = 0; }
      return;
    }

    var speed = BASE_SPEED * 1.35;      /* he leads, so he is a touch faster */
    var step = Math.min(dist, speed * dt);
    var nx = npc.x + (tx / dist) * step;
    var ny = npc.y + (ty / dist) * step;

    if (!npcBlocked(nx, ny)) { npc.x = nx; npc.y = ny; }
    else if (!npcBlocked(npc.x, ny)) { npc.y = ny; }
    else if (!npcBlocked(nx, npc.y)) { npc.x = nx; }
    else {
      /* wedged: drop the waypoint and carry on with the rest of the route */
      npcPath.shift();
      if (!npcPath.length) { npc.moving = false; npc.frame = 0; npc.anim = 0; }
      return;
    }

    npc.dir = Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? "right" : "left")
      : (ty > 0 ? "down" : "up");
    npc.moving = true;
    npc.anim += dt;
    npc.frame = Math.floor(npc.anim * 9) % 4;
  }

  /* Finish (or abandon) the move the tour is waiting on. */
  function endTourMove(forced) {
    var m = tourMove;
    if (!m) return;
    tourMove = null;
    npcPath = [];
    path = [];
    walkTarget = null;
    pendingInteract = null;
    pendingZone = null;
    if (forced) {
      /* never leave the tour stuck: place both of them on the nearest spot */
      if (m.npc) {
        var ns = nearestSpot(m.npc.x, m.npc.y);
        if (ns) { npc.x = ns.x; npc.y = ns.y; }
      }
      if (m.player) {
        var ps = standable(m.player.x, m.player.y) ? m.player : nearestSpot(m.player.x, m.player.y);
        if (ps) { player.x = ps.x; player.y = ps.y; }
      }
      npc.moving = false;
      player.moving = false;
    }
    npc.frame = 0;
    npc.anim = 0;
    if (m.done) m.done(forced);
  }

  function updateTourMove() {
    if (!tourMove) return;
    var npcOk = !tourMove.npc || !npcPath.length;
    var playerOk = !tourMove.player || !path.length;
    if (npcOk && playerOk) endTourMove(false);
    else if (time > tourMove.deadline) endTourMove(true);
  }

  /* Nearest free standing spot for Mohamed, searched back towards wherever he
     already is so he never lands inside the furniture. */
  function npcFreeSpot(x, y) {
    x = clamp(x, 16, 368);
    y = clamp(y, 58, 212);
    if (!npcBlocked(x, y)) return { x: x, y: y };
    for (var i = 1; i <= 18; i++) {
      var nx = npc.x + (x - npc.x) * (1 - i / 18);
      var ny = npc.y + (y - npc.y) * (1 - i / 18);
      if (!npcBlocked(nx, ny)) return { x: nx, y: ny };
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  function update(dt) {
    var dx = 0, dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    if (dx || dy) {
      endRoute(false);            /* taking the wheel cancels the route */
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      moveBy((dx / len) * player.speed * dt, (dy / len) * player.speed * dt);
      setDir(dx, dy);
      player.moving = true;
    } else if (path.length) {
      followPath(dt);
    } else {
      walkTarget = null;
      player.moving = false;
    }

    if (player.moving) {
      player.anim += dt;
      player.frame = Math.floor(player.anim * 9) % 4;
      if (player.frame % 2 === 0 && Math.floor(player.anim * 9) !== steps) {
        steps = Math.floor(player.anim * 9);
      }
    } else {
      player.frame = 0;
      player.anim = 0;
    }

    active = (uiPaused || tourMode) ? null : nearest();
    updateCursor();
    updateNpc(dt);

    updatePet(dt);
    updateParts(dt);
    if (window.Secrets && window.Secrets.tick) {
      window.Secrets.tick(dt, player.x, player.y, player.moving, uiPaused);
    }

    updateTourMove();
  }

  /* ---------------------------------------------------------------- */
  /* Little effects: hearts for a recruiter, sparks for secrets,        */
  /* confetti for finishing everything.                                */
  function spawn(n, x, y, kind) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 14 + Math.random() * 40;
      parts.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y - 12 + (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * sp * 0.5,
        vy: -Math.abs(Math.sin(a)) * sp - 12,
        life: 0,
        max: 0.9 + Math.random() * 0.8,
        kind: kind,
        c: kind === "heart" ? "#ff6b8a" : kind === "confetti"
          ? ["#ffb454", "#6ee7c7", "#7aa2f7", "#bb9af7", "#e9e5dd"][i % 5]
          : "#ffd479",
      });
    }
  }

  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 26 * dt;
      if (p.life >= p.max) parts.splice(i, 1);
    }
  }

  function drawParts() {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var k = 1 - p.life / p.max;
      var x = Math.round(p.x), y = Math.round(p.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, k * 1.4));
      ctx.fillStyle = p.c;
      if (p.kind === "heart") {
        ctx.fillRect(x - 2, y - 1, 2, 2);
        ctx.fillRect(x + 1, y - 1, 2, 2);
        ctx.fillRect(x - 3, y - 2, 7, 2);
        ctx.fillRect(x - 2, y + 1, 5, 1);
        ctx.fillRect(x - 1, y + 2, 3, 1);
      } else if (p.kind === "confetti") {
        ctx.fillRect(x, y, 2, 2);
        ctx.fillRect(x, y + 2, 1, 1);
      } else {
        ctx.fillRect(x, y, 1, 1);
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* A little speech/thought bubble above a character. */
  function drawBubble(text, cx, cy) {
    var x = Math.round(cx), y = Math.round(cy);
    var w = window.PixelFont.width(text) + 13;
    ctx.fillStyle = "rgba(6,9,14,0.85)";
    ctx.fillRect(x - Math.round(w / 2), y - 8, w, 15);
    ctx.fillStyle = "#ffb454";
    ctx.fillRect(x - Math.round(w / 2), y - 8, w, 1);
    ctx.fillRect(x - Math.round(w / 2), y + 6, w, 1);
    ctx.fillRect(x - Math.round(w / 2), y - 8, 1, 15);
    ctx.fillRect(x - Math.round(w / 2) + w - 1, y - 8, 1, 15);
    ctx.fillRect(x - 2, y + 7, 4, 2);
    window.PixelFont.draw(ctx, text, x - Math.round(w / 2) + 6, y - 5, { color: "#e9e5dd" });
  }

  /* the visitor's own bubble ("zZ", "!", "♥") */
  function drawEmote() {
    if (!emote || emote.until <= time) return;
    drawBubble(emote.text, player.x, Math.round(player.y) - 54);
  }

  /* Mohamed's bubble — used when he greets you on arrival */
  function drawNpcEmote() {
    if (!npcEmote || npcEmote.until <= time) return;
    drawBubble(npcEmote.text, npc.x, Math.round(npc.y) - 52);
  }

  /* ---------------------------------------------------------------- */
  /* DEV MODE (konami): boxes, zones and numbers, straight from the      */
  /* data the game actually uses.                                       */
  function drawDebug() {
    var i, it;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "#6ee7c7";
    ctx.lineWidth = 1;
    ctx.font = "6px monospace";
    ctx.fillStyle = "#6ee7c7";

    ctx.beginPath();
    for (i = 0; i < Room.solids.length; i++) {
      var s = Room.solids[i];
      ctx.rect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    }
    ctx.stroke();

    for (i = 0; i < Room.interactables.length; i++) {
      it = Room.interactables[i];
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#7aa2f7";
      ctx.fillRect(it.zone.x, it.zone.y, it.zone.w, it.zone.h);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(it.stand.x - 1, it.stand.y - 1, 3, 3);
      ctx.fillStyle = "#6ee7c7";
      ctx.fillRect(it.hit.x, it.hit.y, it.hit.w, 1);
    }

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#6ee7c7";
    ctx.fillRect(player.x - 5, player.y - 7, 10, 7);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ffb454";
    ctx.fillRect(player.x - 5, player.y - 7, 10, 7);
    ctx.globalAlpha = 1;
    ctx.restore();

    var label = "DEV MODE " + W + "x" + H +
      " " + Math.round(1 / Math.max(lastDt, 0.001)) + "FPS" +
      " X" + Math.round(player.x) + " Y" + Math.round(player.y) +
      " W" + window.Secrets.walked() + "px";
    var lw = window.PixelFont.width(label) + 6;
    ctx.fillStyle = "rgba(6,9,14,0.8)";
    ctx.fillRect(4, 4, lw, 11);
    ctx.fillStyle = "#6ee7c7";
    ctx.fillRect(4, 4, lw, 1);
    window.PixelFont.draw(ctx, label, 7, 6, { color: "#a9f5dd" });
  }

  /* ---------------------------------------------------------------- */
  /* Rewards for the secrets                                            */
  function wakePet(x, y) {
    if (pet) return;
    pet = { x: x, y: y, dir: "down", frame: 0, anim: 0 };
  }

  function becomeLegend() {
    if (legend) return;
    legend = true;
    document.body.classList.add("is-legend");
    var lv = document.querySelector(".dlg-lv");
    if (lv) lv.textContent = "LV. 100";
  }

  /* Rewards that should still be true after a reload: the follower cat, the
     speed boost and the LV.100 aura are part of the room now. */
  function restoreSecrets() {
    if (!window.Secrets) return;
    if (window.Secrets.has("cat")) wakePet(226, 162);
    if (window.Secrets.has("marathon")) player.speed = Math.round(BASE_SPEED * 1.2);
    if (window.Secrets.complete()) becomeLegend();
  }

  function onSecret(id) {
    if (id === "cat") {
      wakePet(player.x + 12, player.y + 10);
      spawn(10, player.x, player.y, "spark");
    } else if (id === "lamp") {
      spawn(8, 104, 112, "spark");
    } else if (id === "hire") {
      spawn(16, player.x, player.y, "heart");
      emote = { text: "HI!", until: time + 3 };
    } else if (id === "idle") {
      emote = { text: "zZ", until: time + 3.4 };
      if (window.Audio8) window.Audio8.play("yawn");
    } else if (id === "marathon") {
      player.speed = Math.round(BASE_SPEED * 1.2);
      spawn(14, player.x, player.y, "spark");
    } else if (id === "konami") {
      spawn(20, player.x, player.y, "confetti");
    } else if (id === "octocat") {
      spawn(14, 316, 168, "spark");
    } else if (id === "all") {
      becomeLegend();
      for (var i = 0; i < 4; i++) {
        spawn(24, 60 + i * 90, 90 + (i % 2) * 40, "confetti");
      }
    }
  }

  function onIdleProgress(left) {
    /* gentle hint: a thought bubble appears when the egg is close */
    if (left > 0 && left <= 5 && (!emote || emote.until <= time)) {
      emote = { text: "hmm", until: time + 1 };
    }
  }

  /* The follower cat: trails the visitor, never blocks, never falls behind
     forever. Simple steering is enough at 384x224. */
  function updatePet(dt) {
    if (!pet) return;
    var dx = player.x - pet.x;
    var dy = player.y - pet.y - 10;      /* sits a little behind the feet */
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 26) {
      var sp = 44;
      var step = Math.min(dist, sp * dt);
      var nx = pet.x + (dx / dist) * step;
      var ny = pet.y + (dy / dist) * step;
      if (!blocked(nx, ny)) { pet.x = nx; pet.y = ny; }
      else if (!blocked(pet.x, ny)) { pet.y = ny; }
      else if (!blocked(nx, pet.y)) { pet.x = nx; }
      if (Math.abs(dx) > Math.abs(dy)) pet.dir = dx > 0 ? "right" : "left";
      else pet.dir = dy > 0 ? "down" : "up";
      pet.anim += dt;
      pet.frame = Math.floor(pet.anim * 8) % 4;
    } else {
      pet.frame = 0;
    }
  }

  function drawPet() {
    if (!pet) return;
    if (!spritesReady) return;
    Room.drawCat(ctx, pet.x, pet.y, pet.dir, pet.frame, time);
  }

  /* ---------------------------------------------------------------- */
  function drawBrandAvatar() {
    var avatar = document.getElementById("brand-avatar");
    if (!avatar) return;
    var g = avatar.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    window.Sprites.renderPortrait(g, 2, {});
  }

  function drawCharacter(spr, x, y, opts) {
    opts = opts || {};
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "#05060a";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y) - 1, 9, 2.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (spr) ctx.drawImage(spr, Math.round(x) - 16, Math.round(y) - 48);
  }

  function drawPlayer() {
    var set = window.Sprites.player;
    if (!set) return;
    var dir = set[player.dir] || set.down;
    if (!dir || !dir.length) return;
    drawCharacter(dir[player.frame] || dir[0], player.x, player.y);
  }

  function drawNpc() {
    var frames = window.Sprites.npc;
    if (!frames) return;
    var dx = player.x - npc.x;
    var dy = player.y - npc.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var dir = npc.dir;
    /* he looks at the visitor when they are near — but keeps his course while
       he is walking the tour */
    if (dist < 84 && !npc.moving) {
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
      else dir = dy > 0 ? "down" : "up";
    }
    var set = frames[dir] || frames.down;
    if (!set || !set.length) return;
    var frame = npc.moving ? ((npc.frame || 0) % set.length) : 0;
    var bob = npc.moving ? 0 : (Math.sin(time * 1.5) > 0.72 ? -1 : 0);
    drawCharacter(set[frame] || set[0], npc.x, npc.y + bob);
  }

  /* ---------------------------------------------------------------- */
  function panel(x, y, w, h, fill, border) {
    ctx.fillStyle = "rgba(4,6,10,0.55)";
    ctx.fillRect(x + 1, y + 1, w, h);
    ctx.fillStyle = border;
    ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
    ctx.fillRect(x, y + 1, 1, h - 2);
    ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  }

  function drawPrompts() {
    if (!active || uiPaused) return;
    var key = isTouch ? "TAP" : "E";
    var label = active.name;
    var kw = window.PixelFont.width(key);
    var lw = window.PixelFont.width(label);
    var w = kw + lw + 17;
    var h = 14;
    var px = clamp(Math.round(active.prompt.x - w / 2), 4, W - w - 4);
    var py = Math.round(active.prompt.y + Math.sin(time * 3) * 1.5);

    panel(px, py, w, h, "#121722", "#ffb454");
    /* keycap */
    ctx.fillStyle = "#ffb454";
    ctx.fillRect(px + 4, py + 4, kw + 4, 6);
    window.PixelFont.draw(ctx, key, px + 6, py + 4, { color: "#1a1206" });
    window.PixelFont.draw(ctx, label, px + kw + 12, py + 4, { color: "#e9e5dd" });

    /* little pointer */
    ctx.fillStyle = "#ffb454";
    ctx.fillRect(px + w / 2 - 2, py + h - 1, 4, 1);
    ctx.fillRect(px + w / 2 - 1, py + h, 2, 1);
  }

  function drawWalkTarget() {
    if (!walkTarget) return;
    var pulse = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.globalAlpha = 0.35 + pulse * 0.5;
    ctx.fillStyle = "#ffb454";
    var x = Math.round(walkTarget.x), y = Math.round(walkTarget.y) - 1;
    ctx.fillRect(x, y - 3, 1, 1);
    ctx.fillRect(x - 1, y - 2, 3, 1);
    ctx.fillRect(x - 2, y - 1, 5, 1);
    ctx.fillRect(x - 1, y, 3, 1);
    ctx.fillRect(x, y + 1, 1, 1);
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    Room.drawBase(ctx);

    var items = Room.props.slice();
    /* only draw the characters once their art source is decided, so the
       built-in pixel characters are never shown before the sheets */
    if (spritesReady) {
      items.push({ y: npc.y, draw: drawNpc });
      items.push({ y: player.y, draw: drawPlayer });
      if (pet) items.push({ y: pet.y, draw: drawPet });
    }
    items.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < items.length; i++) items[i].draw(ctx, time);

    Room.setFocus(Math.round(player.x), Math.round(player.y) - 18);
    Room.drawOverlay(ctx, time);
    drawParts();
    drawWalkTarget();
    drawEmote();
    drawNpcEmote();
    drawPrompts();
    if (window.Secrets && window.Secrets.devMode()) drawDebug();
  }

  /* ---------------------------------------------------------------- */
  /* Boot: resolve the character art, then reveal the room.             */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function reveal() {
    if (spritesReady) return;
    spritesReady = true;

    var loader = document.getElementById("stage-loader");
    if (loader) {
      loader.classList.add("is-done");
      loader.setAttribute("aria-hidden", "true");
      /* drop it from the layout once the fade has had time to run, so the
         room can never be covered by a stalled transition */
      setTimeout(function () { loader.classList.add("is-gone"); }, 480);
    }
    document.body.classList.remove("is-booting");

    drawBrandAvatar();
    requestAnimationFrame(loop);

    /* Welcome duty belongs to Mohamed, not to a popup: js/onboarding.js
       listens for this and asks him to greet an arriving visitor. */
    document.dispatchEvent(new CustomEvent("room:ready"));
  }

  function boot() {
    var sheets = (window.PORTFOLIO && window.PORTFOLIO.sprites) || {};

    /* The sheets are the characters, so they are always requested. A failure
       is survivable: the room still runs, just without the two figures. */
    var result = null;
    var load = window.Sprites.load(sheets)
      .then(function (r) { result = r; return r; })
      .catch(function () { return null; });

    Promise.race([load, wait(BOOT_TIMEOUT_MS)])
      .then(function () {
        if (!result || !result.characters) {
          if (window.console && console.warn) {
            console.warn("[sprites] Character sheets did not resolve; the room will " +
              "show up without them.");
          }
          UI.toast(t("toast.artFail"));
        }
        return wait(MIN_BOOT_MS);
      })
      .then(reveal);
  }

  /* ---------------------------------------------------------------- */
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    lastDt = dt;
    if (document.hidden) return;
    time += dt;
    Room.update(dt, time);
    if (!uiPaused) update(dt);
    render();
  }

  /* ---------------------------------------------------------------- */
  function interact(id) {
    if (uiPaused) return;
    if (id === "npc") {
      UI.openDialogue();
    } else if (id === "desk") {
      UI.openModal("projects");
    } else if (id === "board") {
      UI.openModal("github");
    } else if (id === "shelf") {
      UI.openModal("skills");
    } else if (id === "mailbox") {
      UI.openModal("contact");
    } else if (id === "cat") {
      if (window.Secrets) window.Secrets.poke();
      else window.Audio8.play("confirm");
    } else if (id === "lamp") {
      var on = !Room.isLightsOn();
      Room.setLights(on);
      window.Audio8.play("power");
      UI.toast(on ? t("toast.lightsOn") : t("toast.lightsOff"));
      if (window.Secrets && !window.Secrets.has("lamp")) window.Secrets.unlock("lamp");
    }
  }

  function hitTest(x, y) {
    var list = Room.interactables;
    for (var i = 0; i < list.length; i++) {
      var h = list[i].hit;
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return list[i];
    }
    return null;
  }

  function toWorld(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }

  function walkTo(x, y) {
    startRoute(
      clamp(x, ROOM.x0 + 8, ROOM.x1 - 8),
      clamp(y, ROOM.y0 + 8, ROOM.y1 - 8),
      null,
      null
    );
  }

  function updateCursor() {
    if (isTouch) return;
    canvas.style.cursor = active ? "pointer" : "default";
  }

  /* ---------------------------------------------------------------- */
  function bindInput() {
    var moveKeys = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
      W: "up", S: "down", A: "left", D: "right",
    };

    window.addEventListener("keydown", function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (UI.isBlocking() || tourMode) return;
      var k = e.key;
      if (moveKeys[k]) {
        keys[moveKeys[k]] = true;
        if (k.indexOf("Arrow") === 0) e.preventDefault();
      }
      if (k === "e" || k === "E" || k === "Enter" || k === " ") {
        e.preventDefault();
        if (active) interact(active.id);
      }
    });

    window.addEventListener("keyup", function (e) {
      var moveKeys = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
        W: "up", S: "down", A: "left", D: "right",
      };
      if (moveKeys[e.key]) keys[moveKeys[e.key]] = false;
    });

    window.addEventListener("blur", function () {
      keys = Object.create(null);
    });

    /* click / tap to walk and interact */
    canvas.addEventListener("pointerdown", function (e) {
      if (UI.isBlocking() || tourMode) return;
      e.preventDefault();
      var p = toWorld(e);
      var it = hitTest(p.x, p.y);
      if (it) {
        if (rectDist(player.x, player.y, it.zone) <= 0) {
          interact(it.id);
        } else if (startRoute(it.stand.x, it.stand.y, it.zone, it.id)) {
          window.Audio8.play("select");
        }
        return;
      }
      if (p.y > 52) {
        walkTo(p.x, p.y);
      }
    });

    canvas.addEventListener("pointermove", function (e) {
      if (isTouch) return;
      var p = toWorld(e);
      canvas.style.cursor = hitTest(p.x, p.y) ? "pointer" : "default";
    });

    /* on-screen D-pad */
    var dpad = document.getElementById("dpad");
    if (dpad) {
      var buttons = dpad.querySelectorAll("[data-dir]");
      Array.prototype.forEach.call(buttons, function (btn) {
        var dir = btn.getAttribute("data-dir");
        function down(ev) {
          ev.preventDefault();
          keys[dir] = true;
          btn.classList.add("is-down");
          if (walkTarget || path.length) endRoute(false);
        }
        function up(ev) {
          if (ev) ev.preventDefault();
          keys[dir] = false;
          btn.classList.remove("is-down");
        }
        btn.addEventListener("pointerdown", down);
        btn.addEventListener("pointerup", up);
        btn.addEventListener("pointercancel", up);
        btn.addEventListener("pointerleave", up);
        btn.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
      });

      var actions = document.querySelectorAll("[data-action]");
      Array.prototype.forEach.call(actions, function (action) {
        action.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          action.classList.add("is-down");
          if (active) interact(active.id);
          else UI.toast(t("toast.walkCloser"));
        });
        action.addEventListener("pointerup", function () { action.classList.remove("is-down"); });
        action.addEventListener("pointercancel", function () { action.classList.remove("is-down"); });
        action.addEventListener("pointerleave", function () { action.classList.remove("is-down"); });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !UI.isBlocking() && !tourMode) {
        endRoute(false);
      }
    });
  }

  /* ---------------------------------------------------------------- */
  return {
    setPaused: function (v) {
      uiPaused = !!v;
      if (uiPaused) {
        endRoute(false);
        keys = Object.create(null);
      }
    },
    getPlayer: function () { return player; },
    interact: function (id) { interact(id); },
    /* Mohamed greets the visitor on arrival: he turns towards them and shows a
       bubble. The conversation itself is a scripted dialogue opened by
       js/onboarding.js, so the two stay decoupled. */
    greet: function (bubbleText) {
      if (uiPaused || spritesReady === false) return false;
      var dx = player.x - npc.x;
      var dy = player.y - npc.y;
      if (Math.abs(dx) > Math.abs(dy)) npc.dir = dx > 0 ? "right" : "left";
      else npc.dir = dy > 0 ? "down" : "up";
      npcEmote = { text: bubbleText || "!", until: time + 3.4 };
      return true;
    },
    /* ---- guided tour (js/onboarding.js) ---------------------------- */
    tour: {
      /* true while Mohamed is leading: the room keeps running, the visitor
         does not answer to the keys, and no prompts float around. */
      set: function (on) {
        tourMode = !!on;
        npcGhost = !!on;
        if (!on) {
          npcPath = [];
          tourMove = null;
          npc.moving = false;
          npc.frame = 0;
        }
      },
      active: function () { return tourMode; },
      npc: function () { return { x: Math.round(npc.x), y: Math.round(npc.y), dir: npc.dir }; },
      player: function () { return { x: Math.round(player.x), y: Math.round(player.y) }; },
      /* a bubble over Mohamed, e.g. "!" or "..."; null/"" clears it */
      bubble: function (text, ms) {
        if (!text) { npcEmote = null; return; }
        npcEmote = { text: text, until: time + (ms ? ms / 1000 : 2.4) };
      },
      /* Walk Mohamed to `npcSpot` and the visitor to `playerSpot`, resolving
         once either both have arrived or the walk timed out (then both are
         placed directly, so the tour can never stall). */
      move: function (npcSpot, playerSpot) {
        return new Promise(function (resolve) {
          if (tourMove) endTourMove(true);
          var m = { npc: npcSpot || null, player: playerSpot || null, done: resolve, deadline: time + 12 };
          tourMove = m;
          if (npcSpot) {
            var ns = npcFreeSpot(npcSpot.x, npcSpot.y) || { x: npc.x, y: npc.y };
            var np = navRoute(npc.x, npc.y, ns.x, ns.y, null);
            npcPath = np && np.length ? np : [];
          }
          if (playerSpot) {
            var ps = standable(playerSpot.x, playerSpot.y)
              ? playerSpot
              : (nearestSpot(playerSpot.x, playerSpot.y) || { x: player.x, y: player.y });
            var pp = navRoute(player.x, player.y, ps.x, ps.y, null);
            path = pp && pp.length ? pp : [];
            walkTarget = path.length ? { x: ps.x, y: ps.y } : null;
            pendingInteract = null;
            pendingZone = null;
            stuckFor = 0;
            stuckFrom = Infinity;
          }
          if ((!npcSpot || !npcPath.length) && (!playerSpot || !path.length)) endTourMove(false);
        });
      },
    },
    /* One simulation tick, exposed so the tour and the layout can be driven
       deterministically (the browser tab does not always run rAF). */
    step: function (dt) {
      dt = dt || 1 / 60;
      time += dt;
      Room.update(dt, time);
      if (!uiPaused) update(dt);
      render();
      return { npc: { x: Math.round(npc.x), y: Math.round(npc.y) }, player: { x: Math.round(player.x), y: Math.round(player.y) } };
    },
    onSecret: onSecret,
    onIdleProgress: onIdleProgress,
    spawn: spawn,
    /* Test hook: the walkability grid and a route, without moving anyone. */
    debugNav: function (fx, fy, tx, ty) {
      if (!NAV.grid) return null;
      var free = 0;
      for (var i = 0; i < NAV.grid.length; i++) free += NAV.grid[i];
      var out = {
        cols: NAV.cols, rows: NAV.rows, free: free, total: NAV.grid.length,
        solids: Room.solids.map(function (s) { return s.x + "," + s.y + " " + s.w + "x" + s.h; }),
        rowsArt: [],
      };
      for (var r = 0; r < NAV.rows; r++) {
        var line = "";
        for (var c = 0; c < NAV.cols; c++) line += NAV.grid[r * NAV.cols + c] ? "." : "#";
        out.rowsArt.push(line);
      }
      if (fx !== undefined) out.route = navRoute(fx, fy, tx, ty, null);
      return out;
    },
    debugState: function () {
      return {
        ready: spritesReady,
        pet: pet ? { x: Math.round(pet.x), y: Math.round(pet.y), dir: pet.dir, frame: pet.frame } : null,
        parts: parts.length,
        emote: emote ? emote.text : null,
        npcEmote: npcEmote ? npcEmote.text : null,
        npc: { x: Math.round(npc.x), y: Math.round(npc.y), dir: npc.dir, moving: npc.moving },
        player: { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, moving: player.moving },
        tour: { mode: tourMode, moving: !!npcPath.length, awaiting: !!tourMove },
        legend: legend,
        speed: player.speed,
      };
    },
    init: function () {
      canvas = document.getElementById("game");
      ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      isTouch = window.matchMedia("(pointer: coarse)").matches;
      document.body.classList.toggle("is-touch", isTouch);
      document.body.classList.add("is-booting");

      Room.init();
      buildNav();
      UI.init();
      if (window.Secrets) window.Secrets.init();
      restoreSecrets();
      bindInput();
      drawBrandAvatar();

      /* Hold the room behind the boot screen until the character sheets have
         loaded or failed. Nothing is ever painted with placeholder art, so the
         figures cannot visibly swap. */
      boot();
    },
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  window.Game.init();
});
