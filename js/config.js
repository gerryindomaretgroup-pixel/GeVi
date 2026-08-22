/**
 * GeVi — Konfigurasi kartu ulang tahun
 * Edit isi di sini. Interaksi tiap scene diisi bertahap.
 */
window.GEVI_CONFIG = {
  recipientName: "Septi Ratna Sari",
  /** Nama pengirim — muncul sebagai tanda tangan jika letterSign / invite.sign kosong */
  senderName: "Mas Gerry",
  age: 30,

  /** Teks di layar gelap pembuka */
  darkText: "kok gelap ya sayang…",
  switchHint: "ketuk layar, lalu nyalakan lampunya",

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
    /** Kelopak sakura jatuh — potongan dari SAKURA.png + NEW SAKURA.jpg */
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
    finishedHint: "selesai… lanjut kalau sudah siap",
  },

  /**
   * Musik latar — Fallin Love Again (potongan detik 58 → akhir), loop halus.
   * playFromStart: true = BGM sudah main di layar gelap (sebelum saklar).
   * muteWhileRecord: true = BGM mati saat lagu piringan (scene 3) diputar, nyala lagi setelah selesai.
   */
  bgm: {
    src: "assets/audio/bgm-fallinlove.mp3",
    /** Fallin Love Again — volume cukup terdengar di HP saat layar gelap */
    volume: 0.28,
    duckVolume: 0,
    fadeMs: 700,
    loop: true,
    startAt: 0,
    playFromStart: true,
    muteWhileRecord: true,
  },

  /**
   * Efek suara
   * - to_*: khusus ganti scene (bukan note/sparkle)
   * - notes / sparkle / cake / needle / bubble*: khusus interaksi perintah
   */
  sfx: {
    light: "assets/audio/sfx-light.mp3",
    bloom: "assets/audio/sfx-bloom.mp3",
    /** Default ganti scene */
    transition: "assets/audio/sfx-soft-swipe.mp3",
    to_surprise: "assets/audio/sfx-bloom.mp3",
    to_record: "assets/audio/sfx-whoosh.mp3",
    to_notes: "assets/audio/sfx-soft-swipe.mp3",
    to_cake: "assets/audio/sfx-chime.mp3",
    to_wish: "assets/audio/sfx-whoosh.mp3",
    to_letter: "assets/audio/sfx-letter.mp3",
    to_finale: "assets/audio/sfx-finale.mp3",

    /** Interaksi perintah saja */
    needle: "assets/audio/sfx-needle.mp3",
    notes: "assets/audio/sfx-note.mp3",
    sparkle: "assets/audio/sfx-sparkle.mp3",
    cake: "assets/audio/sfx-sparkle.mp3",
    bubbleAppear: "assets/audio/bubble-appear.mp3",
    bubblePop: "assets/audio/bubble-pop.mp3",
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
    /** Urutan teks saat gelembung diletuskan (posisi balon tetap acak) */
    bubbles: [
      "Kamu selalu diberikan kesehatan dan umur yang panjang",
      "Perasaan dan hatimu selalu penuh dengan rasa bahagia",
      "Rezekimu semakin melimpah dan berkah",
      "Semakin banyak bertemu orang baik yang menyayangimu",
      "Kamu terus tumbuh menjadi wanita yang makin kuat dan hebat",
      "Kamu selalu ingat untuk beristirahat dan tidak terlalu keras pada dirimu sendiri",
      "Kamu selalu bangga pada diri sendiri dan bersyukur atas semua proses yang sudah kamu lewati sampai hari ini",
      "Semua impian dan doa-doamu yang belum terwujud segera dikabulkan",
      "Kamu dan keluarga tercinta selalu dilimpahi keberkahan dan kebaikan",
      "I Love You ❤️",
    ],
  },

  /** Surat — pesan utuh (gabungan dari notes sebelumnya) */
  letterLabel: "Untukmu",
  letterBody:
    "Selamat ulang tahun untuk Septi Ratna Sari\nyang hari ini begitu istimewa.\n\nAku berharap hari ini tidak hanya menjadi tentang bertambahnya usia,\ntetapi juga tentang bertambahnya banyak bahagia dalam hidupmu.\n\nSemoga setiap langkahmu dipertemukan dengan kebaikan,\nsetiap lelahmu menemukan alasan untuk bertahan,\ndan setiap harapanmu perlahan menemukan jalannya.\n\nHari ini kamu dirayakan.\nDan semoga kamu tahu,\ndi antara begitu banyak orang yang mendoakanmu,\nada seseorang yang menyayangimu\ndengan caranya sendiri, dengan tulus.\n\nSemoga senyummu selalu menemukan alasannya,\nhatimu selalu menemukan ketenangannya,\ndan hidupmu selalu dipenuhi hal-hal yang membuatmu merasa dicintai.\n\nSelamat ulang tahun Sayangku, Cintaku, Kasihku, Pusat Tata Suryaku.\nTetaplah menjadi kamu,\nkarena bagiku, kamu selalu punya tempat\nyang istimewa di hati ♥♥♥",
  /** Kosong = pakai senderName di atas */
  letterSign: "",

  /**
   * Scene penutup — swipe kenangan berbingkai.
   * Ideal: 4–6 foto (boleh sampai 7 jika cerita mengalir).
   * File di assets/images/memories/
   * Slide terakhir bisa empty: true (bingkai kosong + teks).
   * Setelah bingkai terakhir: undangan makan (invite) yang harus dibuka.
   */
  finale: {
    caption: "kenangan kita",
    hint: "geser ke kiri atau kanan",
    thanks: "Terima kasih sudah membuka sampai akhir",
    lightsOffLabel: "Aku Pasti Datang 💖",
    /** Tunggu lihat slide terakhir dulu, baru surat/undangan muncul */
    inviteRevealDelayMs: 3200,
    memories: [
      {
        src: "assets/images/memories/P1.jpeg",
        caption: "Pertemuan pertama kita",
      },
      {
        src: "assets/images/memories/P9.jpeg",
        caption: "Ajakan pertama kamu untuk bermain bersama",
      },
      {
        src: "assets/images/memories/P2.jpeg",
        caption: "Mengunjungi tempat hits di Glodok bersama kamu",
      },
      {
        src: "assets/images/memories/P3.jpeg",
        caption: "Photo Box pertama kita",
      },
      {
        src: "assets/images/memories/P10.jpeg",
        caption: "Mengunjungi pantai selepas bertemu dengan keluargamu",
      },
      {
        src: "assets/images/memories/P8.jpeg",
        caption: "Makan Ayam Pop bersama di Pagi Sore",
      },
      {
        src: "assets/images/memories/P7.jpeg",
        caption: 'Katamu disini aku "kok kamu tau semuanya"',
      },
      {
        src: "assets/images/memories/P11N.jpeg",
        caption: "Video Call pertama kita",
      },
      {
        src: "assets/images/memories/P12.jpeg",
        caption: "Pose foto favorit kamu",
        fill: true,
      },
      {
        src: "assets/images/memories/P13.jpeg",
        caption: "Senyum paling manis, tulus dan bahagia dari kamu",
        fill: true,
      },
      {
        empty: true,
        text: "Serta memori indah kita selanjutnya",
        caption: "",
      },
    ],
    /**
     * Undangan makan — muncul setelah slide terakhir sempat dilihat.
     * Ganti body / label / sign sesuai isi yang kamu mau.
     */
    invite: {
      sealedLabel: "ada satu lagi untukmu",
      sealedHint: "ketuk untuk membuka",
      label: "Special Invitation for You ✨",
      body:
        "Hari ini adalah harimu, tapi izinkan aku yang merayakannya.\n\nAku ingin mengajakmu makan siang bersama untuk merayakan bertambahnya usiamu, sebuah momen kecil untuk mengapresiasi hadirmu yang selalu bikin hariku lebih cerah.\n\n📅 Hari / Tanggal: Sabtu, 5 September 2026\n\n⏰ Waktu: Makan Siang (Lunch)\n\n📍 Tempat: A Surprise Destination Just for You\n\nWould you do me the honor of being my lunch date? 🍰",
      /** Kosong = pakai senderName di atas; tempat sengaja surprise sampai ada lokasi pasti */
      sign: "",
    },
  },

  /** Urutan scene — jangan diubah kecuali kamu paham alurnya */
  scenes: ["dark", "surprise", "record", "notes", "cake", "wish", "letter", "finale"],
};
