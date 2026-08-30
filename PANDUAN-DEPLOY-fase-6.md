# PANDUAN DEPLOY — Fase 6: Rekap Admin Tampilkan Lokasi & Bukti Foto

Menambahkan 3 kolom di tabel **Rekap Harian** admin: **Lokasi Masuk**, **Lokasi Pulang**, **Bukti Foto** — memakai data GPS/foto yang mulai tercatat sejak Fase 5. Rekap 2 Minggu, Rekap Bulanan, dan Riwayat relawan **tidak diubah**.

Estimasi waktu: 10 menit. Tidak ada perubahan sheet/database.

---

## Isi Paket

```
fase-6-rekap-foto-lokasi/
├── admin.html                        # DIUBAH — timpa file lama
├── admin.js                          # DIUBAH — timpa file lama
└── google-apps-script/
    └── Absensi.gs                    # DIUBAH — timpa file lama (hanya getRekapHarian() bertambah field)
```

---

## Langkah 1 — Update Google Apps Script

1. **Extensions → Apps Script** → timpa file `Absensi` dengan isi `google-apps-script/Absensi.gs` di paket ini.
2. Simpan (💾).
3. **Deploy → Manage deployments** → pensil (✏️) → **New version** → **Deploy**.

✅ Checkpoint: `?action=health` tetap normal.

---

## Langkah 2 — Update Frontend

1. Timpa `admin.html` dan `admin.js` di GitHub repo Anda.
2. Commit & push.

---

## Langkah 3 — Uji Coba

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka **Rekap Harian**, pilih tanggal yang sudah ada absensi Fase 5 | Kolom baru **Lokasi Masuk**/**Lokasi Pulang** menampilkan jarak + zona, mis. "18 m · Dalam Zona" |
| 2 | Lihat kolom **Bukti Foto** | Tombol kecil "🖼 Masuk" / "🖼 Pulang" muncul untuk baris yang sudah absen dengan selfie |
| 3 | Tap salah satu tombol foto | Foto terbuka di tab baru dari Google Drive |
| 4 | Lihat baris relawan yang **belum absen** atau **Izin/Sakit** | Kolom Lokasi Masuk/Pulang & Bukti Foto menampilkan "–" (bukan error) |
| 5 | Lihat baris data **lama** (sebelum Fase 5, tanpa GPS/foto) | Sama, tampil "–" dengan rapi |
| 6 | Export CSV | File CSV sekarang punya kolom tambahan: Lokasi Masuk, Lokasi Pulang, Foto Masuk (URL), Foto Pulang (URL) |
| 7 | **Regresi:** buka Rekap 2 Minggu, Rekap Bulanan, Riwayat relawan | Semua tampil seperti biasa, tidak ada perubahan |

---

## Rollback

Kembalikan `Absensi.gs`/`admin.html`/`admin.js` ke versi sebelum paket ini, **Deploy → New version**. Tidak ada data yang perlu dikembalikan — perubahan ini murni tampilan.
