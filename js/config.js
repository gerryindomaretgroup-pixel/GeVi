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
  surpriseEyebrow: "Surprise",
  surpriseTitle: "Selamat Ulang Tahun Sayangku",
  /** Tampilkan "yang ke-XX" di scene surprise */
  showAge: false,

  /**
   * Bunga untuk transisi antar scene (muncul acak).
   * File di assets/images/flowers/ — hasil potongan Bunga.png tanpa latar hitam.
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
    ],
    /** Kelopak sakura yang jatuh di scene meriah */
    petals: [
      "assets/images/flowers/sakura-petal-a-1.png",
      "assets/images/flowers/sakura-petal-a-2.png",
      "assets/images/flowers/sakura-petal-a-3.png",
      "assets/images/flowers/sakura-petal-a-4.png",
      "assets/images/flowers/sakura-petal-a-5.png",
      "assets/images/flowers/sakura-petal-b-1.png",
      "assets/images/flowers/sakura-petal-b-2.png",
      "assets/images/flowers/sakura-petal-b-3.png",
      "assets/images/flowers/sakura-petal-b-4.png",
      "assets/images/flowers/sakura-petal-b-5.png",
    ],
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
   * Catatan kecil (halaman) sebelum kue
   */
  notesIntro: "sebelum tiup lilin, baca yang tadi nggak muat.",
  notes: [
    "Selamat ulang tahun untuk Septi Ratna Sari\nyang hari ini begitu istimewa. 🎂\n\nAku berharap hari ini tidak hanya menjadi tentang bertambahnya usia,\ntetapi juga tentang bertambahnya banyak bahagia dalam hidupmu.",
    "Semoga setiap langkahmu dipertemukan dengan kebaikan,\nsetiap lelahmu menemukan alasan untuk bertahan,\ndan setiap harapanmu perlahan menemukan jalannya.\n\nHari ini kamu dirayakan.\nDan semoga kamu tahu,\ndi antara begitu banyak orang yang mendoakanmu,\nada seseorang yang menyayangimu\ndengan caranya sendiri, dengan tulus.",
    "Semoga senyummu selalu menemukan alasannya,\nhatimu selalu menemukan ketenangannya,\ndan hidupmu selalu dipenuhi hal-hal yang membuatmu merasa dicintai.\n\nSelamat ulang tahun Sayangku, Cintaku, Kasihku, Pusat Tata Suryaku\nTetaplah menjadi kamu,\nkarena bagiku, kamu selalu punya tempat\nyang istimewa di hati ♥♥♥",
  ],
  notesFinalButton: "sekarang… kue-nya",

  /** Scene kue */
  cake: {
    image: "assets/images/cake.png",
    cardText: "Happy\nBirthday",
    candleCount: 30,
    caption: "sekarang bagian paling penting",
    hint: "tekan & tahan buat tiup lilinnya pelan-pelan",
    progressHint: "dikit lagi…",
    doneHint: "lilinnya padam… lanjut ya",
    holdMs: 2200,
  },

  /** Preview surat (isi penuh di langkah berikutnya) */
  letterPreview:
    "Selamat ulang tahun. Semoga tahun ini lebih lembut ke kamu, dan lebih sering ada alasan buat kamu ngerasa dipilih.",

  /** Urutan scene — jangan diubah kecuali kamu paham alurnya */
  scenes: ["dark", "surprise", "record", "notes", "cake", "wish", "letter", "finale"],
};
