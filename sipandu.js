// SPPG JEUNGJING — SIPANDU (Work Order)
// Backend (Role.gs SipanduAuth -> requireSipanduPermission_) yang
// menentukan boleh/tidaknya akses, bukan halaman ini.

document.addEventListener('DOMContentLoaded', async () => {
  const sesi = ambilSesiRelawan();
  if (!sesi || !sesi.token) {
    window.location.href = 'login.html';
    return;
  }
  const token = sesi.token;

  const el = {
    ditolak: document.getElementById('sipanduAksesDitolak'),
    konten: document.getElementById('sipanduKontenUtama'),
    tabs: document.querySelectorAll('#sipanduTabs .chip-tab'),
    subs: document.querySelectorAll('.sipandu-sub'),

    dashWoHariIni: document.getElementById('dashWoHariIni'),
    dashTotalPorsi: document.getElementById('dashTotalPorsi'),
    dashWoReady: document.getElementById('dashWoReady'),
    dashOperasional: document.getElementById('dashOperasional'),
    dashPopReady: document.getElementById('dashPopReady'),
    dashPopStale: document.getElementById('dashPopStale'),
    dashPopFilled: document.getElementById('dashPopFilled'),
    dashCompleted: document.getElementById('dashCompleted'),

    woFilterStatus: document.getElementById('woFilterStatus'),
    btnFilterWo: document.getElementById('btnFilterWo'),
    btnBukaTambahWo: document.getElementById('btnBukaTambahWo'),
    woListWrap: document.getElementById('woListWrap'),

    modalTambahWo: document.getElementById('modalTambahWo'),
    formTambahWo: document.getElementById('formTambahWo'),
    woTanggal: document.getElementById('woTanggal'),
    woMenu: document.getElementById('woMenu'),
    woJumlahPorsi: document.getElementById('woJumlahPorsi'),
    woCatatan: document.getElementById('woCatatan'),
    btnBatalTambahWo: document.getElementById('btnBatalTambahWo'),

    modalDetailWo: document.getElementById('modalDetailWo'),
    detailWoNomor: document.getElementById('detailWoNomor'),
    detailWoStatus: document.getElementById('detailWoStatus'),
    detailWoTanggal: document.getElementById('detailWoTanggal'),
    detailWoMenu: document.getElementById('detailWoMenu'),
    detailWoJumlahPorsi: document.getElementById('detailWoJumlahPorsi'),
    detailWoTotalPenerima: document.getElementById('detailWoTotalPenerima'),
    detailWoCatatan: document.getElementById('detailWoCatatan'),
    detailWoAksiStatus: document.getElementById('detailWoAksiStatus'),
    btnTutupDetailWo: document.getElementById('btnTutupDetailWo'),

    formTambahBeneficiary: document.getElementById('formTambahBeneficiary'),
    bnfLokasi: document.getElementById('bnfLokasi'),
    bnfPb: document.getElementById('bnfPb'),
    bnfPk: document.getElementById('bnfPk'),
    bnfBumil: document.getElementById('bnfBumil'),
    bnfBusui: document.getElementById('bnfBusui'),
    bnfBalita: document.getElementById('bnfBalita')
  };

  let idWoTerbuka = null;
  let cacheMenu = [];

  // --------------------------------------------------------
  // Cek akses dulu lewat dashboard -- kalau ditolak, hentikan semua.
  // --------------------------------------------------------
  try {
    showLoading('Memeriksa akses SIPANDU...');
    await muatDashboard();
    hideLoading();
    el.konten.style.display = 'block';
  } catch (err) {
    hideLoading();
    el.ditolak.style.display = 'block';
    return;
  }

  // --------------------------------------------------------
  // SUB-TAB
  // --------------------------------------------------------
  el.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      el.tabs.forEach(b => b.classList.remove('active'));
      el.subs.forEach(s => { s.style.display = 'none'; });
      btn.classList.add('active');
      const target = document.getElementById('sipanduSub' + btn.dataset.sub.charAt(0).toUpperCase() + btn.dataset.sub.slice(1));
      if (target) target.style.display = 'block';

      if (btn.dataset.sub === 'dashboard') muatDashboard();
      else if (btn.dataset.sub === 'wo') muatDaftarWo();
      else if (btn.dataset.sub === 'operasional') muatOperasionalWoList();
    });
  });

  // --------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------
  async function muatDashboard() {
    const d = await sipanduApiGet('getSipanduDashboard', { token });
    el.dashWoHariIni.textContent = d.woHariIni;
    el.dashTotalPorsi.textContent = d.totalPorsiHariIni;
    el.dashWoReady.textContent = d.woReady;
    el.dashOperasional.textContent = d.operasionalBerjalan;
    el.dashPopReady.textContent = d.popReady;
    el.dashPopStale.textContent = d.popStale;
    el.dashPopFilled.textContent = d.popFilled;
    el.dashCompleted.textContent = d.completed;
  }

  // --------------------------------------------------------
  // DAFTAR WORK ORDER
  // --------------------------------------------------------
  function labelStatus_(status) {
    const label = { DRAFT: 'Draft', DATA_LENGKAP: 'Data Lengkap', READY: 'Ready', POP_FILLED: 'POP Filled', COMPLETED: 'Completed' };
    return label[status] || status;
  }
  function kelasStatus_(status) { return 'status-' + String(status).toLowerCase(); }

  async function muatDaftarWo() {
    el.woListWrap.innerHTML = '<div class="empty-state">Memuat data...</div>';
    try {
      const list = await sipanduApiGet('getWorkOrderList', { token, status: el.woFilterStatus.value });
      if (!list.length) { el.woListWrap.innerHTML = '<div class="empty-state">Belum ada Work Order. Tap "+ Buat Work Order" untuk mulai.</div>'; return; }

      el.woListWrap.innerHTML = list.map(w => `
        <div class="sipandu-wo-card" data-id="${escapeHtml(w.id)}">
          <div class="sipandu-wo-card-top">
            <strong>${escapeHtml(w.nomorWO)}</strong>
            <span class="sipandu-status-badge ${kelasStatus_(w.status)}">${labelStatus_(w.status)}</span>
          </div>
          <p>${escapeHtml(w.tanggal)} · ${escapeHtml(w.namaMenu)} · ${w.jumlahPorsi} porsi</p>
        </div>`).join('');

      el.woListWrap.querySelectorAll('.sipandu-wo-card').forEach(card => {
        card.addEventListener('click', () => bukaDetailWo(card.dataset.id));
      });
    } catch (err) {
      el.woListWrap.innerHTML = '';
      showError(err.message);
    }
  }
  el.btnFilterWo.addEventListener('click', muatDaftarWo);

  // --------------------------------------------------------
  // TAMBAH WORK ORDER
  // --------------------------------------------------------
  async function pastikanMenuTermuat_() {
    if (!cacheMenu.length) {
      try {
        cacheMenu = await sipanduApiGet('getMenuList', { token });
        el.woMenu.innerHTML = '<option value="">Pilih Menu</option>' +
          cacheMenu.map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.nama)}</option>`).join('');
      } catch (err) { showError(err.message); }
    }
  }

  el.btnBukaTambahWo.addEventListener('click', async () => {
    await pastikanMenuTermuat_();
    el.formTambahWo.reset();
    el.modalTambahWo.classList.remove('is-hidden');
  });
  el.btnBatalTambahWo.addEventListener('click', () => el.modalTambahWo.classList.add('is-hidden'));
  el.modalTambahWo.addEventListener('click', (e) => { if (e.target === el.modalTambahWo) el.modalTambahWo.classList.add('is-hidden'); });

  el.formTambahWo.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoading('Menyimpan Work Order...');
      const hasil = await sipanduApiPost('addWorkOrder', {
        token, tanggal: el.woTanggal.value, idMenu: el.woMenu.value,
        jumlahPorsi: Number(el.woJumlahPorsi.value || 0), catatan: el.woCatatan.value.trim()
      });
      hideLoading();
      showSuccess('Work Order ' + hasil.nomorWO + ' berhasil dibuat.');
      el.modalTambahWo.classList.add('is-hidden');
      await muatDaftarWo();
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  });

  // --------------------------------------------------------
  // DETAIL WORK ORDER + TRANSISI STATUS + PENERIMA MANFAAT
  // --------------------------------------------------------
  const URUTAN_STATUS = { DRAFT: 'DATA_LENGKAP', DATA_LENGKAP: 'READY', READY: 'POP_FILLED', POP_FILLED: 'COMPLETED' };
  const LABEL_TOMBOL_STATUS = {
    DRAFT: 'Tandai Data Lengkap',
    DATA_LENGKAP: 'Tandai Ready (butuh Validasi)',
    READY: 'Tandai POP Filled (butuh Snapshot POP)',
    POP_FILLED: 'Tandai Completed'
  };

  async function bukaDetailWo(idWo) {
    idWoTerbuka = idWo;
    el.modalDetailWo.classList.remove('is-hidden');
    try {
      const d = await sipanduApiGet('getWorkOrderDetail', { token, id: idWo });
      el.detailWoNomor.textContent = d.nomorWO;
      el.detailWoStatus.textContent = labelStatus_(d.status);
      el.detailWoStatus.className = 'sipandu-status-badge ' + kelasStatus_(d.status);
      el.detailWoTanggal.textContent = d.tanggal;
      el.detailWoMenu.textContent = d.namaMenu;
      el.detailWoJumlahPorsi.textContent = d.jumlahPorsi;
      el.detailWoTotalPenerima.textContent = d.totalPenerimaManfaat + ' (' + d.jumlahLokasiPenerima + ' lokasi)';
      el.detailWoCatatan.textContent = d.catatan || '-';

      const targetStatus = URUTAN_STATUS[d.status];
      if (d.status === 'DATA_LENGKAP') {
        await tampilkanChecklistValidasi(idWo);
      } else if (d.status === 'READY') {
        await tampilkanGeneratePOP(idWo);
      } else if (targetStatus) {
        el.detailWoAksiStatus.innerHTML = `<button type="button" class="btn-submit" id="btnAdvanceStatus" style="width:100%;">${LABEL_TOMBOL_STATUS[d.status]}</button>`;
        document.getElementById('btnAdvanceStatus').addEventListener('click', () => advanceStatus(idWo, targetStatus));
      } else {
        el.detailWoAksiStatus.innerHTML = '<p style="font-size:12.5px;color:var(--color-text-muted);">Work Order sudah selesai (Completed).</p>';
      }
    } catch (err) {
      showError(err.message);
    }
  }

  async function tampilkanGeneratePOP(idWo) {
    try {
      const snap = await sipanduApiGet('getLatestSnapshot', { token, idWo });

      if (!snap) {
        el.detailWoAksiStatus.innerHTML = `<button type="button" class="btn-submit" id="btnGeneratePop" style="width:100%;">⚡ Generate POP</button>`;
        document.getElementById('btnGeneratePop').addEventListener('click', () => jalankanGeneratePOP(idWo));
        return;
      }

      if (snap.isStale) {
        el.detailWoAksiStatus.innerHTML = `
          <div class="stok-perhatian-row" style="margin-bottom:10px;">
            <div><p>⚠️ POP Perlu Diperbarui</p><small>Data SIPANDU berubah setelah POP dibuat (versi ${snap.versi}).</small></div>
          </div>
          <button type="button" class="btn-submit" id="btnGeneratePop" style="width:100%;">⚡ Generate Ulang POP</button>`;
        document.getElementById('btnGeneratePop').addEventListener('click', () => jalankanGeneratePOP(idWo));
        return;
      }

      el.detailWoAksiStatus.innerHTML = `
        <div class="stok-perhatian-row" style="margin-bottom:10px;background:#e8f6ee;">
          <div><p>✓ POP Siap (Snapshot v${snap.versi})</p><small>Dibuat oleh ${escapeHtml(snap.dibuatOleh)} · Data siap dipakai isi form POP resmi (manual, lihat Field Mapping).</small></div>
        </div>
        <button type="button" class="btn-outline" id="btnLihatSnapshot" style="width:100%;margin-bottom:8px;">Lihat Detail Data POP</button>
        <button type="button" class="btn-submit" id="btnAdvanceStatus" style="width:100%;">Tandai POP Filled</button>`;
      document.getElementById('btnAdvanceStatus').addEventListener('click', () => advanceStatus(idWo, 'POP_FILLED'));
      document.getElementById('btnLihatSnapshot').addEventListener('click', () => {
        alert(JSON.stringify(snap.data, null, 2));
      });
    } catch (err) {
      showError(err.message);
    }
  }

  async function jalankanGeneratePOP(idWo) {
    try {
      showLoading('Membuat snapshot POP...');
      const hasil = await sipanduApiPost('generatePOP', { token, idWo });
      hideLoading();
      showSuccess('Snapshot POP versi ' + hasil.versi + ' berhasil dibuat.');
      await bukaDetailWo(idWo);
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  }

  const LABEL_CHECKLIST = {
    wo: 'Work Order dibuat', tanggal: 'Tanggal operasional terisi', menu: 'Menu dipilih',
    jumlah_porsi: 'Jumlah porsi > 0', beneficiaries: 'Penerima manfaat terisi',
    preparation: 'Data Persiapan ada', processing: 'Data Pengolahan ada',
    portioning: 'Data Pemorsian ada', distribution: 'Data Distribusi ada'
  };

  async function tampilkanChecklistValidasi(idWo) {
    try {
      const v = await sipanduApiGet('getValidationStatus', { token, idWo });
      const checklist = v.checklistTersimpan || v.checklistOtomatis;

      const baris = Object.keys(LABEL_CHECKLIST).map(k => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
          <input type="checkbox" class="chk-validasi" data-key="${k}" ${checklist[k] ? 'checked' : ''}>
          ${LABEL_CHECKLIST[k]} ${v.checklistOtomatis[k] ? '<span style="color:#1a7a4c;font-size:11px;">(otomatis: sudah ada)</span>' : '<span style="color:#b23a3a;font-size:11px;">(otomatis: belum ada)</span>'}
        </label>`).join('');

      el.detailWoAksiStatus.innerHTML = `
        <p style="font-size:12.5px;color:var(--color-text-muted);margin-bottom:8px;">Centang tanda "otomatis" cuma saran dari data yang ada — konfirmasi manual tetap wajib sebelum Ready.</p>
        <div id="checklistValidasiWrap">${baris}</div>
        <button type="button" class="btn-submit" id="btnSimpanValidasi" style="width:100%;margin-top:10px;">Simpan &amp; Tandai Ready</button>
      `;

      document.getElementById('btnSimpanValidasi').addEventListener('click', async () => {
        const checklistBaru = {};
        document.querySelectorAll('.chk-validasi').forEach(c => { checklistBaru[c.dataset.key] = c.checked; });
        try {
          showLoading('Menyimpan validasi...');
          await sipanduApiPost('setValidationChecklist', { token, idWo, checklist: checklistBaru, isReady: true });
          await sipanduApiPost('advanceWorkOrderStatus', { token, id: idWo, targetStatus: 'READY' });
          hideLoading();
          showSuccess('Work Order ditandai Ready.');
          await bukaDetailWo(idWo);
          await muatDaftarWo();
        } catch (err) {
          hideLoading();
          showError(err.message);
        }
      });
    } catch (err) {
      showError(err.message);
    }
  }

  async function advanceStatus(idWo, targetStatus) {
    if (!confirm('Yakin ubah status Work Order ini ke ' + labelStatus_(targetStatus) + '?')) return;
    try {
      showLoading('Memproses transisi status...');
      await sipanduApiPost('advanceWorkOrderStatus', { token, id: idWo, targetStatus });
      hideLoading();
      showSuccess('Status berhasil diubah ke ' + labelStatus_(targetStatus) + '.');
      await bukaDetailWo(idWo);
      await muatDaftarWo();
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  }

  el.btnTutupDetailWo.addEventListener('click', () => { el.modalDetailWo.classList.add('is-hidden'); muatDaftarWo(); });
  el.modalDetailWo.addEventListener('click', (e) => { if (e.target === el.modalDetailWo) { el.modalDetailWo.classList.add('is-hidden'); muatDaftarWo(); } });

  el.formTambahBeneficiary.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!idWoTerbuka) return;
    try {
      showLoading('Menyimpan Penerima Manfaat...');
      await sipanduApiPost('addBeneficiary', {
        token, idWo: idWoTerbuka, lokasi: el.bnfLokasi.value.trim(),
        pb: Number(el.bnfPb.value || 0), pk: Number(el.bnfPk.value || 0),
        bumil: Number(el.bnfBumil.value || 0), busui: Number(el.bnfBusui.value || 0), balita: Number(el.bnfBalita.value || 0)
      });
      hideLoading();
      showSuccess('Penerima manfaat ditambahkan.');
      el.formTambahBeneficiary.reset();
      await bukaDetailWo(idWoTerbuka);
    } catch (err) {
      hideLoading();
      showError(err.message);
    }
  });

  // ============================================================
  // OPERASIONAL: Persiapan, Pengolahan, Pemorsian, Distribusi, Cuci Ompreng
  // Skema backend SIPANDU sekarang masih sederhana (bahan/jumlah/satuan,
  // dst) -- BELUM selengkap form POP asli (kategori porsi, plat kendaraan
  // spesifik, foto per tahap). Lihat catatan di laporan pengiriman.
  // ============================================================
  const opsEl = {
    filterWo: document.getElementById('opsFilterWo'),
    belumPilih: document.getElementById('opsBelumPilihWo'),
    konten: document.getElementById('opsKontenWo'),
    tabs: document.querySelectorAll('#opsTabs .chip-tab'),
    panels: document.querySelectorAll('.ops-panel')
  };
  let idWoOperasionalAktif = null;
  let idDistribusiTujuanAktif = null;

  async function muatOperasionalWoList() {
    if (opsEl.filterWo.options.length > 1) return; // sudah pernah dimuat
    try {
      const list = await sipanduApiGet('getWorkOrderList', { token });
      opsEl.filterWo.innerHTML = '<option value="">Pilih Work Order...</option>' +
        list.map(w => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.nomorWO)} — ${escapeHtml(w.tanggal)}</option>`).join('');
    } catch (err) { showError(err.message); }
  }

  opsEl.filterWo.addEventListener('change', () => {
    idWoOperasionalAktif = opsEl.filterWo.value;
    if (!idWoOperasionalAktif) {
      opsEl.belumPilih.style.display = 'block';
      opsEl.konten.style.display = 'none';
      return;
    }
    opsEl.belumPilih.style.display = 'none';
    opsEl.konten.style.display = 'block';
    const tabAktif = document.querySelector('#opsTabs .chip-tab.active');
    muatPanelOperasional_(tabAktif ? tabAktif.dataset.ops : 'persiapan');
  });

  opsEl.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      opsEl.tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      opsEl.panels.forEach(p => { p.style.display = 'none'; });
      const nama = btn.dataset.ops.charAt(0).toUpperCase() + btn.dataset.ops.slice(1);
      document.getElementById('opsPanel' + nama).style.display = 'block';
      muatPanelOperasional_(btn.dataset.ops);
    });
  });

  function muatPanelOperasional_(nama) {
    if (!idWoOperasionalAktif) return;
    if (nama === 'persiapan') muatPersiapan();
    else if (nama === 'pengolahan') muatPengolahan();
    else if (nama === 'pemorsian') muatPemorsian();
    else if (nama === 'distribusi') muatDistribusi();
    else if (nama === 'cuci') muatCuci();
  }

  // ---- PERSIAPAN ----
  async function muatPersiapan() {
    const wrap = document.getElementById('listPersiapan');
    wrap.innerHTML = '<div class="empty-state">Memuat...</div>';
    try {
      const list = await sipanduApiGet('getPreparationList', { token, idWo: idWoOperasionalAktif });
      wrap.innerHTML = !list.length ? '<div class="empty-state">Belum ada bahan dicatat.</div>' : list.map(p => `
        <div class="sipandu-wo-card" style="cursor:default;">
          <div class="sipandu-wo-card-top"><strong>${escapeHtml(p.bahan)}</strong><span>${p.jumlah} ${escapeHtml(p.satuan || '')}</span></div>
          <p>Status: ${escapeHtml(p.status)}${p.waktu ? ' · ' + escapeHtml(p.waktu) : ''}</p>
        </div>`).join('');
    } catch (err) { wrap.innerHTML = ''; showError(err.message); }
  }

  document.getElementById('formTambahPersiapan').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addPreparationItem', {
        token, idWo: idWoOperasionalAktif,
        bahan: document.getElementById('prpBahan').value.trim(),
        jumlah: Number(document.getElementById('prpJumlah').value || 0),
        satuan: document.getElementById('prpSatuan').value.trim()
      });
      e.target.reset();
      showSuccess('Bahan ditambahkan.');
      muatPersiapan();
    } catch (err) { showError(err.message); }
  });

  // ---- PENGOLAHAN ----
  async function muatPengolahan() {
    const wrap = document.getElementById('listPengolahan');
    wrap.innerHTML = '<div class="empty-state">Memuat...</div>';
    try {
      const list = await sipanduApiGet('getProcessingList', { token, idWo: idWoOperasionalAktif });
      wrap.innerHTML = !list.length ? '<div class="empty-state">Belum ada kegiatan dicatat.</div>' : list.map(p => `
        <div class="sipandu-wo-card" style="cursor:default;">
          <div class="sipandu-wo-card-top"><strong>${escapeHtml(p.kegiatan)}</strong><span>${p.jumlah} ${escapeHtml(p.satuan || '')}</span></div>
          <p>${escapeHtml(p.bahan || '-')} · Status: ${escapeHtml(p.status)}</p>
        </div>`).join('');
    } catch (err) { wrap.innerHTML = ''; showError(err.message); }
  }

  document.getElementById('formTambahPengolahan').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addProcessingItem', {
        token, idWo: idWoOperasionalAktif,
        kegiatan: document.getElementById('pngKegiatan').value.trim(),
        bahan: document.getElementById('pngBahan').value.trim(),
        jumlah: Number(document.getElementById('pngJumlah').value || 0),
        satuan: document.getElementById('pngSatuan').value.trim()
      });
      e.target.reset();
      showSuccess('Kegiatan ditambahkan.');
      muatPengolahan();
    } catch (err) { showError(err.message); }
  });

  // ---- PEMORSIAN ----
  async function muatPemorsian() {
    const wrap = document.getElementById('listPemorsian');
    wrap.innerHTML = '<div class="empty-state">Memuat...</div>';
    try {
      const list = await sipanduApiGet('getPortioningList', { token, idWo: idWoOperasionalAktif });
      wrap.innerHTML = !list.length ? '<div class="empty-state">Belum ada sesi pemorsian.</div>' : list.map(p => `
        <div class="sipandu-wo-card" data-id="${escapeHtml(p.id)}" style="cursor:default;">
          <div class="sipandu-wo-card-top"><strong>${escapeHtml(p.sesi)}</strong><span>Target ${p.target}</span></div>
          <p>Status: ${escapeHtml(p.status)} · Hasil: ${p.jumlahSelesai}/${p.target}</p>
          ${p.status !== 'SELESAI' ? `<div class="inline-form-relawan" style="margin-top:8px;">
            <input type="number" class="input-hasil-sesi" placeholder="Jumlah hasil" min="0">
            <button type="button" class="btn-outline btn-selesaikan-sesi" data-id="${escapeHtml(p.id)}">Catat Hasil &amp; Selesai</button>
          </div>` : ''}
        </div>`).join('');

      wrap.querySelectorAll('.btn-selesaikan-sesi').forEach(btn => {
        btn.addEventListener('click', async () => {
          const input = btn.closest('.sipandu-wo-card').querySelector('.input-hasil-sesi');
          try {
            await sipanduApiPost('updatePortioningSesi', { token, id: btn.dataset.id, jumlahSelesai: Number(input.value || 0), status: 'SELESAI' });
            showSuccess('Sesi pemorsian selesai dicatat.');
            muatPemorsian();
          } catch (err) { showError(err.message); }
        });
      });
    } catch (err) { wrap.innerHTML = ''; showError(err.message); }
  }

  document.getElementById('formTambahSesi').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addPortioningSesi', {
        token, idWo: idWoOperasionalAktif,
        sesi: document.getElementById('pmrSesi').value.trim(),
        target: Number(document.getElementById('pmrTarget').value || 0)
      });
      e.target.reset();
      showSuccess('Sesi pemorsian dibuka.');
      muatPemorsian();
    } catch (err) { showError(err.message); }
  });

  // ---- DISTRIBUSI ----
  async function muatDistribusi() {
    const wrap = document.getElementById('listDistribusi');
    wrap.innerHTML = '<div class="empty-state">Memuat...</div>';
    try {
      const list = await sipanduApiGet('getDistributionList', { token, idWo: idWoOperasionalAktif });
      wrap.innerHTML = !list.length ? '<div class="empty-state">Belum ada armada ditugaskan.</div>' : list.map(r => `
        <div class="sipandu-wo-card" style="cursor:default;">
          <div class="sipandu-wo-card-top"><strong>${escapeHtml(r.namaKurir)}</strong><span>${escapeHtml(r.kendaraan || '-')}</span></div>
          ${r.tujuan.map(t => `<p>📍 ${escapeHtml(t.namaTujuan)} — ${t.jumlahPorsi} porsi ${t.jam ? '(' + escapeHtml(t.jam) + ')' : ''} · <em>${escapeHtml(t.status)}</em></p>`).join('')}
          <button type="button" class="btn-outline btn-tambah-tujuan" data-id="${escapeHtml(r.id)}" style="margin-top:6px;">+ Tambah Tujuan</button>
        </div>`).join('');

      wrap.querySelectorAll('.btn-tambah-tujuan').forEach(btn => {
        btn.addEventListener('click', () => {
          idDistribusiTujuanAktif = btn.dataset.id;
          document.getElementById('formTambahTujuan').reset();
          document.getElementById('modalTambahTujuan').classList.remove('is-hidden');
        });
      });
    } catch (err) { wrap.innerHTML = ''; showError(err.message); }
  }

  document.getElementById('formTambahArmada').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addDistributionRoute', {
        token, idWo: idWoOperasionalAktif,
        namaKurir: document.getElementById('dstKurir').value.trim(),
        kendaraan: document.getElementById('dstKendaraan').value.trim()
      });
      e.target.reset();
      showSuccess('Armada ditambahkan.');
      muatDistribusi();
    } catch (err) { showError(err.message); }
  });

  document.getElementById('btnBatalTambahTujuan').addEventListener('click', () => {
    document.getElementById('modalTambahTujuan').classList.add('is-hidden');
  });

  document.getElementById('formTambahTujuan').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addDistributionStop', {
        token, idDistribution: idDistribusiTujuanAktif,
        namaTujuan: document.getElementById('tjnNama').value.trim(),
        jumlahPorsi: Number(document.getElementById('tjnJumlahPorsi').value || 0),
        jam: document.getElementById('tjnJam').value,
        catatan: document.getElementById('tjnCatatan').value.trim()
      });
      document.getElementById('modalTambahTujuan').classList.add('is-hidden');
      showSuccess('Tujuan ditambahkan.');
      muatDistribusi();
    } catch (err) { showError(err.message); }
  });

  // ---- CUCI OMPRENG ----
  async function muatCuci() {
    const wrap = document.getElementById('listCuci');
    wrap.innerHTML = '<div class="empty-state">Memuat...</div>';
    try {
      const list = await sipanduApiGet('getWashingList', { token, idWo: idWoOperasionalAktif });
      wrap.innerHTML = !list.length ? '<div class="empty-state">Belum ada catatan pencucian.</div>' : list.map(w => `
        <div class="sipandu-wo-card" style="cursor:default;">
          <div class="sipandu-wo-card-top"><strong>${w.jumlahOmpreng} ompreng</strong><span>${escapeHtml(w.kondisi || '-')}</span></div>
          <p>Diterima: ${escapeHtml(w.jamPengambilan || '-')} · Dikembalikan: ${escapeHtml(w.jamDikembalikan || 'belum')}</p>
        </div>`).join('');
    } catch (err) { wrap.innerHTML = ''; showError(err.message); }
  }

  document.getElementById('formTambahCuci').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await sipanduApiPost('addWashingRecord', {
        token, idWo: idWoOperasionalAktif,
        jumlahOmpreng: Number(document.getElementById('cuciJumlah').value || 0),
        kondisi: document.getElementById('cuciKondisi').value
      });
      e.target.reset();
      showSuccess('Penerimaan ompreng dicatat.');
      muatCuci();
    } catch (err) { showError(err.message); }
  });
});
