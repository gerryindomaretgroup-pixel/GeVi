(() => {
  const config = window.GEVI_CONFIG || {};

  const intro = document.getElementById("intro");
  const openBtn = document.getElementById("open-card");
  const card = document.getElementById("card");
  const musicBar = document.getElementById("music-bar");
  const musicToggle = document.getElementById("music-toggle");
  const audio = document.getElementById("bg-music");
  const video = document.getElementById("birthday-video");
  const gallery = document.getElementById("gallery");
  const galleryDots = document.getElementById("gallery-dots");
  const canvas = document.getElementById("sparkles");

  let musicOn = false;
  let particles = [];
  let rafId = 0;

  function fillContent() {
    const nameEl = document.getElementById("recipient-name");
    const msgEl = document.getElementById("main-message");
    const wishEl = document.getElementById("wish-text");

    if (nameEl) nameEl.textContent = config.recipientName || "Happy Birthday";
    if (msgEl) msgEl.textContent = config.mainMessage || "";
    if (wishEl) wishEl.textContent = config.wishText || "";

    buildGallery(Array.isArray(config.images) ? config.images : []);
    setupVideo(config.video || "", config.videoPoster || "");
    setupMusic(config.music || "");
  }

  function buildGallery(images) {
    gallery.innerHTML = "";
    galleryDots.innerHTML = "";

    if (!images.length) {
      gallery.innerHTML =
        '<p class="section-sub">Belum ada foto. Tambahkan di js/config.js</p>';
      return;
    }

    images.forEach((src, i) => {
      const figure = document.createElement("figure");
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Foto kenangan ${i + 1}`;
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      figure.appendChild(img);
      gallery.appendChild(figure);

      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("is-active");
      galleryDots.appendChild(dot);
    });

    const dots = [...galleryDots.querySelectorAll("span")];
    gallery.addEventListener(
      "scroll",
      () => {
        const max = gallery.scrollWidth - gallery.clientWidth;
        const progress = max > 0 ? gallery.scrollLeft / max : 0;
        const index = Math.round(progress * (dots.length - 1));
        dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      },
      { passive: true }
    );
  }

  function setupVideo(src, poster) {
    const frame = video.closest(".video-frame");
    if (!src) {
      frame.classList.add("is-empty");
      frame.setAttribute("data-empty", "1");
      const note = document.createElement("p");
      note.textContent = "Belum ada video. Tambahkan path di js/config.js";
      frame.appendChild(note);
      return;
    }
    video.src = src;
    if (poster) video.poster = poster;
  }

  function setupMusic(src) {
    if (!src) {
      musicBar.hidden = true;
      return;
    }
    audio.src = src;
  }

  async function playMusic() {
    try {
      await audio.play();
      musicOn = true;
      musicToggle.setAttribute("aria-pressed", "true");
      musicToggle.setAttribute("aria-label", "Jeda musik");
      musicToggle.querySelector(".music-label").textContent = "Musik on";
    } catch {
      musicOn = false;
      musicToggle.setAttribute("aria-pressed", "false");
    }
  }

  function pauseMusic() {
    audio.pause();
    musicOn = false;
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggle.setAttribute("aria-label", "Putar musik");
    musicToggle.querySelector(".music-label").textContent = "Musik";
  }

  function openCard() {
    intro.classList.add("is-leaving");

    window.setTimeout(() => {
      intro.hidden = true;
      card.hidden = false;
      musicBar.hidden = !config.music;
      requestAnimationFrame(() => card.classList.add("is-visible"));

      if (config.music) playMusic();
      startSparkles();
    }, 650);
  }

  /* Soft floating sparkles */
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
    const count = Math.min(48, Math.floor(window.innerWidth / 14));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.35 + 0.08),
      vx: (Math.random() - 0.5) * 0.2,
      a: Math.random() * 0.45 + 0.15,
    }));
  }

  function drawSparkles() {
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
      ctx.fillStyle = `rgba(246, 214, 200, ${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(drawSparkles);
  }

  function startSparkles() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    resizeCanvas();
    createParticles();
    cancelAnimationFrame(rafId);
    drawSparkles();
  }

  openBtn.addEventListener("click", openCard);

  musicToggle.addEventListener("click", () => {
    if (musicOn) pauseMusic();
    else playMusic();
  });

  // Pause music softly when video plays (better on phone)
  video.addEventListener("play", () => {
    if (musicOn) pauseMusic();
  });

  window.addEventListener("resize", () => {
    if (!card.hidden) {
      resizeCanvas();
      createParticles();
    }
  });

  fillContent();
})();
