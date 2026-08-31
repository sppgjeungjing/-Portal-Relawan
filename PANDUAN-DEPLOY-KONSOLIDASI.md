# PANDUAN DEPLOY — Konsolidasi Semua File Terbaru + Perbaikan Lintas Tengah Malam

## Catatan Versi (Update)

**Versi ini** menggabungkan perbaikan lintas-tengah-malam dengan tambahan **jam ambang batas** (`JAM_MULAI_CEK_OPERASIONAL_BESOK` di `Utils.gs`, default **18** / jam 6 sore). Kalau tidak ada operasional AKTIF hari ini, sistem baru "melirik" operasional besok setelah jam ini — supaya absen pagi/siang hari yang memang libur tidak keliru nyantol ke operasional besok.

**⚠️ Perlu Anda sesuaikan:** buka `Utils.gs`, cari baris `const JAM_MULAI_CEK_OPERASIONAL_BESOK = 18;` — ganti angka `18` sesuai jam mulai shift malam SPPG Jeungjing yang sebenarnya (sama seperti `JAM_MASUK_STANDAR` yang juga masih placeholder).

**Penting soal sumber file:** Mohon ke depannya semua perubahan lewat satu jalur (chat ini), jangan mencampur file dari sumber lain ke dalam folder yang sama sebelum di-zip — beberapa file yang Anda upload sebelumnya (`dashboard.html`, `login.html`, `notifikasi.html`, `Akun.gs`, `Absensi (1).gs`) tercampur dari sumber lain dan kemungkinan besar itu yang menyebabkan bug "Sheet undefined" kemarin.

---

Paket ini berisi **semua file yang pernah saya ubah sejak awal**, versi paling akhir, digabung jadi satu. Tujuannya menghentikan masalah "versi ketinggalan" yang menyebabkan error `Sheet "undefined" tidak ditemukan` di foto Anda — supaya Anda tinggal timpa semua sekaligus dan pasti semuanya sinkron.

**Juga termasuk:** perbaikan lintas tengah malam yang kita bahas (shift malam otomatis menempel ke operasional besok, tanpa perlu buat entri Kalender terpisah untuk malam sebelumnya).

Estimasi waktu: 20–25 menit (lebih lama dari biasanya karena menimpa banyak file sekaligus — tapi ini kesempatan menyamakan semuanya).

---

## Kenapa errornya "Sheet undefined tidak ditemukan"?

`Utils.gs` yang aktif di Apps Script Anda saat ini rupanya bukan versi terbaru — bagian yang mendaftarkan nama sheet `14_PERIODE_KERJA`, `15_KALENDER_OPERASIONAL`, `16_MASTER_LOKASI_SPPG` hilang/tertimpa versi lama. Modul lain (Relawan, Akun) tidak kena karena itu sudah ada sejak awal, bukan bagian yang saya tambahkan belakangan.

---

## Isi Paket (SEMUA, timpa semuanya)

```
KONSOLIDASI-SEMUA-FILE-TERBARU/
├── admin.html
├── admin.js
├── absensi.html
├── script.js
├── common.js
├── portal.css
└── google-apps-script/
    ├── Utils.gs
    ├── Code.gs
    ├── Periode.gs
    ├── Kalender.gs
    ├── Lokasi.gs
    └── Absensi.gs
```

**File yang TIDAK ada di paket ini** (Relawan.gs, Akun.gs, Admin.gs, Informasi.gs, Jadwal.gs, Dokumen.gs, Notifikasi.gs, Pengumuman.gs, dan file frontend lain seperti dashboard.html/profil.html/dst.) **tidak perlu disentuh** — belum pernah saya ubah, aman seperti apa adanya.

---

## Langkah 1 — Timpa SEMUA File Apps Script (6 file)

1. **Extensions → Apps Script**.
2. Timpa satu per satu, pastikan **nama file di Apps Script cocok** dengan nama di paket (tanpa `.gs` saat dilihat di editor): `Utils`, `Code`, `Periode`, `Kalender`, `Lokasi`, `Absensi`.
3. **Tips supaya tidak ada yang kelewat:** buka setiap file di Apps Script, `Ctrl+A` lalu `Delete` isi lamanya dulu, baru tempel isi baru — jangan cuma tempel di atas tanpa menghapus dulu (bisa nyisa baris lama di bawah).
4. Simpan semua (💾).
5. **Deploy → Manage deployments** → pensil (✏️) → **New version** → **Deploy**.

✅ Checkpoint: `?action=health` tetap `{"success":true,...}`.

---

## Langkah 2 — Timpa SEMUA File Frontend (6 file)

Timpa di GitHub repo Anda: `admin.html`, `admin.js`, `absensi.html`, `script.js`, `common.js`, `portal.css`. Commit & push, tunggu GitHub Pages selesai build.

---

## Langkah 3 — Bersihkan Data Uji Coba

1. Buka Dashboard Admin → pastikan **tidak ada lagi** pesan merah "Sebagian data belum dapat dimuat".
2. Buka **Kalender Operasional** → **hapus entri tanggal 30/08/2026** yang Anda buat manual kemarin sebagai workaround — **sekarang tidak diperlukan lagi**, karena sistem otomatis mendeteksi shift malam dan menempelkannya ke operasional besok (31 Agustus). Kalau entri 30/08 itu dibiarkan, nanti relawan yang absen malam tanggal 30 malah tercatat di operasional tanggal 30 (bukan 31) — sedikit membingungkan untuk Rekap, walau tidak fatal.

---

## Langkah 4 — Uji Coba

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka Dashboard Admin | Tidak ada pesan error merah |
| 2 | Buka Periode Kerja, Kalender Operasional, Master Lokasi SPPG | Semua data tampil normal |
| 3 | Simulasikan absen Masuk **setelah jam 18:00** pada tanggal **sebelum** hari operasional (mis. malam tanggal 30, operasional tercatat untuk tanggal 31 di Kalender) | Berhasil absen, **tidak** perlu ada entri tanggal 30 di Kalender — otomatis nempel ke operasional 31 |
| 4 | Cek Rekap Harian tanggal 31 | Relawan yang absen malam tanggal 30 tadi **muncul di rekap tanggal 31**, bukan tanggal 30 |
| 5 | Absen Pulang setelah lewat tengah malam (misal jam 04:00 tanggal 31) | Durasi terhitung benar dari jam masuk sebenarnya (23:00) sampai jam pulang (04:00) |
| 6 | Absen Masuk normal siang hari (operasional hari yang sama) | Tetap berjalan seperti biasa, tidak terpengaruh perubahan ini |

---

## Rollback

Simpan salinan semua file sebelum menimpa (praktik baik). Kalau ada masalah, kembalikan ke versi sebelum paket ini, **Deploy → New version** lagi. Tidak ada perubahan struktur sheet di paket ini — aman di-rollback kapan saja.

---

## Saran ke Depan

Supaya kejadian "versi ketinggalan" ini tidak berulang: setiap kali saya kirim perbaikan, coba biasakan **selalu timpa SEMUA file yang saya sebutkan** di panduan tersebut sampai tuntas dalam satu sesi, jangan sebagian dulu lalu dilanjut lain waktu — supaya tidak ada file yang "ketinggalan" seperti kali ini.
