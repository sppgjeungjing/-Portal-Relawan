/**
 * SPPG JEUNGJING — SISTEM ABSENSI RELAWAN
 * Relawan.gs — Data relawan & divisi
 */

/**
 * TAMBALAN DARURAT (dipulihkan lagi -- lihat catatan pengiriman):
 * dipanggil di 9 tempat (login, absensi, profil, shift, stok).
 */
function getRelawanById(id) {
  const relawan = sheetToObjects(getSheet(NAMA_SHEET.RELAWAN)).find(r => String(r.ID_RELAWAN) === String(id));
  if (!relawan) return null;
  return {
    id: relawan.ID_RELAWAN,
    nama: relawan.NAMA_RELAWAN,
    divisi: relawan.DIVISI,
    status: relawan.STATUS
  };
}

function getDivisiList() {
  const sheet = getSheet(NAMA_SHEET.DIVISI);
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const nama = sanitize(data[i][0]);
    if (nama) list.push(nama);
  }
  return list;
}

/**
 * @param {string} [divisi] filter berdasarkan divisi (opsional)
 * @param {boolean} [semua] jika true, kembalikan relawan AKTIF & NONAKTIF (dipakai dashboard admin).
 *                          Jika false/kosong, hanya relawan AKTIF (dipakai form absensi publik).
 */
function getRelawanList(divisi, semua) {
  const sheet = getSheet(NAMA_SHEET.RELAWAN);
  const rows = sheetToObjects(sheet);
  return rows
    .filter(r => semua ? true : String(r.STATUS).toUpperCase() === 'AKTIF')
    .filter(r => !divisi || r.DIVISI === divisi)
    .map(r => ({ id: r.ID_RELAWAN, nama: r.NAMA_RELAWAN, divisi: r.DIVISI, status: r.STATUS }));
}

/** Membuat ID baru berformat R001, R002, dst. berdasarkan ID tertinggi yang sudah ada. */
function generateIdRelawan(sheet) {
  const data = sheet.getDataRange().getValues();
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '');
    const cocok = id.match(/^R(\d+)$/i);
    if (cocok) max = Math.max(max, parseInt(cocok[1], 10));
  }
  return 'R' + String(max + 1).padStart(3, '0');
}

function addRelawan(body) {
  const nama = sanitize(body.nama);
  const divisi = sanitize(body.divisi);
  if (!nama) throw new Error('Nama relawan wajib diisi.');
  if (!divisi) throw new Error('Divisi wajib dipilih.');
  if (!getDivisiList().includes(divisi)) throw new Error('Divisi tidak dikenali.');

  const sheet = getSheet(NAMA_SHEET.RELAWAN);
  const id = generateIdRelawan(sheet);
  sheet.appendRow([id, nama, divisi, 'AKTIF']);
  return { id: id, nama: nama, divisi: divisi, status: 'AKTIF' };
}

function updateRelawan(body) {
  const id = sanitize(body.id);
  if (!id) throw new Error('ID relawan wajib diisi.');

  const sheet = getSheet(NAMA_SHEET.RELAWAN);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      const baris = i + 1;
      if (body.nama !== undefined && body.nama !== '') {
        sheet.getRange(baris, 2).setValue(sanitize(body.nama));
      }
      if (body.divisi !== undefined && body.divisi !== '') {
        sheet.getRange(baris, 3).setValue(sanitize(body.divisi));
      }
      if (body.status !== undefined && body.status !== '') {
        sheet.getRange(baris, 4).setValue(sanitize(body.status).toUpperCase());
      }
      return { id: id, success: true };
    }
  }
  throw new Error('Relawan tidak ditemukan.');
}

function addDivisi(body) {
  const nama = sanitize(body.nama);
  if (!nama) throw new Error('Nama divisi wajib diisi.');

  const existing = getDivisiList();
  if (existing.some(d => d.toLowerCase() === nama.toLowerCase())) {
    throw new Error('Divisi tersebut sudah ada.');
  }
  const sheet = getSheet(NAMA_SHEET.DIVISI);
  sheet.appendRow([nama]);
  return { nama: nama };
}
