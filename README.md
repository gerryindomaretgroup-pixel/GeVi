# GeVi — Kartu Ucapan Ulang Tahun Interaktif

Kartu ucapan ulang tahun multi-scene, tema **hitam romantis**. Dibuka di HP lewat link GitHub Pages.

## Link HP

https://gerryindomaretgroup-pixel.github.io/GeVi/

## Alur

1. Layar gelap → ketuk layar, lalu nyalakan lampu  
2. Surprise  
3. Suara (record player) — geser jarum / dengar sampai habis  
4. Catatan kecil  
5. Kue + tiup lilin (tekan & tahan)  
6. Lingkaran doa → gelembung doa  
7. Surat  
8. Finale — swipe kenangan → amplop undangan → **Aku Pasti Datang 💖**

**Status:** scene 1–8 interaktif. Konten diedit di `js/config.js`.

## Cara isi konten

Edit `js/config.js`:

```js
window.GEVI_CONFIG = {
  recipientName: "Septi Ratna Sari",
  senderName: "Mas Gerry", // tanda tangan surat & undangan (jika letterSign / invite.sign kosong)
  age: 30,
  darkText: "kok gelap ya sayang…",
  surpriseTitle: "Selamat Ulang Tahun Sayangku",
  music: { src: "assets/audio/ceritaku-ceritamu-clip.mp3" },
  bgm: { src: "assets/audio/bgm-fallinlove.mp3", playFromStart: true },
  notes: ["..."],
  cake: { image: "assets/images/cake-tart.png", candleMode: "age" },
  letterBody: "...",
  finale: {
    lightsOffLabel: "Aku Pasti Datang 💖",
    memories: [/* foto di assets/images/memories/ */],
    invite: { /* teks undangan makan */ },
  },
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
