# 📦 Panduan Deploy — PWA + Rebranding (Fase 2)

Paket ini **100% file frontend** (GitHub, branch `development`) — **tidak ada file `.gs`/Apps Script sama sekali**, jadi nol resiko ke data presensi.

## File BARU di paket ini
- `manifest.json` — identitas PWA (nama, ikon, warna)
- `service-worker.js` — cache aset statis biar buka lebih cepat & sedikit tahan offline. **Tidak pernah cache panggilan ke Apps Script** (data absensi/stok/shift selalu ambil langsung dari server)
- `rebrand.css` — style header baru, terpisah dari `style.css`/`portal.css`/`app-shell.css` yang sudah ada

## File yang DIUBAH di paket ini
- **Semua 17 halaman `.html`** — header di-update jadi format "Logo BGN — PORTAL / SPPG JEUNGJING — Logo SPPG" (§4 dokumen kamu), plus link ke `manifest.json` & `rebrand.css`
- `common.js` — nambah 6 baris di akhir file buat daftarin service worker (aditif, logic lain tidak diubah)

## File yang IKUT DIBAWA tapi TIDAK berubah dari paket sebelumnya
`admin.js`, `admin-stok.js`, `admin-shift.js`, `portal.css`, `stok-relawan.js` — cuma dibawa biar paket ini lengkap sendiri, isinya sama persis dengan yang sudah kamu pasang dari paket Stok+Shift. **Boleh dilewati** kalau file itu sudah ada dan belum ada perubahan lain menyusul.

## Cara pasang
1. Timpa/tambah semua file di atas ke branch `development`.
2. Commit & push.
3. Buka situsnya di HP → di Chrome/Safari harusnya muncul opsi "Tambahkan ke Layar Utama" / "Install app" dalam beberapa saat.

## ⚠️ Yang masih perlu dicek manual (keterbatasan saya)
1. **Ikon PWA** — `manifest.json` sekarang pakai `assets/logo.png` apa adanya untuk semua ukuran (192x192 & 512x512). Kalau file itu bukan benar-benar berukuran segitu atau nggak ada ruang kosong di pinggirnya, ikon di HP bisa kepotong aneh pas di-install. Idealnya siapkan versi 192x192 & 512x512 khusus (saya nggak bisa bikin/edit gambar dari sini).
2. **Tampilan header di 3 halaman** (`login.html`, `index.html`, `beranda.html`) saya edit manual (bukan lewat skrip otomatis kayak 13 halaman lain) — tolong dicek sekali secara visual, siapa tahu susunannya agak beda dari yang lain karena strukturnya emang beda dari awal.
3. Saya belum bisa nge-test instalasi PWA sungguhan di HP dari sini — coba di Android & iPhone, soalnya perilaku "Add to Home Screen" beda dikit antar OS.

## Belum termasuk (belum diminta / nunggu keputusan)
- Rename teks "Portal Relawan" yang masih muncul di beberapa subtitle/deskripsi halaman (saya cuma ubah bagian HEADER utama sesuai instruksi §4, teks lain sengaja belum disentuh)
- Opsi "per Divisi" di Jadwal & Penugasan (masih nunggu keputusanmu)
