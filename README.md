# SPPG Jeungjing — Sistem Absensi Relawan

Sistem absensi berbasis web untuk relawan **SPPG Jeungjing**, dibangun dengan HTML/CSS/JavaScript sederhana, **Google Apps Script** sebagai backend/API, dan **Google Spreadsheet** sebagai database. Hosting menggunakan **GitHub Pages** — sepenuhnya gratis, tanpa backend berbayar.

Alur inti: **1 QR Code → Absensi Relawan → Data Otomatis → Google Spreadsheet → Dashboard Admin.**

---

## 0. Catatan Redesign (Tahap Ini) — Portal Relawan & Dashboard Admin Premium

Tahap ini membangun ulang **tampilan & navigasi** Portal Relawan dan Dashboard Admin menjadi satu sistem UI responsif (HP → Tablet → Laptop → Desktop) dengan sidebar/drawer, hero, dan struktur modular — **tanpa mengubah logic/database Absensi yang sudah berjalan** (`absensi.html`, `script.js` tidak disentuh sama sekali).

**Berkas baru:**
- `app-shell.css`, `app-shell.js` — sistem sidebar/drawer/topbar/hero yang dipakai bersama seluruh halaman.
- `dashboard.html` + `dashboard.js` — Dashboard Relawan (baru, landing setelah login; `index.html` sekarang jadi halaman "belum login" saja).
- `dokumen.html` + `dokumen.js` — Dokumen & Panduan (baru, modul #7).
- `notifikasi.html` + `notifikasi.js` — Notifikasi (baru, modul #6 — sebelumnya placeholder).
- `google-apps-script/Dokumen.gs`, `Notifikasi.gs`, `Pengumuman.gs` — backend baru untuk 3 modul di atas + Pengumuman Admin.

**Sheet baru yang perlu ditambahkan di Google Spreadsheet** (lihat §3 untuk format lengkap): `11_DOKUMEN`, `12_NOTIFIKASI`, `13_PENGUMUMAN`.

**Perilaku baru yang perlu diketahui:**
- Menambah **Informasi** atau **Jadwal** dari Admin otomatis mencatat satu baris di `12_NOTIFIKASI` (relawan langsung melihatnya di lonceng notifikasi) — logic asli `addInformasi()`/`addJadwal()` tidak diubah, hanya ditambah satu baris pemanggilan `catatNotifikasi_()` di akhir fungsi.
- **Pengumuman** (menu baru di Dashboard Admin) adalah alat admin: sekali kirim, otomatis tayang ke halaman **Informasi** relawan dan tercatat di **Notifikasi** — bukan halaman terpisah di sisi relawan (selaras dengan referensi desain yang diberikan).
- Status "sudah dibaca" pada Notifikasi disimpan per perangkat relawan (localStorage), bukan di server — supaya tidak perlu menambah kolom di sheet.
- `login.js` sekarang mengarahkan relawan ke `dashboard.html` (bukan `profil.html`) setelah login berhasil.

---

## Daftar Isi

1. [Struktur Folder](#1-struktur-folder)
2. [Cara Kerja Sistem](#2-cara-kerja-sistem)
3. [Langkah 1 — Setup Google Spreadsheet](#3-langkah-1--setup-google-spreadsheet)
4. [Langkah 2 — Setup Google Apps Script](#4-langkah-2--setup-google-apps-script)
5. [Langkah 3 — Hubungkan Website ke Apps Script](#5-langkah-3--hubungkan-website-ke-apps-script)
6. [Langkah 4 — Deploy ke GitHub Pages](#6-langkah-4--deploy-ke-github-pages)
7. [Langkah 5 — Membuat QR Code](#7-langkah-5--membuat-qr-code)
8. [Panduan Penggunaan — Relawan](#8-panduan-penggunaan--relawan)
9. [Panduan Penggunaan — Admin](#9-panduan-penggunaan--admin)
   - [Login & Profil Relawan (Tahap 2-4)](#9a-panduan-penggunaan--login--profil-relawan-tahap-2-4)
10. [Keamanan](#10-keamanan)
11. [Asumsi & Catatan Desain](#11-asumsi--catatan-desain)
12. [Troubleshooting](#12-troubleshooting)
13. [Pengembangan Lanjutan (opsional)](#13-pengembangan-lanjutan-opsional)
14. [Checklist Regresi — Tahap 2-4](#14-checklist-regresi--tahap-2-4)

---

## 1. Struktur Folder

```
SPPG-JEUNGJING-ABSENSI/
│
├── index.html              # Halaman "belum login" (hero + tombol Masuk) — redirect ke dashboard.html jika sesi aktif
├── dashboard.html            # Dashboard Relawan (landing setelah login) — BARU
├── absensi.html             # Halaman absensi relawan (tujuan QR Code) — TIDAK DIUBAH
├── login.html                # Login relawan
├── profil.html                 # Profil relawan — identitas, ubah No HP/Email
├── pengaturan.html               # Pengaturan Akun — status, login terakhir, menu Ganti Password, keluar (Modul #3)
├── ganti-password.html             # Ganti Password — halaman tersendiri, terpisah dari Pengaturan Akun
├── riwayat.html                    # Riwayat Absensi — 14 hari terakhir milik sendiri (Modul #2)
├── informasi.html                    # Pusat Informasi — daftar pengumuman aktif (Modul #4)
├── jadwal.html                         # Jadwal & Penugasan — milik sendiri + broadcast (Modul #5)
├── notifikasi.html                       # Notification Center — BARU (Modul #6)
├── dokumen.html                            # Dokumen & Panduan — BARU (Modul #7)
├── bantuan.html                              # Panduan, kendala, FAQ, kontak admin
├── admin.html                                  # Dashboard admin (dilindungi login) — sidebar/drawer, modul baru
├── qrcode.html                                   # Halaman cetak QR Code (untuk admin) — mengarah ke absensi.html
│
├── style.css                  # Desain dasar (dipakai halaman Absensi & Admin)
├── portal.css                  # Desain komponen konten Portal (kartu, form, dsb.)
├── admin.css                    # Desain komponen Dashboard Admin (tabel, filter, dsb.)
├── app-shell.css                  # BARU — sistem sidebar/drawer/topbar/hero responsif (dipakai semua halaman)
├── app-shell.js                     # BARU — perilaku sidebar/drawer + boot header relawan (nama, status, badge notif)
├── dashboard.js                       # BARU — logic Dashboard Relawan
├── notifikasi.js                        # BARU — logic halaman Notifikasi
├── dokumen.js                             # BARU — logic halaman Dokumen & Panduan
│
├── admin.css                    # Style tambahan khusus dashboard
│
├── config.js                    # 1 tempat untuk mengisi URL Apps Script
├── common.js                     # Fungsi API bersama (dipakai semua halaman .js)
├── auth-relawan.js                # Sesi login relawan (dipakai semua halaman relawan)
├── script.js                       # Logic halaman absensi (absensi.html)
├── login.js                          # Logic halaman login relawan
├── profil.js                          # Logic halaman profil relawan
├── pengaturan.js                        # Logic halaman Pengaturan Akun
├── ganti-password.js                      # Logic halaman Ganti Password
├── riwayat.js                             # Logic halaman Riwayat Absensi
├── informasi.js                             # Logic halaman Informasi
├── jadwal.js                                  # Logic halaman Jadwal & Penugasan
├── admin.js                                     # Logic dashboard admin
│
├── assets/
│   ├── logo.png                    # Logo resmi SPPG Jeungjing (latar transparan)
│   ├── logo-bgn.png                 # Logo Badan Gizi Nasional (ikon, latar transparan)
│   └── logo-bgn-full.png             # Logo BGN versi lengkap (ikon + wordmark), cadangan
│
├── seed-data/                        # CSV siap-impor ke Google Sheets
│   ├── 01_DATA_RELAWAN.csv             # 47 relawan awal, sudah diberi ID R001–R047
│   ├── 02_DATA_DIVISI.csv               # 12 divisi aktif
│   ├── 03_DATA_ABSENSI.csv               # Hanya header
│   ├── 04_REKAP_HARIAN.csv                # Hanya header
│   ├── 05_REKAP_BULANAN.csv                # Hanya header (historis, tidak lagi jadi tab utama — lihat Bagian 9)
│   ├── 06_ADMIN.csv                         # Hanya header
│   ├── 07_AKUN_RELAWAN.csv                   # Hanya header — akun login relawan (Tahap 2-4)
│   ├── 08_REKAP_2_MINGGU.csv                  # Hanya header — rekap periode gajian 2 mingguan
│   ├── 09_INFORMASI.csv                        # Hanya header — pengumuman/informasi (Modul #4)
│   ├── 10_JADWAL.csv                            # Hanya header — jadwal & penugasan (Modul #5)
│   ├── 11_DOKUMEN.csv                            # BARU — hanya header — Dokumen & Panduan (Modul #7)
│   ├── 12_NOTIFIKASI.csv                          # BARU — hanya header — Notification Center (Modul #6)
│   └── 13_PENGUMUMAN.csv                           # BARU — hanya header — Pengumuman (alat Admin)
│
├── google-apps-script/                        # Kode backend — disalin ke script.google.com
│   ├── Code.gs                                  # Routing utama (doGet / doPost)
│   ├── Utils.gs                                  # Konfigurasi & fungsi bantuan
│   ├── Relawan.gs                                 # Data relawan & divisi
│   ├── Akun.gs                                     # Akun, login & profil relawan (Tahap 2-4)
│   ├── Absensi.gs                                  # Absensi, cegah duplikasi, rekap, riwayat pribadi
│   ├── Admin.gs                                     # Login admin & sesi
│   ├── Informasi.gs                                  # Pusat Informasi (Modul #4)
│   ├── Jadwal.gs                                      # Jadwal & Penugasan (Modul #5)
│   ├── Dokumen.gs                                      # BARU — Dokumen & Panduan (Modul #7)
│   ├── Notifikasi.gs                                    # BARU — Notification Center (Modul #6)
│   └── Pengumuman.gs                                     # BARU — Pengumuman (alat Admin, tayang ke Informasi + Notifikasi)
│
└── README.md                                          # Dokumen ini
```

> Struktur ini sedikit lebih lengkap dari draf awal (ditambah `admin.css`, `common.js`, `admin.js`, `qrcode.html`, `seed-data/`) agar kode tetap modular dan mudah dikembangkan, sesuai permintaan awal.

---

## 2. Cara Kerja Sistem

```
   Buka Website              QR CODE (dicetak, ditempel di lokasi)
        │                              │
        ▼                              │
   index.html (Portal Relawan)         │
        │                              │
        │  klik menu "Absensi"         │
        ▼                              ▼
   absensi.html  ──▶  Pilih Divisi  ──▶  Pilih Nama  ──▶  Jenis Absensi
        │                                                  │
        │                                          (Masuk / Pulang)
        │                                                  ▼
        │                                          Keterangan (opsional)
        │                                                  ▼
        │                                          Kirim Absensi
        ▼
   Google Apps Script (Web App / API)
        │  • Timestamp diambil dari SERVER (Asia/Jakarta), bukan dari HP relawan
        │  • Validasi & cegah absensi ganda
        ▼
   Google Spreadsheet (database)
        │
        ▼
   admin.html — Dashboard: rekap harian, rekap bulanan, kelola relawan/divisi
```

Frontend (GitHub Pages) hanya berkomunikasi dengan Apps Script melalui HTTP biasa (`fetch`) — tidak ada database yang tersimpan di browser maupun di HP admin.

---

## 3. Langkah 1 — Setup Google Spreadsheet

1. Buat Google Spreadsheet baru (spreadsheet.new), beri nama misalnya **"SPPG Jeungjing — Database Absensi"**.
2. Buat **13 sheet (tab)** dengan nama **PERSIS** seperti berikut (huruf besar/kecil dan garis bawah harus sama persis, karena dibaca oleh kode):
   - `01_DATA_RELAWAN`
   - `02_DATA_DIVISI`
   - `03_DATA_ABSENSI`
   - `04_REKAP_HARIAN`
   - `05_REKAP_BULANAN`
   - `06_ADMIN`
   - `07_AKUN_RELAWAN`
   - `08_REKAP_2_MINGGU`
   - `09_INFORMASI`
   - `10_JADWAL`
   - `11_DOKUMEN` — **baru**
   - `12_NOTIFIKASI` — **baru**
   - `13_PENGUMUMAN` — **baru**
3. Untuk **setiap** sheet, impor file CSV yang namanya sama dari folder `seed-data/`:
   - Buka sheet tujuan (misalnya `01_DATA_RELAWAN`) → menu **File → Impor → Upload** → pilih file `.csv` yang sesuai.
   - Pada "Lokasi impor", pilih **"Ganti sheet saat ini"**, lalu klik **Impor data**.
   - `01_DATA_RELAWAN.csv` sudah berisi **47 relawan awal** sesuai data yang Anda berikan, lengkap dengan ID R001–R047.
   - `02_DATA_DIVISI.csv` sudah berisi **12 divisi**, termasuk `HEAD CHEF` yang sengaja dikosongkan (belum ada nama relawan, sesuai catatan Anda).
   - Sheet lainnya (termasuk `07_AKUN_RELAWAN`, `11_DOKUMEN`, `12_NOTIFIKASI`, `13_PENGUMUMAN`) hanya berisi baris judul kolom — akan terisi otomatis lewat Dashboard Admin.

**Format kolom 3 sheet baru** (kalau lebih suka membuat manual daripada impor CSV):

| Sheet | Kolom |
|---|---|
| `11_DOKUMEN` | `ID, JUDUL, DESKRIPSI, KATEGORI, URL, STATUS, DIBUAT_PADA` |
| `12_NOTIFIKASI` | `ID, KATEGORI, JUDUL, ISI, ID_RELAWAN, DIBUAT_PADA` |
| `13_PENGUMUMAN` | `ID, JUDUL, ISI, TARGET, TANGGAL_PUBLIKASI, STATUS, DIBUAT_PADA` |

---

## 4. Langkah 2 — Setup Google Apps Script

1. Pada Spreadsheet yang sama, buka menu **Extensions → Apps Script**.
2. Hapus seluruh isi file `Code.gs` bawaan (kosongkan).
3. Buat **11 file baru** (klik ikon **+** di samping "Files", pilih "Script"), beri nama persis:
   `Utils`, `Admin`, `Relawan`, `Absensi`, `Akun`, `Informasi`, `Jadwal`, `Dokumen`, `Notifikasi`, `Pengumuman`, `Code` — Apps Script otomatis menambahkan akhiran `.gs`.
4. Salin isi masing-masing file dari folder `google-apps-script/` pada paket ini ke file dengan nama yang sesuai.
5. Buka file **Admin.gs**, cari fungsi `setupAdminPassword()`, lalu ganti nilai `USERNAME_BARU` dan `PASSWORD_BARU` sesuai keinginan Anda.
6. Pada dropdown fungsi di atas editor, pilih **setupAdminPassword**, lalu klik tombol **Run (▶)**. Berikan izin akses (Authorize) saat diminta — ini normal karena skrip perlu mengakses Spreadsheet Anda sendiri.
7. Cek sheet `06_ADMIN` — baris kedua akan otomatis terisi username, hash password, dan salt. Setelah berhasil, sebaiknya kosongkan kembali `PASSWORD_BARU` di kode agar password asli tidak tertinggal sebagai teks biasa.
8. Klik **Deploy → New deployment**.
   - Klik ikon gerigi ⚙ di "Select type" → pilih **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**, lalu klik **Authorize access** jika diminta.
9. Salin **Web app URL** yang muncul, formatnya seperti:
   `https://script.google.com/macros/s/AKfycb..................../exec`

> **Catatan:** setiap kali Anda mengubah kode Apps Script, Anda perlu membuat **New deployment** baru (atau *Manage deployments* → ikon pensil → *New version* → Deploy) agar perubahan berlaku pada URL yang sama.

---

## 5. Langkah 3 — Hubungkan Website ke Apps Script

Buka file `config.js`, ganti isinya dengan URL yang disalin dari Langkah 2:

```js
const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycb..................../exec';
```

Ini satu-satunya tempat yang perlu diubah — `absensi.html` dan `admin.html` membaca URL dari file ini. Halaman Portal (`index.html`) tidak memuat `config.js` sama sekali, sehingga Portal tetap bisa tampil meskipun `config.js` belum diisi.

---

## 6. Langkah 4 — Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `sppg-jeungjing-absensi` (bisa publik, karena tidak ada kredensial di dalam kode frontend).
2. Unggah **seluruh isi** folder `SPPG-JEUNGJING-ABSENSI/` ke repository tersebut (termasuk folder `assets/`, `seed-data/`, dan `google-apps-script/` — dua folder terakhir hanya untuk referensi/dokumentasi, tidak memengaruhi jalannya website).
3. Buka **Settings → Pages** pada repository.
4. Pada "Branch", pilih `main` dan folder `/root`, lalu klik **Save**.
5. Tunggu 1–2 menit — website akan aktif di:
   `https://USERNAME.github.io/sppg-jeungjing-absensi/`

---

## 7. Langkah 5 — Membuat QR Code

1. Buka `https://USERNAME.github.io/sppg-jeungjing-absensi/qrcode.html` di browser.
2. QR Code otomatis dibuat mengikuti alamat website Anda — **tidak perlu diisi manual**.
3. Klik tombol **Cetak QR Code**, lalu tempel hasil cetaknya di lokasi absensi dapur SPPG Jeungjing.

---

## 8. Panduan Penggunaan — Relawan

Ada dua cara masuk ke halaman Absensi:

- **Lewat Portal** — buka alamat website, akan tampil **Portal Relawan** (`index.html`) terlebih dahulu, lalu klik menu **Absensi**.
- **Lewat QR Code** — scan QR Code yang tertempel di lokasi, langsung menuju halaman Absensi (`absensi.html`) tanpa melalui Portal.

Menu lain di Portal (Profil Saya, Riwayat Absensi, Jadwal & Penugasan, Informasi, Notifikasi, Pengaturan Akun, Bantuan) masih berupa halaman placeholder dan akan dikembangkan pada fase berikutnya.

Langkah mengisi absensi:

1. Scan QR Code yang tertempel di lokasi (atau klik menu Absensi dari Portal).
2. Pilih **Divisi**.
3. Pilih **Nama** (daftar nama muncul otomatis sesuai divisi yang dipilih).
4. Pilih **Jenis Absensi**: Masuk atau Pulang.
5. Isi **Keterangan** hanya jika perlu (Izin/Sakit/Dinas/Lainnya) — untuk kehadiran biasa, langsung lewati.
6. Tekan **Kirim Absensi**. Tanggal dan jam tercatat otomatis dari server, tidak bisa diketik manual.

---

## 9. Panduan Penggunaan — Admin

1. Buka `admin.html` (tautan "Admin" ada di bagian bawah halaman absensi), login dengan akun yang dibuat di Langkah 2.
2. **Rekap Harian** — pilih tanggal, lihat status tiap relawan (Hadir/Terlambat/Izin/Sakit/Belum Absen), filter per divisi/status, export CSV.
3. **Rekap 2 Minggu** — pilih periode (tanggal awal & akhir, default otomatis ke periode 1-14 atau 15-akhir bulan berjalan sesuai tanggal hari ini), lihat rekap Hadir/Terlambat/Izin/Sakit/Tidak Hadir/Total Hari Kerja per relawan, export CSV. Ini menggantikan Rekap Bulanan sebagai tab utama karena gajian berjalan tiap 2 minggu — data Rekap Bulanan lama tetap tersimpan di sheet `05_REKAP_BULANAN` (tidak dihapus), hanya sudah tidak ditampilkan sebagai tab.
4. **Kelola Relawan** — tambah relawan baru (ID dibuat otomatis), ubah nama, pindah divisi, aktifkan/nonaktifkan relawan.
5. **Akun Relawan** (Tahap 2) — buat akun login untuk relawan yang sudah ada di Kelola Relawan: klik **+ Buat Akun**, isi username (sudah disarankan otomatis) & No HP, lalu **Buat**. Password sementara akan muncul **satu kali saja** — catat dan sampaikan langsung ke relawan. Tombol **Reset Password** dipakai jika relawan lupa password atau perangkatnya hilang. Tombol **Aktifkan/Nonaktifkan** mengontrol apakah relawan tsb bisa login — relawan yang dinonaktifkan langsung ditolak pada aksi berikutnya, bukan menunggu sesi kedaluwarsa.
6. **Kelola Divisi** — tambah divisi baru; otomatis muncul di form absensi tanpa perlu mengubah kode.
7. **Informasi** — tulis Judul & Isi, klik **+ Tambah Informasi**. Muncul langsung ke semua relawan. Tombol **Edit** untuk ubah isi, tombol **Nonaktifkan** untuk menyembunyikan dari relawan tanpa menghapus datanya (bisa diaktifkan lagi kapan saja).
8. **Jadwal & Penugasan** — isi Tanggal, Waktu, pilih **Relawan** (satu orang tertentu, atau "Semua Relawan" untuk broadcast), Penugasan, Keterangan, dan Status. Relawan hanya melihat jadwal miliknya sendiri + jadwal untuk "Semua Relawan". Tombol **Hapus** menghapus permanen (beda dari Informasi/Akun yang hanya dinonaktifkan — jadwal memang didesain bisa dihapus sesuai kebutuhan).

---

## 9a. Panduan Penggunaan — Login & Dashboard Relawan

1. Relawan membuka `login.html` (tautan **Profil Saya** di Portal), masuk dengan username & password yang diberikan Admin.
2. **Login pertama**: sistem akan meminta relawan membuat password baru sebelum melanjutkan (password sementara dari Admin tidak bisa dipakai terus-menerus).
3. Setelah masuk, relawan diarahkan ke `profil.html`: melihat identitas resmi (ID, Nama, Divisi, Status — tidak bisa diubah sendiri), melengkapi No HP & Email.
4. Dari Profil, relawan bisa membuka menu **Pengaturan Akun** (kartu menu, bukan link kecil) untuk: **Ganti Password** (halaman tersendiri), dan melihat Status Akun & Login Terakhir. Setiap halaman turunan (Pengaturan Akun, Ganti Password) punya tombol **← Kembali** di bagian atas, bukan di bawah halaman.
5. Menu Portal lain yang sudah aktif: **Riwayat Absensi** (14 hari terakhir milik sendiri), **Informasi** (pengumuman dari Admin), **Jadwal & Penugasan** (milik sendiri + yang ditujukan ke semua relawan), **Bantuan** (panduan & FAQ).
6. Sesi tersimpan di HP relawan (maks. 6 jam, sama seperti sesi Admin) — perlu login ulang setelah itu. Kalau akun dinonaktifkan Admin saat sedang login, relawan otomatis diarahkan ke login dengan pesan yang jelas pada aksi berikutnya (buka halaman, simpan data, dst.).
7. **Penting**: modul akun ini masih berdiri sendiri dari sistem Absensi — login belum menggantikan alur pilih-Divisi-pilih-Nama di halaman Absensi. Menghubungkan keduanya direncanakan pada tahap berikutnya (Fase 7 di roadmap Anda).

---

## 10. Keamanan

- Password admin **tidak pernah** disimpan di kode frontend (HTML/JS) — hanya *hash* SHA-256 (dengan salt acak) yang tersimpan di sheet `06_ADMIN`.
- Timestamp absensi **selalu** diambil dari server (Apps Script) — relawan tidak dapat mengetik atau memanipulasi jam dari perangkatnya.
- Data mentah `03_DATA_ABSENSI` **tidak pernah dihapus atau ditimpa** oleh sistem, termasuk saat sheet rekap diperbarui.
- Sesi login admin disimpan sementara di **server** (Cache Service, maksimal 6 jam) — bukan di `localStorage` browser. Jika halaman admin di-refresh, Anda perlu login kembali; ini pilihan desain yang disengaja agar tidak ada data sesi tersimpan di perangkat.
- Karena Apps Script dijalankan dengan "Execute as: Me", Spreadsheet **tidak perlu dibagikan secara publik** — hanya Web App URL yang bersifat publik, dan URL itu hanya mengekspos fungsi-fungsi yang memang dirancang untuk diakses (bukan akses langsung ke sheet).
- Disarankan tetap membatasi akses "Share" pada Spreadsheet asli hanya untuk akun Google admin, sebagai lapisan keamanan tambahan.
- Password relawan **tidak pernah** disimpan sebagai teks biasa — hanya *hash* SHA-256 (dengan salt acak per akun) yang tersimpan di `07_AKUN_RELAWAN`, sama seperti pola akun Admin.
- Password sementara (saat akun dibuat / direset) hanya muncul **satu kali** di layar Admin — tidak disimpan di sistem sebagai teks biasa setelahnya, dan tidak bisa dilihat kembali oleh siapa pun termasuk Admin.
- Sesi login relawan (`login.html`/`profil.html`) memakai mekanisme sama seperti Admin (Cache Service, maks. 6 jam) — namun tokennya **disimpan di `localStorage` HP relawan** (bukan sesi per-refresh seperti Admin), karena relawan diharapkan login dari perangkat pribadinya sendiri secara berulang. Tombol **Keluar**, baik di Admin maupun Profil Relawan, menghapus sesi di server (`CacheService`) — bukan hanya di HP/browser (Tahap 2).
- Relawan **hanya** bisa mengubah No HP, Email, dan password miliknya sendiri — identitas resmi (ID/Nama/Divisi/Status) tetap sepenuhnya dikontrol Admin lewat tab Kelola Relawan.
- **Lupa Password Admin** (Tahap 5): sistem belum punya email/SMS resmi, jadi alurnya sengaja melibatkan developer secara manual, bukan tombol otomatis. Admin yang lupa password menghubungi developer, developer menjalankan `generateAdminResetCode()` satu kali dari editor Apps Script (lihat komentar di `Admin.gs`), lalu menyampaikan kode 6 digit itu secara manual (WhatsApp/telepon). Kode berlaku 15 menit dan hanya bisa dipakai sekali — admin memasukkannya lewat tautan "Lupa Password?" di halaman login.
- **Status akun Nonaktif** (fondasi Dashboard Relawan): Admin bisa menonaktifkan akun relawan lewat tab Akun Relawan. Setiap aksi relawan yang butuh login (`requireAuthRelawan`) memvalidasi ulang status akun ke sheet — begitu Admin menonaktifkan, aksi *berikutnya* dari relawan tsb langsung ditolak & sesinya dihapus dari server, bukan menunggu token kedaluwarsa (maks 6 jam). Ini bukan real-time seketika (server tidak tahu token mana yang sedang dipakai), tapi konsisten tervalidasi di setiap request.

---

## 11. Asumsi & Catatan Desain

Beberapa hal tidak disebutkan secara eksplisit di permintaan awal, sehingga dibuat keputusan berikut (semuanya mudah diubah):

- **Jam terlambat**: karena jam operasional SPPG Jeungjing yang sebenarnya tidak disebutkan, sistem memakai **07:00 WIB** sebagai contoh batas "Terlambat". Ubah di `Utils.gs` → konstanta `JAM_MASUK_STANDAR`.
- **Status Izin/Sakit**: dicatat melalui field Keterangan yang sama dengan form absensi (bukan form terpisah), sehingga relawan yang berhalangan hadir tetap bisa melapor dari luar lokasi tanpa perlu scan QR Code — cukup membuka tautan website.
- **Divisi HEAD CHEF** sengaja dibiarkan tanpa nama relawan, sesuai catatan Anda agar tidak membuat nama fiktif.
- **Absensi Pulang** mensyaratkan sudah ada absensi Masuk pada hari yang sama (mencegah data pulang tanpa masuk); baik Masuk maupun Pulang hanya bisa dikirim satu kali per hari per relawan.

---

## 12. Troubleshooting

| Gejala | Kemungkinan Penyebab & Solusi |
|---|---|
| Dropdown divisi kosong / "Gagal memuat data" | `config.js` belum diisi URL Apps Script yang benar, atau deployment belum di-set "Anyone" pada "Who has access". |
| Error terkait CORS di console browser | Pastikan tidak menambahkan header `Content-Type` khusus saat memanggil API (sudah ditangani di `common.js`) — ini disengaja agar tidak memicu CORS *preflight* yang tidak didukung Apps Script. |
| Perubahan kode Apps Script tidak terlihat di website | Anda perlu membuat **deployment baru** setiap kali kode diubah (lihat catatan di Langkah 2). |
| Login admin gagal terus | Jalankan ulang `setupAdminPassword()` di Apps Script editor dengan username/password baru. |
| Nama relawan tidak muncul di suatu divisi | Pastikan kolom `STATUS` relawan tersebut adalah `AKTIF` (huruf besar) di sheet `01_DATA_RELAWAN`. |

---

## 13. Pengembangan Lanjutan (opsional)

Beberapa ide untuk pengembangan berikutnya — **belum diimplementasikan**, hanya catatan bila suatu saat dibutuhkan:

- Notifikasi WhatsApp/Telegram otomatis ke admin saat relawan absen masuk.
- Pengaturan jam standar keterlambatan langsung dari dashboard (tanpa membuka Apps Script editor).
- Validasi lokasi (GPS) saat absensi untuk memastikan relawan berada di lokasi dapur.

---

## 14. Checklist Regresi — Tahap 2-4

Jalankan checklist ini setelah deploy sebelum menganggap tahap ini selesai. Bagian **Sistem Lama** wajib tetap 100% lolos — itu tandanya modul baru tidak merusak apa pun yang sudah berjalan.

**Sistem Lama (tidak boleh berubah)**
- [ ] Portal (`index.html`) tetap terbuka tanpa perlu login
- [ ] Menu Absensi di Portal tetap membuka `absensi.html`
- [ ] Absensi Masuk & Pulang di `absensi.html` masih berfungsi normal (tanpa login akun)
- [ ] Duplikasi absensi (2x Masuk / 2x Pulang di hari sama) masih dicegah
- [ ] QR Code masih mengarah ke `absensi.html`
- [ ] Login Admin, Rekap Harian, Rekap 2 Minggu, Kelola Relawan, Kelola Divisi semuanya masih berjalan seperti sebelumnya

**Modul Baru (Tahap 2-4)**
- [ ] Admin bisa membuat akun baru dari tab **Akun Relawan**, password sementara muncul sekali
- [ ] Username dobel & relawan yang sudah punya akun ditolak saat dibuatkan akun baru
- [ ] Login relawan gagal dengan pesan yang jelas jika username/password salah
- [ ] Login pertama memaksa relawan membuat password baru sebelum masuk ke Profil
- [ ] Setelah ganti password, password lama tidak lagi bisa dipakai login
- [ ] Profil menampilkan identitas resmi (ID/Nama/Divisi/Status) sebagai teks biasa, tidak bisa diedit
- [ ] No HP & Email bisa diedit dan tersimpan
- [ ] Tombol Reset Password di Admin membuat password lama relawan langsung tidak berlaku
- [ ] Tombol Keluar di Profil benar-benar mengeluarkan sesi (coba buka `profil.html` lagi setelah keluar → harus diarahkan ke `login.html`)
- [ ] Relawan berstatus Nonaktif di `01_DATA_RELAWAN` tidak bisa login walau akunnya ada
- [ ] Tab **Rekap 2 Minggu** tampil dengan periode default yang masuk akal (1-14 atau 15-akhir bulan)
- [ ] Ubah periode secara manual → data ikut berubah, dan data di luar periode tidak ikut terhitung
- [ ] Export CSV Rekap 2 Minggu berhasil, kolom Total Hari Kerja terisi
- [ ] (Tahap 1) Absensi Masuk & Pulang tetap berjalan normal seperti biasa — LockService seharusnya tidak terasa oleh pengguna sama sekali kecuali sedang ada lonjakan pemakaian bersamaan
- [ ] (Tahap 2) Klik **Keluar** di dashboard Admin → coba akses ulang (mis. refresh halaman & login lagi dengan token lama kalau bisa disimulasikan) → sesi lama benar-benar tidak berlaku, bukan cuma tampilan yang berpindah ke form login
- [ ] (Tahap 5) Di form login Admin, klik **TAMPILKAN** pada password → teks password terlihat, tombol berubah jadi **SEMBUNYIKAN** → klik lagi, kembali tersembunyi
- [ ] (Tahap 5) Klik **"Lupa Password?"** → jalankan `generateAdminResetCode()` dari editor Apps Script → catat kode 6 digit dari log/Executions → masukkan Username + kode + password baru di form Reset Password → berhasil → login pakai password baru berhasil, login pakai password lama ditolak
- [ ] (Tahap 6) Absensi Masuk & Pulang tetap berjalan normal — perubahan ini murni di dalam kode, tidak ada yang terlihat beda di layar
- [ ] (Fondasi Dashboard Relawan) Buat akun percobaan, login, lalu di Admin klik **Nonaktifkan** pada akun tsb → coba buka/refresh `profil.html` di sesi relawan yang sedang login → harus terlempar ke `login.html` dengan pesan "Akun Anda telah dinonaktifkan oleh Admin" → coba login lagi dengan akun itu → harus ditolak → klik **Aktifkan** di Admin → login lagi → berhasil
- [ ] **(Modul Riwayat Absensi)** Setelah beberapa kali absen, buka menu Riwayat Absensi → 14 hari terakhir tampil dengan status yang benar, terbaru di atas
- [ ] **(Modul Pengaturan Akun)** Buka Profil Saya → klik "Ganti password & pengaturan akun" → Status Akun & Login Terakhir tampil → ganti password berhasil dari sana (bukan lagi dari Profil)
- [ ] **(Modul Bantuan)** Halaman Bantuan terbuka, semua bagian panduan bisa dibuka/tutup
- [ ] **(Modul Informasi)** Admin tambah informasi → langsung tampil ke relawan di halaman Informasi, terbaru di atas. Nonaktifkan dari Admin → hilang dari tampilan relawan tapi tidak terhapus datanya
- [ ] **(Modul Jadwal & Penugasan)** Admin tambah jadwal untuk relawan tertentu → hanya relawan itu yang melihatnya. Tambah jadwal untuk "Semua Relawan" → semua relawan melihatnya. Hapus jadwal → hilang permanen dari semua orang
- [ ] **(UI Pengaturan Akun)** Buka Profil Saya → tampil 2 kartu menu ("Ganti Password" dan "Pengaturan Akun"), bukan link kecil seperti sebelumnya. Klik "Pengaturan Akun" → halaman punya tombol "← Kembali" di atas (bukan di bawah), lalu klik "Ganti Password" di sana → berhasil ganti password dari halaman tersendiri

