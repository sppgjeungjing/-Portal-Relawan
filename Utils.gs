/**
 * SPPG JEUNGJING — SISTEM ABSENSI RELAWAN
 * Utils.gs — Konfigurasi & fungsi bantuan
 *
 * File ini tidak dijalankan sendiri. Salin SELURUH file .gs pada folder
 * google-apps-script/ ke satu proyek Apps Script yang sama.
 * Lihat README.md → "Langkah 2 — Setup Google Apps Script".
 */

// ------------------------------------------------------------
// KONFIGURASI
// ------------------------------------------------------------

const NAMA_SHEET = {
  RELAWAN: '01_DATA_RELAWAN',
  DIVISI: '02_DATA_DIVISI',
  ABSENSI: '03_DATA_ABSENSI',
  REKAP_HARIAN: '04_REKAP_HARIAN',
  REKAP_BULANAN: '05_REKAP_BULANAN',
  ADMIN: '06_ADMIN',
  AKUN_RELAWAN: '07_AKUN_RELAWAN',
  REKAP_DUA_MINGGU: '08_REKAP_2_MINGGU',
  INFORMASI: '09_INFORMASI',
  JADWAL: '10_JADWAL',
  DOKUMEN: '11_DOKUMEN',
  NOTIFIKASI: '12_NOTIFIKASI',
  PENGUMUMAN: '13_PENGUMUMAN',
  PERIODE: '14_PERIODE_KERJA',
  KALENDER: '15_KALENDER_OPERASIONAL',
  LOKASI: '16_MASTER_LOKASI_SPPG',
  STOK_KATEGORI: '17_STOK_KATEGORI',
  STOK_BARANG: '18_STOK_BARANG',
  STOK_TRANSAKSI: '19_STOK_TRANSAKSI',
  STOK_TRANSAKSI_DETAIL: '20_STOK_TRANSAKSI_DETAIL',
  SHIFT_DIVISI: '21_SHIFT_DIVISI',
  PENUGASAN_KHUSUS: '22_PENUGASAN_KHUSUS',
  STOK_SATUAN: '23_STOK_SATUAN'
};

// Jam masuk standar (format 24 jam, "HH:MM"). Relawan yang absen MASUK
// setelah jam ini akan otomatis berstatus "TERLAMBAT".
// >>> UBAH ANGKA INI SESUAI JAM OPERASIONAL SPPG JEUNGJING YANG SEBENARNYA <<<
const JAM_MASUK_STANDAR = '07:00';

// Toleransi keterlambatan (menit) -- relawan baru dianggap TERLAMBAT kalau
// jam presensinya melewati (jam standar/shift + toleransi ini).
// >>> UBAH ANGKA INI SESUAI KEBIJAKAN SPPG JEUNGJING <<<
const TOLERANSI_KETERLAMBATAN_MENIT = 0;

// Batas "aman" mengajukan Izin/Sakit sebelum jam shift mulai (jam).
// Bukan penolakan -- pengajuan tetap diterima kapan pun, cuma ditandai
// statusnya (TEPAT_WAKTU/MEPET/TELAT) supaya Admin tahu konteksnya.
// >>> UBAH ANGKA INI SESUAI KEBIJAKAN SPPG JEUNGJING <<<
const BATAS_JAM_PENGAJUAN_IZIN_SEBELUM_SHIFT = 3;

// Mulai jam berapa (0-23, waktu ZONA_WAKTU) sistem boleh mulai mencocokkan
// absen MASUK ke entri Kalender Operasional tanggal BESOK, kalau tanggal
// HARI INI tidak/belum punya entri AKTIF. Ini untuk shift malam yang
// "menempel" ke hari produksi besok (mis. relawan masuk jam 23:00 tanggal
// 30 untuk operasional yang di Kalender tercatat tanggal 31) — supaya
// Admin TIDAK perlu membuat entri Kalender terpisah untuk tanggal 30.
// Sebelum jam ini, tanggal besok tidak dilirik sama sekali (mis. jam 09:00
// tetap dianggap "belum ada operasional aktif" kalau memang hari itu libur
// — mencegah absen pagi keliru nyantol ke operasional besok).
// >>> UBAH ANGKA INI SESUAI JAM MULAI SHIFT MALAM SPPG JEUNGJING YANG SEBENARNYA <<<
// Contoh nyata dari planning operasional SPPG Jeungjing: Tim Persiapan mulai
// 17:00 malam sebelumnya (paling awal dari semua divisi) — 16 dipilih supaya
// ada jeda 1 jam sebelum jam mulai paling awal itu. Kalau ada divisi yang
// mulai lebih awal dari 17:00, turunkan angka ini lagi.
const JAM_MULAI_CEK_OPERASIONAL_BESOK = 16;

const ZONA_WAKTU = 'Asia/Jakarta';

// ------------------------------------------------------------
// AKSES SHEET
// ------------------------------------------------------------

function getSheet(namaSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(namaSheet);
  if (!sheet) {
    throw new Error('Sheet "' + namaSheet + '" tidak ditemukan. Periksa kembali struktur Spreadsheet Anda.');
  }
  return sheet;
}

/** Mengubah data sheet (2D array) menjadi array of object berdasarkan header baris pertama. */
/**
 * PERBAIKAN UNIVERSAL: kolom mana pun yang isinya waktu ("HH:mm:ss") kadang
 * otomatis dikonversi Google Sheets jadi nilai Time asli, yang selalu
 * "menempel" ke tanggal epoch 30 Desember 1899 saat dibaca sebagai objek
 * Date. Ini terjadi di BANYAK tempat (Absensi, Riwayat, Dashboard Admin)
 * karena semuanya baca lewat sheetToObjects -- makanya diperbaiki DI SINI,
 * satu tempat, bukan di tiap halaman satu per satu.
 * Heuristiknya aman: satu-satunya cara sebuah Date bertanggal PERSIS
 * 30 Des 1899 muncul di sheet ini adalah lewat bug konversi Time di atas --
 * tidak ada data asli yang datang dari tanggal itu.
 */
function bersihkanNilaiSheet_(nilai) {
  if (nilai instanceof Date && nilai.getFullYear() === 1899 && nilai.getMonth() === 11 && nilai.getDate() === 30) {
    return formatJam(nilai); // -> teks "HH:mm:ss"
  }
  return nilai;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = bersihkanNilaiSheet_(row[i]); });
      return obj;
    });
}

// ------------------------------------------------------------
// RESPON JSON
// ------------------------------------------------------------

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sukses(data) {
  return jsonResponse({ success: true, data: data });
}

/**
 * @param {string} message Pesan yang ramah untuk ditampilkan ke pengguna.
 * @param {string} [errorCode] Kode kategori error untuk debugging, mis.
 *   'UNKNOWN_ACTION', 'AUTH_ERROR', 'VALIDATION_ERROR', 'SERVER_ERROR'.
 *   Tidak ditampilkan ke pengguna — hanya untuk log/debugging di console.
 */
function gagal(message, errorCode) {
  const body = { success: false, message: message };
  if (errorCode) body.error = errorCode;
  return jsonResponse(body);
}

// ------------------------------------------------------------
// FORMAT & SANITASI
// ------------------------------------------------------------

/** Sanitasi input teks sederhana: hilangkan spasi berlebih & tanda kurung sudut. */
function sanitize(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/[<>]/g, '');
}

function formatTanggal(date) {
  return Utilities.formatDate(date, ZONA_WAKTU, 'dd/MM/yyyy');
}

function formatJam(date) {
  return Utilities.formatDate(date, ZONA_WAKTU, 'HH:mm:ss');
}

function formatJamPendek(date) {
  return Utilities.formatDate(date, ZONA_WAKTU, 'HH:mm');
}

/**
 * PERBAIKAN PENTING: Google Sheets otomatis mengonversi teks "dd/MM/yyyy"
 * yang ditulis lewat appendRow() menjadi nilai tanggal asli (Date) begitu
 * kolom tersebut "dikenali" sebagai kolom tanggal — walau kode menulisnya
 * sebagai string biasa. Akibatnya, saat dibaca kembali lewat getValues(),
 * nilai yang didapat kadang Date, kadang tetap teks (tergantung format
 * kolom). Fungsi ini menyeragamkan APAPUN bentuknya menjadi teks
 * "dd/MM/yyyy", supaya perbandingan string (===) dan .split('/') di
 * seluruh sistem selalu konsisten, tanpa bergantung pada format kolom
 * yang diatur manual di Spreadsheet.
 */
function bacaTanggalDMY_(nilai) {
  if (nilai instanceof Date) return formatTanggal(nilai);
  return String(nilai);
}

/** Sama seperti bacaTanggalDMY_, tapi untuk kolom JAM ("HH:mm:ss"). Google Sheets
 * juga otomatis mengonversi teks jam jadi tipe Waktu (Time) — saat dibaca lewat
 * getValues(), nilainya jadi Date beranchor 1899-12-30 (epoch waktu Sheets),
 * yang kalau tidak diformat ulang akan tampil aneh mis. "1899-12-30T04:55:16.000Z"
 * di frontend. Berbeda dari bug tanggal, di sini TIDAK ada informasi yang
 * tertukar/hilang — jam-nya tetap benar, cuma perlu diformat ulang jadi teks. */
function bacaJamHMS_(nilai) {
  if (nilai instanceof Date) return formatJam(nilai);
  return String(nilai);
}

/**
 * PERBAIKAN PENTING (sisi TULIS): kalau Spreadsheet punya locale Amerika
 * (MM/DD/YYYY) padahal kode menulis teks format Indonesia (DD/MM/YYYY),
 * Google Sheets akan otomatis MEMBACA teks itu terbalik saat disimpan
 * (mis. "11/09/2026" dibaca sebagai bulan 11 tanggal 09 = 9 November,
 * bukan 11 September) — nilai yang tersimpan jadi salah SEJAK AWAL,
 * bukan cuma salah baca belakangan. Paksa format sel jadi Plain Text
 * ('@') SEBELUM nilai ditulis, supaya Sheets tidak pernah menafsirkannya
 * sebagai tanggal sama sekali — locale spreadsheet jadi tidak relevan.
 * Selalu panggil INI sebelum menulis kolom TANGGAL/TANGGAL_MULAI/
 * TANGGAL_SELESAI/TANGGAL_OPERASIONAL, baik lewat appendRow (reformat
 * ulang setelahnya) maupun setValues (format dulu sebelum ditulis).
 */
function paksaKolomTeks_(sheet, baris, kolom, jumlahBaris) {
  sheet.getRange(baris, kolom, jumlahBaris || 1, 1).setNumberFormat('@');
}

/** Mengecek apakah suatu jam ("HH:mm" atau "HH:mm:ss") melewati JAM_MASUK_STANDAR. */
/** Bandingkan jamString terhadap batas HH:mm mana pun, dengan toleransi TOLERANSI_KETERLAMBATAN_MENIT. */
function apakahTerlambatDenganBatas_(jamString, batasHHmm) {
  if (!jamString || !batasHHmm) return false;
  const bagianJam = String(jamString).split(':');
  const menitAktual = Number(bagianJam[0]) * 60 + Number(bagianJam[1]);
  const bagianBatas = String(batasHHmm).split(':').map(Number);
  const menitBatas = bagianBatas[0] * 60 + bagianBatas[1] + TOLERANSI_KETERLAMBATAN_MENIT;
  return menitAktual > menitBatas;
}

function apakahTerlambat(jamString) {
  return apakahTerlambatDenganBatas_(jamString, JAM_MASUK_STANDAR);
}

// ------------------------------------------------------------
// KEAMANAN
// ------------------------------------------------------------

function hashPassword(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + String(salt));
  return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16)).padStart(2, '0')).join('');
}

function generateToken() {
  return Utilities.getUuid();
}
