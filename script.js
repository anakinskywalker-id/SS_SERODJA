/**
 * script.js
 * -----------------------------------------------------------------------
 * Logika UI aplikasi Liga Kandang.
 * Data dibaca & disimpan lewat objek DB (lihat database.js) yang
 * tersambung ke GitHub + Worker. Membaca = publik, menulis = wajib login
 * admin. Semua operasi tulis bersifat async (menunggu respons Worker).
 * -----------------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ---------------- Elemen umum & auth ----------------
  const authStatus = document.getElementById('auth-status');
  const btnShowLogin = document.getElementById('btn-show-login');
  const btnLogout = document.getElementById('btn-logout');
  const loginModal = document.getElementById('login-modal');
  const formLogin = document.getElementById('form-login');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const btnCancelLogin = document.getElementById('btn-cancel-login');

  const tabButtons = document.querySelectorAll('.tabs__btn');
  const panels = document.querySelectorAll('.panel');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  function switchTab(tab) {
    tabButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
    panels.forEach((p) => p.classList.toggle('is-active', p.id === 'tab-' + tab));
    if (tab === 'klasemen') renderKlasemen();
    if (tab === 'topskor') renderTopSkor();
    if (tab === 'pertandingan') renderFormPertandingan();
    if (tab === 'startingxi') renderFormStartingXI();
  }

  // ---------------- Auth UI ----------------

  btnShowLogin.addEventListener('click', () => {
    loginError.hidden = true;
    formLogin.reset();
    loginModal.hidden = false;
    loginUsername.focus();
  });

  btnCancelLogin.addEventListener('click', () => {
    loginModal.hidden = true;
  });

  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.hidden = true;
  });

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const submitBtn = formLogin.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await DB.login(loginUsername.value.trim(), loginPassword.value);
      loginModal.hidden = true;
      applyAuthUI();
      refreshCurrentTabAdminAreas();
    } catch (err) {
      loginError.textContent = err.message || 'Login gagal.';
      loginError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  btnLogout.addEventListener('click', () => {
    DB.logout();
    applyAuthUI();
    refreshCurrentTabAdminAreas();
  });

  function applyAuthUI() {
    const loggedIn = DB.isLoggedIn();
    btnShowLogin.hidden = loggedIn;
    btnLogout.hidden = !loggedIn;
    authStatus.textContent = loggedIn
      ? 'Login sebagai admin'
      : (DB.isUsingFallback() ? 'Mode publik (data belum tersedia)' : 'Mode publik (baca saja)');

    document.getElementById('tim-admin-area').style.display = loggedIn ? '' : 'none';
    document.getElementById('tim-readonly-note').hidden = loggedIn;

    document.getElementById('pertandingan-admin-area').style.display = loggedIn ? '' : 'none';
    document.getElementById('pertandingan-readonly-note').hidden = loggedIn;

    document.getElementById('startingxi-admin-area').style.display = loggedIn ? '' : 'none';
    document.getElementById('startingxi-readonly-note').hidden = loggedIn;
  }

  function refreshCurrentTabAdminAreas() {
    renderDaftarTimTersimpan();
    renderFormPertandingan();
    renderFormStartingXI();
    renderKlasemen();
    renderTopSkor();
  }

  function handleWriteError(err) {
    console.error(err);
    alert(err.message || 'Terjadi kesalahan saat menyimpan data.');
    if (err.code === 'AUTH_EXPIRED') {
      applyAuthUI();
      refreshCurrentTabAdminAreas();
    }
  }

  // ---------------- TAB 1: Setup Tim ----------------
  const formJumlahTim = document.getElementById('form-jumlah-tim');
  const slotNamaTim = document.getElementById('slot-nama-tim');
  const btnSimpanTim = document.getElementById('btn-simpan-tim');
  const btnResetSemua = document.getElementById('btn-reset-semua');
  const daftarTimTersimpan = document.getElementById('daftar-tim-tersimpan');

  formJumlahTim.addEventListener('submit', (e) => {
    e.preventDefault();
    const jumlah = parseInt(document.getElementById('input-jumlah-tim').value, 10);
    if (!jumlah || jumlah < 2) return;

    slotNamaTim.innerHTML = '';
    for (let i = 1; i <= jumlah; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'team-slot';
      wrap.innerHTML = `
        <label for="nama-tim-${i}">Tim ${i}</label>
        <input type="text" id="nama-tim-${i}" placeholder="Nama tim ${i}" required>
      `;
      slotNamaTim.appendChild(wrap);
    }
    btnSimpanTim.disabled = false;
  });

  btnSimpanTim.addEventListener('click', async () => {
    const inputs = slotNamaTim.querySelectorAll('input[type="text"]');
    const names = Array.from(inputs).map((inp) => inp.value.trim());

    if (names.length === 0 || names.some((n) => !n)) {
      alert('Mohon isi semua nama tim.');
      return;
    }
    const hasDuplicate = new Set(names.map((n) => n.toLowerCase())).size !== names.length;
    if (hasDuplicate) {
      alert('Nama tim tidak boleh sama antara satu dengan yang lain.');
      return;
    }

    btnSimpanTim.disabled = true;
    btnSimpanTim.textContent = 'Menyimpan ke GitHub...';
    try {
      await DB.setTeams(names);
      renderDaftarTimTersimpan();
      renderFormPertandingan();
      renderFormStartingXI();
      alert('Tim berhasil disimpan. Kompetisi siap dimulai!');
      switchTab('pertandingan');
    } catch (err) {
      handleWriteError(err);
    } finally {
      btnSimpanTim.disabled = false;
      btnSimpanTim.textContent = 'Simpan Tim & Mulai Kompetisi';
    }
  });

  btnResetSemua.addEventListener('click', async () => {
    if (!confirm('Yakin ingin menghapus SEMUA data (tim, pertandingan & starting XI) di GitHub? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await DB.resetAll();
      slotNamaTim.innerHTML = '';
      btnSimpanTim.disabled = true;
      document.getElementById('input-jumlah-tim').value = '';
      renderDaftarTimTersimpan();
      renderFormPertandingan();
      renderRiwayatPertandingan();
      renderFormStartingXI();
    } catch (err) {
      handleWriteError(err);
    }
  });

  function renderDaftarTimTersimpan() {
    const teams = DB.getTeams();
    if (teams.length === 0) {
      daftarTimTersimpan.innerHTML = '';
      return;
    }
    daftarTimTersimpan.innerHTML = `
      <h3>Tim Terdaftar (${teams.length})</h3>
      <div class="saved-teams__list">
        ${teams.map((t) => `<span class="chip">${escapeHtml(t.name)}</span>`).join('')}
      </div>
    `;
  }

  // ---------------- TAB 2: Input Pertandingan ----------------
  const formPertandingan = document.getElementById('form-pertandingan');
  const selectTimA = document.getElementById('select-tim-a');
  const selectTimB = document.getElementById('select-tim-b');
  const skorA = document.getElementById('skor-a');
  const skorB = document.getElementById('skor-b');
  const labelTimA = document.getElementById('label-tim-a');
  const labelTimB = document.getElementById('label-tim-b');
  const scorerListA = document.getElementById('scorer-list-a');
  const scorerListB = document.getElementById('scorer-list-b');
  const pertandinganWarning = document.getElementById('pertandingan-warning');
  const scorerWarning = document.getElementById('scorer-warning');

  document.querySelectorAll('[data-add-scorer]').forEach((btn) => {
    btn.addEventListener('click', () => addScorerRow(btn.dataset.addScorer));
  });

  function renderFormPertandingan() {
    const teams = DB.getTeams();
    const cukupTim = teams.length >= 2;
    pertandinganWarning.hidden = cukupTim;
    document.getElementById('pertandingan-admin-area').hidden = !cukupTim;

    if (!cukupTim) {
      renderRiwayatPertandingan();
      return;
    }

    const optionsHtml = teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    selectTimA.innerHTML = optionsHtml;
    selectTimB.innerHTML = optionsHtml;
    if (teams.length > 1) selectTimB.selectedIndex = 1;

    updateScorerLabels();
    renderRiwayatPertandingan();
  }

  function updateScorerLabels() {
    const namaA = selectTimA.options[selectTimA.selectedIndex]?.text || 'Tim Tuan Rumah';
    const namaB = selectTimB.options[selectTimB.selectedIndex]?.text || 'Tim Tamu';
    labelTimA.textContent = namaA;
    labelTimB.textContent = namaB;
  }

  selectTimA.addEventListener('change', updateScorerLabels);
  selectTimB.addEventListener('change', updateScorerLabels);

  function addScorerRow(side, playerVal = '', goalsVal = 1) {
    const container = side === 'a' ? scorerListA : scorerListB;
    const row = document.createElement('div');
    row.className = 'scorer-row';
    row.innerHTML = `
      <input type="text" placeholder="Nama pemain" class="scorer-player" value="${escapeHtml(playerVal)}">
      <input type="number" min="1" value="${goalsVal}" class="scorer-goals">
      <button type="button" class="scorer-row__remove" title="Hapus">&times;</button>
    `;
    row.querySelector('.scorer-row__remove').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  formPertandingan.addEventListener('submit', async (e) => {
    e.preventDefault();

    const teamAId = selectTimA.value;
    const teamBId = selectTimB.value;
    if (teamAId === teamBId) {
      alert('Tim tuan rumah dan tim tamu tidak boleh sama.');
      return;
    }

    const nA = parseInt(skorA.value, 10);
    const nB = parseInt(skorB.value, 10);

    const scorersA = readScorerRows(scorerListA);
    const scorersB = readScorerRows(scorerListB);

    const totalGolA = scorersA.reduce((sum, s) => sum + s.goals, 0);
    const totalGolB = scorersB.reduce((sum, s) => sum + s.goals, 0);

    if (totalGolA !== nA || totalGolB !== nB) {
      scorerWarning.hidden = false;
      return;
    }
    scorerWarning.hidden = true;

    const submitBtn = formPertandingan.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan ke GitHub...';
    try {
      await DB.addMatch({ teamAId, teamBId, scoreA: nA, scoreB: nB, scorersA, scorersB });
      formPertandingan.reset();
      scorerListA.innerHTML = '';
      scorerListB.innerHTML = '';
      renderRiwayatPertandingan();
      updateScorerLabels();
    } catch (err) {
      handleWriteError(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Hasil Pertandingan';
    }
  });

  function readScorerRows(container) {
    const rows = container.querySelectorAll('.scorer-row');
    const result = [];
    rows.forEach((row) => {
      const player = row.querySelector('.scorer-player').value.trim();
      const goals = parseInt(row.querySelector('.scorer-goals').value, 10) || 0;
      if (player && goals > 0) result.push({ player, goals });
    });
    return result;
  }

  function renderRiwayatPertandingan() {
    const box = document.getElementById('riwayat-pertandingan');
    const matches = DB.getMatches();
    const teams = DB.getTeams();
    const teamName = (id) => teams.find((t) => t.id === id)?.name || '(tim dihapus)';
    const loggedIn = DB.isLoggedIn();

    if (matches.length === 0) {
      box.innerHTML = `<p class="empty-note">Belum ada pertandingan yang dicatat.</p>`;
      return;
    }

    box.innerHTML = matches
      .slice()
      .reverse()
      .map((m) => {
        const scorerText = (list) => list.map((s) => `${escapeHtml(s.player)} (${s.goals})`).join(', ') || '&mdash;';
        return `
        <div class="match-card">
          <div class="match-card__score">
            ${escapeHtml(teamName(m.teamAId))} <b>${m.scoreA} &ndash; ${m.scoreB}</b> ${escapeHtml(teamName(m.teamBId))}
          </div>
          ${loggedIn ? `<button class="match-card__remove" data-id="${m.id}">Hapus</button>` : ''}
          <div class="match-card__scorers">
            Gol ${escapeHtml(teamName(m.teamAId))}: ${scorerText(m.scorersA)} &nbsp;|&nbsp;
            Gol ${escapeHtml(teamName(m.teamBId))}: ${scorerText(m.scorersB)}
          </div>
        </div>`;
      })
      .join('');

    box.querySelectorAll('.match-card__remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus pertandingan ini dari riwayat?')) return;
        try {
          await DB.deleteMatch(btn.dataset.id);
          renderRiwayatPertandingan();
        } catch (err) {
          handleWriteError(err);
        }
      });
    });
  }

  // ---------------- TAB 3: Klasemen ----------------
  function hitungKlasemen() {
    const teams = DB.getTeams();
    const matches = DB.getMatches();

    const table = {};
    teams.forEach((t) => {
      table[t.id] = {
        id: t.id,
        name: t.name,
        played: 0, win: 0, draw: 0, lose: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0
      };
    });

    matches.forEach((m) => {
      const a = table[m.teamAId];
      const b = table[m.teamBId];
      if (!a || !b) return; // tim mungkin sudah dihapus

      a.played++; b.played++;
      a.goalsFor += m.scoreA; a.goalsAgainst += m.scoreB;
      b.goalsFor += m.scoreB; b.goalsAgainst += m.scoreA;

      if (m.scoreA > m.scoreB) {
        a.win++; a.points += 3;
        b.lose++;
      } else if (m.scoreA < m.scoreB) {
        b.win++; b.points += 3;
        a.lose++;
      } else {
        a.draw++; b.draw++;
        a.points += 1; b.points += 1;
      }
    });

    return Object.values(table).sort((x, y) => {
      if (y.points !== x.points) return y.points - x.points;
      const gdX = x.goalsFor - x.goalsAgainst;
      const gdY = y.goalsFor - y.goalsAgainst;
      if (gdY !== gdX) return gdY - gdX;
      if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor;
      return x.name.localeCompare(y.name);
    });
  }

  function renderKlasemen() {
    const body = document.getElementById('tabel-klasemen-body');
    const standings = hitungKlasemen();

    if (standings.length === 0) {
      body.innerHTML = `<tr><td colspan="10" class="empty-note">Belum ada tim yang terdaftar.</td></tr>`;
      return;
    }

    body.innerHTML = standings
      .map((r, i) => {
        const gd = r.goalsFor - r.goalsAgainst;
        return `
        <tr>
          <td class="col-rank">${i + 1}</td>
          <td class="col-team">${escapeHtml(r.name)}</td>
          <td>${r.played}</td>
          <td>${r.win}</td>
          <td>${r.draw}</td>
          <td>${r.lose}</td>
          <td>${r.goalsFor}</td>
          <td>${r.goalsAgainst}</td>
          <td>${gd > 0 ? '+' : ''}${gd}</td>
          <td class="col-pts">${r.points}</td>
        </tr>`;
      })
      .join('');
  }

  // ---------------- TAB 4: Top Skor ----------------
  function hitungTopSkor() {
    const matches = DB.getMatches();
    const teams = DB.getTeams();
    const teamName = (id) => teams.find((t) => t.id === id)?.name || '(tim dihapus)';

    const totals = {}; // key: player|teamId

    matches.forEach((m) => {
      m.scorersA.forEach((s) => addGoals(s, m.teamAId));
      m.scorersB.forEach((s) => addGoals(s, m.teamBId));
    });

    function addGoals(s, teamId) {
      const key = s.player.toLowerCase() + '|' + teamId;
      if (!totals[key]) {
        totals[key] = { player: s.player, team: teamName(teamId), goals: 0 };
      }
      totals[key].goals += s.goals;
    }

    return Object.values(totals).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
  }

  function renderTopSkor() {
    const box = document.getElementById('daftar-topskor');
    const scorers = hitungTopSkor();

    if (scorers.length === 0) {
      box.innerHTML = `<p class="empty-note">Belum ada gol yang tercatat.</p>`;
      return;
    }

    box.innerHTML = scorers
      .map((s, i) => `
        <div class="topscorer-row">
          <div class="topscorer-row__rank">${i + 1}</div>
          <div>
            <div class="topscorer-row__player">${escapeHtml(s.player)}</div>
            <div class="topscorer-row__team">${escapeHtml(s.team)}</div>
          </div>
          <div></div>
          <div class="topscorer-row__goals">${s.goals} gol</div>
        </div>
      `)
      .join('');
  }

  // ---------------- TAB 5: Starting XI ----------------
  const FORMAT_INFO = {
    futsal:  { label: 'Futsal', total: 5 },
    mini:    { label: 'Mini Soccer', total: 8 },
    standar: { label: 'Sepak Bola Standar', total: 11 }
  };

  // Katalog posisi per format. `line` = jalur taktis dari kiper (0) ke lini depan (angka terbesar),
  // dipakai untuk menyusun kolom di tampilan lapangan & menghitung string formasi otomatis.
  const POSITION_CATALOG = {
    futsal: [
      { code: 'GK', label: 'Kiper', line: 0 },
      { code: 'FIXO', label: 'Fixo (Bek)', line: 1 },
      { code: 'ALA_KANAN', label: 'Ala Kanan', line: 2 },
      { code: 'ALA_KIRI', label: 'Ala Kiri', line: 2 },
      { code: 'PIVOT', label: 'Pivot', line: 3 }
    ],
    mini: [
      { code: 'GK', label: 'Kiper', line: 0 },
      { code: 'CB', label: 'Bek Tengah', line: 1 },
      { code: 'RB', label: 'Bek Kanan', line: 1 },
      { code: 'LB', label: 'Bek Kiri', line: 1 },
      { code: 'CM', label: 'Gelandang Tengah', line: 2 },
      { code: 'RM', label: 'Gelandang Kanan', line: 2 },
      { code: 'LM', label: 'Gelandang Kiri', line: 2 },
      { code: 'CF', label: 'Penyerang', line: 3 }
    ],
    standar: [
      { code: 'GK', label: 'Kiper', line: 0 },
      { code: 'CB', label: 'Bek Tengah', line: 1 },
      { code: 'RB', label: 'Bek Kanan', line: 1 },
      { code: 'LB', label: 'Bek Kiri', line: 1 },
      { code: 'DMF', label: 'Gelandang Bertahan', line: 2 },
      { code: 'CMF', label: 'Gelandang Tengah', line: 3 },
      { code: 'RMF', label: 'Gelandang Kanan', line: 3 },
      { code: 'LMF', label: 'Gelandang Kiri', line: 3 },
      { code: 'AMF', label: 'Gelandang Serang', line: 3 },
      { code: 'RWF', label: 'Sayap Kanan', line: 4 },
      { code: 'LWF', label: 'Sayap Kiri', line: 4 },
      { code: 'CF', label: 'Penyerang Tengah', line: 4 },
      { code: 'SS', label: 'Penyerang Bayangan', line: 4 }
    ]
  };

  function posLabel(format, code) {
    const found = POSITION_CATALOG[format]?.find((p) => p.code === code);
    return found ? found.label : code;
  }

  function posLine(format, code) {
    const found = POSITION_CATALOG[format]?.find((p) => p.code === code);
    return found ? found.line : 0;
  }

  function positionOptionsHtml(format, selectedCode) {
    return POSITION_CATALOG[format]
      .map((p) => `<option value="${p.code}" ${p.code === selectedCode ? 'selected' : ''}>${escapeHtml(p.label)}</option>`)
      .join('');
  }

  const formStartingXI = document.getElementById('form-startingxi');
  const selectLineupTim = document.getElementById('select-lineup-tim');
  const selectFormat = document.getElementById('select-format');
  const lineupSlots = document.getElementById('lineup-slots');
  const startingxiWarning = document.getElementById('startingxi-warning');
  const daftarLineupTersimpan = document.getElementById('daftar-lineup-tersimpan');
  const pitchWarning = document.getElementById('pitch-warning');
  const pitchControls = document.getElementById('pitch-controls');
  const selectPitchA = document.getElementById('select-pitch-a');
  const selectPitchB = document.getElementById('select-pitch-b');
  const btnTampilkanPitch = document.getElementById('btn-tampilkan-pitch');
  const pitchPreviewWrap = document.getElementById('pitch-preview-wrap');

  selectLineupTim.addEventListener('change', () => loadLineupIntoForm(selectLineupTim.value));
  selectFormat.addEventListener('change', () => buildLineupSlots(selectFormat.value));

  function loadLineupIntoForm(teamId) {
    const existing = DB.getLineup(teamId);
    if (existing) {
      selectFormat.value = existing.format;
      buildLineupSlots(existing.format, existing.players);
    } else {
      buildLineupSlots(selectFormat.value);
    }
  }

  function renderFormStartingXI() {
    const teams = DB.getTeams();
    const adaTim = teams.length >= 1;
    startingxiWarning.hidden = adaTim;
    document.getElementById('startingxi-admin-area').hidden = !adaTim;

    if (!adaTim) {
      daftarLineupTersimpan.innerHTML = '';
      pitchControls.style.display = 'none';
      pitchWarning.hidden = false;
      return;
    }

    selectLineupTim.innerHTML = teams.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    loadLineupIntoForm(selectLineupTim.value);
    renderDaftarLineupTersimpan();
    renderPitchTeamSelectors();
  }

  function buildLineupSlots(format, existingPlayers = []) {
    const total = FORMAT_INFO[format].total;
    const catalog = POSITION_CATALOG[format];
    const defaultOutfieldCode = catalog.find((p) => p.code !== 'GK').code;
    lineupSlots.innerHTML = '';

    for (let i = 0; i < total; i++) {
      const existing = existingPlayers[i];
      const existingName = existing?.name || '';
      const selectedCode = existing?.positionCode || (i === 0 ? 'GK' : defaultOutfieldCode);

      const row = document.createElement('div');
      row.className = 'lineup-slot';
      row.innerHTML = `
        <span class="lineup-slot__num">${i + 1}</span>
        <input type="text" class="lineup-slot__input" placeholder="Nama pemain ${i + 1}" value="${escapeHtml(existingName)}">
        <select class="lineup-slot__position">${positionOptionsHtml(format, selectedCode)}</select>
      `;
      lineupSlots.appendChild(row);
    }

    updateGkBadges();
    lineupSlots.querySelectorAll('.lineup-slot__position').forEach((sel) => {
      sel.addEventListener('change', updateGkBadges);
    });
  }

  function updateGkBadges() {
    lineupSlots.querySelectorAll('.lineup-slot').forEach((row) => {
      const isGK = row.querySelector('.lineup-slot__position').value === 'GK';
      row.querySelector('.lineup-slot__num').classList.toggle('is-gk', isGK);
    });
  }

  formStartingXI.addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamId = selectLineupTim.value;
    const format = selectFormat.value;
    const rows = lineupSlots.querySelectorAll('.lineup-slot');

    const players = [];
    rows.forEach((row, i) => {
      const name = row.querySelector('.lineup-slot__input').value.trim();
      const positionCode = row.querySelector('.lineup-slot__position').value;
      if (name) players.push({ id: 'p' + i, name, positionCode });
    });

    if (players.length === 0) {
      alert('Isi minimal satu nama pemain.');
      return;
    }
    const jumlahGK = players.filter((p) => p.positionCode === 'GK').length;
    if (jumlahGK === 0) {
      if (!confirm('Belum ada pemain dengan posisi Kiper. Tetap simpan?')) return;
    } else if (jumlahGK > 1) {
      if (!confirm('Ada lebih dari satu pemain berposisi Kiper. Tetap simpan?')) return;
    }

    const submitBtn = formStartingXI.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan ke GitHub...';
    try {
      await DB.saveLineup(teamId, format, players);
      renderDaftarLineupTersimpan();
      renderPitchTeamSelectors();
      alert('Starting XI berhasil disimpan.');
    } catch (err) {
      handleWriteError(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Starting XI';
    }
  });

  function renderDaftarLineupTersimpan() {
    const teams = DB.getTeams();
    const lineups = DB.getAllLineups();
    const teamsWithLineup = teams.filter((t) => lineups[t.id]);
    const loggedIn = DB.isLoggedIn();

    if (teamsWithLineup.length === 0) {
      daftarLineupTersimpan.innerHTML = `<p class="empty-note">Belum ada starting XI yang tersimpan.</p>`;
      return;
    }

    daftarLineupTersimpan.innerHTML = teamsWithLineup
      .map((t) => {
        const lu = lineups[t.id];
        const formatLabel = FORMAT_INFO[lu.format]?.label || lu.format;
        return `
        <div class="lineup-card">
          <div class="lineup-card__head">
            <h4>${escapeHtml(t.name)}</h4>
            <span class="lineup-card__format">${formatLabel} &middot; ${formationString(lu.format, lu.players)}</span>
            ${loggedIn ? `
            <div class="lineup-card__actions">
              <button type="button" class="btn btn--ghost btn--small" data-edit-lineup="${t.id}">Edit</button>
              <button type="button" class="btn btn--danger btn--small" data-delete-lineup="${t.id}">Hapus</button>
            </div>` : ''}
          </div>
          <div class="lineup-card__players">
            ${lu.players
              .map((p) => `<span class="lineup-chip ${p.positionCode === 'GK' ? 'is-gk' : ''}">${escapeHtml(p.name)} <em>${escapeHtml(posLabel(lu.format, p.positionCode))}</em></span>`)
              .join('')}
          </div>
        </div>`;
      })
      .join('');

    daftarLineupTersimpan.querySelectorAll('[data-edit-lineup]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectLineupTim.value = btn.dataset.editLineup;
        loadLineupIntoForm(btn.dataset.editLineup);
        formStartingXI.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    daftarLineupTersimpan.querySelectorAll('[data-delete-lineup]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus starting XI tim ini?')) return;
        try {
          await DB.deleteLineup(btn.dataset.deleteLineup);
          renderDaftarLineupTersimpan();
          renderPitchTeamSelectors();
          pitchPreviewWrap.innerHTML = '';
        } catch (err) {
          handleWriteError(err);
        }
      });
    });
  }

  function formationString(format, players) {
    const catalog = POSITION_CATALOG[format];
    const maxLine = Math.max(...catalog.map((p) => p.line));
    const counts = [];
    for (let line = 1; line <= maxLine; line++) {
      counts.push(players.filter((p) => posLine(format, p.positionCode) === line).length);
    }
    return counts.join('-');
  }

  // ---------------- Preview lapangan (Head-to-Head) ----------------

  function renderPitchTeamSelectors() {
    const teams = DB.getTeams();
    const lineups = DB.getAllLineups();
    const teamsWithLineup = teams.filter((t) => lineups[t.id]);

    if (teamsWithLineup.length < 2) {
      pitchControls.style.display = 'none';
      pitchWarning.hidden = false;
      pitchPreviewWrap.innerHTML = '';
      return;
    }

    pitchControls.style.display = '';
    pitchWarning.hidden = true;

    const optionsHtml = teamsWithLineup.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    selectPitchA.innerHTML = optionsHtml;
    selectPitchB.innerHTML = optionsHtml;
    if (teamsWithLineup.length > 1) selectPitchB.selectedIndex = 1;
  }

  btnTampilkanPitch.addEventListener('click', () => {
    const teamAId = selectPitchA.value;
    const teamBId = selectPitchB.value;
    if (teamAId === teamBId) {
      alert('Pilih dua tim yang berbeda untuk dibandingkan.');
      return;
    }
    renderPitchPreview(teamAId, teamBId);
  });

  function renderPitchPreview(teamAId, teamBId) {
    const teams = DB.getTeams();
    const lineups = DB.getAllLineups();
    const teamA = teams.find((t) => t.id === teamAId);
    const teamB = teams.find((t) => t.id === teamBId);
    const luA = lineups[teamAId];
    const luB = lineups[teamBId];

    if (!teamA || !teamB || !luA || !luB) {
      pitchPreviewWrap.innerHTML = `<p class="empty-note">Data starting XI tidak lengkap untuk salah satu tim.</p>`;
      return;
    }

    function buildColumns(format, players, reversed) {
      const catalog = POSITION_CATALOG[format];
      const maxLine = Math.max(...catalog.map((p) => p.line));
      const lineIndexes = [];
      for (let line = 0; line <= maxLine; line++) lineIndexes.push(line);
      const ordered = reversed ? lineIndexes.slice().reverse() : lineIndexes;

      return ordered
        .map((line) => {
          const playersInLine = players.filter((p) => posLine(format, p.positionCode) === line);
          if (playersInLine.length === 0) return '';
          const cards = playersInLine
            .map(
              (p) => `
              <div class="pitch__player">
                <div class="pitch__player-name">${escapeHtml(p.name)}</div>
                <div class="pitch__player-pos">${escapeHtml(posLabel(format, p.positionCode))}</div>
              </div>`
            )
            .join('');
          return `<div class="pitch__col">${cards}</div>`;
        })
        .join('');
    }

    pitchPreviewWrap.innerHTML = `
      <div class="pitch-heading">
        <div class="pitch-heading__team">
          <span class="pitch-heading__dot"></span>
          <strong>${escapeHtml(teamA.name)}</strong> Formasi <b>${formationString(luA.format, luA.players)}</b>
        </div>
        <div class="pitch-heading__team pitch-heading__team--right">
          <strong>${escapeHtml(teamB.name)}</strong> Formasi <b>${formationString(luB.format, luB.players)}</b>
          <span class="pitch-heading__dot pitch-heading__dot--b"></span>
        </div>
      </div>
      <div class="pitch">
        <div class="pitch__center-line"></div>
        <div class="pitch__center-circle"></div>
        <div class="pitch__side">${buildColumns(luA.format, luA.players, false)}</div>
        <div class="pitch__side">${buildColumns(luB.format, luB.players, true)}</div>
      </div>
    `;
  }

  // ---------------- Util ----------------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------- Init awal ----------------
  authStatus.textContent = 'Memuat data dari GitHub...';
  await DB.init();
  applyAuthUI();
  renderDaftarTimTersimpan();
  renderFormPertandingan();
  renderKlasemen();
  renderTopSkor();
  renderFormStartingXI();
});
