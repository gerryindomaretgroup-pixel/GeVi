(() => {
  const config = window.GEVI_CONFIG || {};
  const scenesOrder = Array.isArray(config.scenes)
    ? config.scenes
    : ["dark", "surprise", "record", "notes", "cake", "wish", "letter", "finale"];

  const FESTIVE_SCENES = new Set(["surprise", "record", "notes", "cake"]);

  const story = document.getElementById("story");
  const progress = document.getElementById("progress");
  const festoon = document.getElementById("festoon");
  const sakuraFall = document.getElementById("sakura-fall");
  const bloomVeil = document.getElementById("bloom-veil");
  const lightBurst = document.getElementById("light-burst");
  const lightSwitch = document.getElementById("light-switch");
  const canvas = document.getElementById("embers");
  const sceneEls = [...story.querySelectorAll(".scene")];

  const turntable = document.getElementById("turntable");
  const vinyl = document.getElementById("vinyl");
  const tonearm = document.getElementById("tonearm");
  const recordAudio = document.getElementById("record-audio");
  const bgmAudio = document.getElementById("bgm-audio");
  const recordHint = document.getElementById("record-hint");
  const recordSkip = document.getElementById("record-skip");
  const recordNext = document.getElementById("record-next");
  const sfxAudio = document.getElementById("sfx-audio");

  let index = 0;
  let transitioning = false;
  let particles = [];
  let rafId = 0;
  let sakuraBuilt = false;
  let musicPlaying = false;
  let musicStarting = false;
  let armDragging = false;
  let noteIndex = 0;
  let bgmWanted = false;
  let bgmDucked = false;
  let bgmFadeTimer = 0;
  let bgmLoopBound = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function musicConfig() {
    return config.music || {};
  }

  function bgmConfig() {
    return config.bgm || {};
  }

  function sfxConfig() {
    return config.sfx || {};
  }

  const sfxCache = {};
  let audioUnlocked = false;

  function preloadSfx() {
    const conf = sfxConfig();
    Object.keys(conf).forEach((key) => {
      if (key === "volume" || typeof conf[key] !== "string") return;
      if (sfxCache[key]) return;
      // MDN: new Audio(url) starts loading asynchronously
      const audio = new Audio(conf[key]);
      audio.preload = "auto";
      audio.load();
      sfxCache[key] = audio;
    });
  }

  function bgmStartAt() {
    return Math.max(0, Number(bgmConfig().startAt) || 0);
  }

  function setupBgm() {
    if (!bgmAudio) return;
    const bgm = bgmConfig();
    if (!bgm.src) return;
    if (bgmAudio.dataset.src !== bgm.src) {
      bgmAudio.src = bgm.src;
      bgmAudio.dataset.src = bgm.src;
      bgmAudio.preload = "auto";
    }
    // Loop manual agar startAt & fade loop tetap sinkron (native loop selalu dari 0)
    bgmAudio.loop = false;
    if (!bgmLoopBound) {
      bgmLoopBound = true;
      bgmAudio.addEventListener("ended", () => {
        if (!bgmWanted || bgmDucked) return;
        if (bgmConfig().loop === false) return;
        try {
          bgmAudio.currentTime = bgmStartAt();
          bgmAudio.play().catch(() => {});
        } catch {
          /* ignore */
        }
      });
      // Antisipasi gap/seek sebelum ended pada beberapa browser
      bgmAudio.addEventListener("timeupdate", () => {
        if (!bgmWanted || bgmDucked || bgmConfig().loop === false) return;
        const dur = bgmAudio.duration;
        if (!Number.isFinite(dur) || dur <= 0) return;
        if (dur - bgmAudio.currentTime > 0.35) return;
        // biarkan ended yang me-restart; hanya jaga jika paused tak terduga
        if (bgmAudio.paused && bgmWanted && !bgmDucked) {
          try {
            bgmAudio.currentTime = bgmStartAt();
            bgmAudio.play().catch(() => {});
          } catch {
            /* ignore */
          }
        }
      });
    }
  }

  function clearBgmFade() {
    window.clearInterval(bgmFadeTimer);
    bgmFadeTimer = 0;
  }

  function fadeBgmTo(targetVol, ms) {
    if (!bgmAudio) return Promise.resolve();
    clearBgmFade();
    const start = bgmAudio.volume;
    const end = Math.min(1, Math.max(0, targetVol));
    const dur = Math.max(0, Number(ms) || 0);
    if (dur <= 0 || Math.abs(start - end) < 0.01) {
      bgmAudio.volume = end;
      return Promise.resolve();
    }
    const t0 = performance.now();
    return new Promise((resolve) => {
      bgmFadeTimer = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        bgmAudio.volume = start + (end - start) * p;
        if (p >= 1) {
          clearBgmFade();
          bgmAudio.volume = end;
          resolve();
        }
      }, 32);
    });
  }

  async function startBgm({ force = false } = {}) {
    setupBgm();
    const bgm = bgmConfig();
    if (!bgmAudio || !bgm.src) return false;
    bgmWanted = true;
    // Jangan nyalakan lagi kalau sedang di-mute karena lagu record
    if (bgmDucked && !force) return false;
    if (musicPlaying && bgm.muteWhileRecord !== false && !force) return false;
    const vol = Math.min(1, Math.max(0, Number(bgm.volume) || 0.16));
    try {
      if (bgmAudio.paused) {
        bgmAudio.volume = 0;
        const startAt = bgmStartAt();
        if (startAt > 0 && bgmAudio.currentTime < 0.05) {
          bgmAudio.currentTime = startAt;
        }
        await bgmAudio.play();
      }
      if (!bgmDucked) {
        await fadeBgmTo(vol, Number(bgm.fadeMs) || 1000);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function duckBgm() {
    if (!bgmAudio || !bgmWanted) return;
    if (bgmConfig().muteWhileRecord === false) return;
    bgmDucked = true;
    const bgm = bgmConfig();
    const duck = Math.min(
      1,
      Math.max(0, Number(bgm.duckVolume) ?? 0)
    );
    await fadeBgmTo(duck, Math.min(700, Number(bgm.fadeMs) || 1000));
    if (duck <= 0.001) {
      try {
        bgmAudio.pause();
      } catch {
        /* ignore */
      }
    }
  }

  async function restoreBgm() {
    if (!bgmAudio || !bgmWanted) return;
    // Fleksibel: selama lagu scene 3 masih main, BGM tetap mati
    if (musicPlaying && bgmConfig().muteWhileRecord !== false) return;
    bgmDucked = false;
    const bgm = bgmConfig();
    const vol = Math.min(1, Math.max(0, Number(bgm.volume) || 0.16));
    try {
      if (bgmAudio.paused) {
        bgmAudio.volume = 0;
        await bgmAudio.play();
      }
      await fadeBgmTo(vol, Number(bgm.fadeMs) || 1000);
    } catch {
      /* ignore */
    }
  }

  async function stopBgm({ fade = true } = {}) {
    bgmWanted = false;
    bgmDucked = false;
    if (!bgmAudio) return;
    const bgm = bgmConfig();
    if (fade) await fadeBgmTo(0, Number(bgm.fadeMs) || 1000);
    else {
      clearBgmFade();
      bgmAudio.volume = 0;
    }
    try {
      bgmAudio.pause();
      bgmAudio.currentTime = bgmStartAt();
    } catch {
      /* ignore */
    }
  }

  async function unlockAudio() {
    if (audioUnlocked) {
      // Interaksi berikutnya: pastikan BGM awal tetap jalan
      if (bgmConfig().playFromStart !== false && !musicPlaying) {
        startBgm();
      }
      return;
    }
    audioUnlocked = true;
    preloadSfx();
    setupBgm();
    // Warm-up silent play under user gesture (autoplay policy)
    try {
      const warm = new Audio(
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAGAAGn9AAAIwgAJP8AAAD4AAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQZg8AAAaQAAAAAgAADSAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
      );
      warm.volume = 0.01;
      await warm.play();
      warm.pause();
    } catch {
      /* still try later */
    }
    if (bgmConfig().playFromStart !== false) {
      startBgm();
    }
  }

  function playSfx(key) {
    const conf = sfxConfig();
    const src = conf[key];
    if (!src) return Promise.resolve(false);
    preloadSfx();
    const vol = Math.min(1, Math.max(0, Number(conf.volume) || 0.95));
    try {
      const base = sfxCache[key] || new Audio(src);
      sfxCache[key] = base;
      const node = base.cloneNode(true);
      node.volume = vol;
      const playPromise = node.play();
      if (playPromise && typeof playPromise.then === "function") {
        return playPromise.then(() => true).catch(() => {
          if (!sfxAudio) return false;
          sfxAudio.src = src;
          sfxAudio.volume = vol;
          return sfxAudio.play().then(() => true).catch(() => false);
        });
      }
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  function sfxForTransition(fromScene, toScene) {
    if (fromScene === "dark" && toScene === "surprise") return "light";
    if (fromScene === "finale" && toScene === "dark") return "light";
    const conf = sfxConfig();
    // Dedicated transition keys — jangan pakai notes/sparkle (khusus perintah)
    const dedicated = `to_${toScene}`;
    if (conf[dedicated]) return dedicated;
    if (conf.transition) return "transition";
    return "bloom";
  }

  function fillContent() {
    const name = config.recipientName || "Sahabatku";
    const age = config.age || "";
    const sender = (config.senderName || "").trim();
    const showAge = config.showAge === true;
    const music = musicConfig();

    setText("dark-text", config.darkText || "kok gelap ya…");
    setText("switch-hint", config.switchHint || "nyalakan lampunya");
    setText("surprise-eyebrow", config.surpriseEyebrow || "");
    const eyebrow = document.getElementById("surprise-eyebrow");
    if (eyebrow) eyebrow.hidden = !(config.surpriseEyebrow || "").trim();
    setText("surprise-title", config.surpriseTitle || "Selamat Ulang Tahun Sayangku");
    setText("surprise-name", name);

    const ageEl = document.getElementById("surprise-age");
    if (ageEl) {
      ageEl.hidden = !showAge;
      ageEl.textContent = showAge && age ? `yang ke-${age}` : "";
    }

    setText("record-caption", music.caption || "ada lagu yang aku sisipin buat kamu.");
    setText("record-hint", music.hint || "geser jarumnya ke piringan buat muterin");

    const label = document.getElementById("vinyl-label");
    if (label) label.textContent = (name.trim()[0] || "S").toUpperCase();

    if (recordAudio && music.src) {
      recordAudio.src = music.src;
      recordAudio.preload = "auto";
    }

    setText("notes-intro", config.notesIntro || "sebelum tiup lilin, baca yang tadi nggak muat.");
    renderNote(0);

    const cake = config.cake || {};
    setText("cake-caption", cake.caption || "sekarang bagian paling penting");
    const cakeHint = document.getElementById("cake-hint");
    if (cakeHint) {
      cakeHint.hidden = true;
      cakeHint.textContent = cake.hint || "tekan & tahan lilinnya agak lama buat meniup";
    }
    const cakeCard = document.getElementById("cake-card-text");
    if (cakeCard) {
      const showCard = cake.showCardText === true && cake.cardText;
      cakeCard.hidden = !showCard;
      cakeCard.textContent = showCard ? cake.cardText : "";
    }
    const cakeImg = document.getElementById("cake-image");
    if (cakeImg && cake.image) cakeImg.src = cake.image;
    buildCandles();

    const wish = wishConfig();
    setText("wish-caption", wish.caption || "saatnya berdoa");
    setText(
      "wish-hint",
      wish.hint || "tekan & tahan bola doa agak lama"
    );
    setText("wish-center", wish.center || "ini doaku untukmu");

    setText("letter-label", config.letterLabel || "Untukmu");
    renderLetterBody(config.letterBody || config.letterPreview || "");
    const letterFrom = (config.letterSign || sender || "").trim();
    setText("letter-sign", letterFrom ? `— ${letterFrom}` : "");

    const finale = config.finale || {};
    setText("finale-caption", finale.caption || "kenangan kita");
    setText("memory-hint", finale.hint || "geser ke kiri atau kanan");
    setText(
      "finale-thanks",
      finale.thanks || "Terima kasih sudah membuka sampai akhir"
    );
    const lightsOff = document.getElementById("lights-off");
    if (lightsOff) {
      lightsOff.textContent = finale.lightsOffLabel || "matikan lampu";
    }

    const invite = inviteConfig();
    setText("invite-sealed-label", invite.sealedLabel || "ada satu lagi untukmu");
    setText("invite-sealed-hint", invite.sealedHint || "ketuk untuk membuka");
    setText("invite-label", invite.label || "Undangan");
    renderInviteBody(invite.body || "");
    const inviteFrom = (invite.sign || sender || "").trim();
    setText("invite-sign", inviteFrom ? `— ${inviteFrom}` : "");
  }

  function formatRichText(raw) {
    // Escape dulu, lalu terapkan markup ringan (MDN: em = emphasis, strong = importance)
    return String(raw || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/♥+/g, (m) => `<span class="love-mark">${"♥".repeat(m.length)}</span>`);
  }

  function renderLetterBody(raw) {
    const el = document.getElementById("letter-preview");
    if (!el) return;
    el.innerHTML = formatRichText(raw);
  }

  function renderInviteBody(raw) {
    const el = document.getElementById("invite-body");
    if (!el) return;
    el.innerHTML = formatRichText(raw);
  }

  function notesList() {
    return Array.isArray(config.notes) && config.notes.length
      ? config.notes
      : ["Catatan belum diisi."];
  }

  function renderNote(i) {
    const list = notesList();
    noteIndex = Math.max(0, Math.min(i, list.length - 1));
    const label =
      list.length === 1 ? "Catatan kecil" : `Catatan kecil · ${noteIndex + 1}`;
    setText("note-label", label);
    const bodyEl = document.getElementById("note-body");
    if (bodyEl) bodyEl.innerHTML = formatRichText(list[noteIndex] || "");
    const dots = document.getElementById("note-dots");
    const btn = document.getElementById("notes-next");
    if (dots) {
      dots.innerHTML = "";
      dots.hidden = list.length <= 1;
      list.forEach((_, idx) => {
        const d = document.createElement("span");
        if (idx === noteIndex) d.classList.add("is-active");
        dots.appendChild(d);
      });
    }
    if (btn) {
      const last = noteIndex >= list.length - 1;
      btn.textContent = last
        ? config.notesFinalButton || "Surprise"
        : "Next";
      btn.dataset.notesAction = last ? "done" : "next";
    }
  }

  function advanceNote() {
    const list = notesList();
    const card = document.getElementById("note-card");
    if (noteIndex >= list.length - 1) {
      goNext();
      return;
    }
    playSfx("notes");
    if (card) card.classList.add("is-swap");
    window.setTimeout(() => {
      renderNote(noteIndex + 1);
      if (card) {
        void card.offsetWidth;
        card.classList.remove("is-swap");
      }
    }, 220);
  }

  /* ——— Cake / blow candles ——— */

  const cakeStage = document.getElementById("cake-stage");
  const cakeCandles = document.getElementById("cake-candles");
  const cakeNext = document.getElementById("cake-next");
  const cakeHint = document.getElementById("cake-hint");
  let cakeBlown = false;
  let cakeHolding = false;
  let cakeReady = false;
  let cakeHoldTimer = 0;
  let cakeIntroTimers = [];

  function cakeConfig() {
    return config.cake || {};
  }

  function clearCakeIntroTimers() {
    cakeIntroTimers.forEach((id) => window.clearTimeout(id));
    cakeIntroTimers = [];
  }

  function scheduleCake(fn, ms) {
    const id = window.setTimeout(fn, ms);
    cakeIntroTimers.push(id);
    return id;
  }

  function setCakeHint(text, visible) {
    if (!cakeHint) return;
    if (typeof text === "string") cakeHint.textContent = text;
    cakeHint.hidden = !visible;
  }

  function buildCandles() {
    if (!cakeCandles) return;
    cakeCandles.innerHTML = "";
    const cake = cakeConfig();
    const mode = cake.candleMode || "age";

    // Lilin berbentuk angka (default: umur) di area coklat kue
    if (mode === "age" || mode === "digits") {
      const digits = String(
        cake.candleDigits || config.age || "30"
      ).replace(/\D/g, "") || "30";
      const baseTop = cake.candleTop || "50%";
      const baseLeft = Number.parseFloat(cake.candleLeft) || 50.5;
      // Sepasang angka rapat sebagai "30" di tengah coklat tiramisu
      const spread = Number(cake.candleSpread);
      const gap = Number.isFinite(spread) ? spread : 5.2;
      const chars = [...digits];
      const mid = (chars.length - 1) / 2;
      chars.forEach((ch, i) => {
        const el = document.createElement("span");
        el.className = "candle candle--digit";
        el.style.left = `${baseLeft + (i - mid) * gap}%`;
        el.style.top = baseTop;
        el.style.setProperty("--light-delay", `${i * 280}ms`);
        el.innerHTML =
          '<span class="candle-flame"></span><span class="candle-digit-face" aria-hidden="true"></span>';
        el.querySelector(".candle-digit-face").textContent = ch;
        cakeCandles.appendChild(el);
      });
      return;
    }

    const n = Math.max(1, Number(cake.candleCount) || 1);
    if (n === 1) {
      const el = document.createElement("span");
      el.className = "candle candle--hero";
      el.style.left = cake.candleLeft || "50%";
      el.style.top = cake.candleTop || "47%";
      el.innerHTML = '<span class="candle-flame"></span>';
      cakeCandles.appendChild(el);
      return;
    }

    const outer = Math.ceil(n * 0.62);
    const inner = n - outer;
    const rings = [
      { n: outer, cx: 50, cy: 43.5, rx: 26, ry: 12 },
      { n: inner, cx: 50, cy: 43.5, rx: 15, ry: 7 },
    ];
    let made = 0;
    rings.forEach((ring) => {
      for (let i = 0; i < ring.n; i++) {
        const t = (i / ring.n) * Math.PI * 2 + (made % 2) * 0.08;
        const jitter = ((made * 17) % 7) - 3;
        const x = ring.cx + Math.cos(t) * ring.rx + jitter * 0.12;
        const y = ring.cy + Math.sin(t) * ring.ry + ((made % 5) - 2) * 0.18;
        const el = document.createElement("span");
        el.className = "candle";
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.setProperty("--light-delay", `${(made % 6) * 120}ms`);
        el.innerHTML = '<span class="candle-flame"></span>';
        cakeCandles.appendChild(el);
        made += 1;
      }
    });
  }

  function leaveCakeScene() {
    clearCakeIntroTimers();
    cakeReady = false;
    cakeHolding = false;
    setCakeHint("", false);
  }

  function enableCakeBlow() {
    cakeReady = true;
    if (cakeStage) {
      cakeStage.disabled = false;
      cakeStage.classList.add("is-ready");
    }
    const cake = cakeConfig();
    setCakeHint(
      cake.hint || "tekan & tahan lilinnya agak lama buat meniup",
      true
    );
    playSfx("sparkle");
  }

  function enterCakeScene() {
    clearCakeIntroTimers();
    cakeBlown = false;
    cakeHolding = false;
    cakeReady = false;
    const cake = cakeConfig();
    const lightingMs = Number(cake.lightingMs) || 1200;

    if (cakeNext) cakeNext.hidden = true;
    setCakeHint("", false);
    if (cakeStage) {
      cakeStage.disabled = true;
      cakeStage.classList.remove("is-holding", "is-blown", "is-ready");
      cakeStage.classList.add("is-revealed");
    }
    if (cakeCandles) {
      cakeCandles.classList.add("is-unlit");
      cakeCandles.classList.remove("is-lighting", "is-lit");
    }

    buildCandles();
    playSfx("cake");

    if (reduceMotion) {
      if (cakeCandles) {
        cakeCandles.classList.remove("is-unlit");
        cakeCandles.classList.add("is-lit");
      }
      enableCakeBlow();
      return;
    }

    // Kue sudah tampil — nyalakan lilin, lalu siap ditiup
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      if (cakeCandles) {
        cakeCandles.classList.remove("is-unlit");
        cakeCandles.classList.add("is-lighting");
      }
      playSfx("sparkle");
    }, 280);

    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      if (cakeCandles) {
        cakeCandles.classList.remove("is-lighting");
        cakeCandles.classList.add("is-lit");
      }
      enableCakeBlow();
    }, 280 + lightingMs);
  }

  function clearCakeHold() {
    cakeHolding = false;
    window.clearTimeout(cakeHoldTimer);
    if (cakeStage && !cakeBlown) cakeStage.classList.remove("is-holding");
    if (!cakeBlown && cakeReady) {
      setCakeHint(
        cakeConfig().hint || "tekan & tahan lilinnya agak lama buat meniup",
        true
      );
    }
  }

  function finishBlow() {
    if (cakeBlown || !cakeReady) return;
    cakeBlown = true;
    cakeHolding = false;
    if (cakeStage) {
      cakeStage.classList.remove("is-holding");
      cakeStage.classList.add("is-blown");
    }
    playSfx("sparkle");
    // Hanya instruksi tiup yang ditampilkan; setelah padam cukup tombol lanjut
    setCakeHint("", false);
    if (cakeNext) cakeNext.hidden = false;
  }

  function startCakeHold(event) {
    if (scenesOrder[index] !== "cake" || cakeBlown || !cakeReady) return;
    unlockAudio();
    cakeHolding = true;
    if (cakeStage) cakeStage.classList.add("is-holding");
    const holdMs = Number(cakeConfig().holdMs) || 2200;
    setCakeHint(
      cakeConfig().hint || "tekan & tahan lilinnya agak lama buat meniup",
      true
    );
    window.clearTimeout(cakeHoldTimer);
    cakeHoldTimer = window.setTimeout(() => {
      if (cakeHolding) finishBlow();
    }, holdMs);
    if (event && event.pointerId != null && cakeStage) {
      try {
        cakeStage.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  }

  if (cakeStage) {
    cakeStage.addEventListener("pointerdown", startCakeHold);
    cakeStage.addEventListener("pointerup", clearCakeHold);
    cakeStage.addEventListener("pointercancel", clearCakeHold);
    cakeStage.addEventListener("lostpointercapture", clearCakeHold);
  }

  /* ——— Wish / hold prayer + mystery bubbles ——— */

  const wishOrb = document.getElementById("wish-orb");
  const wishPray = document.getElementById("wish-pray");
  const wishField = document.getElementById("wish-field");
  const wishBubbles = document.getElementById("wish-bubbles");
  const wishFocus = document.getElementById("wish-focus");
  const wishFocusCard = document.getElementById("wish-focus-card");
  const wishFocusText = document.getElementById("wish-focus-text");
  const wishNext = document.getElementById("wish-next");
  let wishDone = false;
  let wishHolding = false;
  let wishHoldTimer = 0;
  let wishAlmostTimer = 0;
  let wishNextTimer = 0;
  let wishPopped = 0;
  let wishTotal = 0;

  function wishConfig() {
    return config.wish || {};
  }

  function clearWishTimers() {
    window.clearTimeout(wishHoldTimer);
    window.clearTimeout(wishAlmostTimer);
    window.clearTimeout(wishNextTimer);
    wishHoldTimer = 0;
    wishAlmostTimer = 0;
    wishNextTimer = 0;
  }

  function closeWishFocus() {
    if (!wishFocus) return;
    wishFocus.classList.remove("is-open");
    wishFocus.hidden = true;
    if (wishFocusText) wishFocusText.textContent = "";
  }

  function maybeShowWishNext() {
    if (wishTotal <= 0 || wishPopped < wishTotal) return;
    if (wishNext && wishNext.hidden) {
      wishNext.hidden = false;
      playSfx("sparkle");
    }
  }

  function popWishBubble(btn) {
    if (!btn || btn.classList.contains("is-popped") || btn.classList.contains("is-popping")) {
      return false;
    }
    btn.classList.add("is-popping");
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
    // MDN: clone Audio node agar SFX bisa overlap saat beberapa gelembung pecah
    playSfx("bubblePop");
    // Pecahan kecil di sekitar gelembung
    for (let i = 0; i < 6; i++) {
      const shard = document.createElement("span");
      shard.className = "wish-bubble-shard";
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 28 + Math.random() * 36;
      shard.style.setProperty("--sx", `${Math.cos(angle) * dist}px`);
      shard.style.setProperty("--sy", `${Math.sin(angle) * dist}px`);
      shard.style.setProperty("--sdelay", `${i * 18}ms`);
      btn.appendChild(shard);
    }
    window.setTimeout(() => {
      btn.classList.remove("is-popping");
      btn.classList.add("is-popped");
      btn.hidden = true;
    }, 420);
    wishPopped += 1;
    maybeShowWishNext();
    return true;
  }

  function openWishFocus(text, btn) {
    if (!wishFocus || !wishFocusText) return;
    if (btn && (btn.classList.contains("is-popped") || btn.classList.contains("is-popping"))) {
      return;
    }
    wishFocusText.textContent = text;
    wishFocus.hidden = false;
    void wishFocus.offsetWidth;
    wishFocus.classList.add("is-open");
    if (btn) popWishBubble(btn);
  }

  function buildWishBubbles() {
    if (!wishBubbles) return;
    wishBubbles.innerHTML = "";
    wishPopped = 0;
    const wish = wishConfig();
    const list = Array.isArray(wish.bubbles) ? wish.bubbles : [];
    wishTotal = list.length;
    const slots = [
      { x: 10, y: 10, s: 1.05, d: 11, delay: 0 },
      { x: 72, y: 8, s: 0.9, d: 13, delay: 0.4 },
      { x: 86, y: 30, s: 1.15, d: 10, delay: 0.8 },
      { x: 14, y: 36, s: 0.85, d: 14, delay: 1.1 },
      { x: 48, y: 18, s: 1.0, d: 12, delay: 0.2 },
      { x: 76, y: 56, s: 0.95, d: 15, delay: 1.5 },
      { x: 8, y: 64, s: 1.1, d: 11.5, delay: 0.6 },
      { x: 40, y: 62, s: 0.88, d: 13.5, delay: 1.8 },
      { x: 62, y: 78, s: 1.2, d: 12.5, delay: 0.9 },
      { x: 28, y: 82, s: 1.0, d: 14.5, delay: 1.3 },
    ];

    list.forEach((text, i) => {
      const slot = slots[i % slots.length];
      const btn = document.createElement("button");
      btn.type = "button";
      const isLove = /i love you/i.test(text);
      btn.className = `wish-bubble wish-bubble--${(i % 5) + 1}${isLove ? " is-love" : ""}`;
      btn.style.setProperty("--bx", `${slot.x}%`);
      btn.style.setProperty("--by", `${slot.y}%`);
      btn.style.setProperty("--bs", String(slot.s));
      btn.style.setProperty("--bdur", `${slot.d}s`);
      btn.style.setProperty("--bdelay", `${slot.delay + i * 0.1}s`);
      btn.style.setProperty("--bdrift", `${((i % 3) - 1) * 12}px`);
      btn.dataset.message = text;
      btn.setAttribute("aria-label", "Buka doa");
      btn.innerHTML = '<span class="wish-bubble-shine" aria-hidden="true"></span>';
      btn.addEventListener("click", () => openWishFocus(text, btn));
      wishBubbles.appendChild(btn);
    });
  }

  function revealWishBubbles() {
    if (wishPray) wishPray.hidden = true;
    if (wishOrb) {
      wishOrb.classList.remove("is-praying", "is-holding");
      wishOrb.classList.add("is-done");
      wishOrb.disabled = true;
    }
    buildWishBubbles();
    if (wishField) {
      wishField.hidden = false;
      wishField.classList.add("is-visible");
    }
    const caption = document.getElementById("wish-caption");
    if (caption) caption.hidden = true;
    // Suara gelembung muncul saat beralih dari berdoa
    playSfx("bubbleAppear");
    if (wishNext) {
      wishNext.hidden = true;
      wishNext.textContent = "Next";
    }
  }

  function clearWishHold() {
    wishHolding = false;
    window.clearTimeout(wishHoldTimer);
    window.clearTimeout(wishAlmostTimer);
    if (wishOrb && !wishDone) wishOrb.classList.remove("is-holding");
    if (!wishDone) {
      setText(
        "wish-hint",
        wishConfig().hint || "tekan & tahan bola doa agak lama"
      );
    }
  }

  function startWishHold(event) {
    if (scenesOrder[index] !== "wish" || wishDone) return;
    unlockAudio();
    wishHolding = true;
    if (wishOrb) wishOrb.classList.add("is-holding");
    const holdMs = Math.max(800, Number(wishConfig().holdMs) || 2800);
    setText(
      "wish-hint",
      wishConfig().progressHint || "pelan-pelan… biarkan doamu mengisi"
    );
    window.clearTimeout(wishHoldTimer);
    window.clearTimeout(wishAlmostTimer);
    const almostAt = Math.max(400, holdMs - 700);
    wishAlmostTimer = window.setTimeout(() => {
      if (!wishHolding || wishDone) return;
      setText("wish-hint", wishConfig().almostHint || "hampir… jangan lepas dulu");
    }, almostAt);
    wishHoldTimer = window.setTimeout(() => {
      if (wishHolding) finishWish();
    }, holdMs);
    if (event && event.pointerId != null && wishOrb) {
      try {
        wishOrb.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
  }

  function leaveWishScene() {
    clearWishTimers();
    clearWishHold();
    closeWishFocus();
    wishDone = false;
    if (wishOrb) {
      wishOrb.disabled = false;
      wishOrb.classList.remove("is-holding", "is-done", "is-praying");
    }
    if (wishPray) wishPray.hidden = false;
    if (wishField) {
      wishField.hidden = true;
      wishField.classList.remove("is-visible");
    }
    if (wishBubbles) wishBubbles.innerHTML = "";
    if (wishNext) wishNext.hidden = true;
    wishPopped = 0;
    wishTotal = 0;
    const caption = document.getElementById("wish-caption");
    if (caption) caption.hidden = false;
  }

  function enterWishScene() {
    clearWishTimers();
    clearWishHold();
    closeWishFocus();
    wishDone = false;
    wishPopped = 0;
    wishTotal = 0;
    const wish = wishConfig();

    if (wishPray) wishPray.hidden = false;
    if (wishOrb) {
      wishOrb.disabled = false;
      wishOrb.classList.remove("is-holding", "is-done");
      wishOrb.classList.add("is-praying");
    }
    if (wishField) {
      wishField.hidden = true;
      wishField.classList.remove("is-visible");
    }
    if (wishBubbles) wishBubbles.innerHTML = "";
    if (wishNext) {
      wishNext.hidden = true;
      wishNext.textContent = "Next";
    }
    const caption = document.getElementById("wish-caption");
    if (caption) caption.hidden = false;

    setText("wish-caption", wish.caption || "saatnya berdoa");
    setText("wish-hint", wish.hint || "tekan & tahan bola doa agak lama");
    setText("wish-center", wish.center || "ini doaku untukmu");
    if (wishOrb) {
      const holdMs = Math.max(800, Number(wish.holdMs) || 2800);
      wishOrb.style.setProperty("--wish-hold-ms", `${holdMs}ms`);
    }
  }

  function finishWish() {
    if (wishDone) return;
    wishDone = true;
    wishHolding = false;
    window.clearTimeout(wishHoldTimer);
    if (wishOrb) wishOrb.classList.remove("is-holding");
    revealWishBubbles();
  }

  if (wishOrb) {
    wishOrb.addEventListener("pointerdown", startWishHold);
    wishOrb.addEventListener("pointerup", clearWishHold);
    wishOrb.addEventListener("pointercancel", clearWishHold);
    wishOrb.addEventListener("lostpointercapture", clearWishHold);
  }
  if (wishFocus) {
    wishFocus.addEventListener("click", (event) => {
      if (event.target === wishFocus) closeWishFocus();
    });
  }
  if (wishFocusCard) {
    wishFocusCard.addEventListener("click", () => closeWishFocus());
  }

  /* ——— Finale / memory swipe + lights out ——— */

  const memoryViewport = document.getElementById("memory-viewport");
  const memoryTrack = document.getElementById("memory-track");
  const memoryDots = document.getElementById("memory-dots");
  const memoryPrev = document.getElementById("memory-prev");
  const memoryNext = document.getElementById("memory-next");
  const memoryHint = document.getElementById("memory-hint");
  const finaleEnd = document.getElementById("finale-end");
  const inviteStage = document.getElementById("invite-stage");
  const inviteSeal = document.getElementById("invite-seal");
  const inviteSheet = document.getElementById("invite-sheet");
  const lightsOffBtn = document.getElementById("lights-off");
  let memoryIndex = 0;
  let memoryCount = 0;
  let memoryScrollLock = false;
  let inviteOpened = false;
  let inviteReady = false;
  let inviteRevealTimer = 0;

  function finaleConfig() {
    return config.finale || {};
  }

  function inviteConfig() {
    return finaleConfig().invite || {};
  }

  function memoryList() {
    const list = finaleConfig().memories;
    if (!Array.isArray(list)) return [];
    return list.filter((m) => m && (m.empty || m.src));
  }

  function clearInviteRevealTimer() {
    window.clearTimeout(inviteRevealTimer);
    inviteRevealTimer = 0;
  }

  function resetInviteUi() {
    clearInviteRevealTimer();
    inviteOpened = false;
    inviteReady = false;
    const finaleScene = document.querySelector('.scene[data-scene="finale"]');
    if (finaleScene) finaleScene.classList.remove("is-invite-open");
    if (inviteStage) inviteStage.classList.remove("is-open");
    if (inviteSeal) {
      inviteSeal.hidden = false;
      inviteSeal.setAttribute("aria-expanded", "false");
    }
    if (inviteSheet) inviteSheet.hidden = true;
    if (lightsOffBtn) lightsOffBtn.hidden = true;
    if (finaleEnd) finaleEnd.hidden = true;
  }

  function revealInviteStage() {
    if (inviteReady) return;
    if (!(memoryCount > 0 && memoryIndex >= memoryCount - 1)) return;
    inviteReady = true;
    if (finaleEnd) finaleEnd.hidden = false;
    if (memoryHint) memoryHint.hidden = true;
    if (!inviteOpened && lightsOffBtn) lightsOffBtn.hidden = true;
    playSfx("sparkle");
  }

  function scheduleInviteReveal() {
    if (inviteReady) {
      if (finaleEnd) finaleEnd.hidden = false;
      if (memoryHint) memoryHint.hidden = true;
      return;
    }
    // Sudah menunggu — jangan reset timer tiap sync scroll
    if (inviteRevealTimer) return;

    if (finaleEnd) finaleEnd.hidden = true;
    if (memoryHint) {
      memoryHint.hidden = false;
      memoryHint.textContent =
        finaleConfig().lastSlideHint || "lihat sampai habis dulu ya…";
    }
    const delay = Math.max(
      0,
      Number(finaleConfig().inviteRevealDelayMs) || 3200
    );
    if (reduceMotion || delay === 0) {
      revealInviteStage();
      return;
    }
    inviteRevealTimer = window.setTimeout(() => {
      inviteRevealTimer = 0;
      revealInviteStage();
    }, delay);
  }

  function openInvite() {
    if (!inviteReady || inviteOpened) return;
    inviteOpened = true;
    playSfx("letter");
    const finaleScene = document.querySelector('.scene[data-scene="finale"]');
    if (finaleScene) finaleScene.classList.add("is-invite-open");
    if (inviteStage) inviteStage.classList.add("is-open");
    if (inviteSeal) {
      inviteSeal.hidden = true;
      inviteSeal.setAttribute("aria-expanded", "true");
    }
    if (inviteSheet) inviteSheet.hidden = false;
    if (lightsOffBtn) lightsOffBtn.hidden = false;
  }

  function updateMemoryUi() {
    if (memoryDots) {
      [...memoryDots.querySelectorAll("span")].forEach((dot, i) => {
        dot.classList.toggle("is-active", i === memoryIndex);
      });
    }
    if (memoryPrev) memoryPrev.disabled = memoryIndex <= 0;
    if (memoryNext) memoryNext.disabled = memoryIndex >= memoryCount - 1;
    const atEnd = memoryCount > 0 && memoryIndex >= memoryCount - 1;
    if (!atEnd) {
      resetInviteUi();
      if (memoryHint) {
        memoryHint.hidden = false;
        memoryHint.textContent =
          finaleConfig().hint || "geser ke kiri atau kanan";
      }
      return;
    }
    scheduleInviteReveal();
  }

  function goMemory(index, { smooth = true, sfx = true } = {}) {
    if (!memoryViewport || memoryCount <= 0) return;
    const next = Math.max(0, Math.min(memoryCount - 1, index));
    const changed = next !== memoryIndex;
    memoryIndex = next;
    const slide = memoryTrack?.children[memoryIndex];
    if (slide) {
      memoryScrollLock = true;
      slide.scrollIntoView({
        behavior: smooth && !reduceMotion ? "smooth" : "auto",
        inline: "center",
        block: "nearest",
      });
      window.setTimeout(() => {
        memoryScrollLock = false;
      }, smooth ? 380 : 40);
    }
    updateMemoryUi();
    if (changed && sfx) playSfx("sparkle");
  }

  function syncMemoryFromScroll() {
    if (!memoryViewport || !memoryTrack || memoryCount <= 0 || memoryScrollLock) return;
    const slides = [...memoryTrack.children];
    if (!slides.length) return;
    const mid = memoryViewport.scrollLeft + memoryViewport.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const center = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== memoryIndex) {
      memoryIndex = best;
      updateMemoryUi();
      playSfx("sparkle");
    } else {
      updateMemoryUi();
    }
  }

  function buildMemories() {
    if (!memoryTrack) return;
    memoryTrack.innerHTML = "";
    if (memoryDots) memoryDots.innerHTML = "";
    const list = memoryList();
    memoryCount = list.length;
    memoryIndex = 0;

    list.forEach((item, i) => {
      const figure = document.createElement("figure");
      figure.className = "memory-frame";
      if (item.empty) {
        figure.classList.add("is-empty");
        const emptyText =
          item.text || "Serta kenangan cerita kita lainnya";
        figure.setAttribute("aria-label", emptyText);
        const empty = document.createElement("div");
        empty.className = "memory-empty";
        const text = document.createElement("p");
        text.className = "memory-empty-text";
        text.textContent = emptyText;
        empty.appendChild(text);
        figure.appendChild(empty);
      } else {
        figure.setAttribute("aria-label", item.caption || `Kenangan ${i + 1}`);
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.caption || `Kenangan ${i + 1}`;
        img.draggable = false;
        img.decoding = "async";
        figure.appendChild(img);
      }
      if (item.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "memory-caption";
        cap.textContent = item.caption;
        figure.appendChild(cap);
      }
      memoryTrack.appendChild(figure);

      if (memoryDots) {
        const dot = document.createElement("span");
        if (i === 0) dot.classList.add("is-active");
        memoryDots.appendChild(dot);
      }
    });

    if (memoryViewport) memoryViewport.scrollLeft = 0;
    updateMemoryUi();
  }

  function enterFinaleScene() {
    resetInviteUi();
    buildMemories();
    goMemory(0, { smooth: false, sfx: false });
    // Pastikan surat/undangan benar-benar tersembunyi di foto awal
    if (finaleEnd) finaleEnd.hidden = true;
    if (inviteSheet) inviteSheet.hidden = true;
    if (lightsOffBtn) lightsOffBtn.hidden = true;
    if (memoryHint) {
      memoryHint.hidden = false;
      memoryHint.textContent =
        finaleConfig().hint || "geser ke kiri atau kanan";
    }
  }

  function leaveFinaleScene() {
    clearInviteRevealTimer();
    if (finaleEnd) finaleEnd.hidden = true;
    if (memoryHint) {
      memoryHint.hidden = false;
      memoryHint.textContent =
        finaleConfig().hint || "geser ke kiri atau kanan";
    }
    memoryIndex = 0;
    resetInviteUi();
  }

  async function playLightsOut() {
    // Matikan BGM saat lampu padam / restart
    stopBgm({ fade: true });
    playSfx("light");
    document.body.classList.add("is-lights-out");
    if (festoon) {
      festoon.classList.remove("is-visible");
      festoon.hidden = true;
    }
    await new Promise((r) => window.setTimeout(r, reduceMotion ? 180 : 780));
  }

  if (memoryPrev) {
    memoryPrev.addEventListener("click", () => {
      unlockAudio();
      goMemory(memoryIndex - 1);
    });
  }
  if (memoryNext) {
    memoryNext.addEventListener("click", () => {
      unlockAudio();
      goMemory(memoryIndex + 1);
    });
  }
  if (memoryViewport) {
    let scrollTimer = 0;
    memoryViewport.addEventListener(
      "scroll",
      () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(syncMemoryFromScroll, 80);
      },
      { passive: true }
    );
    memoryViewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goMemory(memoryIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goMemory(memoryIndex + 1);
      }
    });
  }
  if (inviteSeal) {
    inviteSeal.addEventListener("click", () => {
      unlockAudio();
      if (scenesOrder[index] !== "finale") return;
      openInvite();
    });
  }
  if (lightsOffBtn) {
    lightsOffBtn.addEventListener("click", () => {
      unlockAudio();
      if (scenesOrder[index] !== "finale") return;
      restart();
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function buildProgress() {
    progress.innerHTML = "";
    scenesOrder.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("is-active");
      progress.appendChild(dot);
    });
    progress.hidden = false;
  }

  function updateProgress() {
    const dots = [...progress.querySelectorAll("span")];
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      dot.classList.toggle("is-done", i < index);
    });
  }

  function updateFestoon(sceneName) {
    if (!festoon) return;
    const show = FESTIVE_SCENES.has(sceneName);
    festoon.hidden = !show;
    festoon.classList.toggle("is-visible", show);
    if (show) buildSakuraFall();
  }

  function getSceneEl(name) {
    return sceneEls.find((el) => el.dataset.scene === name);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getFlowerImages() {
    const conf = config.flowers || {};
    const images = Array.isArray(conf.images) ? conf.images.filter(Boolean) : [];
    return images.length
      ? images
      : [
          "assets/images/flowers/rose-pink.png",
          "assets/images/flowers/sakura-pink.png",
          "assets/images/flowers/peony-pink.png",
        ];
  }

  function getPetalImages() {
    const conf = config.flowers || {};
    const petals = Array.isArray(conf.petals) ? conf.petals.filter(Boolean) : [];
    return petals.length ? petals : getFlowerImages().slice(0, 3);
  }

  function buildSakuraFall() {
    if (!sakuraFall || sakuraBuilt || reduceMotion) return;
    sakuraFall.innerHTML = "";
    const conf = config.flowers || {};
    const petals = getPetalImages();
    const count = Math.max(4, Math.min(12, Number(conf.petalCount) || 8));
    const sizeMin = Number(conf.petalSizeMin) || 0.55;
    const sizeMax = Number(conf.petalSizeMax) || 0.95;
    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.className = "sakura-petal";
      img.src = petals[i % petals.length];
      img.alt = "";
      img.decoding = "async";
      // Sebar tipis, hindari zona tengah teks (~25–75%)
      const edge = Math.random() < 0.5;
      const left = edge
        ? 2 + Math.random() * 18
        : 80 + Math.random() * 18;
      img.style.left = `${left}%`;
      const size = sizeMin + Math.random() * (sizeMax - sizeMin);
      img.style.setProperty("--pw", `${size}rem`);
      img.style.setProperty("--dur", `${12 + Math.random() * 8}s`);
      img.style.setProperty("--delay", `${-Math.random() * 14}s`);
      img.style.setProperty("--drift", `${-28 + Math.random() * 56}px`);
      img.style.setProperty("--spin", `${200 + Math.random() * 220}deg`);
      sakuraFall.appendChild(img);
    }
    sakuraBuilt = true;
  }

  const BLOOM_VARIANTS = ["cascade", "burst", "rain", "spiral", "wave", "orbit"];
  let bloomVariantIndex = 0;

  function nextBloomVariant() {
    const name = BLOOM_VARIANTS[bloomVariantIndex % BLOOM_VARIANTS.length];
    bloomVariantIndex += 1;
    return name;
  }

  function makeBloomSpots(variant) {
    const spots = [];
    // Lebih padat supaya terasa full
    const cols = 6;
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = (Math.random() - 0.5) * 9;
        const jitterY = (Math.random() - 0.5) * 7;
        spots.push({
          left: (c / (cols - 1)) * 100 + jitterX,
          top: (r / (rows - 1)) * 100 + jitterY,
          size: 22 + Math.random() * 16,
          order: r * cols + c,
        });
      }
    }
    const extras = [
      { left: 50, top: 48, size: 48 },
      { left: 18, top: 18, size: 38 },
      { left: 82, top: 16, size: 40 },
      { left: 12, top: 78, size: 42 },
      { left: 88, top: 80, size: 44 },
      { left: 50, top: 8, size: 34 },
      { left: 50, top: 92, size: 36 },
      { left: -4, top: 48, size: 38 },
      { left: 104, top: 52, size: 38 },
      { left: 32, top: 36, size: 30 },
      { left: 68, top: 40, size: 32 },
      { left: 40, top: 68, size: 30 },
      { left: 62, top: 70, size: 31 },
    ];
    extras.forEach((e, i) => spots.push({ ...e, order: 200 + i }));

    // Urutan delay berbeda per variasi (MDN: animation-delay)
    spots.forEach((spot) => {
      const i = spot.order;
      if (variant === "cascade") {
        spot.delay = Math.floor((spot.top / 100) * 900 + Math.random() * 120);
      } else if (variant === "rain") {
        spot.delay = Math.floor((spot.top / 100) * 700 + (spot.left / 100) * 180);
      } else if (variant === "burst") {
        const dx = spot.left - 50;
        const dy = spot.top - 50;
        const dist = Math.sqrt(dx * dx + dy * dy);
        spot.delay = Math.floor(dist * 9 + Math.random() * 80);
      } else if (variant === "spiral") {
        const ang = Math.atan2(spot.top - 50, spot.left - 50);
        spot.delay = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 1000);
      } else if (variant === "wave") {
        spot.delay = Math.floor((spot.left / 100) * 950 + Math.sin(spot.top / 18) * 80);
      } else {
        // orbit
        spot.delay = Math.floor(((i % 16) * 55) + Math.random() * 90);
      }
      spot.outDelay = Math.floor(Math.random() * 280);
    });
    return spots;
  }

  function buildBloomLayer(variant = "cascade") {
    bloomVeil.innerHTML = "";
    bloomVeil.dataset.variant = variant;
    const images = getFlowerImages();
    const spots = makeBloomSpots(variant);

    spots.forEach((spot) => {
      const el = document.createElement("div");
      el.className = "bloom-flower";
      el.style.setProperty("--size", `${spot.size}vmin`);
      el.style.setProperty("--rot", `${Math.floor(Math.random() * 360)}`);
      el.style.setProperty("--delay", `${spot.delay}ms`);
      el.style.setProperty("--out-delay", `${spot.outDelay}ms`);
      el.style.left = `${spot.left}%`;
      el.style.top = `${spot.top}%`;
      el.style.zIndex = String(10 + Math.floor(Math.random() * 40));
      const img = document.createElement("img");
      img.src = pick(images);
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      el.appendChild(img);
      bloomVeil.appendChild(el);
    });
  }

  async function playBloomTransition(sfxKey = "bloom") {
    if (reduceMotion || !bloomVeil) {
      if (sfxKey) await playSfx(sfxKey);
      return;
    }
    const variant = nextBloomVariant();
    buildBloomLayer(variant);
    const imgs = [...bloomVeil.querySelectorAll("img")];
    await Promise.all(
      imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))
    );
    bloomVeil.classList.remove("is-out", "is-on");
    BLOOM_VARIANTS.forEach((v) => bloomVeil.classList.remove(`variant-${v}`));
    bloomVeil.classList.add(`variant-${variant}`);
    void bloomVeil.offsetWidth;
    bloomVeil.classList.add("is-on");
    if (sfxKey) playSfx(sfxKey);
    await new Promise((r) => window.setTimeout(r, 1950));
    bloomVeil.classList.add("is-out");
    await new Promise((r) => window.setTimeout(r, 1100));
    bloomVeil.classList.remove("is-on", "is-out", `variant-${variant}`);
    bloomVeil.innerHTML = "";
  }

  async function playLightReveal() {
    return new Promise((resolve) => {
      if (!lightBurst) {
        resolve();
        return;
      }
      if (lightSwitch) lightSwitch.classList.add("is-on");
      // SFX saklar bersamaan dengan cahaya
      playSfx("light");
      if (reduceMotion) {
        resolve();
        return;
      }
      lightBurst.classList.remove("is-on");
      void lightBurst.offsetWidth;
      lightBurst.classList.add("is-on");
      window.setTimeout(() => {
        resolve();
        window.setTimeout(() => lightBurst.classList.remove("is-on"), 400);
      }, 520);
    });
  }

  async function swapScene(nextIndex) {
    const current = getSceneEl(scenesOrder[index]);
    const next = getSceneEl(scenesOrder[nextIndex]);
    if (!next) return;

    if (current && current !== next) {
      current.classList.add("is-leaving");
      current.classList.remove("is-active");
    }

    await new Promise((r) => {
      window.setTimeout(r, current && current !== next ? 320 : 0);
    });

    if (current && current !== next) {
      current.hidden = true;
      current.classList.remove("is-leaving");
    }

    next.hidden = false;
    void next.offsetWidth;
    next.classList.add("is-active");

    index = nextIndex;
    updateProgress();
    updateFestoon(scenesOrder[index]);

    if (scenesOrder[index] === "dark" && lightSwitch) {
      lightSwitch.classList.remove("is-on");
    }

    if (scenesOrder[index] === "record") {
      enterRecordScene();
    } else {
      leaveRecordScene();
    }

    if (scenesOrder[index] === "notes") {
      renderNote(0);
    }

    if (scenesOrder[index] === "cake") {
      enterCakeScene();
    } else {
      leaveCakeScene();
    }

    if (scenesOrder[index] === "wish") {
      enterWishScene();
    } else {
      leaveWishScene();
    }

    if (scenesOrder[index] === "finale") {
      enterFinaleScene();
    } else {
      leaveFinaleScene();
    }
  }

  async function showScene(nextIndex, { restart = false, transition = "none" } = {}) {
    if (transitioning) return;
    if (nextIndex < 0 || nextIndex >= scenesOrder.length) return;
    if (!restart && nextIndex === index) return;

    transitioning = true;
    const fromScene = scenesOrder[index];
    const toScene = scenesOrder[nextIndex];
    const sfxKey = sfxForTransition(fromScene, toScene);

    if (transition === "light") {
      await playLightReveal();
      await swapScene(nextIndex);
      // Pastikan BGM tetap jalan setelah lampu (kalau belum dari layar gelap)
      startBgm();
    } else if (transition === "lightsOut") {
      await playLightsOut();
      await swapScene(nextIndex);
      document.body.classList.remove("is-lights-out");
      if (lightSwitch) lightSwitch.classList.remove("is-on");
      // Kembali ke gelap: BGM main lagi dari awal pengalaman
      if (bgmConfig().playFromStart !== false) {
        startBgm({ force: true });
      }
    } else if (transition === "bloom") {
      // Bunga + SFX scene muncul bersamaan; bukan di jarum piringan
      await playBloomTransition(sfxKey === "light" ? "bloom" : sfxKey);
      await swapScene(nextIndex);
    } else {
      if (transition !== "none" && fromScene !== toScene) {
        await playSfx(sfxKey);
      }
      await swapScene(nextIndex);
    }

    transitioning = false;
  }

  function goNext() {
    if (index >= scenesOrder.length - 1) return;
    const from = scenesOrder[index];
    const transition = from === "dark" ? "light" : "bloom";
    showScene(index + 1, { transition });
  }

  function restart() {
    showScene(0, { restart: true, transition: "lightsOut" });
  }

  /* ——— Record player / music ——— */

  function resetRecordUi() {
    musicPlaying = false;
    if (turntable) turntable.classList.remove("is-playing");
    if (vinyl) vinyl.classList.remove("is-spinning");
    if (tonearm) {
      tonearm.classList.remove("is-on");
      tonearm.setAttribute("aria-pressed", "false");
    }
    const music = musicConfig();
    setText("record-hint", music.hint || "geser jarumnya ke piringan buat muterin");
    if (recordSkip) recordSkip.hidden = true;
    if (recordNext) recordNext.hidden = true;
  }

  function enterRecordScene() {
    resetRecordUi();
    if (recordSkip) recordSkip.hidden = true;
    if (recordNext) recordNext.hidden = true;
  }

  function leaveRecordScene() {
    stopMusic();
    restoreBgm();
  }

  function showRecordContinue() {
    if (recordSkip) recordSkip.hidden = true;
    if (recordNext) recordNext.hidden = false;
  }

  function finishMusicPlayback() {
    if (!musicPlaying && recordNext && !recordNext.hidden) return;
    stopMusic();
    setText(
      "record-hint",
      musicConfig().finishedHint || "selesai… lanjut kalau sudah siap"
    );
    showRecordContinue();
    restoreBgm();
  }

  async function startMusic() {
    const music = musicConfig();
    if (!recordAudio || !music.src) {
      showRecordContinue();
      return;
    }
    if (musicPlaying || musicStarting) return;
    musicStarting = true;

    const startAt = Number(music.startAt) || 0;
    try {
      playSfx("needle");
      // Duck BGM dulu supaya tidak tabrakan dengan lagu piringan
      duckBgm();
      recordAudio.pause();
      recordAudio.currentTime = startAt;
      await recordAudio.play();
      musicPlaying = true;
      if (turntable) turntable.classList.add("is-playing");
      if (vinyl && !reduceMotion) vinyl.classList.add("is-spinning");
      if (tonearm) {
        tonearm.classList.add("is-on");
        tonearm.setAttribute("aria-pressed", "true");
      }
      // Next sengaja ditahan sampai lagu habis (MDN: HTMLMediaElement ended)
      if (recordNext) recordNext.hidden = true;
      if (recordSkip) recordSkip.hidden = true;
      setText("record-hint", music.playingHint || "lagi muter… dengerin sampai habis ya");
    } catch (err) {
      musicPlaying = false;
      setText("record-hint", "ketuk lagi jarumnya untuk memutar");
      restoreBgm();
    } finally {
      musicStarting = false;
    }
  }

  function stopMusic() {
    musicPlaying = false;
    if (recordAudio) {
      recordAudio.pause();
    }
    if (turntable) turntable.classList.remove("is-playing");
    if (vinyl) vinyl.classList.remove("is-spinning");
    if (tonearm) {
      tonearm.classList.remove("is-on");
      tonearm.setAttribute("aria-pressed", "false");
    }
  }

  function onMusicTimeUpdate() {
    if (!musicPlaying || !recordAudio) return;
    const endAt = Number(musicConfig().endAt) || 0;
    if (endAt > 0 && recordAudio.currentTime >= endAt) {
      finishMusicPlayback();
    }
  }

  function getArmLimits() {
    if (!tonearm) return { rest: -8, play: 52 };
    const styles = window.getComputedStyle(tonearm);
    const rest = Number.parseFloat(styles.getPropertyValue("--arm-rest")) || -8;
    const play = Number.parseFloat(styles.getPropertyValue("--arm-play")) || 40;
    return { rest, play };
  }

  function getArmPivot() {
    if (!tonearm) return { x: 0, y: 0 };
    const pivotEl = tonearm.querySelector(".tonearm-pivot");
    if (pivotEl) {
      const r = pivotEl.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    const rect = tonearm.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.5, y: rect.top + 11 };
  }

  /** Sudut CSS (positif = jarum ke kiri / ke piringan) dari posisi pointer. */
  function armAngleFromPointer(clientX, clientY) {
    const pivot = getArmPivot();
    const dx = clientX - pivot.x;
    const dy = clientY - pivot.y;
    // y ke bawah: atan2(dx, dy)=0 saat lurus ke bawah; kiri → sudut negatif → balik tanda utk CSS
    let deg = (-Math.atan2(dx, dy) * 180) / Math.PI;
    const { rest, play } = getArmLimits();
    return Math.min(play, Math.max(rest, deg));
  }

  function armProgressFromAngle(deg) {
    const { rest, play } = getArmLimits();
    const span = play - rest || 1;
    return Math.min(1, Math.max(0, (deg - rest) / span));
  }

  function setArmVisual(deg) {
    if (!tonearm) return;
    tonearm.classList.add("is-dragging");
    tonearm.style.transform = `rotate(${deg}deg)`;
  }

  function clearArmInline() {
    if (!tonearm) return;
    tonearm.classList.remove("is-dragging");
    tonearm.style.transform = "";
  }

  if (tonearm) {
    const onDown = (event) => {
      if (scenesOrder[index] !== "record" || musicPlaying) return;
      armDragging = true;
      tonearm.setPointerCapture?.(event.pointerId);
      setArmVisual(armAngleFromPointer(event.clientX, event.clientY));
      event.preventDefault();
    };

    const onMove = (event) => {
      if (!armDragging) return;
      const deg = armAngleFromPointer(event.clientX, event.clientY);
      setArmVisual(deg);
      if (armProgressFromAngle(deg) > 0.78) {
        armDragging = false;
        clearArmInline();
        startMusic();
      }
    };

    const onUp = (event) => {
      if (!armDragging) return;
      armDragging = false;
      const deg = armAngleFromPointer(event.clientX, event.clientY);
      clearArmInline();
      if (armProgressFromAngle(deg) > 0.55) startMusic();
      else if (tonearm) tonearm.classList.remove("is-on");
    };

    tonearm.addEventListener("pointerdown", (event) => {
      unlockAudio();
      onDown(event);
    });
    tonearm.addEventListener("pointermove", onMove);
    tonearm.addEventListener("pointerup", onUp);
    tonearm.addEventListener("pointercancel", onUp);
    tonearm.addEventListener("click", () => {
      unlockAudio();
      if (scenesOrder[index] !== "record" || musicPlaying) return;
      startMusic();
    });
  }

  if (recordAudio) {
    recordAudio.addEventListener("timeupdate", onMusicTimeUpdate);
    // MDN: ended fires when playback reaches the end of the media
    recordAudio.addEventListener("ended", () => {
      finishMusicPlayback();
    });
  }

  if (recordSkip) {
    recordSkip.addEventListener("click", () => {
      stopMusic();
      goNext();
    });
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const count = Math.min(36, Math.floor(window.innerWidth / 18));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.28 + 0.06),
      vx: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.4 + 0.12,
    }));
  }

  function drawEmbers() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -4) {
        p.y = window.innerHeight + 4;
        p.x = Math.random() * window.innerWidth;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(232, 196, 192, ${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = requestAnimationFrame(drawEmbers);
  }

  function startEmbers() {
    if (reduceMotion) return;
    resizeCanvas();
    createParticles();
    cancelAnimationFrame(rafId);
    drawEmbers();
  }

  if (lightSwitch) {
    // Mulai BGM sedini mungkin saat jari menyentuh saklar (sebelum lampu nyala)
    lightSwitch.addEventListener(
      "pointerdown",
      () => {
        unlockAudio();
        if (bgmConfig().playFromStart !== false) startBgm();
      },
      { passive: true }
    );
    lightSwitch.addEventListener("click", () => {
      unlockAudio();
      if (bgmConfig().playFromStart !== false) startBgm();
      if (scenesOrder[index] !== "dark") return;
      goNext();
    });
  }

  const notesNext = document.getElementById("notes-next");
  if (notesNext) {
    notesNext.addEventListener("click", () => {
      unlockAudio();
      if (scenesOrder[index] !== "notes") return;
      advanceNote();
    });
  }

  story.addEventListener("click", (event) => {
    unlockAudio();
    if (event.target.closest("#light-switch")) return;
    if (event.target.closest("#tonearm")) return;
    if (event.target.closest("#record-skip")) return;
    if (event.target.closest("#notes-next")) return;
    if (event.target.closest("#cake-stage")) return;
    if (event.target.closest("#wish-orb")) return;
    if (event.target.closest("#memory-deck")) return;
    if (event.target.closest("#lights-off")) return;
    const nextBtn = event.target.closest("[data-next]");
    const restartBtn = event.target.closest("[data-restart]");
    if (restartBtn) {
      restart();
      return;
    }
    if (nextBtn) goNext();
  });

  // Gesture pertama di mana saja → buka audio + BGM (supaya main sebelum saklar)
  const armEarlyBgm = () => {
    unlockAudio();
    if (bgmConfig().playFromStart !== false) startBgm();
  };
  ["pointerdown", "touchstart", "keydown"].forEach((evt) => {
    document.addEventListener(evt, armEarlyBgm, { capture: true, passive: true });
  });

  // Preload assets early; unlock still needs gesture
  preloadSfx();
  setupBgm();
  // Coba autoplay (sering diblokir browser; gesture di atas jadi fallback)
  if (bgmConfig().playFromStart !== false) {
    startBgm();
  }
  getFlowerImages().forEach((src) => {
    const img = new Image();
    img.src = src;
  });
  memoryList().forEach((item) => {
    if (!item.src) return;
    const img = new Image();
    img.src = item.src;
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    createParticles();
  });

  fillContent();
  buildProgress();
  showScene(0, { restart: true });
  startEmbers();
})();
