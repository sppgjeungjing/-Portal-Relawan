# PANDUAN DEPLOY — Konsolidasi Final (Semua Perbaikan + Fitur Baru Tergabung)

Paket ini menggabungkan **semua pekerjaan sejauh ini dari 2 sumber**: perbaikan-perbaikan saya sebelumnya (lintas tengah malam, format tanggal, format jam, Master Lokasi, Periode/Kalender Operasional) **digabung** dengan paket perbaikan & fitur baru yang Anda upload (`paket-perbaikan-sppg-jeungjing.zip`). Saya sudah verifikasi satu per satu — semuanya dibangun di atas pekerjaan Fase 5, bukan menimpa balik ke versi lama.

**Ini paket paling lengkap sejauh ini — timpa SEMUA file, jangan sebagian.**

Estimasi waktu: 30–35 menit.

---

## Apa saja yang baru di paket ini?

### Dari perbaikan saya sebelumnya (sudah pernah dikirim, tetap disertakan)
- Format tanggal Periode/Kalender Operasional (locale terbalik)
- Format jam (`1899-12-30T...` → `04:55:16`)
- Lintas tengah malam (ambang batas **16:00**, sesuai jadwal riil Tim Persiapan mulai 17:00)
- Master Lokasi SPPG, Periode Kerja, Kalender Operasional (Fase 2-4)

### Baru dari paket yang Anda upload
1. **Format JAM diperbaiki di akarnya** — sekarang dibersihkan otomatis di `sheetToObjects()` (dipakai SEMUA modul), bukan cuma di Absensi. Lebih tahan ke depan kalau ada bug serupa di modul lain.
2. **Foto swafoto tidak lagi tampil ikon rusak** — URL foto diganti ke format `thumbnail` yang lebih stabil untuk `<img>`. Foto lama otomatis ikut kebenerin (URL dibangun ulang tiap diambil, bukan disimpan statis).
3. **Sesi login relawan bisa bertahan lama** (default 90 hari) — cocok untuk HP/tablet yang ditampilkan terus di lokasi SPPG sebagai "kios absensi", tidak perlu login ulang tiap 6 jam.
4. **Konfirmasi 2 titik saat absen** — banner besar "Anda Akan Absen MASUK/PULANG" sebelum kamera aktif, dan layar sukses penuh (bukan cuma notifikasi kecil) setelah berhasil, supaya relawan tidak salah kirim absen.
5. **Tombol "Absen Sekarang"** di Dashboard Relawan — langsung ke halaman Absensi tanpa buka menu dulu.
6. **Halaman Login lebih resmi** — logo Badan Gizi Nasional + logo SPPG Jeungjing berdampingan.
7. **Notifikasi bisa dibuka detailnya** — tap notifikasi sekarang membuka isi lengkap, bukan cuma tertandai dibaca.

---

## Isi Paket (17 file, timpa SEMUA)

```
KONSOLIDASI-SEMUA-FILE-TERBARU/
├── admin.html, admin.js
├── absensi.html, script.js, common.js, portal.css
├── dashboard.html
├── login.html
├── notifikasi.html, notifikasi.js
└── google-apps-script/
    ├── Utils.gs, Code.gs, Periode.gs, Kalender.gs, Lokasi.gs, Absensi.gs
    └── Akun.gs   ← BARU disentuh untuk pertama kali (sesi login tahan lama)
```

**Tidak ada di paket** (belum pernah diubah, aman seperti apa adanya): `Relawan.gs`, `Admin.gs`, `Informasi.gs`, `Jadwal.gs`, `Dokumen.gs`, `Pengumuman.gs`, `profil.html`, `riwayat.html`, `jadwal.html`, dan file lain yang tidak disebut di atas.

---

## ⚠️ Sebelum Deploy — 2 Hal Wajib Disiapkan

1. **Kolom baru di `07_AKUN_RELAWAN`** (untuk sesi login tahan lama): buka sheet itu, tambahkan 2 kolom di paling kanan: `TOKEN_AKTIF` dan `TOKEN_KADALUARSA`. **Kalau dilewati, tidak error** — sesi relawan cuma akan tetap terbatas 6 jam seperti sebelumnya (bukan fatal, tapi fiturnya tidak aktif).
2. **File `assets/logo-bgn.png`** (untuk halaman Login): pastikan file ini sudah ada di folder `assets/` GitHub Pages Anda. Kalau belum ada, upload dulu — kalau tidak, logo akan tampil kosong/pecah di halaman Login.

---

## Langkah 1 — Timpa Semua File Apps Script (7 file)

1. **Extensions → Apps Script**.
2. Timpa: `Utils`, `Code`, `Periode`, `Kalender`, `Lokasi`, `Absensi`, dan **`Akun`** (baru pertama kali disentuh — pastikan tidak salah timpa file lain).
3. **Ctrl+A → Delete dulu baru paste**, supaya tidak ada baris lama yang nyisa.
4. Simpan (💾) → **Deploy → Manage deployments** → pensil (✏️) → **New version** → **Deploy**.

✅ Checkpoint: `?action=health` tetap normal.

---

## Langkah 2 — Timpa Semua File Frontend (10 file)

Timpa di GitHub repo: `admin.html`, `admin.js`, `absensi.html`, `script.js`, `common.js`, `portal.css`, `dashboard.html`, `login.html`, `notifikasi.html`, `notifikasi.js`. Commit & push, tunggu GitHub Pages build.

---

## Langkah 3 — Uji Coba

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka halaman Login | Logo BGN + logo SPPG tampil berdampingan (bukan ikon pecah) |
| 2 | Login relawan → buka Dashboard | Ada tombol besar "Absen Sekarang" di bagian atas |
| 3 | Tap "Absen Sekarang" → pilih jenis | Muncul banner konfirmasi besar "Anda Akan Absen Masuk/Pulang" dulu, kamera/GPS BELUM aktif |
| 4 | Tap "Lanjutkan" | Baru kamera & GPS aktif seperti biasa |
| 5 | Selesaikan absen | Muncul layar sukses penuh (bukan cuma notifikasi kecil) dengan Jenis, Jam, Status Lokasi — wajib tap "Selesai" |
| 6 | Cek Rekap Harian / Riwayat Absensi | Jam tampil normal (`HH:mm`), foto bukti bisa dibuka tanpa ikon rusak |
| 7 | Buka Notifikasi, tap salah satu item | Modal detail lengkap terbuka (judul, isi, tanggal), ada tombol Tutup |
| 8 | (Kalau sudah tambah kolom TOKEN_AKTIF/TOKEN_KADALUARSA) Login di HP, tutup browser total, buka lagi setelah lebih dari 6 jam | Tetap dalam keadaan login, tidak diminta login ulang |
| 9 | **Regresi:** Kalender Operasional, Periode Kerja, Master Lokasi SPPG | Semua berjalan normal seperti sebelumnya |

---

## Rollback

Simpan salinan semua file sebelum menimpa. Kembalikan ke versi sebelumnya, **Deploy → New version**. Kolom `TOKEN_AKTIF`/`TOKEN_KADALUARSA` boleh dibiarkan ada di sheet — tidak mengganggu apa pun kalau kodenya di-rollback.

---

## Catatan Keamanan — Sesi Login 90 Hari

Perlu Anda pertimbangkan: sesi yang bertahan 90 hari berarti kalau HP/tablet relawan hilang atau dipinjam orang lain, orang itu bisa absen atas nama relawan tsb selama sesi belum kadaluarsa/logout manual. Cocok untuk **1 tablet khusus yang memang dipasang permanen di lokasi SPPG sebagai kios absensi** (dengan pengawasan), kurang cocok kalau tiap relawan pakai HP pribadi masing-masing dan sering gonta-ganti perangkat. Angka 90 hari bisa diubah lewat konstanta `DURASI_SESI_RELAWAN_HARI` di bagian atas `Akun.gs` sesuai kebutuhan Anda.
