// ============================================================
// SPPG JEUNGJING — FUNGSI BERSAMA
// Dipakai oleh absensi.html (script.js), admin.html (admin.js),
// login.html (login.js), dan profil.html (profil.js) agar logic
// pemanggilan API tidak ditulis berulang-ulang (modular).
// ============================================================

// ------------------------------------------------------------
// JARING PENGAMAN GLOBAL: kalau ada error JavaScript yang tidak
// tertangkap di mana pun (bug yang belum ketahuan), jangan biarkan
// pengguna terjebak di layar loading selamanya — paksa sembunyikan
// overlay loading, lalu catat ke console untuk developer. Pesan
// teknis TIDAK pernah ditampilkan langsung ke pengguna dari sini.
// ------------------------------------------------------------
window.addEventListener('error', (event) => {
  console.error('[SPPG][window.onerror]', event.message, event.filename + ':' + event.lineno);
  hideLoading();
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[SPPG][unhandledrejection]', event.reason);
  hideLoading();
});

/**
 * Menampilkan overlay loading di atas halaman.
 * @param {string} [text] Teks yang ditampilkan, mis. "Menyimpan absensi..."
 */
function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  const label = document.getElementById('loadingText');
  if (label) label.textContent = text || 'Memuat data...';
  if (overlay) overlay.classList.remove('is-hidden');
}

/** Menyembunyikan overlay loading. */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('is-hidden');
}

/**
 * Menampilkan toast singkat selama beberapa detik (internal, dipakai
 * showError & showSuccess).
 */
function showToast_(message, isSuccess) {
  const toast = document.getElementById('errorToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('toast-success', !!isSuccess);
  toast.classList.remove('is-hidden');
  clearTimeout(showToast_._timer);
  showToast_._timer = setTimeout(() => toast.classList.add('is-hidden'), 5000);
}

/**
 * Menampilkan pesan error singkat (toast) selama beberapa detik.
 * Pesan teknis TIDAK ditampilkan ke pengguna — hanya pesan yang
 * sudah ramah pengguna (lihat error handling di Code.gs & script.js).
 * @param {string} message
 */
function showError(message) {
  showToast_(message, false);
}

/** Menampilkan pesan berhasil singkat (toast hijau), mis. setelah profil disimpan. */
function showSuccess(message) {
  showToast_(message, true);
}

/** Escape teks agar aman disisipkan sebagai innerHTML (mencegah XSS sederhana). */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str === undefined || str === null ? '' : String(str);
  return div.innerHTML;
}

/** Waktu maksimal menunggu respons server sebelum dianggap gagal (ms). */
const API_TIMEOUT_MS = 20000;

/** Bikin fetch dengan batas waktu, supaya loading tidak berputar tanpa akhir.
 * @param {number} [timeoutMs] override timeout default, dipakai submitAbsensi (upload foto lebih lambat). */
function fetchDenganTimeout_(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || API_TIMEOUT_MS);
  return fetch(url, Object.assign({}, options, { signal: controller.signal })).finally(() => clearTimeout(timer));
}

function logDebug_(label, action, extra) {
  if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
    console.log('[SPPG][' + label + ']', action, extra || '');
  }
}

/**
 * Memanggil aksi GET pada Google Apps Script Web App.
 * GET bersifat hanya-baca sehingga aman di-retry otomatis (maks 2x) kalau
 * gagal karena jaringan/timeout — bukan karena error dari server itu sendiri.
 * @param {string} action nama aksi, mis. "getDivisi"
 * @param {object} [params] parameter tambahan (query string)
 */
async function apiGet(action, params, _attempt) {
  const attempt = _attempt || 1;
  if (!action) throw new Error('API action belum ditentukan (kesalahan pada kode halaman).');
  if (!GOOGLE_APPS_SCRIPT_WEB_APP_URL || GOOGLE_APPS_SCRIPT_WEB_APP_URL === 'GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    throw new Error('Website belum terhubung ke server. Admin perlu mengisi config.js terlebih dahulu.');
  }
  const url = new URL(GOOGLE_APPS_SCRIPT_WEB_APP_URL);
  url.searchParams.set('action', action);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const mulai = Date.now();
  let res;
  try {
    res = await fetchDenganTimeout_(url.toString(), { method: 'GET' });
  } catch (err) {
    const jaringanBermasalah = err.name === 'AbortError' || err instanceof TypeError;
    if (jaringanBermasalah && attempt < 3) {
      logDebug_('RETRY', action, 'percobaan ke-' + (attempt + 1));
      await new Promise(r => setTimeout(r, 600 * attempt)); // backoff singkat
      return apiGet(action, params, attempt + 1);
    }
    logDebug_('ERROR', action, err.name);
    if (err.name === 'AbortError') throw new Error('Server tidak merespons. Silakan muat ulang halaman.');
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet dan coba kembali.');
  }
  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error('Server memberikan respons yang tidak terduga. Coba beberapa saat lagi.');
  }
  logDebug_('OK', action, (Date.now() - mulai) + 'ms');
  if (!json.success) throw new Error(json.message || 'Terjadi kesalahan pada server.');
  return json.data;
}

/**
 * Memanggil aksi POST (menulis data) pada Google Apps Script Web App.
 * TIDAK di-retry otomatis (berbeda dari apiGet) — operasi tulis berisiko
 * membuat data ganda kalau permintaan sebelumnya sebenarnya sudah berhasil
 * di server tetapi responsnya yang terlambat/hilang.
 * @param {string} action nama aksi, mis. "submitAbsensi"
 * @param {object} [payload] data yang dikirim
 * @param {number} [timeoutMs] override timeout default (mis. upload foto perlu lebih lama)
 */
async function apiPost(action, payload, timeoutMs) {
  if (!action) throw new Error('API action belum ditentukan (kesalahan pada kode halaman).');
  if (!GOOGLE_APPS_SCRIPT_WEB_APP_URL || GOOGLE_APPS_SCRIPT_WEB_APP_URL === 'GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    throw new Error('Website belum terhubung ke server. Admin perlu mengisi config.js terlebih dahulu.');
  }
  const mulai = Date.now();
  let res;
  try {
    res = await fetchDenganTimeout_(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      // CATATAN PENTING: sengaja TIDAK diberi header 'Content-Type: application/json'.
      // Jika diberikan, browser akan mengirim permintaan "preflight" (OPTIONS)
      // terlebih dahulu, yang TIDAK didukung oleh Google Apps Script sehingga
      // permintaan akan gagal karena CORS. Tanpa header ini, browser mengirim
      // sebagai "simple request" (text/plain) yang lolos tanpa preflight.
      // Di sisi server (Code.gs), body ini tetap di-parse sebagai JSON biasa.
      body: JSON.stringify(Object.assign({}, payload, { action }))
    }, timeoutMs);
  } catch (err) {
    logDebug_('ERROR', action, err.name);
    if (err.name === 'AbortError') throw new Error('Server tidak merespons. Data mungkin belum tersimpan — periksa kembali sebelum mengulang.');
    throw new Error('Data belum dapat dikirim. Silakan periksa koneksi internet dan coba kembali.');
  }
  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error('Server memberikan respons yang tidak terduga. Coba beberapa saat lagi.');
  }
  logDebug_('OK', action, (Date.now() - mulai) + 'ms');
  if (!json.success) throw new Error(json.message || 'Terjadi kesalahan pada server.');
  return json.data;
}

/** Cek cepat apakah server/API dapat dijangkau, tanpa membaca seluruh database. */
async function apiHealthCheck() {
  try {
    await apiGet('health');
    return true;
  } catch (err) {
    return false;
  }
}

// ------------------------------------------------------------
// PWA — pendaftaran service worker (Fase 2)
// Aditif, tidak mengubah fungsi lain di atas. Gagal daftar (mis. browser
// lama/tidak dukung) dibiarkan diam-diam -- situs tetap berjalan normal
// sebagai halaman web biasa tanpa fitur PWA.
// ------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // PWA opsional -- jangan ganggu pengalaman utama kalau gagal daftar.
    });
  });
}
