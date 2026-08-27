// ============================================================
// SPPG JEUNGJING — KONFIGURASI SISTEM ABSENSI
// ============================================================
// Ganti nilai di bawah ini dengan Web App URL Google Apps Script
// Anda setelah proses deployment selesai.
// Lihat README.md → "Langkah 2 — Setup Google Apps Script".
//
// Contoh format URL yang benar:
// https://script.google.com/macros/s/AKfycb.................../exec
// ============================================================

const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby5uuwdo0G-W22txE7eOSuHuFGc_XYnrhm7SyGvLsbXApJiJNE4eM5nuFYJ29uXM8yMIw/exec';

// Set true sementara di perangkat Anda sendiri untuk melihat log setiap
// request API (action, durasi, status) di Console browser — TIDAK PERNAH
// mencatat password/token. Selalu false saat production/dibagikan ke publik.
const DEBUG_MODE = false;
