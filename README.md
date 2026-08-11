# GeVi — Kartu Ucapan Ulang Tahun Interaktif

Kartu ucapan ulang tahun multi-scene, tema **hitam romantis**. Dibuka di HP lewat link (setelah GitHub Pages aktif).

## Link HP

https://gerryindomaretgroup-pixel.github.io/GeVi/

## Alur (setelah QR)

1. Layar gelap → ketuk  
2. Surprise  
3. Suara (record player) — *berikutnya*  
4. Catatan kecil — *berikutnya*  
5. Kue + tiup lilin — *berikutnya*  
6. Lingkaran doa — *berikutnya*  
7. Surat — *berikutnya*  
8. Finale — *berikutnya*

**Langkah 1 selesai:** kerangka scene + tema + navigasi.

## Cara isi konten

Edit `js/config.js`:

```js
window.GEVI_CONFIG = {
  recipientName: "Naya",
  senderName: "Dimas",
  age: 21,
  darkText: "kok gelap ya…",
  surpriseEyebrow: "Surprise",
  surpriseTitle: "Kamu dibedain.",
  // ...
};
```

## Preview lokal

```bash
npx --yes serve .
```

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
