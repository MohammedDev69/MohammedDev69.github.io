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

  var parts = [];             /* hearts, sparks, confetti */
  var pet = null;             /* the cat, once it follows you */
  var emote = null;           /* the little bubble above the visitor */
  var legend = false;         /* every secret found */
  var lastDt = 0.016;         /* for the DEV MODE readout */

  var player = {
    x: 192, y: 190, dir: "up", moving: false, frame: 0, anim: 0, speed: 64,
  };
  var BASE_SPEED = 64;
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

    updatePet(dt);
    updateParts(dt);
    if (window.Secrets && window.Secrets.tick) {
      window.Secrets.tick(dt, player.x, player.y, player.moving, uiPaused);
    }
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

  /* The visitor's own little thought bubble ("zZ", "!", "♥") */
  function drawEmote() {
    if (!emote || emote.until <= time) return;
    var x = Math.round(player.x), y = Math.round(player.y) - 54;
    ctx.fillStyle = "rgba(6,9,14,0.85)";
    ctx.fillRect(x - 12, y - 8, 25, 15);
    ctx.fillStyle = "#ffb454";
    ctx.fillRect(x - 12, y - 8, 25, 1);
    ctx.fillRect(x - 12, y + 6, 25, 1);
    ctx.fillRect(x - 12, y - 8, 1, 15);
    ctx.fillRect(x + 12, y - 8, 1, 15);
    ctx.fillRect(x - 2, y + 7, 4, 2);
    window.PixelFont.draw(ctx, emote.text, x - 11, y - 5, { color: "#e9e5dd" });
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
    if (dist < 84) {
      if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
      else dir = dy > 0 ? "down" : "up";
    }
    var bob = Math.sin(time * 1.5) > 0.72 ? -1 : 0;
    var set = frames[dir] || frames.down;
    if (!set || !set.length) return;
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
      if (pet) items.push({ y: pet.y, draw: drawPet });
    }
    items.sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < items.length; i++) items[i].draw(ctx, time);

    Room.setFocus(Math.round(player.x), Math.round(player.y) - 18);
    Room.drawOverlay(ctx, time);
    drawParts();
    drawWalkTarget();
    drawEmote();
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

    var seen = false;
    try { seen = localStorage.getItem("mn_seen_hint") === "1"; } catch (e) {}
    if (!seen) {
      UI.toast("Walk with WASD or arrows · press E near anything that glows.");
      try { localStorage.setItem("mn_seen_hint", "1"); } catch (e) {}
    }
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
          UI.toast("Character art could not be loaded.");
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
      UI.toast(on ? "Lights on." : "Lights off — the monitors do the rest.");
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
    interact: function (id) { interact(id); },
    onSecret: onSecret,
    onIdleProgress: onIdleProgress,
    spawn: spawn,
    debugState: function () {
      return {
        ready: spritesReady,
        pet: pet ? { x: Math.round(pet.x), y: Math.round(pet.y), dir: pet.dir, frame: pet.frame } : null,
        parts: parts.length,
        emote: emote ? emote.text : null,
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
