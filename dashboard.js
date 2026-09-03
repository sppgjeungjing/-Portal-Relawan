// ============================================================
// SPPG JEUNGJING — LOGIC DASHBOARD RELAWAN (dashboard.html)
// Menggabungkan data dari endpoint yang SUDAH ADA (tidak menambah
// endpoint baru): getProfilRelawan, getRiwayatAbsensiRelawan,
// getJadwalRelawan, getInformasiRelawan. Tidak menyentuh logic
// Absensi (submitAbsensi, dst.) sama sekali.
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const sesi = ambilSesiRelawan();
  if (!sesi || !sesi.token) {
    window.location.href = 'login.html';
    return;
  }

  const main = document.getElementById('dashboardMain');

  try {
    showLoading('Memuat dashboard...');
    const [profil, riwayat, notifikasi, informasi] = await Promise.all([
      window.sppgProfilPromise || apiGet('getProfilRelawan', { token: sesi.token }),
      apiGet('getRiwayatAbsensiRelawan', { token: sesi.token }).catch(() => ({ periode: null, items: [] })),
      apiGet('getNotifikasiRelawan', { token: sesi.token }).catch(() => []),
      apiGet('getInformasiRelawan', { token: sesi.token }).catch(() => [])
    ]);
    hideLoading();

    // ---- HERO: sapaan + status akun aktual ----
    document.getElementById('heroNama').textContent = (profil.nama || 'Relawan').split(' ')[0];
    document.getElementById('heroDivisi').textContent = profil.divisi ? ('Relawan ' + profil.divisi) : 'Relawan SPPG Jeungjing';
    const isAktif = (profil.status || 'Aktif').toLowerCase().indexOf('nonaktif') === -1;
    const pill = document.getElementById('heroStatusPill');
    pill.classList.add(isAktif ? 'aktif' : 'nonaktif');
    pill.textContent = isAktif ? 'Akun Aktif' : 'Akun Tidak Aktif';

    // ---- RINGKASAN ABSENSI (dihitung dari riwayat PERIODE AKTIF; detail lengkap tetap di modul Absensi) ----
    // Catatan: endpoint riwayat sekarang mengembalikan { periode, items },
    // bukan array polos seperti versi lama.
    const daftarRiwayat = Array.isArray(riwayat) ? riwayat : (riwayat && riwayat.items) || [];
    const hitung = { Hadir: 0, Terlambat: 0, Izin: 0, Sakit: 0 };
    daftarRiwayat.forEach(r => { if (hitung.hasOwnProperty(r.status)) hitung[r.status]++; });
    const totalAbsen = hitung.Hadir + hitung.Terlambat;
    setText('sumTotal', totalAbsen);
    setText('sumHadir', hitung.Hadir);
    setText('sumTerlambat', hitung.Terlambat);
    setText('sumIzin', hitung.Izin);
    setText('sumSakit', hitung.Sakit);

    // ---- AKTIVITAS TERBARU (dari collection Notifikasi asli, terbaru di atas, maks 5) ----
    const aktivitas = (notifikasi || []).slice(0, 5);

    const listAktivitas = document.getElementById('listAktivitas');
    if (!aktivitas.length) {
      listAktivitas.innerHTML = '<div class="shell-empty"><p>Belum ada aktivitas terbaru.</p></div>';
    } else {
      listAktivitas.innerHTML = aktivitas.map(a => `
        <div class="activity-item">
          <span class="activity-item-icon type-${a.kategori === 'Informasi' ? 'informasi' : 'jadwal'}">${a.kategori === 'Informasi' ? iconInfo() : iconJadwal()}</span>
          <span class="activity-item-body">
            <p class="activity-title">${escapeHtml(a.judul)}</p>
            <p class="activity-desc">${escapeHtml(a.isi)}</p>
            <p class="activity-time">${escapeHtml(formatTanggalWaktuIndoShell(a.tanggal))}</p>
          </span>
        </div>`).join('');
    }

    // ---- INFORMASI PENTING (2 informasi teraktif terbaru) ----
    const infoPenting = (informasi || []).slice(0, 2);
    const panelInfo = document.getElementById('listInformasiPenting');
    if (!infoPenting.length) {
      panelInfo.innerHTML = '<div class="shell-empty"><p>Belum ada informasi penting saat ini.</p></div>';
    } else {
      panelInfo.innerHTML = infoPenting.map(i => `
        <div class="info-card" style="box-shadow:none;">
          <p class="info-card-date">${escapeHtml(i.tanggal)}</p>
          <h3 class="info-card-title">${escapeHtml(i.judul)}</h3>
          <p class="info-card-body">${escapeHtml(i.isi)}</p>
        </div>`).join('');
    }

    main.style.display = 'block';
  } catch (err) {
    hideLoading();
    hapusSesiRelawan();
    simpanNotisLogin(err.message || 'Sesi telah berakhir. Silakan login kembali.');
    window.location.href = 'login.html';
  }
});

function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function iconInfo() { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/></svg>'; }
function iconJadwal() { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>'; }
