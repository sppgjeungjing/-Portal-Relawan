/**
 * SPPG JEUNGJING — SISTEM ABSENSI RELAWAN
 * Kalender.gs — Kalender Operasional (fondasi data, Fase 3)
 *
 * Modul berdiri sendiri, sheet baru (15_KALENDER_OPERASIONAL) — tidak
 * menyentuh sheet/fungsi lain. ID_OPERASIONAL yang dibuat di sini BELUM
 * dipakai oleh Absensi.gs/submitAbsensi() pada tahap ini — itu pekerjaan
 * fase integrasi berikutnya (§6 dokumen pengembangan), sesudah Anda
 * konfirmasi. Menambahkan modul ini sendirian tidak mengubah perilaku
 * absensi yang sudah berjalan sama sekali.
 *
 * Kolom 15_KALENDER_OPERASIONAL:
 *   ID_OPERASIONAL | ID_PERIODE | TANGGAL_OPERASIONAL | HARI | STATUS | KETERANGAN
 *   STATUS: AKTIF | DIBATALKAN
 *
 * hitungNamaHari_() dipakai ulang dari Jadwal.gs (fungsi global dalam
 * satu proyek Apps Script yang sama) — tidak didefinisikan ulang di sini.
 */

const STATUS_OPERASIONAL_VALID = ['AKTIF', 'DIBATALKAN'];

function getKalenderSheet() {
  return getSheet(NAMA_SHEET.KALENDER);
}

/** Semua baris Kalender dengan TANGGAL_OPERASIONAL sudah diseragamkan jadi teks "dd/MM/yyyy". */
function getKalenderRows_() {
  const rows = sheetToObjects(getKalenderSheet());
  rows.forEach(r => { if (r.TANGGAL_OPERASIONAL) r.TANGGAL_OPERASIONAL = bacaTanggalDMY_(r.TANGGAL_OPERASIONAL); });
  return rows;
}

function generateIdOperasional_(sheet) {
  const data = sheet.getDataRange().getValues();
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '');
    const cocok = id.match(/^OP(\d+)$/i);
    if (cocok) max = Math.max(max, parseInt(cocok[1], 10));
  }
  return 'OP' + String(max + 1).padStart(3, '0');
}

/**
 * Untuk Admin — semua tanggal operasional, dengan nama periode sudah
 * dicocokkan. @param {string} [idPeriode] filter opsional per periode.
 */
function getKalenderListAdmin(idPeriode) {
  const semua = getKalenderRows_();
  const periodeList = sheetToObjects(getPeriodeSheet());
  const namaPeriodeById = {};
  periodeList.forEach(p => { namaPeriodeById[p.ID_PERIODE] = p.NAMA_PERIODE; });

  return semua
    .filter(k => !idPeriode || k.ID_PERIODE === idPeriode)
    .map(k => ({
      id: k.ID_OPERASIONAL,
      idPeriode: k.ID_PERIODE,
      namaPeriode: namaPeriodeById[k.ID_PERIODE] || k.ID_PERIODE,
      tanggal: k.TANGGAL_OPERASIONAL,
      hari: k.HARI,
      status: k.STATUS,
      keterangan: k.KETERANGAN
    }))
    .sort((a, b) => {
      const isoA = tanggalSheetKeIso_(a.tanggal) || '';
      const isoB = tanggalSheetKeIso_(b.tanggal) || '';
      return isoA.localeCompare(isoB);
    });
}

/** Cek apakah tanggal (format dd/MM/yyyy) sudah ada untuk periode tsb — cegah entri ganda pada tanggal yang sama. */
function operasionalSudahAda_(sheet, idPeriode, tanggalDMY) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === idPeriode && bacaTanggalDMY_(data[i][2]) === tanggalDMY) return true;
  }
  return false;
}

function addOperasional(body) {
  const idPeriode = sanitize(body.idPeriode);
  const tanggalIso = sanitize(body.tanggal);
  const keterangan = sanitize(body.keterangan);

  if (!idPeriode) throw new Error('Periode wajib dipilih.');
  if (!tanggalIso) throw new Error('Tanggal operasional wajib diisi.');

  const periode = getPeriodeById_(idPeriode);
  if (!periode) throw new Error('Periode tidak ditemukan.');

  const tanggalDMY = isoKeDmy_(tanggalIso);
  const hari = hitungNamaHari_(tanggalDMY);

  const sheet = getKalenderSheet();
  if (operasionalSudahAda_(sheet, idPeriode, tanggalDMY)) {
    throw new Error('Tanggal operasional ini sudah ada dalam periode tersebut.');
  }

  const id = generateIdOperasional_(sheet);
  sheet.appendRow([id, idPeriode, tanggalDMY, hari, 'AKTIF', keterangan]);
  const baris = sheet.getLastRow();
  paksaKolomTeks_(sheet, baris, 3);
  sheet.getRange(baris, 3).setValue(tanggalDMY);
  return { id: id, tanggal: tanggalDMY, hari: hari };
}

/**
 * Buat banyak tanggal operasional sekaligus untuk satu periode, berdasarkan
 * hari-dalam-minggu yang dipilih Admin (mis. Senin–Jumat, atau Minggu–Jumat).
 * TIDAK mengasumsikan pola kerja REGULER/SECURITY dari dokumen Anda secara
 * otomatis — Admin yang memilih sendiri hari mana yang aktif, supaya tidak
 * mengarang pola kerja divisi mana pun (§20 dokumen: pola kerja hanya
 * referensi, bukan aturan mengikat semua divisi).
 *
 * @param {string} body.idPeriode
 * @param {number[]} body.hariAktif  0=Minggu .. 6=Sabtu (konvensi Date.getDay())
 * @param {string} [body.keterangan]
 */
function addOperasionalBulk(body) {
  const idPeriode = sanitize(body.idPeriode);
  const hariAktif = Array.isArray(body.hariAktif) ? body.hariAktif.map(Number) : [];
  const keterangan = sanitize(body.keterangan);

  if (!idPeriode) throw new Error('Periode wajib dipilih.');
  if (!hariAktif.length) throw new Error('Pilih minimal satu hari dalam minggu.');

  const periode = getPeriodeById_(idPeriode);
  if (!periode) throw new Error('Periode tidak ditemukan.');

  const [ddM, mmM, yyyyM] = periode.tanggalMulai.split('/');
  const [ddS, mmS, yyyyS] = periode.tanggalSelesai.split('/');
  const mulai = new Date(Number(yyyyM), Number(mmM) - 1, Number(ddM));
  const selesai = new Date(Number(yyyyS), Number(mmS) - 1, Number(ddS));

  const sheet = getKalenderSheet();
  // Nomor urut ID dihitung SEKALI di awal (bukan per-baris via generateIdOperasional_),
  // karena appendRow belum terjadi di tengah loop — sheet belum "melihat" baris baru.
  let nomorBerikutnya = parseInt(generateIdOperasional_(sheet).replace('OP', ''), 10);
  const rowsBaru = [];
  let dilewati = 0;

  for (let d = new Date(mulai); d <= selesai; d.setDate(d.getDate() + 1)) {
    if (hariAktif.indexOf(d.getDay()) === -1) continue;
    const tanggalDMY = formatTanggal(d);
    if (operasionalSudahAda_(sheet, idPeriode, tanggalDMY) ||
        rowsBaru.some(r => r[2] === tanggalDMY)) {
      dilewati++;
      continue;
    }
    const id = 'OP' + String(nomorBerikutnya).padStart(3, '0');
    nomorBerikutnya++;
    rowsBaru.push([id, idPeriode, tanggalDMY, hitungNamaHari_(tanggalDMY), 'AKTIF', keterangan]);
  }

  if (rowsBaru.length) {
    const barisAwal = sheet.getLastRow() + 1;
    paksaKolomTeks_(sheet, barisAwal, 3, rowsBaru.length); // kolom TANGGAL_OPERASIONAL jadi teks dulu, SEBELUM ditulis
    sheet.getRange(barisAwal, 1, rowsBaru.length, 6).setValues(rowsBaru);
  }

  return { ditambahkan: rowsBaru.length, dilewati: dilewati };
}

function updateStatusOperasional(body) {
  const id = sanitize(body.id);
  const status = sanitize(body.status).toUpperCase();
  if (!id) throw new Error('ID operasional wajib diisi.');
  if (STATUS_OPERASIONAL_VALID.indexOf(status) === -1) throw new Error('Status operasional tidak valid.');

  const sheet = getKalenderSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.getRange(i + 1, 5).setValue(status);
      return { success: true, status: status };
    }
  }
  throw new Error('Tanggal operasional tidak ditemukan.');
}

/** Spec mengizinkan Kalender dihapus selama belum dipakai Absensi (belum ada dependency saat ini). */
function deleteOperasional(body) {
  const id = sanitize(body.id);
  const sheet = getKalenderSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error('Tanggal operasional tidak ditemukan.');
}

/** Hapus SEMUA tanggal operasional milik satu periode sekaligus — berguna untuk membersihkan
 * hasil "Buat Massal" yang keliru (mis. akibat bug/salah pilih hari) lalu generate ulang. */
function hapusSemuaOperasionalPeriode(body) {
  const idPeriode = sanitize(body.idPeriode);
  if (!idPeriode) throw new Error('Periode wajib dipilih.');

  const sheet = getKalenderSheet();
  const data = sheet.getDataRange().getValues();
  let dihapus = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === idPeriode) {
      sheet.deleteRow(i + 1);
      dihapus++;
    }
  }
  return { dihapus: dihapus };
}
