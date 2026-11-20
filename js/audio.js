/* 8-bit audio: a small WebAudio chiptune loop + UI sound effects.
   Nothing loads from the network; everything is synthesised. */
window.Audio8 = (function () {
  "use strict";

  var ctx = null, master = null, musicBus = null, sfxBus = null;
  var musicOn = false, sfxOn = true;
  var timer = null, nextTime = 0, step = 0;
  var BPM = 88, STEP = 60 / BPM / 4;
  var LOOP = 64;
  var started = false;

  var ROOTS = [45, 41, 36, 43];              /* A2 F2 C2 G2 */
  var CHORDS = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
  var MELODY = {
    2: 12, 6: 15, 10: 19, 14: 15,
    18: 16, 22: 19, 26: 24, 30: 19,
    34: 19, 38: 24, 42: 28, 46: 24,
    50: 19, 54: 22, 58: 26, 62: 22,
  };

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    lp.Q.value = 0.4;
    lp.connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(lp);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);
    return true;
  }

  function tone(freq, time, dur, type, gain, bus, glideTo) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var env = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, time);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, time + dur * 0.9);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(gain, time + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env);
    env.connect(bus || sfxBus);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function playStep(i, t) {
    var bar = Math.floor(i / 16) % 4;
    var inBar = i % 16;
    var root = ROOTS[bar];
    var chord = CHORDS[bar];

    /* bass */
    if (inBar === 0 || inBar === 8) {
      tone(midi(root - 12), t, STEP * 3.2, "triangle", 0.22, musicBus);
    }
    if (inBar === 12) {
      tone(midi(root - 5), t, STEP * 2, "triangle", 0.14, musicBus);
    }

    /* arpeggio */
    if (inBar % 2 === 0) {
      var n = chord[(inBar / 2) % chord.length];
      tone(midi(root + 12 + n), t, STEP * 1.4, "square", 0.045, musicBus);
    }

    /* sparse melody */
    var mel = MELODY[i];
    if (mel != null) {
      tone(midi(root + 12 + mel), t, STEP * 3.6, "sine", 0.10, musicBus);
    }

    /* soft hat */
    if (inBar % 4 === 2) {
      tone(1400, t, 0.02, "square", 0.012, musicBus);
    }
  }

  function tick() {
    if (!ctx || !musicOn) return;
    while (nextTime < ctx.currentTime + 0.14) {
      playStep(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % LOOP;
    }
  }

  function startMusic() {
    if (!ensure()) return false;
    musicOn = true;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.30, ctx.currentTime, 0.4);
    nextTime = ctx.currentTime + 0.08;
    if (!timer) timer = setInterval(tick, 30);
    return true;
  }

  function stopMusic() {
    musicOn = false;
    if (ctx && musicBus) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    }
  }

  function play(name) {
    if (!sfxOn || !ensure()) return;
    var t = ctx.currentTime;
    switch (name) {
      case "blip":
        tone(700 + Math.random() * 90, t, 0.035, "square", 0.05);
        break;
      case "select":
        tone(520, t, 0.05, "square", 0.06, null, 760);
        break;
      case "confirm":
        tone(660, t, 0.06, "square", 0.07);
        tone(990, t + 0.07, 0.09, "square", 0.06);
        break;
      case "open":
        tone(320, t, 0.12, "square", 0.06, null, 880);
        break;
      case "close":
        tone(760, t, 0.10, "square", 0.05, null, 280);
        break;
      case "copy":
        tone(880, t, 0.05, "square", 0.06);
        tone(1180, t + 0.06, 0.07, "square", 0.05);
        break;
      case "error":
        tone(190, t, 0.12, "sawtooth", 0.05);
        break;
      case "step":
        tone(150, t, 0.02, "triangle", 0.02);
        break;
      case "secret":
        tone(880, t, 0.07, "square", 0.06);
        tone(1174, t + 0.08, 0.07, "square", 0.06);
        tone(1568, t + 0.16, 0.14, "square", 0.05);
        break;
      case "fanfare":
        tone(523, t, 0.10, "square", 0.06);
        tone(659, t + 0.11, 0.10, "square", 0.06);
        tone(784, t + 0.22, 0.10, "square", 0.06);
        tone(1046, t + 0.33, 0.26, "square", 0.06);
        tone(1568, t + 0.34, 0.28, "triangle", 0.05);
        break;
      case "meow":
        tone(700, t, 0.09, "triangle", 0.05, null, 950);
        tone(950, t + 0.10, 0.13, "triangle", 0.04, null, 560);
        break;
      case "power":
        tone(240, t, 0.09, "square", 0.05, null, 120);
        tone(120, t + 0.10, 0.12, "square", 0.04);
        break;
      case "yawn":
        tone(520, t, 0.22, "triangle", 0.04, null, 300);
        tone(330, t + 0.24, 0.30, "triangle", 0.04, null, 190);
        break;
    }
  }

  function readPref(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? fallback : v === "1";
    } catch (e) { return fallback; }
  }

  function savePref(key, value) {
    try { localStorage.setItem(key, value ? "1" : "0"); } catch (e) { /* ignore */ }
  }

  return {
    init: function () {
      musicOn = false;
      sfxOn = readPref("mn_sfx", true);
    },
    unlock: function () {
      if (ensure() && musicOn) startMusic();
    },
    isMusicOn: function () { return musicOn; },
    isSfxOn: function () { return sfxOn; },
    toggleMusic: function () {
      if (musicOn) { stopMusic(); savePref("mn_music", false); }
      else { startMusic(); savePref("mn_music", true); }
      return musicOn;
    },
    toggleSfx: function () {
      sfxOn = !sfxOn;
      savePref("mn_sfx", sfxOn);
      if (sfxOn) play("select");
      return sfxOn;
    },
    play: play,
    /* try to resume a saved preference on the first real interaction */
    restore: function () {
      if (readPref("mn_music", false)) {
        startMusic();
        return true;
      }
      return false;
    },
  };
})();
