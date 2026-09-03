// ============================================================
// SPPG JEUNGJING — KONFIGURASI PORTAL
// ============================================================
// File ini SATU-SATUNYA tempat menyimpan URL Apps Script.
// Jangan tulis URL di file lain mana pun — kalau nanti ganti
// deployment, cukup ubah di sini saja.
// ============================================================

// ============================================================
// PORTAL RELAWAN
// Aplikasi utama / portal besar — Absensi (SIPRES), Stok (SIRAGA),
// Shift, Role, dan seluruh modul yang hidup di proyek Apps Script
// utama (Absensi.gs, Admin.gs, Akun.gs, Stok.gs, Shift.gs, Role.gs, dst).
// ============================================================

const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycby5uuwdo0G-W22txE7eOSuHuFGc_XYnrhm7SyGvLsbXApJiJNE4eM5nuFYJ29uXM8yMIw/exec';

// ============================================================
// SIPANDU
// Menu SIPANDU di dalam Portal Relawan yang sama (satu login,
// sesi relawan yang sama) -- TAPI backend & database-nya sengaja
// terpisah (proyek Apps Script sendiri + Spreadsheet sendiri),
// sesuai keputusan arsitektur "PROMPT MASTER FINAL".
// ============================================================

const SIPANDU_API_URL =
  'https://script.google.com/macros/s/AKfycbyMOXMtHP2MPGBiOwLQ3M_7l-CzNCN7FD_oMB7yFPXudoOUwDCvG9WOo9dwEPqW-bQizg/exec';

// ============================================================
// SYSTEM
// ============================================================

// Set true sementara di perangkat sendiri untuk melihat log tiap
// request API (aksi, durasi, status) di Console browser -- TIDAK PERNAH
// mencatat password/token. Selalu false saat dipakai/dibagikan ke relawan.
const DEBUG_MODE = false;
