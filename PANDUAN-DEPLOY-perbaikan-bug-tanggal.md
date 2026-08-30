# PANDUAN DEPLOY — Perbaikan Bug Tanggal + Fitur Hapus Semua Tanggal Operasional

## Apa yang salah?

Google Sheets otomatis mengubah teks tanggal `"30/08/2026"` yang ditulis lewat kode menjadi tipe **Date** asli begitu kolom itu "dikenali" sebagai kolom tanggal — walau kodenya menulis sebagai teks biasa. Akibatnya, saat sistem membandingkan tanggal sebagai teks (`"30/08/2026" === "30/08/2026"`), perbandingan itu **selalu gagal** karena salah satu sisi sudah bukan teks lagi.

Ini menyebabkan 2 masalah:
1. **"periode.tanggalSelesai.split is not a function"** saat Buat Massal di Kalender Operasional (yang Anda alami).
2. **"Belum ada operasional aktif untuk absensi hari ini"** di halaman Absensi relawan — padahal tanggalnya sudah dibuat — karena pengecekan tanggal hari ini vs Kalender Operasional gagal cocok.

## Perbaikan

Saya tambahkan fungsi `bacaTanggalDMY_()` yang menyeragamkan APAPUN bentuk data tanggal dari Sheets (Date atau teks) menjadi teks `"dd/MM/yyyy"` yang konsisten, lalu menerapkannya di **semua** tempat yang membaca tanggal dari sheet: Periode Kerja, Kalender Operasional, dan seluruh Absensi (submit, status, rekap, riwayat). Ini perbaikan menyeluruh, bukan tambal di satu tempat saja — supaya bug yang sama tidak muncul lagi di bagian lain.

**Tambahan:** tombol **🗑 Hapus Semua (periode terpilih)** di tab Kalender Operasional, sesuai permintaan Anda — untuk membersihkan tanggal yang salah/gagal lalu generate ulang.

---

## Isi Paket

```
perbaikan-bug-tanggal-kalender/
├── admin.html                        # DIUBAH (+tombol Hapus Semua)
├── admin.js                          # DIUBAH (+handler tombol)
└── google-apps-script/
    ├── Utils.gs                      # DIUBAH (+bacaTanggalDMY_)
    ├── Periode.gs                    # DIUBAH (baca tanggal via helper baru)
    ├── Kalender.gs                   # DIUBAH (baca tanggal via helper baru, +hapusSemuaOperasionalPeriode)
    ├── Absensi.gs                    # DIUBAH (baca tanggal via helper baru — INI YANG MEMPERBAIKI "belum ada operasional aktif")
    └── Code.gs                       # DIUBAH (+1 action baru)
```

---

## Langkah 1 — Update Google Apps Script

1. **Extensions → Apps Script**.
2. Timpa **kelima file** ini dengan isi dari paket: `Utils`, `Periode`, `Kalender`, `Absensi`, `Code`.
3. Simpan (💾).
4. **Deploy → Manage deployments** → pensil (✏️) → **New version** → **Deploy**.

✅ Checkpoint: `?action=health` tetap normal.

---

## Langkah 2 — Update Frontend

1. Timpa `admin.html` dan `admin.js` di GitHub repo Anda.
2. Commit & push.

---

## Langkah 3 — Bersihkan Data yang Salah, lalu Uji Coba

1. Buka tab **Kalender Operasional** → pilih periode di dropdown filter → tap **🗑 Hapus Semua (periode terpilih)** untuk membersihkan tanggal yang mungkin sudah kepalang dibuat dari percobaan sebelumnya.
2. Generate ulang lewat **Buat Massal berdasarkan Hari** (pilih periode + centang hari) → sekarang seharusnya **tidak muncul error** `split is not a function`.
3. Buka halaman Absensi sebagai relawan (di HP, hari yang tanggalnya ada di Kalender Operasional & berstatus AKTIF) → coba absen Masuk.

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Generate massal tanggal operasional | Tidak ada error, muncul jumlah tanggal yang dibuat |
| 2 | Buka halaman Absensi relawan hari ini | **Tidak lagi** muncul "Belum ada operasional aktif" (kalau hari ini memang ada di Kalender & AKTIF) |
| 3 | Selesaikan absen Masuk (selfie+GPS) | Berhasil |
| 4 | Cek Rekap Harian di Admin | Data absensi baru muncul dengan benar |
| 5 | Tap **Hapus Semua** tanpa pilih periode dulu | Muncul pesan "Pilih satu periode dulu", bukan menghapus semua periode sekaligus |
| 6 | Tap **Hapus Semua** dengan periode terpilih | Muncul konfirmasi nama periode, lalu semua tanggal periode itu terhapus |

---

## Rollback

Kembalikan kelima file `.gs` dan `admin.html`/`admin.js` ke versi sebelum perbaikan ini, **Deploy → New version**. Tidak ada perubahan struktur sheet pada perbaikan ini — aman di-rollback kapan saja.
