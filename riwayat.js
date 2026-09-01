// SPPG JEUNGJING — LOGIC HALAMAN RIWAYAT ABSENSI (riwayat.html)
// Menggunakan fungsi bersama dari common.js (apiGet, dst.) dan auth-relawan.js.

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jumat", 'Sabtu'];
const NAMA_BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** tanggal dalam format "dd/MM/yyyy" -> objek Date. */
function parseTanggalDMY(tanggalStr) {
  const [dd, mm, yyyy] = tanggalStr.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function badgeClassUntukStatus(status) {
  const peta = { 'Hadir': 'hadir', 'Terlambat': 'terlambat', 'Izin': 'izin', 'Sakit': 'sakit', 'Tidak Hadir': 'tidak-hadir', 'Tidak Ada Jadwal': 'tidak-ada-jadwal' };
  return peta[status] || 'tidak-hadir';
}

document.addEventListener('DOMContentLoaded', async () => {
  const sesi = ambilSesiRelawan();
  if (!sesi || !sesi.token) {
    window.location.href = 'login.html';
    return;
  }

  const main = document.getElementById('riwayatMain');
  const list = document.getElementById('riwayatList');

  try {
    showLoading('Memuat riwayat absensi...');
    const riwayat = await apiGet('getRiwayatAbsensiRelawan', { token: sesi.token });
    hideLoading();

    list.innerHTML = riwayat.map(r => {
      const d = parseTanggalDMY(r.tanggal);
      const namaHari = NAMA_HARI[d.getDay()];
      const tglSingkat = `${d.getDate()} ${NAMA_BULAN_SINGKAT[d.getMonth()]}`;
      const jamText = (r.jamMasuk || r.jamPulang)
        ? `Masuk ${r.jamMasuk ? r.jamMasuk.slice(0, 5) : '—'} · Pulang ${r.jamPulang ? r.jamPulang.slice(0, 5) : '—'}`
        : 'Tidak ada catatan absensi';

      return `
      <div class="riwayat-item">
        <div class="riwayat-item-date">
          <span class="riwayat-day-name">${namaHari}</span>
          <span class="riwayat-day-num">${tglSingkat}</span>
        </div>
        <div class="riwayat-item-detail">
          <div class="riwayat-item-top">
            <span class="riwayat-badge ${badgeClassUntukStatus(r.status)}">${r.status}</span>
          </div>
          <div class="riwayat-item-jam">${jamText}</div>
          ${r.keterangan ? `<div class="riwayat-item-ket">${escapeHtml(r.keterangan)}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    main.style.display = 'block';
  } catch (err) {
    hideLoading();
    // Sesi kedaluwarsa / akun dinonaktifkan → kembali ke login dengan pesan yang jelas.
    hapusSesiRelawan();
    simpanNotisLogin(err.message || 'Sesi telah berakhir. Silakan login kembali.');
    window.location.href = 'login.html';
  }
});
