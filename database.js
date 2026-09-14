/**
 * database.js
 * -----------------------------------------------------------------------
 * Lapisan "database" untuk aplikasi Liga Sepakbola — versi tersambung ke
 * GitHub lewat Worker (lihat /worker/liga-worker.js dan DEPLOY.md).
 *
 * Cara kerja:
 * - MEMBACA data: langsung ambil file JSON public dari GitHub
 *   (APP_CONFIG.GITHUB_RAW_URL). Siapa pun bisa, tanpa login.
 * - MENULIS data: hanya bisa kalau sudah login sebagai admin (lewat
 *   DB.login()). Permintaan tulis dikirim ke Worker (APP_CONFIG.WORKER_URL),
 *   yang memverifikasi sesi lalu men-commit perubahan ke GitHub atas nama
 *   Worker (memakai token rahasia yang tidak pernah dikirim ke browser).
 *
 * Struktur data — dipecah per MUSIM/KOMPETISI supaya data lama tidak
 * pernah tertimpa saat mulai musim baru:
 * {
 *   musim: [{ id, name, createdAt }],
 *   dataByMusim: {
 *     [musimId]: {
 *       teams:   [{ id, name }],
 *       matches: [{ id, teamAId, teamBId, scoreA, scoreB, scorersA, scorersB, date, createdAt }],
 *       lineups: { [teamId]: { format, players: [{ id, name, positionCode }] } }
 *     }
 *   }
 * }
 *
 * "Musim yang sedang dilihat" (_viewingMusimId) murni penanda LOKAL di
 * browser masing-masing orang — beralih musim untuk MELIHAT tidak
 * memerlukan tulis apa pun ke GitHub. Hanya membuat/mengganti nama/hapus
 * musim yang benar-benar menyimpan perubahan.
 * -----------------------------------------------------------------------
 */

const DB = (() => {
  const SESSION_KEY = 'liga_admin_session';

  let _cache = null;          // data yang sedang dipakai UI (hasil fetch terakhir)
  let _usingFallback = false; // true kalau gagal ambil data dari GitHub (mis. file belum ada)
  let _viewingMusimId = null; // musim mana yang sedang ditampilkan (lokal, tidak disimpan)

  function _emptyMusimData() {
    return { teams: [], matches: [], lineups: {} };
  }

  function _genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  // Migrasi otomatis: kalau data yang diambil masih format lama (tanpa
  // konsep musim) atau kosong, bungkus jadi 1 musim default supaya data
  // lama tidak hilang.
  function _migrateIfNeeded(raw) {
    if (raw && Array.isArray(raw.musim) && raw.musim.length > 0 && raw.dataByMusim && typeof raw.dataByMusim === 'object') {
      // Sudah format baru — pastikan tiap musim punya bentuk data yang lengkap.
      const dataByMusim = {};
      raw.musim.forEach((m) => {
        const d = raw.dataByMusim[m.id] || {};
        dataByMusim[m.id] = {
          teams: Array.isArray(d.teams) ? d.teams : [],
          matches: Array.isArray(d.matches) ? d.matches : [],
          lineups: d && typeof d.lineups === 'object' && d.lineups !== null ? d.lineups : {}
        };
      });
      return { musim: raw.musim, dataByMusim };
    }

    // Format lama (atau file belum ada sama sekali) — bungkus jadi 1 musim.
    const legacyTeams = Array.isArray(raw?.teams) ? raw.teams : [];
    const legacyMatches = Array.isArray(raw?.matches) ? raw.matches : [];
    const legacyLineups = raw && typeof raw.lineups === 'object' && raw.lineups !== null ? raw.lineups : {};

    const defaultId = _genId('musim');
    return {
      musim: [{ id: defaultId, name: `Musim ${new Date().getFullYear()}`, createdAt: new Date().toISOString() }],
      dataByMusim: { [defaultId]: { teams: legacyTeams, matches: legacyMatches, lineups: legacyLineups } }
    };
  }

  // ---------- Muat data awal dari GitHub ----------

  async function init() {
    try {
      const bust = Date.now(); // hindari cache CDN/browser supaya selalu dapat data terbaru
      const res = await fetch(`${APP_CONFIG.GITHUB_RAW_URL}?_=${bust}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Status ' + res.status);
      const json = await res.json();
      _cache = _migrateIfNeeded(json);
      _usingFallback = false;
    } catch (err) {
      console.warn('Gagal memuat data dari GitHub, memakai data kosong sementara:', err);
      _cache = _migrateIfNeeded(null);
      _usingFallback = true;
    }
    // Default: tampilkan musim yang paling baru dibuat.
    _viewingMusimId = _cache.musim[_cache.musim.length - 1].id;
    return _cache;
  }

  function isUsingFallback() {
    return _usingFallback;
  }

  // ---------- Sesi Admin ----------

  function _saveSession(token, expiresAt) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt }));
  }

  function _readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session.token || !session.expiresAt || session.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (err) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!_readSession();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function login(username, password) {
    const res = await fetch(`${APP_CONFIG.WORKER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Login gagal.');
    }
    _saveSession(body.token, body.expiresAt);
    return true;
  }

  // ---------- Kirim perubahan ke Worker (commit ke GitHub) ----------

  async function _persistRemote(newData) {
    const session = _readSession();
    if (!session) {
      const err = new Error('Anda harus login sebagai admin untuk menyimpan perubahan.');
      err.code = 'NOT_LOGGED_IN';
      throw err;
    }

    const res = await fetch(`${APP_CONFIG.WORKER_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify(newData)
    });

    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      logout();
      const err = new Error('Sesi admin sudah berakhir. Silakan login kembali.');
      err.code = 'AUTH_EXPIRED';
      throw err;
    }
    if (!res.ok) {
      const err = new Error(body.error || 'Gagal menyimpan perubahan ke GitHub.');
      err.code = 'SAVE_FAILED';
      throw err;
    }
    return body;
  }

  // Ambil data musim yang sedang dilihat (tidak pernah null/undefined).
  function _activeData() {
    if (!_cache) return _emptyMusimData();
    return _cache.dataByMusim[_viewingMusimId] || _emptyMusimData();
  }

  // Terapkan perubahan HANYA ke musim yang sedang dilihat, lalu simpan
  // seluruh blob (semua musim lain ikut terbawa apa adanya, tidak tersentuh).
  async function _updateActiveData(mutator) {
    const current = _activeData();
    const updated = mutator(current);
    const newData = {
      ..._cache,
      dataByMusim: { ..._cache.dataByMusim, [_viewingMusimId]: updated }
    };
    await _persistRemote(newData);
    _cache = newData;
    return updated;
  }

  // ---------- MUSIM / KOMPETISI ----------

  function getMusimList() {
    return _cache ? _cache.musim.slice() : [];
  }

  function getViewingMusimId() {
    return _viewingMusimId;
  }

  // Ganti musim yang sedang DILIHAT. Ini murni state lokal (tidak menulis
  // apa pun ke GitHub) — siapa pun (termasuk pengunjung tanpa login) boleh
  // beralih-alih musim untuk sekadar melihat riwayat.
  function setViewingMusim(musimId) {
    if (_cache && _cache.dataByMusim[musimId]) {
      _viewingMusimId = musimId;
    }
  }

  async function createMusim(name) {
    const newId = _genId('musim');
    const newMusim = { id: newId, name: name.trim(), createdAt: new Date().toISOString() };
    const newData = {
      ..._cache,
      musim: [..._cache.musim, newMusim],
      dataByMusim: { ..._cache.dataByMusim, [newId]: _emptyMusimData() }
    };
    await _persistRemote(newData);
    _cache = newData;
    _viewingMusimId = newId;
    return newMusim;
  }

  async function renameMusim(musimId, newName) {
    const newMusimList = _cache.musim.map((m) => (m.id === musimId ? { ...m, name: newName.trim() } : m));
    const newData = { ..._cache, musim: newMusimList };
    await _persistRemote(newData);
    _cache = newData;
  }

  async function deleteMusim(musimId) {
    if (_cache.musim.length <= 1) {
      throw new Error('Tidak bisa menghapus musim terakhir yang tersisa — minimal harus ada 1 musim.');
    }
    const newMusimList = _cache.musim.filter((m) => m.id !== musimId);
    const newDataByMusim = { ..._cache.dataByMusim };
    delete newDataByMusim[musimId];
    const newData = { ..._cache, musim: newMusimList, dataByMusim: newDataByMusim };
    await _persistRemote(newData);
    _cache = newData;
    if (_viewingMusimId === musimId) {
      _viewingMusimId = newMusimList[newMusimList.length - 1].id;
    }
  }

  // ---------- TEAMS ----------

  function getTeams() {
    return _activeData().teams;
  }

  async function setTeams(teamNames) {
    const newTeams = teamNames.map((name) => ({ id: _genId('team'), name: name.trim() }));
    const updated = await _updateActiveData(() => ({ teams: newTeams, matches: [], lineups: {} }));
    return updated.teams;
  }

  // Tambah satu tim baru TANPA menghapus pertandingan/lineup yang sudah ada.
  async function addTeam(name) {
    const newTeam = { id: _genId('team'), name: name.trim() };
    await _updateActiveData((cur) => ({ ...cur, teams: [...cur.teams, newTeam] }));
    return newTeam;
  }

  // Ganti nama tim. ID tidak berubah, jadi pertandingan & lineup yang sudah
  // ada tetap terhubung otomatis ke nama barunya.
  async function updateTeamName(teamId, newName) {
    await _updateActiveData((cur) => ({
      ...cur,
      teams: cur.teams.map((t) => (t.id === teamId ? { ...t, name: newName.trim() } : t))
    }));
  }

  // Hapus satu tim. Pertandingan yang melibatkan tim ini TETAP disimpan
  // (akan tampil sebagai "(tim dihapus)"), hanya lineup tim ini yang ikut
  // dibersihkan karena sudah tidak relevan.
  async function deleteTeam(teamId) {
    await _updateActiveData((cur) => {
      const newLineups = { ...cur.lineups };
      delete newLineups[teamId];
      return { ...cur, teams: cur.teams.filter((t) => t.id !== teamId), lineups: newLineups };
    });
  }

  // ---------- MATCHES ----------

  function getMatches() {
    return _activeData().matches;
  }

  async function addMatch(match) {
    const newMatch = { id: _genId('match'), createdAt: new Date().toISOString(), ...match };
    await _updateActiveData((cur) => ({ ...cur, matches: [...cur.matches, newMatch] }));
    return newMatch;
  }

  async function deleteMatch(matchId) {
    await _updateActiveData((cur) => ({ ...cur, matches: cur.matches.filter((m) => m.id !== matchId) }));
  }

  // Perbarui pertandingan yang sudah tersimpan (skor/pencetak gol/tanggal
  // salah ketik dsb.) tanpa perlu hapus lalu input ulang dari nol.
  async function updateMatch(matchId, updatedFields) {
    await _updateActiveData((cur) => ({
      ...cur,
      matches: cur.matches.map((m) => (m.id === matchId ? { ...m, ...updatedFields } : m))
    }));
  }

  // ---------- LINE UP ----------

  function getLineup(teamId) {
    return _activeData().lineups[teamId] || null;
  }

  function getAllLineups() {
    return _activeData().lineups;
  }

  async function saveLineup(teamId, format, players) {
    await _updateActiveData((cur) => ({ ...cur, lineups: { ...cur.lineups, [teamId]: { format, players } } }));
    return _activeData().lineups[teamId];
  }

  async function deleteLineup(teamId) {
    await _updateActiveData((cur) => {
      const newLineups = { ...cur.lineups };
      delete newLineups[teamId];
      return { ...cur, lineups: newLineups };
    });
  }

  // ---------- RESET ----------

  // Hanya mengosongkan musim yang SEDANG DILIHAT — musim lain tidak ikut terhapus.
  async function resetAll() {
    await _updateActiveData(() => _emptyMusimData());
    return _activeData();
  }

  return {
    init,
    isUsingFallback,
    isLoggedIn,
    login,
    logout,
    getMusimList,
    getViewingMusimId,
    setViewingMusim,
    createMusim,
    renameMusim,
    deleteMusim,
    getTeams,
    setTeams,
    addTeam,
    updateTeamName,
    deleteTeam,
    getMatches,
    addMatch,
    deleteMatch,
    updateMatch,
    getLineup,
    getAllLineups,
    saveLineup,
    deleteLineup,
    resetAll
  };
})();
