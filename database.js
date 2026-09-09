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
 * Struktur data (sama seperti versi localStorage sebelumnya):
 * {
 *   teams:   [{ id, name }],
 *   matches: [{ id, teamAId, teamBId, scoreA, scoreB, scorersA, scorersB, createdAt }],
 *   lineups: { [teamId]: { format, players: [{ id, name, positionCode }] } }
 * }
 * -----------------------------------------------------------------------
 */

const DB = (() => {
  const SESSION_KEY = 'liga_admin_session';

  let _cache = null;        // data yang sedang dipakai UI (hasil fetch terakhir)
  let _usingFallback = false; // true kalau gagal ambil data dari GitHub (mis. file belum ada)

  function _defaultData() {
    return { teams: [], matches: [], lineups: {} };
  }

  function _normalize(data) {
    return {
      teams: Array.isArray(data?.teams) ? data.teams : [],
      matches: Array.isArray(data?.matches) ? data.matches : [],
      lineups: data && typeof data.lineups === 'object' && data.lineups !== null ? data.lineups : {}
    };
  }

  function _genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Muat data awal dari GitHub ----------

  async function init() {
    try {
      const bust = Date.now(); // hindari cache CDN/browser supaya selalu dapat data terbaru
      const res = await fetch(`${APP_CONFIG.GITHUB_RAW_URL}?_=${bust}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Status ' + res.status);
      const json = await res.json();
      _cache = _normalize(json);
      _usingFallback = false;
    } catch (err) {
      console.warn('Gagal memuat data dari GitHub, memakai data kosong sementara:', err);
      _cache = _defaultData();
      _usingFallback = true;
    }
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

  // ---------- TEAMS ----------

  function getTeams() {
    return _cache ? _cache.teams : [];
  }

  async function setTeams(teamNames) {
    const newData = {
      ..._cache,
      teams: teamNames.map((name) => ({ id: _genId('team'), name: name.trim() })),
      matches: [],
      lineups: {}
    };
    await _persistRemote(newData);
    _cache = newData;
    return _cache.teams;
  }

  // Tambah satu tim baru TANPA menghapus pertandingan/starting XI yang sudah ada.
  async function addTeam(name) {
    const newTeam = { id: _genId('team'), name: name.trim() };
    const newData = { ..._cache, teams: [..._cache.teams, newTeam] };
    await _persistRemote(newData);
    _cache = newData;
    return newTeam;
  }

  // Ganti nama tim. ID tidak berubah, jadi pertandingan & lineup yang sudah
  // ada tetap terhubung otomatis ke nama barunya.
  async function updateTeamName(teamId, newName) {
    const newTeams = _cache.teams.map((t) => (t.id === teamId ? { ...t, name: newName.trim() } : t));
    const newData = { ..._cache, teams: newTeams };
    await _persistRemote(newData);
    _cache = newData;
  }

  // Hapus satu tim. Pertandingan yang melibatkan tim ini TETAP disimpan
  // (akan tampil sebagai "(tim dihapus)"), hanya starting XI tim ini yang
  // ikut dibersihkan karena sudah tidak relevan.
  async function deleteTeam(teamId) {
    const newTeams = _cache.teams.filter((t) => t.id !== teamId);
    const newLineups = { ..._cache.lineups };
    delete newLineups[teamId];
    const newData = { ..._cache, teams: newTeams, lineups: newLineups };
    await _persistRemote(newData);
    _cache = newData;
  }

  // ---------- MATCHES ----------

  function getMatches() {
    return _cache ? _cache.matches : [];
  }

  async function addMatch(match) {
    const newMatch = { id: _genId('match'), createdAt: new Date().toISOString(), ...match };
    const newData = { ..._cache, matches: [..._cache.matches, newMatch] };
    await _persistRemote(newData);
    _cache = newData;
    return newMatch;
  }

  async function deleteMatch(matchId) {
    const newData = { ..._cache, matches: _cache.matches.filter((m) => m.id !== matchId) };
    await _persistRemote(newData);
    _cache = newData;
  }

  // Perbarui pertandingan yang sudah tersimpan (skor/pencetak gol salah ketik dsb.)
  // tanpa perlu hapus lalu input ulang dari nol.
  async function updateMatch(matchId, updatedFields) {
    const newMatches = _cache.matches.map((m) => (m.id === matchId ? { ...m, ...updatedFields } : m));
    const newData = { ..._cache, matches: newMatches };
    await _persistRemote(newData);
    _cache = newData;
  }

  // ---------- STARTING XI ----------

  function getLineup(teamId) {
    return (_cache && _cache.lineups && _cache.lineups[teamId]) || null;
  }

  function getAllLineups() {
    return (_cache && _cache.lineups) || {};
  }

  async function saveLineup(teamId, format, players) {
    const newLineups = { ..._cache.lineups, [teamId]: { format, players } };
    const newData = { ..._cache, lineups: newLineups };
    await _persistRemote(newData);
    _cache = newData;
    return _cache.lineups[teamId];
  }

  async function deleteLineup(teamId) {
    const newLineups = { ..._cache.lineups };
    delete newLineups[teamId];
    const newData = { ..._cache, lineups: newLineups };
    await _persistRemote(newData);
    _cache = newData;
  }

  // ---------- RESET ----------

  async function resetAll() {
    const newData = _defaultData();
    await _persistRemote(newData);
    _cache = newData;
    return _cache;
  }

  async function resetMatchesOnly() {
    const newData = { ..._cache, matches: [] };
    await _persistRemote(newData);
    _cache = newData;
    return _cache;
  }

  return {
    init,
    isUsingFallback,
    isLoggedIn,
    login,
    logout,
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
    resetAll,
    resetMatchesOnly
  };
})();
