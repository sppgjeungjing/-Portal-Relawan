/**
 * SPPG JEUNGJING — PORTAL RELAWAN
 * Role.gs — Fondasi Role ASN & Kepala SPPG (Fase 1, BARU)
 *
 * TIDAK mengubah Akun.gs / Admin.gs sama sekali. Relawan, ASN, dan Kepala
 * SPPG semua tetap login lewat jalur RELAWAN yang sama (loginRelawan,
 * requireAuthRelawan) — yang membedakan cuma kolom BARU "ROLE" di sheet
 * 07_AKUN_RELAWAN. Ini konsisten dengan pola ROLE_STOK yang sudah ada
 * (izin tambahan lewat kolom, bukan sistem login terpisah).
 *
 * ==================================================================
 * WAJIB DISIAPKAN MANUAL:
 * ==================================================================
 * Tambah kolom baru "ROLE" di 07_AKUN_RELAWAN (kolom baru di kanan,
 * boleh setelah ROLE_STOK kalau sudah ada). Nilai yang dikenali:
 *   - (kosong)      -> RELAWAN biasa (default, TIDAK PERLU diisi manual
 *                       untuk relawan yang sudah ada -- kosong = aman)
 *   - "ASN"         -> akses baca lebih luas (§7 dokumen: kehadiran,
 *                       operasional, persediaan, laporan, dokumen -- SEMUA
 *                       read-only, tidak bisa tambah/ubah/hapus apa pun)
 *   - "KEPALA_SPPG" -> akses baca + laporan + monitoring
 *
 * ==================================================================
 * PENTING soal cakupan pekerjaan ini (baca supaya ekspektasi jelas):
 * ==================================================================
 * Ini FONDASI role — validasi role di backend (requireRole_) sudah bisa
 * dipakai kapan saja untuk endpoint baru mana pun. Yang SUDAH dibuat
 * konkret di file ini cuma SATU endpoint contoh (getRingkasanMonitoring)
 * + 1 halaman frontend (monitoring.html) sebagai bukti kerja end-to-end.
 *
 * BELUM dikerjakan (ini scope Fase 5/6/8, menunggu source code halaman
 * lama yang terkini -- Informasi.gs, Jadwal.gs, Dokumen.gs, Admin.gs,
 * dst -- supaya tidak menebak-nebak dari salinan yang mungkin basi):
 *   - Membuat SEMUA endpoint admin lama bisa diakses read-only oleh
 *     ASN/Kepala SPPG (Rekap Harian/Bulanan, Informasi, Jadwal, Dokumen)
 *   - Dashboard berbeda tampilan penuh per role sesuai §8
 *   - Halaman login/redirect otomatis berdasar role setelah login
 */

// ------------------------------------------------------------
// PENGECEKAN ROLE
// ------------------------------------------------------------

/** Ambil role relawan dari 07_AKUN_RELAWAN. Return 'RELAWAN' kalau kosong/kolom belum ada/tidak dikenali. */
function getRoleRelawan_(idRelawan) {
  const akun = cariAkunByIdRelawan_(idRelawan); // dari Akun.gs, tidak diubah
  if (!akun || akun.idx.ROLE === undefined) return 'RELAWAN';
  const nilai = String(akun.data[akun.idx.ROLE] || '').toUpperCase().trim();
  return (nilai === 'ASN' || nilai === 'KEPALA_SPPG') ? nilai : 'RELAWAN';
}

/**
 * Validasi sesi relawan DAN pastikan role-nya termasuk salah satu yang
 * diizinkan. Pakai ini di setiap endpoint baru yang perlu dibatasi role.
 * Return { idRelawan, role }. Throw kalau sesi tidak valid ATAU role
 * tidak termasuk allowedRoles.
 */
function requireRole_(token, allowedRoles) {
  const idRelawan = requireAuthRelawan(token); // dari Akun.gs, tidak diubah
  const role = getRoleRelawan_(idRelawan);
  if (allowedRoles.indexOf(role) === -1) {
    throw new Error('Akun Anda tidak memiliki akses ke fitur ini.');
  }
  return { idRelawan: idRelawan, role: role };
}

/**
 * Dipakai FRONTEND supaya tahu role sendiri (buat atur menu/redirect
 * setelah login). BUKAN satu-satunya lapisan keamanan -- tiap endpoint
 * baru tetap WAJIB validasi ulang lewat requireRole_ di backend, jangan
 * cuma percaya role yang "diingat" di frontend.
 */
function getProfilRoleSaya(token) {
  const idRelawan = requireAuthRelawan(token);
  return { idRelawan: idRelawan, role: getRoleRelawan_(idRelawan) };
}

// ------------------------------------------------------------
// CONTOH ENDPOINT READ-ONLY UNTUK ASN & KEPALA SPPG
// Ringkasan lintas-modul, murni BACA, tidak ada create/update/delete di
// sini sama sekali. Sengaja SATU endpoint gabungan dulu (bukan bongkar
// tiap endpoint admin lama satu-satu) supaya resikonya kecil & jelas.
// ------------------------------------------------------------

function getRingkasanMonitoring(token) {
  requireRole_(token, ['ASN', 'KEPALA_SPPG']);

  const relawanAktif = sheetToObjects(getSheet(NAMA_SHEET.RELAWAN))
    .filter(r => String(r.STATUS).toUpperCase() === 'AKTIF');
  const hariIni = formatTanggal(new Date());
  const sudahAbsenHariIni = getAbsensiRows_()
    .filter(a => a.TANGGAL === hariIni && a.JENIS_ABSENSI === 'MASUK').length;

  let stok = null;
  try {
    const barang = sheetToObjects(getStokBarangSheet()).filter(b => String(b.AKTIF).toUpperCase() !== 'NONAKTIF');
    let aman = 0, menipis = 0, habis = 0;
    barang.forEach(b => {
      const s = statusStokBarang_(Number(b.STOK_SAAT_INI) || 0, Number(b.STOK_MINIMUM) || 0);
      if (s === 'AMAN') aman++; else if (s === 'MENIPIS') menipis++; else habis++;
    });
    stok = { totalJenisBarang: barang.length, aman: aman, menipis: menipis, habis: habis };
  } catch (e) {
    // Modul Stok belum disiapkan di proyek ini -- tampilkan kosong, jangan gagalkan seluruh ringkasan.
  }

  return {
    totalRelawanAktif: relawanAktif.length,
    sudahAbsenHariIni: sudahAbsenHariIni,
    belumAbsenHariIni: Math.max(0, relawanAktif.length - sudahAbsenHariIni),
    stok: stok
  };
}

// ------------------------------------------------------------
// KELOLA ROLE (Hak Akses) -- dipulihkan, sempat hilang saat rilis
// sebelumnya tidak lengkap terpasang (dipanggil dari Code.gs tapi
// fungsinya belum ada).
// ------------------------------------------------------------

function getDaftarRelawanUntukRoleAdmin(token) {
  requireAuth(token);
  const namaMap = {};
  sheetToObjects(getSheet(NAMA_SHEET.RELAWAN))
    .filter(r => String(r.STATUS).toUpperCase() === 'AKTIF')
    .forEach(r => { namaMap[r.ID_RELAWAN] = r.NAMA_RELAWAN; });

  return sheetToObjects(getAkunSheet())
    .filter(a => namaMap[a.ID_RELAWAN])
    .map(a => ({ idRelawan: a.ID_RELAWAN, nama: namaMap[a.ID_RELAWAN], role: getRoleRelawan_(a.ID_RELAWAN) }));
}

function setRoleRelawan(body) {
  const usernameAdmin = requireAuth(body.token);
  const idRelawan = sanitize(body.idRelawan);
  const role = sanitize(body.role);
  if (!idRelawan) throw new Error('Relawan wajib dipilih.');
  if (role && role !== 'ASN' && role !== 'KEPALA_SPPG') throw new Error('Role tidak dikenali.');

  const sheet = getAkunSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idxId = headers.indexOf('ID_RELAWAN');
  const idxRole = headers.indexOf('ROLE');
  if (idxRole === -1) {
    throw new Error('Kolom ROLE belum ditambahkan di sheet 07_AKUN_RELAWAN. Tambahkan dulu kolom ini secara manual sebelum mengatur Hak Akses.');
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxId]) === idRelawan) {
      sheet.getRange(i + 1, idxRole + 1).setValue(role);
      logAudit_('SET_ROLE_RELAWAN', 'ROLE', idRelawan, usernameAdmin, { role: role || 'RELAWAN' });
      return { success: true };
    }
  }
  throw new Error('Akun relawan tidak ditemukan.');
}
