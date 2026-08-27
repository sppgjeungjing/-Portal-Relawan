# PANDUAN DEPLOY — Fase 2 & 3: Periode Kerja + Kalender Operasional

Paket ini menambahkan 2 modul baru (Periode Kerja, Kalender Operasional) ke sistem **SPPG Jeungjing — Portal Relawan** yang sudah berjalan. **Semuanya bersifat tambahan** — tidak ada data lama, sheet lama, atau fungsi lama (termasuk `submitAbsensi()` dan `absensi.html`) yang diubah/dihapus.

Estimasi waktu: 15–20 menit. Kerjakan berurutan, jangan lompat langkah.

---

## Isi Paket

```
fase-2-3-periode-kalender/
├── admin.html                              # DIUBAH — timpa file lama
├── admin.js                                # DIUBAH — timpa file lama
├── google-apps-script/
│   ├── Utils.gs                            # DIUBAH — timpa file lama
│   ├── Code.gs                             # DIUBAH — timpa file lama
│   ├── Periode.gs                          # BARU — tambahkan file baru
│   └── Kalender.gs                         # BARU — tambahkan file baru
└── seed-data/
    ├── 14_PERIODE_KERJA.csv                # BARU — untuk sheet baru
    └── 15_KALENDER_OPERASIONAL.csv         # BARU — untuk sheet baru
```

---

## Langkah 1 — Tambah 2 Sheet Baru di Google Spreadsheet

1. Buka Google Spreadsheet database sistem Anda (yang sudah berisi 13 sheet: `01_DATA_RELAWAN` sampai `13_PENGUMUMAN`).
2. Klik tombol **+** di pojok kiri bawah untuk membuat sheet baru. Beri nama **persis**: `14_PERIODE_KERJA`.
3. Klik sel A1 pada sheet tersebut → menu **File → Impor → Upload** → pilih `seed-data/14_PERIODE_KERJA.csv` dari paket ini. Pada "Lokasi impor" pilih **"Ganti sheet saat ini"** → **Impor data**.
4. Ulangi langkah 2–3 untuk sheet `15_KALENDER_OPERASIONAL` dengan file `seed-data/15_KALENDER_OPERASIONAL.csv`.
5. Pastikan kedua sheet baru hanya berisi **1 baris header** (belum ada data) — ini normal, akan terisi otomatis lewat Dashboard Admin.

✅ Checkpoint: Spreadsheet Anda sekarang punya **15 sheet** total.

---

## Langkah 2 — Update Google Apps Script

1. Di Spreadsheet yang sama, buka **Extensions → Apps Script**.
2. **Timpa file yang sudah ada** (hapus isi lama, tempel isi baru):
   - Buka `Utils` → hapus semua isi → tempel isi dari `google-apps-script/Utils.gs` di paket ini.
   - Buka `Code` → hapus semua isi → tempel isi dari `google-apps-script/Code.gs` di paket ini.
3. **Tambah 2 file baru**: klik ikon **+** di samping "Files" → pilih "Script".
   - Beri nama `Periode` → tempel isi dari `google-apps-script/Periode.gs`.
   - Beri nama `Kalender` → tempel isi dari `google-apps-script/Kalender.gs`.
4. Klik ikon **Simpan** (💾) di toolbar editor.
5. Klik **Deploy → Manage deployments** → klik ikon pensil (✏️) pada deployment yang aktif → pada "Version" pilih **New version** → klik **Deploy**.
   - **Jangan** buat "New deployment" terpisah — itu akan menghasilkan URL baru dan `config.js` Anda perlu diubah. Gunakan **New version** pada deployment yang sudah ada supaya URL tetap sama.
6. Jika diminta **Authorize access** lagi, ikuti saja — ini normal karena ada file baru.

✅ Checkpoint: Jalankan fungsi `health` lewat browser (`URL_APPS_SCRIPT_ANDA?action=health`) — harus muncul `{"success":true,"data":{"status":"OK",...}}`.

---

## Langkah 3 — Update Frontend (GitHub Pages)

1. Buka repository GitHub Anda.
2. Timpa 2 file berikut dengan isi dari paket ini:
   - `admin.html`
   - `admin.js`
3. File lain (`absensi.html`, `script.js`, `index.html`, dst.) **tidak perlu disentuh** — tidak ada perubahan di sana.
4. Commit & push. Tunggu 1–2 menit sampai GitHub Pages selesai build ulang.

✅ Checkpoint: Buka `admin.html` di browser, login, lihat sidebar — harus ada 2 menu baru: **"Periode Kerja"** dan **"Kalender Operasional"** (grup "Periode & Kalender", di atas "Jadwal & Penugasan").

---

## Langkah 4 — Uji Coba (jalankan semua, urut)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka tab **Periode Kerja** | Tabel kosong: "Belum ada periode kerja." — bukan error |
| 2 | Tambah periode: nama "Uji Coba", tanggal mulai & selesai (rentang ±2 minggu) | Muncul di tabel, status **DRAFT** |
| 3 | Ubah status periode dari dropdown ke **AKTIF** | Tersimpan, tidak perlu refresh |
| 4 | Buka tab **Kalender Operasional** → pilih periode "Uji Coba" → centang **Senin–Jumat** → klik "Buat Tanggal Operasional" | Muncul pesan jumlah tanggal dibuat, tabel terisi tanggal-tanggal Senin–Jumat dalam rentang periode |
| 5 | Ulangi generate dengan hari yang sama | Pesan "0 tanggal dibuat, X dilewati (sudah ada)" — tidak ada duplikat |
| 6 | Tambah 1 tanggal manual di luar hari yang sudah ada | Muncul di tabel |
| 7 | Klik "Batalkan" pada satu baris | Status berubah jadi DIBATALKAN |
| 8 | Klik "Hapus" pada satu baris | Baris hilang dari tabel |
| 9 | **Regresi — WAJIB lolos:** buka `absensi.html`, lakukan absen Masuk seperti biasa | Berjalan normal, sama seperti sebelum paket ini dipasang |
| 10 | **Regresi:** buka tab Rekap Harian & Rekap 2 Minggu di admin | Data tetap tampil seperti biasa |

Jika langkah 9–10 gagal atau berubah perilaku, **hentikan** dan hubungi saya — berarti ada yang tidak sesuai rencana (seharusnya tidak mungkin, karena paket ini tidak menyentuh `Absensi.gs`/`script.js` sama sekali).

---

## Rollback (jika perlu batalkan)

1. Di Apps Script: kembalikan isi `Utils.gs` dan `Code.gs` ke versi sebelumnya (simpan salinan lama sebelum menimpa, sebagai jaga-jaga), hapus file `Periode.gs` dan `Kalender.gs`, lalu **Deploy → New version** lagi.
2. Di GitHub: revert commit `admin.html` dan `admin.js` ke versi sebelumnya.
3. Sheet `14_PERIODE_KERJA` dan `15_KALENDER_OPERASIONAL` boleh dibiarkan ada (kosong/berisi data uji coba) — tidak mengganggu apa pun karena tidak ada modul lain yang membacanya.

Data relawan, absensi, jadwal, dsb. tidak tersentuh oleh proses rollback ini.

---

## Catatan

- `ID_OPERASIONAL` yang dibuat di Kalender Operasional **belum** dipakai oleh `submitAbsensi()`. Ini murni fondasi data — penyambungan ke alur absensi (selfie + GPS + login akun) adalah pekerjaan fase berikutnya yang akan didiskusikan terpisah sebelum ada kode diubah di `Absensi.gs`.
- Pola hari (Senin–Jumat, dsb.) di fitur "Buat Massal" **tidak di-hardcode** — Anda yang memilih sendiri setiap kali generate, sesuai kebutuhan tiap periode/divisi.
