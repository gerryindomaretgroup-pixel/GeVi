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
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function musicConfig() {
    return config.music || {};
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

  async function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    preloadSfx();
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
    const conf = sfxConfig();
    if (conf[toScene]) return toScene;
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
    setText("cake-hint", cake.waitHint || cake.hint || "sebentar… ada kejutan kecil");
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
      wish.hint || "pejamkan matamu… dan berdoalah dalam hati sampai selesai"
    );

    setText("letter-label", config.letterLabel || "Untukmu");
    renderLetterBody(config.letterBody || config.letterPreview || "");
    const letterFrom = (config.letterSign || sender || "").trim();
    setText("letter-sign", letterFrom ? `— ${letterFrom}` : "");

    const finale = config.finale || {};
    setText("finale-eyebrow", finale.eyebrow || "Terima kasih sudah sampai sini");
    setText("finale-line", finale.line || `Untuk ${name}.`);
    setText(
      "finale-note",
      finale.note || "Semoga harimu hangat, dan hatimu tenang."
    );
    const finaleAge = document.getElementById("finale-age");
    if (finaleAge) {
      const showFinaleAge = finale.showAge !== false && age;
      finaleAge.hidden = !showFinaleAge;
      finaleAge.textContent = showFinaleAge ? `yang ke-${age}` : "";
    }
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
        ? config.notesFinalButton || "sekarang… kue-nya"
        : "lanjut";
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
  const cakeConfetti = document.getElementById("cake-confetti");
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

  function buildCakeConfetti() {
    if (!cakeConfetti || reduceMotion) return;
    cakeConfetti.innerHTML = "";
    const cake = cakeConfig();
    const colors = [
      "#ff6b6b",
      "#ffd93d",
      "#6bcB77",
      "#4d96ff",
      "#ff8fab",
      "#c9a66b",
      "#ffffff",
      "#b388ff",
      "#ff9f43",
      "#48dbfb",
      "#f368e0",
      "#e8c4c0",
      "#20c997",
      "#feca57",
    ];
    // Urutan ledakan pojok bergantian (MDN: animation-delay)
    const corners = [
      { name: "tr", left: "92%", top: "6%", wave: 0 },
      { name: "bl", left: "8%", top: "92%", wave: 1 },
      { name: "tl", left: "8%", top: "6%", wave: 2 },
      { name: "br", left: "92%", top: "92%", wave: 3 },
    ];
    const perCorner = Math.max(24, Math.floor((Number(cake.confettiCount) || 140) / corners.length));
    const waveGap = 0.95; // detik antar pojok

    corners.forEach((corner) => {
      for (let i = 0; i < perCorner; i++) {
        const bit = document.createElement("span");
        bit.className = `confetti-bit from-corner corner-${corner.name}`;
        bit.style.left = corner.left;
        bit.style.top = corner.top;
        // Sembur keluar dari pojok ke arah tengah/layar
        const angleBase =
          corner.name === "tr"
            ? 200
            : corner.name === "bl"
              ? 20
              : corner.name === "tl"
                ? 340
                : 160;
        const angle = ((angleBase + (Math.random() * 70 - 35)) * Math.PI) / 180;
        const dist = 38 + Math.random() * 55;
        const sprayX = Math.cos(angle) * dist;
        const sprayY = Math.sin(angle) * dist;
        bit.style.setProperty("--cx", `${sprayX}vw`);
        bit.style.setProperty("--cy", `${sprayY}vh`);
        bit.style.setProperty("--rot", `${Math.floor(Math.random() * 1080 - 540)}deg`);
        bit.style.setProperty("--dur", `${1.5 + Math.random() * 1.4}s`);
        bit.style.setProperty(
          "--delay",
          `${corner.wave * waveGap + Math.random() * 0.28}s`
        );
        bit.style.background = colors[(i + corner.wave * 3) % colors.length];
        bit.style.width = `${5 + Math.random() * 10}px`;
        bit.style.height = `${6 + Math.random() * 12}px`;
        if (Math.random() > 0.5) bit.classList.add("is-round");
        cakeConfetti.appendChild(bit);
      }
    });
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
    if (cakeConfetti) {
      cakeConfetti.classList.remove("is-on");
      cakeConfetti.innerHTML = "";
    }
  }

  function enableCakeBlow() {
    cakeReady = true;
    if (cakeStage) {
      cakeStage.disabled = false;
      cakeStage.classList.add("is-ready");
    }
    const cake = cakeConfig();
    setText("cake-hint", cake.hint || "tekan & tahan lilinnya agak lama buat meniup");
    playSfx("sparkle");
  }

  function enterCakeScene() {
    clearCakeIntroTimers();
    cakeBlown = false;
    cakeHolding = false;
    cakeReady = false;
    const cake = cakeConfig();

    if (cakeNext) cakeNext.hidden = true;
    if (cakeStage) {
      cakeStage.disabled = true;
      cakeStage.classList.remove("is-holding", "is-blown", "is-revealed", "is-ready");
      cakeStage.classList.add("is-concealed");
    }
    if (cakeCandles) {
      cakeCandles.classList.add("is-unlit");
      cakeCandles.classList.remove("is-lighting", "is-lit");
    }
    if (cakeConfetti) cakeConfetti.classList.remove("is-on");

    setText("cake-hint", cake.waitHint || "sebentar… ada kejutan kecil");
    buildCandles();

    if (reduceMotion) {
      if (cakeStage) {
        cakeStage.classList.remove("is-concealed");
        cakeStage.classList.add("is-revealed");
      }
      if (cakeCandles) {
        cakeCandles.classList.remove("is-unlit");
        cakeCandles.classList.add("is-lit");
      }
      enableCakeBlow();
      return;
    }

    // 1) Confetti dulu — ledakan pojok bergilir + suara, ~5 detik
    buildCakeConfetti();
    if (cakeConfetti) cakeConfetti.classList.add("is-on");
    setText("cake-hint", cake.confettiHint || "🎉");
    playSfx("confetti");
    // Suara tiap gelombang pojok
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      playSfx("confetti");
    }, 950);
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      playSfx("sparkle");
    }, 1900);
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      playSfx("confetti");
    }, 2850);
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      playSfx("sparkle");
    }, 3800);

    const confettiMs = Number(cake.confettiMs) || 5000;
    const revealMs = Number(cake.revealMs) || 1100;
    const lightingMs = Number(cake.lightingMs) || 1400;

    // 2) Kue muncul
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      if (cakeConfetti) cakeConfetti.classList.remove("is-on");
      setText("cake-hint", cake.revealHint || "kue ulang tahunmu…");
      if (cakeStage) {
        cakeStage.classList.remove("is-concealed");
        cakeStage.classList.add("is-revealed");
      }
      playSfx("cake");
    }, confettiMs);

    // 3) Nyalakan lilin
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      setText("cake-hint", cake.lightingHint || "nyalakan lilinnya…");
      if (cakeCandles) {
        cakeCandles.classList.remove("is-unlit");
        cakeCandles.classList.add("is-lighting");
      }
      playSfx("sparkle");
    }, confettiMs + revealMs);

    // 4) Siap ditiup
    scheduleCake(() => {
      if (scenesOrder[index] !== "cake") return;
      if (cakeCandles) {
        cakeCandles.classList.remove("is-lighting");
        cakeCandles.classList.add("is-lit");
      }
      enableCakeBlow();
    }, confettiMs + revealMs + lightingMs);
  }

  function clearCakeHold() {
    cakeHolding = false;
    window.clearTimeout(cakeHoldTimer);
    if (cakeStage && !cakeBlown) cakeStage.classList.remove("is-holding");
    if (!cakeBlown && cakeReady) {
      setText("cake-hint", cakeConfig().hint || "tekan & tahan lilinnya agak lama buat meniup");
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
    setText("cake-hint", cakeConfig().doneHint || "lilinnya padam… lanjut ya");
    if (cakeNext) cakeNext.hidden = false;
  }

  function startCakeHold(event) {
    if (scenesOrder[index] !== "cake" || cakeBlown || !cakeReady) return;
    unlockAudio();
    cakeHolding = true;
    if (cakeStage) cakeStage.classList.add("is-holding");
    const holdMs = Number(cakeConfig().holdMs) || 2200;
    setText("cake-hint", cakeConfig().progressHint || "dikit lagi… tiup pelan-pelan");
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

  /* ——— Wish / timed prayer ——— */

  const wishOrb = document.getElementById("wish-orb");
  const wishNext = document.getElementById("wish-next");
  let wishDone = false;
  let wishWaitTimer = 0;
  let wishTickTimer = 0;

  function wishConfig() {
    return config.wish || {};
  }

  function clearWishTimers() {
    window.clearTimeout(wishWaitTimer);
    window.clearInterval(wishTickTimer);
    wishWaitTimer = 0;
    wishTickTimer = 0;
  }

  function leaveWishScene() {
    clearWishTimers();
    if (wishOrb) wishOrb.classList.remove("is-holding", "is-done", "is-praying");
  }

  function enterWishScene() {
    clearWishTimers();
    wishDone = false;
    if (wishOrb) {
      wishOrb.classList.remove("is-holding", "is-done");
      wishOrb.classList.add("is-praying");
    }
    if (wishNext) wishNext.hidden = true;
    const wish = wishConfig();
    setText("wish-caption", wish.caption || "saatnya berdoa");
    setText(
      "wish-hint",
      wish.hint || "pejamkan matamu… dan berdoalah dalam hati sampai selesai"
    );

    const waitMs = Math.max(1000, Number(wish.waitMs) || 30000);
    const startedAt = Date.now();

    // MDN: setTimeout menunda tombol lanjut; setInterval untuk update hint
    wishTickTimer = window.setInterval(() => {
      if (wishDone || scenesOrder[index] !== "wish") return;
      const left = Math.max(0, waitMs - (Date.now() - startedAt));
      const secs = Math.ceil(left / 1000);
      if (secs <= 8) {
        setText("wish-hint", wish.almostHint || "sebentar lagi…");
      } else {
        setText(
          "wish-hint",
          wish.progressHint || "pelan-pelan… biarkan doamu mengisi ruang ini"
        );
      }
    }, 1000);

    wishWaitTimer = window.setTimeout(() => {
      finishWish();
    }, waitMs);
  }

  function finishWish() {
    if (wishDone) return;
    wishDone = true;
    clearWishTimers();
    if (wishOrb) {
      wishOrb.classList.remove("is-praying", "is-holding");
      wishOrb.classList.add("is-done");
    }
    playSfx("wish");
    setText("wish-hint", wishConfig().doneHint || "semoga terkabul… lanjut ya");
    if (wishNext) wishNext.hidden = false;
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
    showScene(0, { restart: true, transition: "bloom" });
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
  }

  function showRecordContinue() {
    if (recordSkip) recordSkip.hidden = true;
    if (recordNext) recordNext.hidden = false;
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
      setText("record-hint", music.playingHint || "lagi muter… dengerin sampai habis ya");
      showRecordContinue();
    } catch (err) {
      musicPlaying = false;
      setText("record-hint", "ketuk lagi jarumnya untuk memutar");
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
      stopMusic();
      setText("record-hint", "selesai… lanjut kalau sudah siap");
      showRecordContinue();
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
    recordAudio.addEventListener("ended", () => {
      stopMusic();
      setText("record-hint", "selesai… lanjut kalau sudah siap");
      showRecordContinue();
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
    lightSwitch.addEventListener("click", () => {
      unlockAudio();
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
    const nextBtn = event.target.closest("[data-next]");
    const restartBtn = event.target.closest("[data-restart]");
    if (restartBtn) {
      restart();
      return;
    }
    if (nextBtn) goNext();
  });

  // Preload assets early; unlock still needs gesture
  preloadSfx();
  getFlowerImages().forEach((src) => {
    const img = new Image();
    img.src = src;
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
