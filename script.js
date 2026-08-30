// ============================================================
// SPPG JEUNGJING — LOGIC HALAMAN ABSENSI (absensi.html) — Fase 5
// Identitas dari SESSION PORTAL (bukan pilih Divisi/Nama manual lagi).
// Wajib: Swafoto (kamera langsung, bukan galeri) + GPS + validasi zona.
// ============================================================

let sesiAbsensi = null;
let statusTerkini = null;     // hasil getStatusAbsensiRelawan terakhir
let jenisAktif = null;        // 'MASUK' | 'PULANG' — jenis yang sedang diisi di form
let fotoDataUrl = null;       // hasil capture kamera (base64 data URL)
let lokasiSaya = null;        // { latitude, longitude, akurasi }
let zonaValid = false;        // hasil perhitungan jarak vs radius (client-side, hanya utk UX)
let streamKamera = null;      // MediaStream aktif, supaya bisa di-stop
let jenisIzinDipilih = null;  // 'Izin' | 'Sakit' di panel pengajuan

const el = {};

document.addEventListener('DOMContentLoaded', async () => {
  sesiAbsensi = ambilSesiRelawan();
  if (!sesiAbsensi || !sesiAbsensi.token) {
    window.location.href = 'login.html';
    return;
  }

  Object.assign(el, {
    absensiMain: document.getElementById('absensiMain'),
    absensiAvatar: document.getElementById('absensiAvatar'),
    absensiNama: document.getElementById('absensiNama'),
    absensiDivisiId: document.getElementById('absensiDivisiId'),

    stateKosong: document.getElementById('stateKosong'),
    pesanKosong: document.getElementById('pesanKosong'),

    ringkasanMasuk: document.getElementById('ringkasanMasuk'),
    ringkasanJamMasuk: document.getElementById('ringkasanJamMasuk'),
    ringkasanZonaMasuk: document.getElementById('ringkasanZonaMasuk'),

    stateForm: document.getElementById('stateForm'),
    labelJenis: document.getElementById('labelJenis'),
    judulForm: document.getElementById('judulForm'),
    cameraBox: document.getElementById('cameraBox'),
    cameraPlaceholder: document.getElementById('cameraPlaceholder'),
    videoLive: document.getElementById('videoLive'),
    fotoPreview: document.getElementById('fotoPreview'),
    btnAmbilFoto: document.getElementById('btnAmbilFoto'),
    btnUlangFoto: document.getElementById('btnUlangFoto'),
    canvasCapture: document.getElementById('canvasCapture'),
    gpsRow: document.getElementById('gpsRow'),
    zonaBadgeWrap: document.getElementById('zonaBadgeWrap'),
    inputKeteranganAbsen: document.getElementById('inputKeteranganAbsen'),
    btnKirimAbsen: document.getElementById('btnKirimAbsen'),
    btnBukaIzin: document.getElementById('btnBukaIzin'),

    stateSelesai: document.getElementById('stateSelesai'),
    detailInfoList: document.getElementById('detailInfoList'),
    detailFotoWrap: document.getElementById('detailFotoWrap'),

    panelIzinSakit: document.getElementById('panelIzinSakit'),
    btnPilihIzin: document.getElementById('btnPilihIzin'),
    btnPilihSakit: document.getElementById('btnPilihSakit'),
    inputKeteranganIzin: document.getElementById('inputKeteranganIzin'),
    btnBatalIzin: document.getElementById('btnBatalIzin'),
    btnKirimIzin: document.getElementById('btnKirimIzin')
  });

  el.btnAmbilFoto.addEventListener('click', ambilSwafoto);
  el.btnUlangFoto.addEventListener('click', mulaiKamera);
  el.inputKeteranganAbsen.addEventListener('input', perbaruiTombolKirim);
  el.btnKirimAbsen.addEventListener('click', kirimAbsensi);
  el.btnBukaIzin.addEventListener('click', bukaPanelIzin);
  el.btnBatalIzin.addEventListener('click', tutupPanelIzin);
  el.btnPilihIzin.addEventListener('click', () => pilihJenisIzin('Izin'));
  el.btnPilihSakit.addEventListener('click', () => pilihJenisIzin('Sakit'));
  el.inputKeteranganIzin.addEventListener('input', perbaruiTombolIzin);
  el.btnKirimIzin.addEventListener('click', kirimIzinSakit);

  // Kamera & GPS dilepas kalau pengguna pindah halaman/menutup tab, supaya
  // tidak ada indikator kamera menyala terus tanpa alasan.
  window.addEventListener('pagehide', hentikanKamera);

  await muatStatusAbsensi();
});

// ------------------------------------------------------------
// MUAT STATUS (dipanggil saat buka halaman & setelah submit berhasil)
// ------------------------------------------------------------

async function muatStatusAbsensi() {
  hentikanKamera();
  showLoading('Memuat status absensi...');
  try {
    statusTerkini = await apiGet('getStatusAbsensiRelawan', { token: sesiAbsensi.token });
    hideLoading();
    renderStatus();
    el.absensiMain.style.display = 'block';
  } catch (err) {
    hideLoading();
    hapusSesiRelawan();
    simpanNotisLogin(err.message || 'Sesi telah berakhir. Silakan login kembali.');
    window.location.href = 'login.html';
  }
}

function renderStatus() {
  const s = statusTerkini;

  el.absensiAvatar.textContent = initialsFromName(s.identitas.nama);
  el.absensiNama.textContent = s.identitas.nama;
  el.absensiDivisiId.textContent = s.identitas.id + ' • ' + s.identitas.divisi;

  // Sembunyikan semua state dulu, baru tampilkan satu yang sesuai.
  el.stateKosong.style.display = 'none';
  el.ringkasanMasuk.style.display = 'none';
  el.stateForm.style.display = 'none';
  el.stateSelesai.style.display = 'none';
  el.panelIzinSakit.style.display = 'none';

  if (!s.operasional.ada) {
    el.stateKosong.style.display = 'block';
    return;
  }

  const masukIzinSakit = s.masuk.sudah && s.masuk.isIzinSakit;

  if (masukIzinSakit) {
    tampilkanSelesaiIzinSakit();
    return;
  }

  if (s.masuk.sudah && s.pulang.sudah) {
    tampilkanSelesaiLengkap();
    return;
  }

  if (s.masuk.sudah && !s.pulang.sudah) {
    el.ringkasanMasuk.style.display = 'block';
    el.ringkasanJamMasuk.textContent = s.masuk.jam || '–';
    el.ringkasanZonaMasuk.textContent = s.masuk.statusLokasi === 'DALAM_ZONA' ? 'Dalam zona disetujui' : 'Di luar zona';
    mulaiFormJenis('PULANG');
    return;
  }

  // Belum masuk sama sekali, operasional tersedia.
  el.btnBukaIzin.style.display = 'block';
  mulaiFormJenis('MASUK');
}

// ------------------------------------------------------------
// STATE: FORM (Masuk/Pulang)
// ------------------------------------------------------------

function mulaiFormJenis(jenis) {
  jenisAktif = jenis;
  fotoDataUrl = null;
  lokasiSaya = null;
  zonaValid = false;

  el.labelJenis.textContent = jenis === 'MASUK' ? 'PRESENSI MASUK' : 'PRESENSI PULANG';
  el.judulForm.textContent = jenis === 'MASUK' ? 'Presensi Masuk' : 'Presensi Pulang';
  el.inputKeteranganAbsen.value = '';
  el.btnUlangFoto.style.display = 'none';
  el.fotoPreview.style.display = 'none';
  el.videoLive.style.display = 'none';
  el.cameraPlaceholder.style.display = 'block';
  el.cameraPlaceholder.textContent = '📷 Menyiapkan kamera…';

  el.stateForm.style.display = 'block';
  perbaruiTombolKirim();

  mulaiKamera();
  mulaiGps();
}

// ----- KAMERA -----

async function mulaiKamera() {
  hentikanKamera();
  fotoDataUrl = null;
  el.fotoPreview.style.display = 'none';
  el.btnUlangFoto.style.display = 'none';
  el.btnAmbilFoto.style.display = 'block';
  el.btnAmbilFoto.disabled = true;
  el.cameraPlaceholder.style.display = 'block';
  el.cameraPlaceholder.textContent = '📷 Menyiapkan kamera…';
  perbaruiTombolKirim();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    el.cameraPlaceholder.textContent = 'Perangkat/browser ini tidak mendukung kamera. Gunakan browser lain (Chrome/Safari terbaru).';
    return;
  }

  try {
    streamKamera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }, // prioritaskan kamera depan
      audio: false
    });
    el.videoLive.srcObject = streamKamera;
    el.videoLive.style.display = 'block';
    el.cameraPlaceholder.style.display = 'none';
    el.btnAmbilFoto.disabled = false;
  } catch (err) {
    el.cameraPlaceholder.textContent = 'Tidak dapat mengakses kamera. Periksa izin kamera pada browser Anda, lalu muat ulang halaman.';
  }
}

function ambilSwafoto() {
  if (!streamKamera) return;
  const video = el.videoLive;
  const canvas = el.canvasCapture;
  const lebar = video.videoWidth || 720;
  const tinggi = video.videoHeight || 960;
  canvas.width = lebar;
  canvas.height = tinggi;
  canvas.getContext('2d').drawImage(video, 0, 0, lebar, tinggi);
  fotoDataUrl = canvas.toDataURL('image/jpeg', 0.72);

  el.fotoPreview.src = fotoDataUrl;
  el.fotoPreview.style.display = 'block';
  el.videoLive.style.display = 'none';
  el.btnAmbilFoto.style.display = 'none';
  el.btnUlangFoto.style.display = 'block';

  hentikanKamera(); // lepas kamera setelah foto diambil, tidak perlu tetap menyala
  perbaruiTombolKirim();
}

function hentikanKamera() {
  if (streamKamera) {
    streamKamera.getTracks().forEach(t => t.stop());
    streamKamera = null;
  }
}

// ----- GPS -----

function mulaiGps() {
  el.gpsRow.className = 'absensi-gps-row';
  el.gpsRow.textContent = '📍 Mengambil lokasi Anda…';
  el.zonaBadgeWrap.innerHTML = '';
  lokasiSaya = null;
  zonaValid = false;
  perbaruiTombolKirim();

  if (!navigator.geolocation) {
    tampilkanGpsGagal('Perangkat/browser ini tidak mendukung GPS.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lokasiSaya = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        akurasi: pos.coords.accuracy
      };
      evaluasiZona();
    },
    (err) => {
      let pesan = 'Lokasi tidak dapat diperoleh.';
      if (err.code === err.PERMISSION_DENIED) pesan = 'Izin lokasi ditolak. Aktifkan izin lokasi untuk melakukan absensi.';
      tampilkanGpsGagal(pesan);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function tampilkanGpsGagal(pesan) {
  el.gpsRow.className = 'absensi-gps-row bad';
  el.gpsRow.innerHTML = '⚠️ ' + escapeHtml(pesan) + '<br><button type="button" class="absensi-gps-retry" id="btnUlangGps">Coba Lagi</button>';
  document.getElementById('btnUlangGps').addEventListener('click', mulaiGps);
  perbaruiTombolKirim();
}

function evaluasiZona() {
  const lokasiSppg = statusTerkini && statusTerkini.lokasiSppg;
  if (!lokasiSppg) {
    el.gpsRow.className = 'absensi-gps-row bad';
    el.gpsRow.textContent = '⚠️ Lokasi SPPG belum diatur oleh Admin. Absensi belum dapat dilakukan.';
    zonaValid = false;
    perbaruiTombolKirim();
    return;
  }

  const jarak = hitungJarakMeterClient_(lokasiSaya.latitude, lokasiSaya.longitude, lokasiSppg.latitude, lokasiSppg.longitude);
  zonaValid = jarak <= lokasiSppg.radiusMeter;

  el.gpsRow.className = 'absensi-gps-row ok';
  el.gpsRow.textContent = `📍 Lokasi terdeteksi (±${Math.round(lokasiSaya.akurasi)} m akurasi GPS).`;

  const badge = document.createElement('span');
  badge.className = 'absensi-zone-badge ' + (zonaValid ? 'ok' : 'bad');
  badge.textContent = zonaValid
    ? `✓ Dalam Zona Disetujui — ${Math.round(jarak)} meter dari ${lokasiSppg.nama}`
    : `⚠️ Di Luar Zona Absensi — ${Math.round(jarak)} meter dari ${lokasiSppg.nama} (maks ${lokasiSppg.radiusMeter} m)`;
  el.zonaBadgeWrap.innerHTML = '';
  el.zonaBadgeWrap.appendChild(badge);

  perbaruiTombolKirim();
}

function hitungJarakMeterClient_(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ----- TOMBOL KIRIM -----

function perbaruiTombolKirim() {
  el.btnKirimAbsen.disabled = !(fotoDataUrl && lokasiSaya && zonaValid);
}

async function kirimAbsensi() {
  if (!fotoDataUrl || !lokasiSaya || !zonaValid) return;
  el.btnKirimAbsen.disabled = true;
  showLoading(jenisAktif === 'MASUK' ? 'Mengirim absensi masuk...' : 'Mengirim absensi pulang...');
  try {
    await apiPost('submitAbsensi', {
      token: sesiAbsensi.token,
      jenis: jenisAktif,
      latitude: lokasiSaya.latitude,
      longitude: lokasiSaya.longitude,
      akurasi: lokasiSaya.akurasi,
      fotoBase64: fotoDataUrl,
      keterangan: el.inputKeteranganAbsen.value.trim()
    }, 45000); // timeout lebih panjang: upload foto ke Drive perlu waktu lebih dari 20 detik standar

    hideLoading();
    showSuccess('Absensi berhasil dicatat.');
    await muatStatusAbsensi();
  } catch (err) {
    hideLoading();
    showError(err.message || 'Absensi gagal dikirim.');
    perbaruiTombolKirim();
  }
}

// ------------------------------------------------------------
// STATE: SELESAI / DETAIL
// ------------------------------------------------------------

function baris_(label, nilai) {
  return `<div class="profile-identity-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(nilai)}</span></div>`;
}

function labelZona_(statusLokasi) {
  if (statusLokasi === 'DALAM_ZONA') return 'Dalam zona disetujui';
  if (statusLokasi === 'LUAR_ZONA') return 'Di luar zona';
  return '–';
}

function tampilkanSelesaiIzinSakit() {
  const s = statusTerkini;
  el.detailInfoList.innerHTML =
    baris_('Tanggal', s.operasional.tanggal) +
    baris_('Status', s.masuk.keterangan) +
    baris_('Keterangan', s.masuk.keterangan);
  el.detailFotoWrap.innerHTML = '';
  el.stateSelesai.style.display = 'block';
}

function tampilkanSelesaiLengkap() {
  const s = statusTerkini;
  let baris =
    baris_('Tanggal', s.operasional.tanggal) +
    baris_('Jam Masuk', s.masuk.jam || '–') +
    baris_('Jam Pulang', s.pulang.jam || '–') +
    baris_('Durasi Kerja', s.durasi || '–') +
    baris_('Status Lokasi Masuk', labelZona_(s.masuk.statusLokasi)) +
    baris_('Status Lokasi Pulang', labelZona_(s.pulang.statusLokasi));
  if (s.masuk.keterangan) baris += baris_('Keterangan', s.masuk.keterangan);
  el.detailInfoList.innerHTML = baris;

  let foto = '';
  if (s.masuk.fotoUrl) foto += `<div class="absensi-detail-photo"><img src="${escapeHtml(s.masuk.fotoUrl)}" alt="Swafoto Masuk" loading="lazy"><span>Swafoto Masuk</span></div>`;
  if (s.pulang.fotoUrl) foto += `<div class="absensi-detail-photo"><img src="${escapeHtml(s.pulang.fotoUrl)}" alt="Swafoto Pulang" loading="lazy"><span>Swafoto Pulang</span></div>`;
  el.detailFotoWrap.innerHTML = foto;

  el.stateSelesai.style.display = 'block';
}

// ------------------------------------------------------------
// PANEL AJUKAN IZIN / SAKIT (tanpa selfie & GPS — lihat catatan Fase 5)
// ------------------------------------------------------------

function bukaPanelIzin() {
  hentikanKamera();
  el.stateForm.style.display = 'none';
  jenisIzinDipilih = null;
  el.inputKeteranganIzin.value = '';
  el.btnPilihIzin.classList.remove('selected');
  el.btnPilihSakit.classList.remove('selected');
  perbaruiTombolIzin();
  el.panelIzinSakit.style.display = 'block';
}

function tutupPanelIzin() {
  el.panelIzinSakit.style.display = 'none';
  renderStatus();
}

function pilihJenisIzin(jenis) {
  jenisIzinDipilih = jenis;
  el.btnPilihIzin.classList.toggle('selected', jenis === 'Izin');
  el.btnPilihSakit.classList.toggle('selected', jenis === 'Sakit');
  perbaruiTombolIzin();
}

function perbaruiTombolIzin() {
  el.btnKirimIzin.disabled = !(jenisIzinDipilih && el.inputKeteranganIzin.value.trim());
}

async function kirimIzinSakit() {
  if (!jenisIzinDipilih || !el.inputKeteranganIzin.value.trim()) return;
  el.btnKirimIzin.disabled = true;
  showLoading('Mengirim pengajuan...');
  try {
    await apiPost('ajukanIzinSakit', {
      token: sesiAbsensi.token,
      jenisPengajuan: jenisIzinDipilih,
      keterangan: el.inputKeteranganIzin.value.trim()
    });
    hideLoading();
    showSuccess('Pengajuan ' + jenisIzinDipilih + ' berhasil dikirim.');
    await muatStatusAbsensi();
  } catch (err) {
    hideLoading();
    showError(err.message || 'Pengajuan gagal dikirim.');
    perbaruiTombolIzin();
  }
}
