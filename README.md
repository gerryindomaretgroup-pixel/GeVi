# GeVi — Kartu Ucapan Ulang Tahun Interaktif

Kartu ucapan ulang tahun yang bisa dibuka di HP lewat link. Mendukung **foto**, **video**, dan **musik**.

## Link HP (setelah GitHub Pages aktif)

https://gerryindomaretgroup-pixel.github.io/GeVi/

## Cara pakai

1. Buka folder `GeVi` di VS Code / Codespace.
2. Edit `js/config.js` — ganti nama, pesan, foto, video, musik.
3. Masukkan file media ke:
   - `assets/images/` — foto
   - `assets/video/` — video `.mp4`
   - `assets/audio/` — musik `.mp3`
4. Commit & push ke GitHub → link Pages otomatis update.

### Contoh config

```js
window.GEVI_CONFIG = {
  recipientName: "Budi",
  mainMessage: "Selamat ulang tahun!",
  wishText: "Semoga panjang umur dan bahagia.",
  images: [
    "assets/images/foto1.jpg",
    "assets/images/foto2.jpg",
  ],
  video: "assets/video/ucapan.mp4",
  music: "assets/audio/lagu.mp3",
};
```

## Preview lokal

Buka `index.html` di browser, atau dari folder project:

```bash
npx --yes serve .
```

Lalu buka alamat yang muncul di HP (satu Wi‑Fi) atau pakai link GitHub Pages.

## Struktur

```
GeVi/
├── index.html
├── css/styles.css
├── js/config.js      ← edit konten di sini
├── js/app.js
└── assets/
    ├── images/
    ├── video/
    └── audio/
```

Proyek ini terpisah dari Review-Say-Burger dan SuperDatabase.
