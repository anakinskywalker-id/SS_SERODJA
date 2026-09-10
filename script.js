/**
 * script.js
 * -----------------------------------------------------------------------
 * Logika UI aplikasi liga sepakbola berbasis GitHub.
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
    renderTimAwalVsKelola();
    renderFormPertandingan();
    renderFormStartingXI();
    renderKlasemen();
    renderTopSkor();
  }

  function handleWriteError(err) {
    console.error(err);
    showToast(err.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
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
  const timAwalArea = document.getElementById('tim-awal-area');
  const tambahTimArea = document.getElementById('tambah-tim-area');
  const formTambahTim = document.getElementById('form-tambah-tim');
  const inputNamaTimBaru = document.getElementById('input-nama-tim-baru');

  // Kalau belum ada tim sama sekali: tampilkan form "buat slot awal" (cara
  // cepat isi banyak tim sekaligus). Kalau sudah ada minimal 1 tim:
  // sembunyikan form itu, tampilkan form "+ Tambah Tim" satuan supaya
  // tim baru bisa ditambah tanpa menghapus pertandingan/starting XI yang
  // sudah ada.
  function renderTimAwalVsKelola() {
    const adaTim = DB.getTeams().length > 0;
    timAwalArea.hidden = adaTim;
    tambahTimArea.hidden = !adaTim;
  }

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
      showToast('Mohon isi semua nama tim.', 'error');
      return;
    }
    const hasDuplicate = new Set(names.map((n) => n.toLowerCase())).size !== names.length;
    if (hasDuplicate) {
      showToast('Nama tim tidak boleh sama antara satu dengan yang lain.', 'error');
      return;
    }

    btnSimpanTim.disabled = true;
    btnSimpanTim.textContent = 'Menyimpan ke GitHub...';
    try {
      await DB.setTeams(names);
      renderDaftarTimTersimpan();
      renderFormPertandingan();
      renderFormStartingXI();
      renderTimAwalVsKelola();
      showToast('Tim berhasil disimpan. Kompetisi siap dimulai!');
      switchTab('pertandingan');
    } catch (err) {
      handleWriteError(err);
    } finally {
      btnSimpanTim.disabled = false;
      btnSimpanTim.textContent = 'Simpan Tim & Mulai Kompetisi';
    }
  });

  formTambahTim.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = inputNamaTimBaru.value.trim();
    if (!name) return;

    const existing = DB.getTeams();
    if (existing.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      showToast('Nama tim itu sudah ada.', 'error');
      return;
    }

    const submitBtn = formTambahTim.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await DB.addTeam(name);
      inputNamaTimBaru.value = '';
      renderDaftarTimTersimpan();
      renderFormPertandingan();
      renderFormStartingXI();
      showToast(`Tim "${name}" berhasil ditambahkan.`);
    } catch (err) {
      handleWriteError(err);
    } finally {
      submitBtn.disabled = false;
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
      renderTimAwalVsKelola();
      showToast('Semua data berhasil dihapus.');
    } catch (err) {
      handleWriteError(err);
    }
  });

  function renderDaftarTimTersimpan() {
    const teams = DB.getTeams();
    const loggedIn = DB.isLoggedIn();
    if (teams.length === 0) {
      daftarTimTersimpan.innerHTML = '';
      return;
    }
    daftarTimTersimpan.innerHTML = `
      <h3>Tim Terdaftar (${teams.length})</h3>
      <div class="saved-teams__list">
        ${teams
          .map(
            (t) => `
          <span class="chip chip--editable" data-team-id="${t.id}">
            <span class="chip__label chip__label--clickable" data-show-lineup="${t.id}" title="Klik untuk lihat line up">${escapeHtml(t.name)}</span>
            ${loggedIn ? `
            <button type="button" class="chip__btn" data-edit-team="${t.id}" title="Ubah nama">&#9998;</button>
            <button type="button" class="chip__btn chip__btn--danger" data-delete-team="${t.id}" title="Hapus tim">&times;</button>` : ''}
          </span>`
          )
          .join('')}
      </div>
    `;

    daftarTimTersimpan.querySelectorAll('[data-edit-team]').forEach((btn) => {
      btn.addEventListener('click', () => startEditTeam(btn.dataset.editTeam));
    });
    daftarTimTersimpan.querySelectorAll('[data-delete-team]').forEach((btn) => {
      btn.addEventListener('click', () => handleDeleteTeam(btn.dataset.deleteTeam));
    });
    daftarTimTersimpan.querySelectorAll('[data-show-lineup]').forEach((el) => {
      el.addEventListener('click', () => toggleTeamLineupPreview(el.dataset.showLineup));
    });
  }

  let previewedTeamId = null;
  function toggleTeamLineupPreview(teamId) {
    const previewBox = document.getElementById('tim-lineup-preview');
    if (previewedTeamId === teamId) {
      previewedTeamId = null;
      previewBox.innerHTML = '';
      return;
    }
    previewedTeamId = teamId;

    const team = DB.getTeams().find((t) => t.id === teamId);
    const lu = DB.getAllLineups()[teamId];

    if (!team) { previewBox.innerHTML = ''; return; }

    if (!lu) {
      previewBox.innerHTML = `
        <div class="lineup-card">
          <div class="lineup-card__head"><h4>${escapeHtml(team.name)}</h4></div>
          <p class="empty-note">Tim ini belum punya Line Up tersimpan.</p>
        </div>`;
      return;
    }

    previewBox.innerHTML = buildLineupCardHtml(team, lu);
    wireLineupCardShareButtons(previewBox);
  }


  function startEditTeam(teamId) {
    const chip = daftarTimTersimpan.querySelector(`.chip[data-team-id="${teamId}"]`);
    const team = DB.getTeams().find((t) => t.id === teamId);
    if (!chip || !team) return;

    chip.innerHTML = `
      <input type="text" class="chip__edit-input" value="${escapeHtml(team.name)}">
      <button type="button" class="chip__btn" data-save-team="${teamId}" title="Simpan">&#10003;</button>
      <button type="button" class="chip__btn" data-cancel-edit-team title="Batal">&times;</button>
    `;
    const input = chip.querySelector('.chip__edit-input');
    input.focus();
    input.select();

    const save = async () => {
      const newName = input.value.trim();
      if (!newName) return;
      try {
        await DB.updateTeamName(teamId, newName);
        renderDaftarTimTersimpan();
        renderFormPertandingan();
        renderFormStartingXI();
        renderRiwayatPertandingan();
        showToast('Nama tim berhasil diperbarui.');
      } catch (err) {
        handleWriteError(err);
      }
    };

    chip.querySelector('[data-save-team]').addEventListener('click', save);
    chip.querySelector('[data-cancel-edit-team]').addEventListener('click', () => renderDaftarTimTersimpan());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') renderDaftarTimTersimpan();
    });
  }

  async function handleDeleteTeam(teamId) {
    const team = DB.getTeams().find((t) => t.id === teamId);
    if (!team) return;
    if (!confirm(`Hapus tim "${team.name}"? Pertandingan yang melibatkan tim ini akan tetap tersimpan (ditandai "tim dihapus"), tapi starting XI tim ini akan ikut terhapus.`)) return;
    try {
      await DB.deleteTeam(teamId);
      renderDaftarTimTersimpan();
      renderFormPertandingan();
      renderFormStartingXI();
      renderRiwayatPertandingan();
      renderTimAwalVsKelola();
      showToast(`Tim "${team.name}" berhasil dihapus.`);
    } catch (err) {
      handleWriteError(err);
    }
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
  const counterGolA = document.getElementById('counter-gol-a');
  const counterGolB = document.getElementById('counter-gol-b');
  const pertandinganWarning = document.getElementById('pertandingan-warning');
  const scorerWarning = document.getElementById('scorer-warning');
  const btnSubmitPertandingan = document.getElementById('btn-submit-pertandingan');
  const btnBatalEditPertandingan = document.getElementById('btn-batal-edit-pertandingan');

  let editingMatchId = null; // null = mode "tambah baru", isi = sedang mengedit match ini

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

  // Counter real-time: tampilkan "X dari Y gol terisi" saat mengetik,
  // supaya tidak perlu klik submit dulu baru tahu jumlahnya belum cocok.
  function updateGoalCounters() {
    const totalA = readScorerRows(scorerListA).reduce((sum, s) => sum + s.goals, 0);
    const totalB = readScorerRows(scorerListB).reduce((sum, s) => sum + s.goals, 0);
    const targetA = parseInt(skorA.value, 10);
    const targetB = parseInt(skorB.value, 10);

    function setCounter(el, total, target) {
      if (isNaN(target)) {
        el.textContent = `(${total} gol dicatat)`;
        el.classList.remove('scorer-counter--ok', 'scorer-counter--off');
        return;
      }
      el.textContent = `(${total} dari ${target} gol)`;
      el.classList.toggle('scorer-counter--ok', total === target);
      el.classList.toggle('scorer-counter--off', total !== target);
    }
    setCounter(counterGolA, totalA, targetA);
    setCounter(counterGolB, totalB, targetB);
  }

  skorA.addEventListener('input', updateGoalCounters);
  skorB.addEventListener('input', updateGoalCounters);
  scorerListA.addEventListener('input', updateGoalCounters);
  scorerListB.addEventListener('input', updateGoalCounters);

  function addScorerRow(side, playerVal = '', goalsVal = 1) {
    const container = side === 'a' ? scorerListA : scorerListB;
    const row = document.createElement('div');
    row.className = 'scorer-row';
    row.innerHTML = `
      <input type="text" placeholder="Nama pemain" class="scorer-player" value="${escapeHtml(playerVal)}">
      <input type="number" min="1" value="${goalsVal}" class="scorer-goals">
      <button type="button" class="scorer-row__remove" title="Hapus">&times;</button>
    `;
    row.querySelector('.scorer-row__remove').addEventListener('click', () => {
      row.remove();
      updateGoalCounters();
    });
    container.appendChild(row);
    updateGoalCounters();
  }

  function resetFormPertandinganKeModeTambah() {
    editingMatchId = null;
    formPertandingan.reset();
    scorerListA.innerHTML = '';
    scorerListB.innerHTML = '';
    btnSubmitPertandingan.textContent = 'Simpan Hasil Pertandingan';
    btnBatalEditPertandingan.hidden = true;
    updateScorerLabels();
    updateGoalCounters();
  }

  btnBatalEditPertandingan.addEventListener('click', resetFormPertandinganKeModeTambah);

  function startEditMatch(matchId) {
    const match = DB.getMatches().find((m) => m.id === matchId);
    if (!match) return;

    editingMatchId = matchId;
    selectTimA.value = match.teamAId;
    selectTimB.value = match.teamBId;
    skorA.value = match.scoreA;
    skorB.value = match.scoreB;
    scorerListA.innerHTML = '';
    scorerListB.innerHTML = '';
    match.scorersA.forEach((s) => addScorerRow('a', s.player, s.goals));
    match.scorersB.forEach((s) => addScorerRow('b', s.player, s.goals));

    updateScorerLabels();
    updateGoalCounters();
    btnSubmitPertandingan.textContent = 'Perbarui Pertandingan';
    btnBatalEditPertandingan.hidden = false;
    formPertandingan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formPertandingan.addEventListener('submit', async (e) => {
    e.preventDefault();

    const teamAId = selectTimA.value;
    const teamBId = selectTimB.value;
    if (teamAId === teamBId) {
      showToast('Tim tuan rumah dan tim tamu tidak boleh sama.', 'error');
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

    btnSubmitPertandingan.disabled = true;
    const originalLabel = btnSubmitPertandingan.textContent;
    btnSubmitPertandingan.textContent = 'Menyimpan ke GitHub...';
    try {
      if (editingMatchId) {
        await DB.updateMatch(editingMatchId, { teamAId, teamBId, scoreA: nA, scoreB: nB, scorersA, scorersB });
        showToast('Pertandingan berhasil diperbarui.');
      } else {
        await DB.addMatch({ teamAId, teamBId, scoreA: nA, scoreB: nB, scorersA, scorersB });
        showToast('Pertandingan berhasil disimpan.');
      }
      resetFormPertandinganKeModeTambah();
      renderRiwayatPertandingan();
    } catch (err) {
      handleWriteError(err);
    } finally {
      btnSubmitPertandingan.disabled = false;
      btnSubmitPertandingan.textContent = editingMatchId ? 'Perbarui Pertandingan' : originalLabel;
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
          <div class="match-card__actions">
            <button class="match-card__share" data-id="${m.id}" title="Bagikan sebagai gambar">&#128247;</button>
            ${loggedIn ? `
            <button class="match-card__edit" data-id="${m.id}">Edit</button>
            <button class="match-card__remove" data-id="${m.id}">Hapus</button>` : ''}
          </div>
          <div class="match-card__scorers">
            Gol ${escapeHtml(teamName(m.teamAId))}: ${scorerText(m.scorersA)} &nbsp;|&nbsp;
            Gol ${escapeHtml(teamName(m.teamBId))}: ${scorerText(m.scorersB)}
          </div>
        </div>`;
      })
      .join('');

    box.querySelectorAll('.match-card__share').forEach((btn) => {
      btn.addEventListener('click', () => shareMatch(btn.dataset.id));
    });

    box.querySelectorAll('.match-card__edit').forEach((btn) => {
      btn.addEventListener('click', () => startEditMatch(btn.dataset.id));
    });

    box.querySelectorAll('.match-card__remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus pertandingan ini dari riwayat?')) return;
        try {
          await DB.deleteMatch(btn.dataset.id);
          if (editingMatchId === btn.dataset.id) resetFormPertandinganKeModeTambah();
          renderRiwayatPertandingan();
          showToast('Pertandingan berhasil dihapus.');
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

  // ---------------- TAB 5: Line Up ----------------
  const FORMAT_INFO = {
    futsal:  { label: 'Futsal', total: 5 },
    mini:    { label: 'Mini Soccer', total: 8 },
    standar: { label: 'Sepak Bola Standar', total: 11 }
  };

  // Katalog posisi per format. `line` = jalur taktis dari kiper (0) ke lini depan (angka terbesar),
  // dipakai untuk menyusun kolom di tampilan lapangan & menghitung string formasi otomatis.
  const POSITION_CATALOG = {
    futsal: [
      { code: 'GK', label: 'Kiper', short: 'GK', line: 0 },
      { code: 'FIXO', label: 'Fixo (Bek)', short: 'FIXO', line: 1 },
      { code: 'ALA_KANAN', label: 'Ala Kanan', short: 'RW', line: 2 },
      { code: 'ALA_KIRI', label: 'Ala Kiri', short: 'LW', line: 2 },
      { code: 'PIVOT', label: 'Pivot', short: 'PIV', line: 3 }
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

  // Nama lengkap (Indonesia) — dipakai di dropdown pilihan & tooltip supaya
  // tetap jelas maksudnya saat memilih/menyusun.
  function posLabel(format, code) {
    const found = POSITION_CATALOG[format]?.find((p) => p.code === code);
    return found ? found.label : code;
  }

  // Kode singkat — dipakai di chip, kartu Line Up, dan gambar hasil share
  // supaya tidak makan tempat (CB, CMF, DMF, LMF, CF, dst).
  function posShort(format, code) {
    const found = POSITION_CATALOG[format]?.find((p) => p.code === code);
    return found ? (found.short || found.code) : code;
  }

  function posLine(format, code) {
    const found = POSITION_CATALOG[format]?.find((p) => p.code === code);
    return found ? found.line : 0;
  }

  function positionOptionsHtml(format, selectedCode) {
    return POSITION_CATALOG[format]
      .map((p) => `<option value="${p.code}" ${p.code === selectedCode ? 'selected' : ''}>${escapeHtml(p.label)} (${escapeHtml(p.short || p.code)})</option>`)
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
      showToast('Isi minimal satu nama pemain.', 'error');
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
      showToast('Line Up berhasil disimpan.');
    } catch (err) {
      handleWriteError(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Line Up';
    }
  });

  function buildLineupCardHtml(team, lu, showActions = false, withShareButton = true) {
    const formatLabel = FORMAT_INFO[lu.format]?.label || lu.format;
    return `
      <div class="lineup-card">
        <div class="lineup-card__head">
          <h4>${escapeHtml(team.name)}</h4>
          <span class="lineup-card__format">${formatLabel} &middot; ${formationString(lu.format, lu.players)}</span>
          <div class="lineup-card__actions">
            ${withShareButton ? `<button type="button" class="btn btn--ghost btn--small" data-share-lineup="${team.id}" title="Bagikan sebagai gambar">&#128247;</button>` : ''}
            ${showActions ? `
            <button type="button" class="btn btn--ghost btn--small" data-edit-lineup="${team.id}">Edit</button>
            <button type="button" class="btn btn--danger btn--small" data-delete-lineup="${team.id}">Hapus</button>` : ''}
          </div>
        </div>
        <div class="lineup-card__players">
          ${lu.players
            .map((p) => `<span class="lineup-chip ${p.positionCode === 'GK' ? 'is-gk' : ''}" title="${escapeHtml(posLabel(lu.format, p.positionCode))}">${escapeHtml(p.name)} <em>${escapeHtml(posShort(lu.format, p.positionCode))}</em></span>`)
            .join('')}
        </div>
      </div>`;
  }

  function wireLineupCardShareButtons(container) {
    container.querySelectorAll('[data-share-lineup]').forEach((btn) => {
      btn.addEventListener('click', () => shareLineup(btn.dataset.shareLineup));
    });
  }

  function renderDaftarLineupTersimpan() {
    const teams = DB.getTeams();
    const lineups = DB.getAllLineups();
    const teamsWithLineup = teams.filter((t) => lineups[t.id]);
    const loggedIn = DB.isLoggedIn();

    if (teamsWithLineup.length === 0) {
      daftarLineupTersimpan.innerHTML = `<p class="empty-note">Belum ada line up yang tersimpan.</p>`;
      return;
    }

    daftarLineupTersimpan.innerHTML = teamsWithLineup
      .map((t) => buildLineupCardHtml(t, lineups[t.id], loggedIn))
      .join('');

    wireLineupCardShareButtons(daftarLineupTersimpan);

    daftarLineupTersimpan.querySelectorAll('[data-edit-lineup]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectLineupTim.value = btn.dataset.editLineup;
        loadLineupIntoForm(btn.dataset.editLineup);
        formStartingXI.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    daftarLineupTersimpan.querySelectorAll('[data-delete-lineup]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus line up tim ini?')) return;
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
    const prevA = selectPitchA.value;
    const prevB = selectPitchB.value;
    selectPitchA.innerHTML = optionsHtml;
    selectPitchB.innerHTML = optionsHtml;
    // Pertahankan pilihan sebelumnya kalau tim itu masih ada; kalau tidak, pakai default.
    if (teamsWithLineup.some((t) => t.id === prevA)) selectPitchA.value = prevA;
    if (teamsWithLineup.some((t) => t.id === prevB)) {
      selectPitchB.value = prevB;
    } else if (teamsWithLineup.length > 1) {
      selectPitchB.selectedIndex = 1;
    }

    renderPitchPreviewFromSelects();
  }

  function renderPitchPreviewFromSelects() {
    const teamAId = selectPitchA.value;
    const teamBId = selectPitchB.value;
    if (!teamAId || !teamBId) return;
    if (teamAId === teamBId) {
      pitchPreviewWrap.innerHTML = `<p class="empty-note">Pilih dua tim yang berbeda untuk melihat perbandingan formasi.</p>`;
      return;
    }
    renderPitchPreview(teamAId, teamBId);
  }

  selectPitchA.addEventListener('change', renderPitchPreviewFromSelects);
  selectPitchB.addEventListener('change', renderPitchPreviewFromSelects);

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
                <div class="pitch__player-pos">${escapeHtml(posShort(format, p.positionCode))}</div>
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

  function slugifyAppName() {
    const name = (APP_CONFIG.APP_NAME || 'liga-kandang').toLowerCase();
    return name.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'liga-kandang';
  }

  function applyAppBranding() {
    const name = APP_CONFIG.APP_NAME || 'Liga Kandang';
    document.getElementById('page-title').textContent = `${name} — Pencatat Kompetisi Sepakbola`;
    document.getElementById('brand-name-text').textContent = name;
    document.getElementById('hero-title').textContent = name.toLowerCase().startsWith('liga') ? name : `Liga ${name}`;
  }

  const toastContainer = document.getElementById('toast-container');
  function showToast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.textContent = message;
    toastContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  // ---------------- Fitur Share / Unduh JPEG ----------------
  // Membuat kartu HTML tersembunyi (di luar layar) berisi konten yang mau
  // dibagikan, "memotretnya" jadi gambar pakai html2canvas, lalu:
  // - Kalau perangkat mendukung Web Share API dengan file (kebanyakan HP),
  //   langsung buka menu share bawaan (bisa langsung ke WhatsApp dsb.)
  // - Kalau tidak, otomatis unduh sebagai file .jpg

  function exportHeaderHtml(subtitle) {
    return `
      <div class="export-card__header">
        <span class="export-card__dot"></span>
        <span class="export-card__brand">${escapeHtml(APP_CONFIG.APP_NAME || 'Liga Kandang')}</span>
      </div>
      <div class="export-card__subtitle">${escapeHtml(subtitle)}</div>
    `;
  }

  const EXPORT_FOOTER_HTML = `<div class="export-card__footer">Dibuat dengan ${escapeHtml(APP_CONFIG.APP_NAME || 'Liga Kandang')}</div>`;

  async function exportHtmlToJpeg(innerHtml, filename, shareTitle, width = 640) {
    const wrapper = document.createElement('div');
    wrapper.className = 'export-card';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = width + 'px';
    wrapper.innerHTML = innerHtml;
    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(wrapper, {
        backgroundColor: '#0D0018',
        scale: 2,
        useCORS: true
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      let shared = false;
      if (navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: shareTitle });
            shared = true;
          }
        } catch (shareErr) {
          // Kalau user membatalkan share (AbortError), jangan lanjut fallback unduh.
          if (shareErr && shareErr.name === 'AbortError') { shared = true; }
        }
      }

      if (!shared) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Gambar berhasil diunduh.');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat gambar untuk dibagikan.', 'error');
    } finally {
      wrapper.remove();
    }
  }

  async function shareStandings() {
    const standings = hitungKlasemen();
    if (standings.length === 0) {
      showToast('Belum ada data klasemen untuk dibagikan.', 'error');
      return;
    }
    const rows = standings
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

    const html = `
      ${exportHeaderHtml('Klasemen')}
      <table class="standings" style="width:100%">
        <thead><tr>
          <th class="col-rank">#</th><th class="col-team">Tim</th><th>M</th><th>M</th><th>S</th><th>K</th><th>GM</th><th>GK</th><th>SG</th><th class="col-pts">Poin</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${EXPORT_FOOTER_HTML}
    `;
    await exportHtmlToJpeg(html, `klasemen-${slugifyAppName()}.jpg`, `Klasemen ${APP_CONFIG.APP_NAME || 'Liga Kandang'}`);
  }

  async function shareTopSkor() {
    const scorers = hitungTopSkor();
    if (scorers.length === 0) {
      showToast('Belum ada data top skor untuk dibagikan.', 'error');
      return;
    }
    const rows = scorers
      .map(
        (s, i) => `
        <div class="topscorer-row">
          <div class="topscorer-row__rank">${i + 1}</div>
          <div>
            <div class="topscorer-row__player">${escapeHtml(s.player)}</div>
            <div class="topscorer-row__team">${escapeHtml(s.team)}</div>
          </div>
          <div></div>
          <div class="topscorer-row__goals">${s.goals} gol</div>
        </div>`
      )
      .join('');

    const html = `
      ${exportHeaderHtml('Top Skor')}
      <div class="topscorer-list">${rows}</div>
      ${EXPORT_FOOTER_HTML}
    `;
    await exportHtmlToJpeg(html, `top-skor-${slugifyAppName()}.jpg`, `Top Skor ${APP_CONFIG.APP_NAME || 'Liga Kandang'}`);
  }

  async function shareMatch(matchId) {
    const match = DB.getMatches().find((m) => m.id === matchId);
    if (!match) return;
    const teams = DB.getTeams();
    const teamName = (id) => teams.find((t) => t.id === id)?.name || '(tim dihapus)';
    const scorerText = (list) => list.map((s) => `${escapeHtml(s.player)} (${s.goals})`).join(', ') || '&mdash;';

    const html = `
      ${exportHeaderHtml('Hasil Pertandingan')}
      <div class="export-match__score">
        <span>${escapeHtml(teamName(match.teamAId))}</span>
        <b>${match.scoreA} &ndash; ${match.scoreB}</b>
        <span>${escapeHtml(teamName(match.teamBId))}</span>
      </div>
      <div class="export-match__scorers">
        <div><em>${escapeHtml(teamName(match.teamAId))}</em><br>${scorerText(match.scorersA)}</div>
        <div><em>${escapeHtml(teamName(match.teamBId))}</em><br>${scorerText(match.scorersB)}</div>
      </div>
      ${EXPORT_FOOTER_HTML}
    `;
    await exportHtmlToJpeg(html, `hasil-pertandingan-${slugifyAppName()}.jpg`, `Hasil Pertandingan ${APP_CONFIG.APP_NAME || 'Liga Kandang'}`);
  }

  // Hitung posisi X (garis lini, kiper=paling kiri sampai penyerang=paling
  // kanan) dan Y (menyebar rata secara vertikal antar pemain di lini yang
  // sama) untuk tiap pemain, dipakai menempatkan pill di lapangan perspektif.
  function computePitchPositions(format, players) {
    const catalog = POSITION_CATALOG[format];
    const maxLine = Math.max(...catalog.map((p) => p.line));
    const byLine = {};
    players.forEach((p) => {
      const line = posLine(format, p.positionCode);
      if (!byLine[line]) byLine[line] = [];
      byLine[line].push(p);
    });

    const positioned = [];
    Object.keys(byLine).forEach((lineKey) => {
      const line = parseInt(lineKey, 10);
      const group = byLine[line];
      const x = 10 + (maxLine === 0 ? 0 : (line / maxLine) * 72);
      group.forEach((p, i) => {
        const count = group.length;
        const y = count === 1 ? 50 : 15 + i * (70 / (count - 1));
        positioned.push({ player: p, x, y, isGK: p.positionCode === 'GK' });
      });
    });
    return positioned;
  }

  function buildLineupPitchExportHtml(team, lu) {
    const appName = APP_CONFIG.APP_NAME || 'Liga Kandang';
    const formatLabel = FORMAT_INFO[lu.format]?.label || lu.format;
    const positions = computePitchPositions(lu.format, lu.players);

    const pillsHtml = positions
      .map(
        (pos) => `
        <div class="export-pitch__player ${pos.isGK ? 'is-gk' : ''}" style="left:${pos.x}%; top:${pos.y}%;">
          ${pos.isGK ? '<span class="export-pitch__gk-badge">GK</span>' : ''}
          <span class="export-pitch__name">${escapeHtml(pos.player.name)}</span>
          <span class="export-pitch__sep">|</span>
          <span class="export-pitch__pos">${escapeHtml(posShort(lu.format, pos.player.positionCode))}</span>
        </div>`
      )
      .join('');

    return `
      <div class="export-pitch-card__head">
        <div class="export-pitch-card__brand">
          <svg class="export-pitch-card__crest" viewBox="0 0 24 24" width="52" height="52">
            <defs>
              <linearGradient id="crestGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#04F5FF"/>
                <stop offset="50%" stop-color="#00FF85"/>
                <stop offset="100%" stop-color="#E90052"/>
              </linearGradient>
            </defs>
            <path d="M12 2 L21 5 V11 C21 16 17 20 12 22 C7 20 3 16 3 11 V5 Z" fill="url(#crestGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
          </svg>
          <div>
            <div class="export-pitch-card__title">${escapeHtml(appName)} <span class="export-pitch-card__title-sep">|</span> Line Up</div>
            <div class="export-pitch-card__subtitle">Tim ${escapeHtml(team.name)}</div>
          </div>
        </div>
        <div class="export-pitch-card__badge">${escapeHtml(formatLabel.toUpperCase())} &middot; ${formationString(lu.format, lu.players)}</div>
      </div>

      <div class="export-pitch">
        <svg class="export-pitch__svg" viewBox="0 0 1000 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pitchFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="rgba(255,255,255,0.07)"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0.015)"/>
            </linearGradient>
          </defs>
          <polygon points="50,0 950,0 1000,500 0,500" fill="url(#pitchFill)" stroke="rgba(255,255,255,0.28)" stroke-width="3"/>
          <ellipse cx="1000" cy="250" rx="140" ry="140" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
          <rect x="2" y="100" width="128" height="300" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>
        </svg>
        ${pillsHtml}
      </div>

      <div class="export-card__footer export-card__footer--fancy">
        <span>&#10148;</span> PRODUCED WITH <strong>${escapeHtml(appName.toUpperCase())} ANALYTICS</strong> <span>&#10148;</span>
      </div>
    `;
  }

  async function shareLineup(teamId) {
    const team = DB.getTeams().find((t) => t.id === teamId);
    const lu = DB.getAllLineups()[teamId];
    if (!team || !lu) {
      showToast('Tim ini belum punya Line Up tersimpan.', 'error');
      return;
    }
    const html = buildLineupPitchExportHtml(team, lu);
    await exportHtmlToJpeg(html, `lineup-${team.name}-${slugifyAppName()}.jpg`, `Line Up ${team.name}`, 960);
  }

  document.getElementById('btn-share-klasemen').addEventListener('click', shareStandings);
  document.getElementById('btn-share-topskor').addEventListener('click', shareTopSkor);

  // ---------------- Init awal ----------------
  applyAppBranding();
  authStatus.textContent = 'Memuat data dari GitHub...';
  await DB.init();
  applyAuthUI();
  renderDaftarTimTersimpan();
  renderTimAwalVsKelola();
  renderFormPertandingan();
  renderKlasemen();
  renderTopSkor();
  renderFormStartingXI();
});
