/**
 * SPPG JEUNGJING — SISTEM ABSENSI RELAWAN
 * Admin.gs — Login admin & manajemen sesi
 */

function adminLogin(username, password) {
  username = sanitize(username);
  if (!username || !password) throw new Error('Username dan password wajib diisi.');

  const sheet = getSheet(NAMA_SHEET.ADMIN);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idxUser = headers.indexOf('USERNAME');
  const idxHash = headers.indexOf('PASSWORD_HASH');
  const idxSalt = headers.indexOf('SALT');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxUser]).toLowerCase() === username.toLowerCase()) {
      const salt = data[i][idxSalt];
      const hash = hashPassword(password, salt);
      if (hash === data[i][idxHash]) {
        const token = generateToken();
        // Sesi disimpan di CacheService (server), BUKAN di browser/localStorage.
        // Maksimal masa berlaku CacheService adalah 6 jam.
        CacheService.getScriptCache().put('sesi_' + token, username, 21600);
        return { token: token, username: username };
      }
      break;
    }
  }
  throw new Error('Username atau password salah.');
}

/**
 * JEMBATAN SIPANDU UNTUK ADMIN.
 * SIPANDU cuma percaya sesi RELAWAN (lihat catatan di SipanduAuth.gs --
 * CacheService sesi Admin tidak bisa dibaca proyek Apps Script lain).
 * Daripada mengubah cara SIPANDU memvalidasi sesi (beresiko ke jalur yang
 * sudah berjalan), Admin cukup "dipinjamkan" sesi relawan miliknya SENDIRI
 * secara otomatis di sini -- pola login-nya PERSIS sama dengan relawanLogin,
 * cuma dipicu dari sesi Admin yang sudah tervalidasi, tanpa perlu username/
 * password relawan diketik ulang.
 *
 * Keamanan: HANYA bisa masuk sebagai relawan yang SUDAH DITAUTKAN ke akun
 * Admin itu sendiri (kolom ID_RELAWAN_TERKAIT di 06_ADMIN, diisi manual
 * oleh Admin) -- tidak ada parameter dari klien yang menentukan relawan
 * mana, jadi tidak bisa dipakai untuk masuk sebagai relawan lain.
 */
function masukSebagaiRelawanUntukSipandu(token) {
  const username = requireAuth(token);

  const sheetAdmin = getSheet(NAMA_SHEET.ADMIN);
  const data = sheetAdmin.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idxUser = headers.indexOf('USERNAME');
  const idxRelawanTerkait = headers.indexOf('ID_RELAWAN_TERKAIT');

  if (idxRelawanTerkait === -1) {
    throw new Error('Kolom ID_RELAWAN_TERKAIT belum ada di 06_ADMIN. Tambahkan dulu, lalu isi dengan ID relawan Anda sendiri (mis. R001).');
  }

  let idRelawanTerkait = '';
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxUser]).toLowerCase() === username.toLowerCase()) {
      idRelawanTerkait = String(data[i][idxRelawanTerkait] || '').trim();
      break;
    }
  }
  if (!idRelawanTerkait) {
    throw new Error('Akun Admin ini belum ditautkan ke relawan mana pun. Isi kolom ID_RELAWAN_TERKAIT di 06_ADMIN dengan ID relawan Anda (mis. R001).');
  }

  const akun = cariAkunByIdRelawan_(idRelawanTerkait);
  if (!akun) throw new Error('Relawan tertaut (' + idRelawanTerkait + ') tidak ditemukan di 07_AKUN_RELAWAN.');

  const relawan = getRelawanById(idRelawanTerkait);
  if (!relawan || String(relawan.status).toUpperCase() !== 'AKTIF') {
    throw new Error('Data relawan tertaut (' + idRelawanTerkait + ') tidak aktif.');
  }

  // Dari sini persis pola relawanLogin() -- jalur cepat (CacheService) +
  // jalur jangka panjang (sheet) supaya SIPANDU (yang membaca sheet
  // lintas-proyek) langsung mengenali sesi ini.
  const relawanToken = generateToken();
  CacheService.getScriptCache().put('sesi_relawan_' + relawanToken, idRelawanTerkait, 21600);

  if (akun.idx.TOKEN_AKTIF !== undefined && akun.idx.TOKEN_KADALUARSA !== undefined) {
    const kadaluarsa = new Date(Date.now() + DURASI_SESI_RELAWAN_HARI * 24 * 60 * 60 * 1000);
    const sheetAkun = getAkunSheet();
    sheetAkun.getRange(akun.baris, akun.idx.TOKEN_AKTIF + 1).setValue(relawanToken);
    sheetAkun.getRange(akun.baris, akun.idx.TOKEN_KADALUARSA + 1).setValue(kadaluarsa);
  } else {
    throw new Error('Portal belum punya kolom TOKEN_AKTIF/TOKEN_KADALUARSA di 07_AKUN_RELAWAN -- jembatan ke SIPANDU butuh itu untuk bisa dibaca lintas-proyek.');
  }

  return {
    token: relawanToken,
    idRelawan: idRelawanTerkait,
    nama: relawan.nama,
    divisi: relawan.divisi,
    wajibGantiPassword: false
  };
}

/** Dipanggil di awal setiap aksi admin (tulis data) untuk memastikan sesi masih berlaku. */
function requireAuth(token) {
  if (!token) throw new Error('Sesi tidak valid. Silakan login kembali.');
  const username = CacheService.getScriptCache().get('sesi_' + token);
  if (!username) throw new Error('Sesi telah berakhir. Silakan login kembali.');
  return username;
}

/**
 * JALANKAN FUNGSI INI SATU KALI SAJA dari editor Apps Script untuk membuat
 * (atau mengganti) akun admin Anda:
 *   1. Ganti nilai USERNAME_BARU dan PASSWORD_BARU di bawah ini.
 *   2. Pilih fungsi "setupAdminPassword" pada dropdown di atas editor Apps Script.
 *   3. Klik tombol "Run" (▶). Berikan izin akses saat diminta.
 *   4. Cek sheet 06_ADMIN — baris kedua akan terisi otomatis.
 *   5. Setelah berhasil, sebaiknya kosongkan kembali PASSWORD_BARU di kode ini
 *      agar password asli tidak tertinggal sebagai teks biasa di dalam skrip.
 */
function setupAdminPassword() {
  const USERNAME_BARU = 'admin';
  const PASSWORD_BARU = 'GantiPasswordIni123';

  const salt = Utilities.getUuid();
  const hash = hashPassword(PASSWORD_BARU, salt);
  const sheet = getSheet(NAMA_SHEET.ADMIN);
  sheet.getRange(2, 1, 1, 3).setValues([[USERNAME_BARU, hash, salt]]);
  Logger.log('Akun admin berhasil dibuat/diperbarui. Username: ' + USERNAME_BARU);
}
