// SPPG JEUNGJING — MONITORING (ASN & Kepala SPPG)
// Backend (Role.gs -> requireRole_) yang menentukan boleh/tidaknya akses,
// bukan halaman ini -- kalau role bukan ASN/KEPALA_SPPG, panggilan API
// pertama akan gagal dan halaman menampilkan pesan "Akses Ditolak".

document.addEventListener('DOMContentLoaded', async () => {
  const sesi = ambilSesiRelawan();
  if (!sesi || !sesi.token) {
    window.location.href = 'login.html';
    return;
  }
  const token = sesi.token;

  const el = {
    ditolak: document.getElementById('monitoringAksesDitolak'),
    konten: document.getElementById('monitoringKontenUtama'),
    monTotalRelawan: document.getElementById('monTotalRelawan'),
    monSudahAbsen: document.getElementById('monSudahAbsen'),
    monBelumAbsen: document.getElementById('monBelumAbsen'),
    monitoringStokWrap: document.getElementById('monitoringStokWrap'),
    monitoringStokKosong: document.getElementById('monitoringStokKosong'),
    monStokTotal: document.getElementById('monStokTotal'),
    monStokAman: document.getElementById('monStokAman'),
    monStokMenipis: document.getElementById('monStokMenipis'),
    monStokHabis: document.getElementById('monStokHabis'),
    monitoringSipanduWrap: document.getElementById('monitoringSipanduWrap'),
    monitoringSipanduKosong: document.getElementById('monitoringSipanduKosong'),
    monSipanduTotal: document.getElementById('monSipanduTotal'),
    monSipanduDraft: document.getElementById('monSipanduDraft'),
    monSipanduReady: document.getElementById('monSipanduReady'),
    monSipanduSelesai: document.getElementById('monSipanduSelesai')
  };

  try {
    showLoading('Memuat ringkasan...');
    const d = await apiGet('getRingkasanMonitoring', { token });
    hideLoading();

    el.monTotalRelawan.textContent = d.totalRelawanAktif;
    el.monSudahAbsen.textContent = d.sudahAbsenHariIni;
    el.monBelumAbsen.textContent = d.belumAbsenHariIni;

    if (d.stok) {
      el.monStokTotal.textContent = d.stok.totalJenisBarang;
      el.monStokAman.textContent = d.stok.aman;
      el.monStokMenipis.textContent = d.stok.menipis;
      el.monStokHabis.textContent = d.stok.habis;
    } else {
      el.monitoringStokWrap.style.display = 'none';
      el.monitoringStokKosong.style.display = 'block';
    }

    if (d.sipandu) {
      el.monSipanduTotal.textContent = d.sipandu.totalWorkOrder;
      el.monSipanduDraft.textContent = d.sipandu.perStatus.DRAFT;
      el.monSipanduReady.textContent = d.sipandu.perStatus.READY;
      el.monSipanduSelesai.textContent = d.sipandu.perStatus.COMPLETED;
    } else {
      el.monitoringSipanduWrap.style.display = 'none';
      el.monitoringSipanduKosong.style.display = 'block';
    }

    el.konten.style.display = 'block';
  } catch (err) {
    hideLoading();
    el.ditolak.style.display = 'block';
  }
});
