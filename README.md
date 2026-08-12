# GeVi — Kartu Ucapan Ulang Tahun Interaktif

Kartu ucapan ulang tahun multi-scene, tema **hitam romantis**. Dibuka di HP lewat link (setelah GitHub Pages aktif).

## Link HP

https://gerryindomaretgroup-pixel.github.io/GeVi/

## Alur (setelah QR)

1. Layar gelap → saklar lampu  
2. Surprise  
3. Suara (record player) — geser jarum / lewati  
4. Catatan kecil (3 halaman)  
5. Kue + tiup lilin (tekan & tahan)  
6. Lingkaran doa (tekan & tahan)  
7. Surat  
8. Finale — *dari awal*

**Status:** scene 1–8 sudah interaktif (konten bisa diedit di `js/config.js`).

## Cara isi konten

Edit `js/config.js`:

```js
window.GEVI_CONFIG = {
  recipientName: "Septi Ratna Sari",
  age: 30,
  darkText: "kok gelap ya sayang…",
  surpriseTitle: "Selamat Ulang Tahun Sayangku",
  music: { src: "assets/audio/ceritaku-ceritamu-clip.mp3" },
  notes: ["...", "...", "..."],
  cake: { image: "assets/images/cake.png", candleCount: 30 },
  letterBody: "...",
  finale: { line: "Untuk Septi Ratna Sari.", showAge: true },
};
```

## Preview lokal

```bash
npx --yes serve . -l 3456
```

Buka `http://localhost:3456/`.

## Struktur

```
GeVi/
├── index.html
├── css/styles.css
├── js/config.js
├── js/app.js
└── assets/
    ├── images/
    ├── video/
    └── audio/
```
