/* Game loop: movement, collision, camera-less room rendering, interactions. */
window.Game = (function () {
  "use strict";

  var W = 384, H = 224;
  var canvas, ctx;
  var uiPaused = false;
  var lastTs = 0;
  var time = 0;
  var isTouch = false;
  var active = null;
  var keys = Object.create(null);
  var walkTarget = null;
  var pendingInteract = null;
  var steps = 0;
  var spritesReady = false;   /* flips once the character art source is final */
  var MIN_BOOT_MS = 450;      /* keeps the boot screen from blinking away */
  var BOOT_TIMEOUT_MS = 6000; /* never hold the room hostage to a slow file */

  var player = {
    x: 192, y: 190, dir: "up", moving: false, frame: 0, anim: 0, speed: 64,
  };
  var npc = { x: 301, y: 112, dir: "down" };

  /* ---------------------------------------------------------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hitbox(x, y) {
    return { x: x - 5, y: y - 7, w: 10, h: 7 };
  }

  function blocked(x, y) {
    var hb = hitbox(x, y);
    if (hb.x < 12 || hb.x + hb.w > 372 || hb.y < 56 || hb.y + hb.h > 214) return true;
    var solids = Room.solids;
    for (var i = 0; i < solids.length; i++) {
      if (aabb(hb, solids[i])) return true;
    }
    if (aabb(hb, { x: npc.x - 7, y: npc.y - 7, w: 14, h: 7 })) return true;
    return false;
  }

  function moveBy(dx, dy) {
    if (dx) {
      var nx = player.x + dx;
      if (!blocked(nx, player.y)) player.x = nx;
    }
    if (dy) {
      var ny = player.y + dy;
      if (!blocked(player.x, ny)) player.y = ny;
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
  function update(dt) {
    var dx = 0, dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    if (dx || dy) {
      walkTarget = null;
      pendingInteract = null;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      moveBy((dx / len) * player.speed * dt, (dy / len) * player.speed * dt);
      setDir(dx, dy);
      player.moving = true;
    } else if (walkTarget) {
      var tx = walkTarget.x - player.x;
      var ty = walkTarget.y - player.y;
      var dist = Math.sqrt(tx * tx + ty * ty);
      if (dist < 2.5) {
        player.x = walkTarget.x;
        player.y = walkTarget.y;
        walkTarget = null;
        player.moving = false;
        if (pendingInteract) {
          var id = pendingInteract;
          pendingInteract = null;
          interact(id);
        }
      } else {
        moveBy((tx / dist) * player.speed * dt, (ty / dist) * player.speed * dt);
        setDir(tx, ty);
        player.moving = true;
      }
    } else {
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

    active = uiPaused ? null : nearest();
    updateCursor();
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
    var set = window.Sprites.player[player.dir] || window.Sprites.player.down;
    drawCharacter(set[player.frame] || set[0], player.x, player.y);
  }

  function drawNpc() {
    var dx = player.x - npc.x;
    var dy = player.y - npc.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var dir = npc.dir;
    if (dist < 84) {
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
      else dir = dy > 0 ? "down" : "up";
    }
    var bob = Math.sin(time * 1.5) > 0.72 ? -1 : 0;
    var set = window.Sprites.npc[dir] || window.Sprites.npc.down;
    drawCharacter(set[0], npc.x, npc.y + bob);
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
    }
    items.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < items.length; i++) items[i].draw(ctx, time);

    Room.drawOverlay(ctx, time);
    drawWalkTarget();
    drawPrompts();
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

    var seen = false;
    try { seen = localStorage.getItem("mn_seen_hint") === "1"; } catch (e) {}
    if (!seen) {
      UI.toast("Walk with WASD or arrows · press E near anything that glows.");
      try { localStorage.setItem("mn_seen_hint", "1"); } catch (e) {}
    }
  }

  function boot() {
    var sheets = (window.PORTFOLIO && window.PORTFOLIO.sprites) || {};
    var hasSheets = !!(sheets.npcSheet || sheets.playerSheet);
    var hasPortrait = !!sheets.npcPortrait;

    /* nothing configured: the built-in characters are the intended art */
    if (!hasSheets && !hasPortrait) { reveal(); return; }

    var loaded = false;
    var load = window.Sprites.loadSheets(sheets)
      .then(function (v) { loaded = v; return v; })
      .catch(function () { return false; });

    Promise.race([load, wait(BOOT_TIMEOUT_MS)])
      .then(function () {
        if (loaded) {
          UI.toast("Character sheets loaded.");
        } else if (window.console && console.warn) {
          console.warn("[sprites] No sheet files found; using built-in pixel characters.");
        }
        /* a custom portrait does not change the room, so do not hold it back */
        return hasSheets ? wait(MIN_BOOT_MS) : null;
      })
      .then(reveal);
  }

  /* ---------------------------------------------------------------- */
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
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
      window.Audio8.play("confirm");
      UI.toast("*purrrr* — the cat is asleep, but it appreciates the visit.");
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

  function freeSpot(x, y) {
    if (!blocked(x, y)) return { x: x, y: y };
    for (var i = 1; i <= 16; i++) {
      var nx = player.x + (x - player.x) * (1 - i / 16);
      var ny = player.y + (y - player.y) * (1 - i / 16);
      if (!blocked(nx, ny)) return { x: nx, y: ny };
    }
    return null;
  }

  function walkTo(x, y) {
    var spot = freeSpot(clamp(x, 16, 368), clamp(y, 58, 212));
    if (!spot) return;
    walkTarget = spot;
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
      if (UI.isBlocking()) return;
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
      if (UI.isBlocking()) return;
      e.preventDefault();
      var p = toWorld(e);
      var it = hitTest(p.x, p.y);
      if (it) {
        if (rectDist(player.x, player.y, it.zone) <= 0) {
          interact(it.id);
        } else {
          var spot = freeSpot(it.stand.x, it.stand.y);
          if (spot) {
            walkTarget = spot;
            pendingInteract = it.id;
            window.Audio8.play("select");
          }
        }
        return;
      }
      if (p.y > 52) {
        walkTo(p.x, p.y);
        pendingInteract = null;
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
          if (walkTarget) { walkTarget = null; pendingInteract = null; }
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

      var action = dpad.querySelector("[data-action]");
      if (action) {
        action.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          action.classList.add("is-down");
          if (active) interact(active.id);
          else UI.toast("Walk closer to an object first.");
        });
        action.addEventListener("pointerup", function () { action.classList.remove("is-down"); });
        action.addEventListener("pointercancel", function () { action.classList.remove("is-down"); });
      }
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !UI.isBlocking()) {
        walkTarget = null;
        pendingInteract = null;
      }
    });
  }

  /* ---------------------------------------------------------------- */
  return {
    setPaused: function (v) {
      uiPaused = !!v;
      if (uiPaused) {
        walkTarget = null;
        pendingInteract = null;
        keys = Object.create(null);
      }
    },
    getPlayer: function () { return player; },
    init: function () {
      canvas = document.getElementById("game");
      ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      isTouch = window.matchMedia("(pointer: coarse)").matches;
      document.body.classList.toggle("is-touch", isTouch);
      document.body.classList.add("is-booting");

      window.Sprites.build();
      Room.init();
      UI.init();
      bindInput();
      drawBrandAvatar();

      /* Hold the room behind the boot screen until the hand-drawn sheets are
         either loaded or proved missing. Nothing is painted with the fallback
         characters first, so the art never visibly swaps. */
      boot();
    },
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  window.Game.init();
});
