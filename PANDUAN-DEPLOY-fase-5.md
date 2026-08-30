# PANDUAN DEPLOY — Fase 5: Rombak Absensi (Login Otomatis + Selfie + GPS)

**Ini perubahan paling besar sejauh ini** — `absensi.html` dirombak total dari halaman QR-tanpa-login menjadi bagian dari Portal Relawan (harus login), dengan Selfie wajib + GPS wajib + validasi jarak ke SPPG. Sesuai instruksi Anda, sistem belum resmi dipakai sehingga perombakan penuh diperbolehkan — **bukan** perubahan bertahap yang mempertahankan alur lama.

Estimasi waktu: 30–40 menit, termasuk uji coba menyeluruh. Kerjakan berurutan.

---

## ⚠️ Sebelum Mulai — Baca Ini

1. **Relawan wajib punya akun** untuk bisa absen sama sekali. Buka tab **Akun Relawan** di Dashboard Admin dan pastikan relawan yang aktif bertugas sudah dibuatkan akun (username + password sementara). QR code lama **tidak lagi berfungsi** untuk absen setelah paket ini dipasang.
2. **Kalender Operasional wajib diisi** untuk tanggal-tanggal aktual. Kalau tidak ada entri `AKTIF` di Kalender Operasional untuk hari ini, relawan akan melihat "Belum ada operasional aktif" dan tidak bisa absen sama sekali. Buka tab **Kalender Operasional** (Fase 3) dan generate tanggalnya.
3. **Master Lokasi SPPG wajib sudah AKTIF** (Fase 4). Kalau belum, submitAbsensi akan selalu gagal dengan pesan "Lokasi SPPG belum diatur oleh Admin."
4. **Google Drive akan diminta otorisasi baru** saat Anda menyimpan Apps Script — ini normal, izinkan saja (dipakai untuk menyimpan foto swafoto).

Jangan pasang paket ini di jam operasional aktif tanpa memastikan 3 hal di atas sudah siap — relawan akan langsung terkunci dari absensi kalau salah satu belum ada.

---

## Isi Paket

```
fase-5-absensi-selfie-gps/
├── absensi.html                                    # DIGANTI TOTAL
├── script.js                                       # DIGANTI TOTAL
├── common.js                                       # DIUBAH (timeout upload foto)
├── portal.css                                      # DIUBAH (+gaya Absensi baru)
├── google-apps-script/
│   ├── Absensi.gs                                  # DIGANTI TOTAL (submitAbsensi() dirombak)
│   └── Code.gs                                     # DIUBAH (+2 action baru)
└── seed-data/
    └── 03_DATA_ABSENSI_HEADER_BARU_REFERENSI.csv   # REFERENSI header baru (lihat Langkah 1)
```

---

## Langkah 1 — Tambah Kolom Baru di `03_DATA_ABSENSI` (WAJIB, manual)

Sheet ini **tidak diganti** — hanya ditambah 7 kolom baru di akhir. Data lama Anda tetap ada dan tetap terbaca.

1. Buka sheet `03_DATA_ABSENSI`.
2. Lihat header saat ini di baris 1 (harusnya kolom A–I: `NO, TIMESTAMP, TANGGAL, JAM, ID_RELAWAN, NAMA_RELAWAN, DIVISI, JENIS_ABSENSI, KETERANGAN`).
3. Di kolom **J sampai P** (baris 1 saja), ketik header baru persis ini, satu per kolom:

   | J | K | L | M | N | O | P |
   |---|---|---|---|---|---|---|
   | ID_OPERASIONAL | LATITUDE | LONGITUDE | GPS_ACCURACY | JARAK_METER | STATUS_LOKASI | FOTO_REFERENCE |

   (Referensi lengkap urutan header ada di `seed-data/03_DATA_ABSENSI_HEADER_BARU_REFERENSI.csv` kalau ingin disalin-tempel.)
4. Baris data lama biarkan kosong di kolom J–P — sistem akan menampilkannya sebagai data lama tanpa error.

✅ Checkpoint: baris 1 sheet `03_DATA_ABSENSI` sekarang punya 16 kolom (A–P).

---

## Langkah 2 — Update Google Apps Script

1. **Extensions → Apps Script**.
2. Timpa `Absensi` dan `Code` dengan isi dari `google-apps-script/Absensi.gs` dan `Code.gs` di paket ini.
3. Simpan (💾).
4. **Deploy → Manage deployments** → pensil (✏️) → **New version** → **Deploy**.
5. Kalau muncul layar otorisasi baru (karena `Absensi.gs` sekarang memakai `DriveApp`) — klik **Continue/Lanjutkan**, pilih akun Google Anda, izinkan aksesnya. Ini hanya muncul sekali.

✅ Checkpoint: `URL_APPS_SCRIPT_ANDA?action=health` tetap `{"success":true,...}`.

---

## Langkah 3 — Update Frontend

1. Timpa `absensi.html`, `script.js`, `common.js`, `portal.css` di GitHub repo Anda.
2. File lain (`dashboard.html`, `profil.html`, `admin.html`, dst.) **tidak perlu disentuh**.
3. Commit & push, tunggu GitHub Pages selesai build.

---

## Langkah 4 — Uji Coba (WAJIB, urut, pakai HP sungguhan agar kamera & GPS ikut teruji)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Login sebagai relawan yang sudah punya akun | Masuk ke Dashboard seperti biasa |
| 2 | Buka menu **Absensi** dari sidebar/menu | Halaman baru terbuka: identitas Anda tampil otomatis (bukan pilih Divisi/Nama) |
| 3 | Kalau belum ada Kalender Operasional untuk hari ini | Muncul pesan "Belum ada operasional aktif" — bukan error/kosong |
| 4 | Tap **Ambil Swafoto** | Browser minta izin kamera → kamera depan menyala → foto tertangkap → tombol **Ambil Ulang** muncul |
| 5 | Tunggu status lokasi | Muncul jarak dalam meter + badge **Dalam Zona** (hijau) atau **Di Luar Zona** (merah) |
| 6 | Coba tekan **Kirim Absensi** sebelum foto/lokasi siap | Tombol harus **nonaktif** (tidak bisa ditekan) |
| 7 | Lengkapi foto + lokasi dalam zona → tekan **Kirim Absensi** | Berhasil, halaman menampilkan ringkasan "Sudah Absen Masuk" |
| 8 | Buka lagi halaman Absensi (refresh) | Tetap menampilkan status "Sudah Absen Masuk", bukan form kosong lagi |
| 9 | Lakukan **Presensi Pulang** dengan cara sama | Berhasil, tampil Detail Presensi lengkap (jam masuk, jam pulang, durasi, 2 foto) |
| 10 | Coba absen Masuk lagi pada operasional yang sama | Ditolak dengan pesan jelas, bukan error mentah |
| 11 | Coba dari lokasi jauh di luar radius (matikan GPS akurat / uji dari rumah) | Badge **Di Luar Zona**, tombol Kirim tetap nonaktif; kalau dipaksa lewat cara lain, backend tetap menolak |
| 12 | Tap **"Tidak bisa hadir? Ajukan Izin/Sakit"** (sebelum absen masuk) | Form Izin/Sakit muncul, tanpa perlu kamera/GPS |
| 13 | Kirim pengajuan Izin | Tercatat, halaman menampilkan status "Izin" hari itu tanpa foto |
| 14 | **Regresi (WAJIB lolos):** buka Rekap Harian & Rekap 2 Minggu di Admin | Data yang baru masuk ikut terhitung dengan benar, data lama tidak berubah |
| 15 | **Regresi:** buka Riwayat Absensi relawan | Menampilkan data baru dengan benar |
| 16 | Buka Google Drive Anda → cari folder `ABSENSI_SELFIE` | Foto tersimpan rapi di `ABSENSI_SELFIE/2026/08/28-08-2026/...jpg` |

### Uji lintas tengah malam (kalau relevan untuk shift malam)
17. Buat entri Kalender Operasional untuk besok, lalu absen Masuk hari ini jam mendekati tengah malam → esok harinya lakukan Pulang → periksa `TANGGAL` di sheet tetap mengacu ke tanggal operasional besok, dan durasi terhitung benar dari jam sebenarnya.

---

## Rollback

1. Simpan salinan `Absensi.gs`/`Code.gs`/`absensi.html`/`script.js`/`common.js`/`portal.css` versi sebelum paket ini **sebelum** menimpa (praktik baik untuk semua fase, bukan hanya ini).
2. Kembalikan file-file di atas ke versi sebelumnya, **Deploy → New version** lagi.
3. Kolom J–P di `03_DATA_ABSENSI` boleh dibiarkan ada — kode versi lama akan mengabaikannya.
4. Data yang sudah tercatat lewat versi baru (dengan foto & GPS) tetap aman dan tetap terbaca oleh Rekap/Riwayat versi lama.

---

## Catatan Desain Penting

- **Izin/Sakit tidak memerlukan selfie/GPS** — ini keputusan sadar, bukan celah keamanan. Kehadiran fisik butuh bukti selfie+GPS; pengajuan tidak-hadir secara logis tidak bisa dibuktikan dengan lokasi SPPG. Ditulis dengan konvensi yang sama seperti sistem lama (`JENIS_ABSENSI='MASUK'`, `KETERANGAN='Izin'/'Sakit'`) sehingga Rekap & Riwayat tidak perlu diubah.
- **Lintas tengah malam**: `TANGGAL` yang tersimpan adalah tanggal operasional (dari Kalender), bukan tanggal HP — jadi Rekap/Riwayat otomatis benar tanpa perubahan kode di sana.
- **Foto yang gagal diunggah ke Drive akan langsung menggagalkan absensi** (tidak ada absensi "setengah berhasil") — sesuai instruksi Anda.
- Foto disimpan dengan sharing "siapa saja yang punya link → lihat" supaya bisa ditampilkan di halaman Detail Presensi & Rekap Admin nanti. File tidak bisa diedit/dihapus oleh pihak luar, hanya dilihat.
