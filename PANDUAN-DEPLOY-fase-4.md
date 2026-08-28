# PANDUAN DEPLOY — Fase 4: Master Lokasi SPPG

Menambahkan modul **Master Lokasi SPPG** — titik referensi resmi + radius toleransi untuk validasi jarak absensi (dipakai nanti di Fase 5: Selfie + GPS). **Murni tambahan**, tidak ada file/sheet/fungsi lama yang dihapus atau diubah perilakunya.

Estimasi waktu: 10 menit.

---

## Isi Paket

```
fase-4-master-lokasi/
├── admin.html                        # DIUBAH — timpa file lama
├── admin.js                          # DIUBAH — timpa file lama
├── google-apps-script/
│   ├── Utils.gs                      # DIUBAH — timpa file lama (+1 nama sheet)
│   ├── Code.gs                       # DIUBAH — timpa file lama (+4 action baru)
│   └── Lokasi.gs                     # BARU — tambahkan file baru
└── seed-data/
    └── 16_MASTER_LOKASI_SPPG.csv     # BARU — untuk sheet baru
```

---

## Langkah 1 — Tambah Sheet Baru

1. Buka Google Spreadsheet database sistem Anda.
2. Buat sheet baru bernama **persis**: `16_MASTER_LOKASI_SPPG`.
3. Sel A1 → **File → Impor → Upload** → pilih `seed-data/16_MASTER_LOKASI_SPPG.csv` → **"Ganti sheet saat ini"** → Impor.

✅ Checkpoint: Spreadsheet sekarang punya **16 sheet**. Sheet baru hanya berisi 1 baris header — ini normal, Anda akan mengisi lewat Dashboard Admin, bukan manual di sini.

---

## Langkah 2 — Update Google Apps Script

1. **Extensions → Apps Script**.
2. Timpa `Utils` dan `Code` dengan isi dari `google-apps-script/Utils.gs` dan `Code.gs` di paket ini.
3. Tambah file baru: klik **+** → Script → beri nama `Lokasi` → tempel isi dari `google-apps-script/Lokasi.gs`.
4. Simpan (💾).
5. **Deploy → Manage deployments** → pensil (✏️) pada deployment aktif → **New version** → **Deploy**. (Jangan buat deployment baru terpisah — URL harus tetap sama.)

✅ Checkpoint: buka `URL_APPS_SCRIPT_ANDA?action=health` — harus tetap `{"success":true,...}`.

---

## Langkah 3 — Update Frontend

1. Timpa `admin.html` dan `admin.js` di GitHub repo Anda.
2. File lain tidak perlu disentuh.
3. Commit & push, tunggu GitHub Pages selesai build.

✅ Checkpoint: login admin → sidebar ada menu baru **"Master Lokasi SPPG"** (di grup "Periode & Kalender").

---

## Langkah 4 — Tetapkan Titik Lokasi Resmi (WAJIB dilakukan langsung oleh Anda)

**Ini bagian penting** — sistem sengaja **tidak** mengisi koordinat apa pun secara otomatis, supaya tidak ada data lokasi karangan yang jadi acuan produksi.

1. Buka tab **Master Lokasi SPPG** di HP Anda, **sambil berdiri di lokasi SPPG Jeungjing yang sebenarnya**.
2. Isi Nama Lokasi, misal "SPPG Jeungjing".
3. Tap tombol **🎯 Gunakan Lokasi Saya Sekarang** — browser akan minta izin GPS, izinkan. Latitude/Longitude terisi otomatis, beserta info akurasi GPS saat itu.
4. Isi **Radius Toleransi (meter)** — jarak maksimal dari titik ini yang masih dianggap sah untuk absen. Sesuaikan dengan luas area SPPG Anda (contoh acuan dari screenshot referensi Anda sebelumnya: jarak 18 meter dianggap "Dalam Zona Disetujui").
5. Centang **"Jadikan lokasi aktif sekarang"**.
6. **Simpan Lokasi**.

✅ Checkpoint: baris baru muncul di tabel dengan badge **AKTIF**.

---

## Langkah 5 — Uji Coba

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Tambah lokasi kedua (uji coba, jangan dijadikan aktif) | Muncul di tabel dengan status NONAKTIF |
| 2 | Tap "Jadikan Aktif" pada lokasi kedua | Lokasi kedua jadi AKTIF, lokasi pertama otomatis jadi NONAKTIF (hanya boleh 1 aktif) |
| 3 | Coba "Hapus" pada lokasi yang sedang AKTIF | Tombol Hapus tidak muncul untuk lokasi aktif — ini sengaja, untuk mencegah sistem kehilangan titik referensi |
| 4 | Aktifkan kembali lokasi SPPG yang benar | Jadi AKTIF lagi |
| 5 | **Regresi:** buka `absensi.html`, Periode Kerja, Kalender Operasional | Berjalan normal seperti sebelumnya — modul ini belum tersambung ke mana pun |

---

## Rollback

Hapus file `Lokasi.gs`, kembalikan `Utils.gs`/`Code.gs`/`admin.html`/`admin.js` ke versi sebelumnya, **Deploy → New version** lagi. Sheet `16_MASTER_LOKASI_SPPG` boleh dibiarkan ada — tidak ada modul lain yang bergantung padanya.

---

## Catatan

Modul ini **belum** dipakai untuk validasi absensi sungguhan — itu Fase 5 (rombak `absensi.html` + `submitAbsensi()` dengan Selfie + GPS), yang rencananya sudah dijelaskan di chat dan menunggu konfirmasi Anda sebelum kode besar itu ditulis.
