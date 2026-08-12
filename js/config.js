/**
 * GeVi — Konfigurasi kartu ulang tahun
 * Edit isi di sini. Interaksi tiap scene diisi bertahap.
 */
window.GEVI_CONFIG = {
  recipientName: "Septi Ratna Sari",
  senderName: "",
  age: 30,

  /** Teks di layar gelap pembuka */
  darkText: "kok gelap ya sayang…",
  switchHint: "nyalakan lampunya",

  /** Surprise */
  surpriseEyebrow: "",
  surpriseTitle: "Selamat Ulang Tahun Sayangku",
  /** Tampilkan "yang ke-XX" di scene surprise */
  showAge: false,

  /**
   * Bunga untuk transisi antar scene (muncul acak).
   * File di assets/images/flowers/
   */
  flowers: {
    images: [
      "assets/images/flowers/rose-pink.png",
      "assets/images/flowers/rose-white.png",
      "assets/images/flowers/peony-pink.png",
      "assets/images/flowers/sakura-light.png",
      "assets/images/flowers/sakura-pink.png",
      "assets/images/flowers/lily-pink.png",
      "assets/images/flowers/lily-white.png",
      "assets/images/flowers/plumeria-pink.png",
      "assets/images/flowers/lotus-pink.png",
      "assets/images/flowers/dahlia-pink.png",
      "assets/images/flowers/carnation-pink.png",
      "assets/images/flowers/hydrangea-pink.png",
      "assets/images/flowers/carnation-white.png",
      "assets/images/flowers/lotus-white.png",
      "assets/images/flowers/plumeria-white.png",
      "assets/images/flowers/lily-soft.png",
    ],
    /** Kelopak sakura jatuh (hasil potongan Kelopak Sakura.png) — kecil & jarang */
    petals: [
      "assets/images/flowers/petals/sakura-fall-01.png",
      "assets/images/flowers/petals/sakura-fall-02.png",
      "assets/images/flowers/petals/sakura-fall-03.png",
      "assets/images/flowers/petals/sakura-fall-04.png",
      "assets/images/flowers/petals/sakura-fall-05.png",
      "assets/images/flowers/petals/sakura-fall-06.png",
      "assets/images/flowers/petals/sakura-fall-07.png",
      "assets/images/flowers/petals/sakura-fall-08.png",
      "assets/images/flowers/petals/sakura-fall-09.png",
      "assets/images/flowers/petals/sakura-fall-10.png",
      "assets/images/flowers/petals/sakura-fall-11.png",
      "assets/images/flowers/petals/sakura-fall-12.png",
      "assets/images/flowers/petals/sakura-fall-13.png",
      "assets/images/flowers/petals/sakura-fall-14.png",
      "assets/images/flowers/petals/sakura-fall-15.png",
      "assets/images/flowers/petals/sakura-fall-16.png",
      "assets/images/flowers/petals/sakura-fall-17.png",
      "assets/images/flowers/petals/sakura-fall-18.png",
    ],
    petalCount: 8,
    petalSizeMin: 0.55,
    petalSizeMax: 0.95,
  },

  /**
   * Musik scene record — potongan lirik:
   * "Selamanya ku ingin bersamamu…" sampai "Bersama denganmu"
   */
  music: {
    src: "assets/audio/ceritaku-ceritamu-clip.mp3",
    startAt: 0,
    endAt: 0,
    caption: "ada lagu yang aku sisipin buat kamu.",
    hint: "geser jarumnya ke piringan buat muterin",
    playingHint: "lagi muter… dengerin sampai habis ya",
  },

  /**
   * Efek suara saat ganti scene (from → sfx)
   * dark→surprise memakai light; scene lain memakai key di bawah.
   */
  sfx: {
    light: "assets/audio/sfx-light.mp3",
    bloom: "assets/audio/sfx-bloom.mp3",
    needle: "assets/audio/sfx-needle.mp3",
    surprise: "assets/audio/sfx-bloom.mp3",
    record: "assets/audio/sfx-bloom.mp3",
    notes: "assets/audio/sfx-note.mp3",
    sparkle: "assets/audio/sfx-sparkle.mp3",
    cake: "assets/audio/sfx-sparkle.mp3",
    wish: "assets/audio/sfx-wish.mp3",
    letter: "assets/audio/sfx-letter.mp3",
    finale: "assets/audio/sfx-finale.mp3",
    volume: 0.95,
  },

  /**
   * Catatan kecil — satu pesan utuh
   * Format ringan: *miring* → <em>, **tebal** → <strong>
   */
  notesIntro: "sebelum lanjut, baca ini dulu…",
  notes: [
    "Ada sesuatu untukmu… 🌷\n\nTidak besar, tidak sempurna,\nhanya sebuah kejutan kecil\nyang dibuat dengan banyak perhatian.\n\nKarena hari ini,\nada seseorang yang ingin memastikan\nbahwa kamu tahu…\n\n*kamu layak untuk dirayakan.* 💐\n\n*Let's celebrate you.* ✨",
  ],
  notesFinalButton: "Surprise",

  /** Scene kue — Tart.png, lilin angka di area coklat (bukan di kartu) */
  cake: {
    image: "assets/images/cake-tart.png",
    cardText: "",
    showCardText: false,
    /** "age" = lilin berbentuk angka umur; angka lain = jumlah lilin biasa */
    candleMode: "age",
    candleDigits: "",
    /** Posisi di TENGAH area coklat tiramisu (bukan di krim tepi) */
    candleTop: "40.5%",
    candleLeft: "50%",
    candleSpread: 5.2,
    caption: "sekarang bagian paling penting",
    hint: "tekan & tahan lilinnya agak lama buat meniup",
    holdMs: 2200,
    lightingMs: 1200,
  },

  /** Scene doa — tekan tahan, lalu gelembung bulat misteri */
  wish: {
    caption: "saatnya berdoa",
    hint: "tekan & tahan bola doa agak lama",
    progressHint: "pelan-pelan… biarkan doamu mengisi",
    almostHint: "hampir… jangan lepas dulu",
    center: "ini doaku untukmu",
    holdMs: 2800,
    bubbles: [
      "Semoga sehat selalu",
      "Semoga bahagia selalu",
      "Semoga rejekimu semakin dilimpahkan",
      "Semoga semakin banyak orang yang sayang kamu",
      "Semoga kamu menjadi wanita kuat",
      "Semoga kamu menemukan pasangan hidup yang kamu harapkan",
      "Semoga pasangan hidupmu itu aku",
      "Semoga doa dan keinginanmu segera di kabulkan apapun itu",
      "Semoga semua keluargamu diberikan banyak rejeki yang melimpah",
      "I Love You",
    ],
  },

  /** Surat — pesan utuh (gabungan dari notes sebelumnya) */
  letterLabel: "Untukmu",
  letterBody:
    "Selamat ulang tahun untuk Septi Ratna Sari\nyang hari ini begitu istimewa.\n\nAku berharap hari ini tidak hanya menjadi tentang bertambahnya usia,\ntetapi juga tentang bertambahnya banyak bahagia dalam hidupmu.\n\nSemoga setiap langkahmu dipertemukan dengan kebaikan,\nsetiap lelahmu menemukan alasan untuk bertahan,\ndan setiap harapanmu perlahan menemukan jalannya.\n\nHari ini kamu dirayakan.\nDan semoga kamu tahu,\ndi antara begitu banyak orang yang mendoakanmu,\nada seseorang yang menyayangimu\ndengan caranya sendiri, dengan tulus.\n\nSemoga senyummu selalu menemukan alasannya,\nhatimu selalu menemukan ketenangannya,\ndan hidupmu selalu dipenuhi hal-hal yang membuatmu merasa dicintai.\n\nSelamat ulang tahun Sayangku, Cintaku, Kasihku, Pusat Tata Suryaku.\nTetaplah menjadi kamu,\nkarena bagiku, kamu selalu punya tempat\nyang istimewa di hati ♥♥♥",
  letterSign: "Mas Gerry",

  /**
   * Scene penutup — swipe kenangan berbingkai.
   * Ideal: 4–6 foto (boleh sampai 7 jika cerita mengalir).
   * File di assets/images/memories/
   */
  finale: {
    caption: "kenangan kita",
    hint: "geser ke kiri atau kanan",
    thanks: "Terima kasih sudah membuka sampai akhir",
    lightsOffLabel: "matikan lampu",
    memories: [
      {
        src: "assets/images/memories/P1.jpeg",
        caption: "Pertemuan pertama kita waktu itu, betapa bahagianya aku",
      },
      {
        src: "assets/images/memories/P9.jpeg",
        caption: "Ajakan pertama kamu untuk bermain bersama",
      },
      {
        src: "assets/images/memories/P2.jpeg",
        caption: "Mengunjungi tempat hits bersama kamu",
      },
      {
        src: "assets/images/memories/P3.jpeg",
        caption: "Photo Box Pertama Kita",
      },
      {
        src: "assets/images/memories/P10.jpeg",
        caption: "Mengunjungi pantai selepas pulang bertemu keluargamu",
      },
      {
        src: "assets/images/memories/P8.jpeg",
        caption: "Ayam pop pertama kamu di Pagi Sore",
      },
      {
        src: "assets/images/memories/P7.jpeg",
        caption: 'Katamu disini aku "kok kamu tau semuanya"',
      },
    ],
  },

  /** Urutan scene — jangan diubah kecuali kamu paham alurnya */
  scenes: ["dark", "surprise", "record", "notes", "cake", "wish", "letter", "finale"],
};
