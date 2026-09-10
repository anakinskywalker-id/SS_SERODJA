/* -----------------------------------------------------------------------
   Liga Kandang — stylesheet
   Palet & tipografi terinspirasi identitas visual Premier League:
   ungu gelap sebagai dasar, gradasi ungu→cyan sebagai aksen hero,
   hijau/cyan/pink sebagai warna sorotan.
   ----------------------------------------------------------------------- */

:root {
  --pl-bg:        #0D0018;   /* dasar halaman, hampir hitam-ungu */
  --pl-purple:    #38003C;   /* ungu brand utama */
  --pl-purple-2:  #2A0030;   /* panel/card gelap */
  --pl-purple-3:  #1D0021;   /* strip tabs */
  --pl-cyan:      #04F5FF;
  --pl-green:     #00FF85;
  --pl-pink:      #E90052;
  --pl-white:     #FFFFFF;
  --pl-ink-soft:  #C7B8CE;   /* teks sekunder di atas gelap */
  --pl-ink-dim:   #8C7C93;
  --pl-border:    #3A1E40;

  --font-display: 'Poppins', 'Arial Black', sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;

  --radius: 8px;
  --radius-pill: 999px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--pl-bg);
  color: var(--pl-white);
  font-family: var(--font-body);
  min-height: 100%;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  margin: 0;
  letter-spacing: -0.01em;
}

p { margin: 0; }
button { font-family: inherit; }

/* ---------------- Top bar ---------------- */

.topbar {
  background: var(--pl-purple);
  border-bottom: 1px solid var(--pl-border);
}

.topbar__inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.brand { display: flex; align-items: center; gap: 10px; }

.brand__mark {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: conic-gradient(var(--pl-cyan), var(--pl-green), var(--pl-pink), var(--pl-cyan));
  flex-shrink: 0;
}

.brand__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  color: var(--pl-white);
}

.topbar__tagline {
  font-size: 12.5px;
  color: var(--pl-ink-soft);
}

.topbar__auth {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ---------------- Login modal ---------------- */

.login-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.login-modal[hidden] {
  display: none;
}

.login-modal__box {
  background: var(--pl-purple-2);
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 24px;
  width: 100%;
  max-width: 360px;
}

.login-modal__box h3 {
  font-size: 19px;
  font-weight: 700;
  color: var(--pl-white);
  margin-bottom: 8px;
}

.login-modal__box > p {
  color: var(--pl-ink-soft);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.login-modal__box form { display: flex; flex-direction: column; gap: 14px; }
.login-modal__box input { width: 100%; }

.login-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.notice {
  background: rgba(4,245,255,0.08);
  color: var(--pl-cyan);
  border: 1px solid rgba(4,245,255,0.3);
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13.5px;
  margin-bottom: 16px;
}

/* ---------------- Hero banner ---------------- */

.hero {
  background: linear-gradient(115deg, #7A2FD6 0%, #963CFF 35%, #22C7EA 75%, #04F5FF 100%);
  padding: 34px 20px 30px;
}

.hero h1 {
  max-width: 1000px;
  margin: 0 auto;
  font-size: 34px;
  font-weight: 800;
  color: var(--pl-white);
}

.hero p {
  max-width: 1000px;
  margin: 6px auto 0;
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

/* ---------------- Tabs ---------------- */

.tabs {
  background: var(--pl-purple-3);
  border-bottom: 1px solid var(--pl-border);
  display: flex;
  gap: 4px;
  padding: 0 20px;
  overflow-x: auto;
  max-width: 1000px;
  margin: 0 auto;
}

.tabs__btn {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--pl-ink-soft);
  padding: 14px 16px 12px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.tabs__btn:hover { color: var(--pl-white); }

.tabs__btn.is-active {
  color: var(--pl-white);
  border-bottom-color: var(--pl-white);
}

/* ---------------- Layout / panels ---------------- */

.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

.panel {
  display: none;
  background: var(--pl-purple-2);
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 26px 26px 30px;
}

.panel.is-active { display: block; }

.panel__head {
  margin-bottom: 20px;
  border-left: 3px solid var(--pl-cyan);
  padding-left: 14px;
}

.panel__head--tight { margin-top: 34px; margin-bottom: 14px; }

.panel__head h2 { font-size: 21px; color: var(--pl-white); font-weight: 700; }
.panel__head h3 { font-size: 16px; color: var(--pl-white); font-weight: 700; }
.panel__head p {
  color: var(--pl-ink-soft);
  font-size: 13.5px;
  margin-top: 5px;
  line-height: 1.5;
}

.panel__actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

/* ---------------- Buttons / inputs ---------------- */

.btn {
  border: none;
  border-radius: var(--radius-pill);
  padding: 11px 20px;
  font-size: 13.5px;
  font-weight: 700;
  font-family: var(--font-display);
  cursor: pointer;
  transition: transform 0.08s ease, filter 0.15s ease;
}
.btn:active { transform: translateY(1px); }

.btn--primary {
  background: var(--pl-green);
  color: #06210F;
}
.btn--primary:hover { filter: brightness(1.06); }
.btn--primary:disabled { background: #4B5750; color: #93A199; cursor: not-allowed; }

.btn--ghost {
  background: transparent;
  color: var(--pl-white);
  border: 1.5px solid var(--pl-border);
}
.btn--ghost:hover { border-color: var(--pl-cyan); color: var(--pl-cyan); }

.btn--danger {
  background: transparent;
  color: var(--pl-pink);
  border: 1.5px solid var(--pl-pink);
}
.btn--danger:hover { background: rgba(233,0,82,0.1); }

.btn--small { padding: 7px 14px; font-size: 12px; }

input, select {
  font-family: var(--font-body);
  font-size: 14px;
  padding: 9px 11px;
  border: 1.5px solid var(--pl-border);
  border-radius: var(--radius);
  background: #170022;
  color: var(--pl-white);
}
input::placeholder { color: var(--pl-ink-dim); }

input:focus, select:focus, button:focus-visible {
  outline: 2.5px solid var(--pl-cyan);
  outline-offset: 1px;
}

label {
  font-size: 12px;
  font-weight: 700;
  color: var(--pl-ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.row-inline {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.row-inline label { display: block; margin-bottom: 6px; }
.row-inline input { width: 140px; }

.field { display: flex; flex-direction: column; gap: 6px; }

/* ---------------- Team setup ---------------- */

.team-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.team-slot { display: flex; flex-direction: column; gap: 6px; }
.team-slot input { width: 100%; }

.saved-teams { margin-top: 22px; }

.saved-teams__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.chip {
  background: var(--pl-purple);
  border: 1px solid var(--pl-border);
  color: var(--pl-white);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
}

.chip--editable {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 14px;
}

.chip__label { white-space: nowrap; }
.chip__label--clickable { cursor: pointer; }
.chip__label--clickable:hover { color: var(--pl-cyan); text-decoration: underline; }

.lineup-preview-inline { margin-top: 16px; }

.chip__btn {
  background: rgba(255,255,255,0.08);
  border: none;
  color: var(--pl-ink-soft);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chip__btn:hover { background: rgba(255,255,255,0.18); color: var(--pl-white); }
.chip__btn--danger:hover { background: rgba(233,0,82,0.25); color: var(--pl-pink); }

.chip__edit-input {
  background: #170022;
  border: 1px solid var(--pl-cyan);
  border-radius: var(--radius-pill);
  color: var(--pl-white);
  padding: 4px 10px;
  font-size: 13px;
  width: 140px;
}

.scorer-counter {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--pl-ink-dim);
}
.scorer-counter--ok { color: var(--pl-green); }
.scorer-counter--off { color: var(--pl-pink); }

/* ---------------- Toast notifications ---------------- */

.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  width: min(90vw, 380px);
  align-items: center;
}

.toast {
  background: var(--pl-purple-2);
  border: 1px solid var(--pl-border);
  border-left: 4px solid var(--pl-green);
  color: var(--pl-white);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13.5px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  width: 100%;
  text-align: center;
}
.toast.is-visible { opacity: 1; transform: translateY(0); }
.toast--error { border-left-color: var(--pl-pink); }

/* ---------------- Match form ---------------- */

.warning {
  background: rgba(233,0,82,0.1);
  color: #FF6FA0;
  border: 1px solid rgba(233,0,82,0.35);
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13.5px;
  margin-bottom: 16px;
}

.match-form__teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: end;
  margin-bottom: 22px;
}

.team-side { display: flex; flex-direction: column; gap: 8px; }
.team-side select { width: 100%; }
.team-side input[type="number"] {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 26px;
  text-align: center;
  width: 100%;
  padding: 8px;
}

.match-form__vs {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--pl-ink-dim);
  font-size: 14px;
  padding-bottom: 12px;
}

.scorers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 10px;
}

.scorers__col h3 {
  font-size: 13.5px;
  color: var(--pl-cyan);
  margin-bottom: 10px;
  font-weight: 700;
}

.scorer-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }

.scorer-row {
  display: grid;
  grid-template-columns: 1fr 64px 28px;
  gap: 6px;
}

.scorer-row input[type="text"] { width: 100%; }
.scorer-row input[type="number"] { width: 100%; text-align: center; }

.scorer-row__remove {
  background: transparent;
  border: 1.5px solid var(--pl-border);
  border-radius: var(--radius);
  color: var(--pl-ink-dim);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}
.scorer-row__remove:hover { border-color: var(--pl-pink); color: var(--pl-pink); }

/* ---------------- Match history ---------------- */

.match-history { display: flex; flex-direction: column; gap: 10px; }

.match-card {
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(255,255,255,0.02);
}

.match-card__score {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--pl-white);
}

.match-card__score b { color: var(--pl-green); font-weight: 800; }

.match-card__scorers {
  font-size: 12.5px;
  color: var(--pl-ink-soft);
  flex-basis: 100%;
}

.match-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.match-card__remove,
.match-card__edit {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: underline;
}
.match-card__remove { color: var(--pl-pink); }
.match-card__edit { color: var(--pl-cyan); }

.match-card__share {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--pl-border);
  color: var(--pl-ink-soft);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.match-card__share:hover { color: var(--pl-cyan); border-color: var(--pl-cyan); }

.empty-note {
  color: var(--pl-ink-dim);
  font-size: 13.5px;
  padding: 14px 0;
}

/* ---------------- Standings table ---------------- */

.table-wrap { overflow-x: auto; }

table.standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  min-width: 560px;
}

table.standings thead th {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 11.5px;
  letter-spacing: 0.03em;
  color: var(--pl-ink-soft);
  text-align: center;
  padding: 10px 6px;
  border-bottom: 1px solid var(--pl-border);
}

table.standings .col-rank, table.standings .col-team { text-align: left; }

table.standings tbody td {
  padding: 12px 6px;
  text-align: center;
  border-bottom: 1px solid var(--pl-border);
  color: var(--pl-white);
}

table.standings tbody tr:hover { background: rgba(255,255,255,0.03); }

table.standings tbody tr:nth-child(-n+4) td.col-rank {
  box-shadow: inset 3px 0 0 var(--pl-cyan);
  padding-left: 9px;
}

table.standings td.col-rank { font-weight: 700; color: var(--pl-ink-soft); }

table.standings td.col-team {
  text-align: left;
  font-weight: 700;
}

table.standings td.col-pts {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: var(--pl-green);
}

.table-legend {
  margin-top: 14px;
  font-size: 12px;
  color: var(--pl-ink-dim);
}

/* ---------------- Top scorer list ---------------- */

.topscorer-list { display: flex; flex-direction: column; }

.topscorer-row {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 13px 4px;
  border-bottom: 1px solid var(--pl-border);
}

.topscorer-row__rank {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 19px;
  color: var(--pl-ink-dim);
}
.topscorer-row:nth-child(1) .topscorer-row__rank { color: var(--pl-cyan); }
.topscorer-row:nth-child(2) .topscorer-row__rank,
.topscorer-row:nth-child(3) .topscorer-row__rank { color: var(--pl-ink-soft); }

.topscorer-row__player { font-weight: 700; color: var(--pl-white); }
.topscorer-row__team { color: var(--pl-ink-soft); font-size: 12.5px; }

.topscorer-row__goals {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 17px;
  color: var(--pl-green);
}

/* ---------------- Line Up ---------------- */

.lineup-form__controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.lineup-form__controls select { width: 100%; }

.lineup-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.lineup-slot {
  display: grid;
  grid-template-columns: 26px 1fr 1fr;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 6px 8px;
}

.lineup-slot__num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--pl-purple);
  color: var(--pl-ink-soft);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lineup-slot__num.is-gk { background: var(--pl-pink); color: var(--pl-white); }

.lineup-slot__input {
  border: none;
  background: transparent;
  padding: 6px 2px;
  width: 100%;
}
.lineup-slot__input:focus { outline: none; }

.lineup-slot__position {
  border: 1px solid var(--pl-border);
  background: #170022;
  font-size: 12px;
  padding: 6px 6px;
  border-radius: var(--radius);
  width: 100%;
}

.lineup-saved-list { display: flex; flex-direction: column; gap: 14px; }

.lineup-card {
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  background: rgba(255,255,255,0.02);
}

.lineup-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.lineup-card__head h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--pl-white);
  margin-right: auto;
}

.lineup-card__format {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--pl-cyan);
  border: 1px solid var(--pl-cyan);
  border-radius: var(--radius-pill);
  padding: 3px 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.lineup-card__actions { display: flex; gap: 6px; }

.lineup-card__players {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lineup-chip {
  background: var(--pl-purple);
  border: 1px solid var(--pl-border);
  color: var(--pl-white);
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 600;
}
.lineup-chip em {
  font-style: normal;
  color: var(--pl-ink-soft);
  font-weight: 500;
  font-size: 11px;
  margin-left: 5px;
}
.lineup-chip.is-gk {
  border-color: var(--pl-pink);
  color: var(--pl-pink);
}
.lineup-chip.is-gk em { color: var(--pl-pink); opacity: 0.75; }

/* ---------------- Pitch head-to-head preview ---------------- */

.pitch-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.pitch-controls select { flex: 1; min-width: 160px; }
.pitch-controls__vs {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--pl-ink-dim);
  font-size: 13px;
}

.pitch-heading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13.5px;
  color: var(--pl-ink-soft);
}
.pitch-heading__team { display: flex; align-items: center; gap: 8px; }
.pitch-heading__team strong { color: var(--pl-white); font-family: var(--font-display); font-size: 15px; }
.pitch-heading__team b { color: var(--pl-cyan); }
.pitch-heading__dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--pl-cyan);
  flex-shrink: 0;
}
.pitch-heading__dot--b { background: var(--pl-pink); }

/* Lapangan selalu vertikal: tim atas menyerang ke bawah, tim bawah
   menyerang ke atas, dipisah garis tengah horizontal — mengikuti gaya
   tampilan susunan pemain Livescore/Sofascore. Cukup scroll untuk lihat
   semua lini. */
.pitch {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 720px;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 60px, rgba(255,255,255,0) 60px 120px),
    linear-gradient(180deg, #123324, #0E2A1D);
  border: 2px solid rgba(255,255,255,0.35);
  border-radius: var(--radius);
  overflow: hidden;
  padding: 16px 10px;
  gap: 0;
}

.pitch__center-line {
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 0;
  border-top: 2px dashed rgba(255,255,255,0.4);
}

.pitch__center-circle {
  position: absolute;
  top: 50%; left: 50%;
  width: 110px; height: 110px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* Kotak "penalti" dekoratif di ujung atas & bawah, kesan garis lapangan asli */
.pitch::before,
.pitch::after {
  content: '';
  position: absolute;
  left: 22%;
  right: 22%;
  height: 13%;
  border: 2px solid rgba(255,255,255,0.3);
}
.pitch::before { top: 0; border-top: none; }
.pitch::after { bottom: 0; border-bottom: none; }

.pitch__side {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.pitch__col {
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-content: space-evenly;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
}

.pitch__player {
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  padding: 6px 9px;
  text-align: center;
  flex: 0 1 88px;
  max-width: 120px;
}

.pitch__player-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  color: var(--pl-white);
  line-height: 1.25;
  overflow-wrap: break-word;
}

.pitch__player-pos {
  font-size: 9.5px;
  color: var(--pl-cyan);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 2px;
}

/* ---------------- Tombol & kartu export/share ---------------- */

.btn--share {
  margin-bottom: 16px;
}

/* Kartu ini dirender di luar layar (position:fixed, left:-9999px) khusus
   untuk dipotret html2canvas jadi JPEG — desainnya sengaja dibuat mandiri
   (ada judul liga & footer) supaya enak dibaca walau dilepas dari konteks
   aplikasi, misal saat dikirim ke grup WhatsApp. */
.export-card {
  background: linear-gradient(180deg, var(--pl-purple-2), var(--pl-bg));
  padding: 28px;
  font-family: var(--font-body);
}

.export-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.export-card__dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: conic-gradient(var(--pl-cyan), var(--pl-green), var(--pl-pink), var(--pl-cyan));
  flex-shrink: 0;
}

.export-card__brand {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: var(--pl-white);
}

.export-card__subtitle {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 26px;
  color: var(--pl-white);
  margin-bottom: 20px;
}

.export-card__footer {
  margin-top: 22px;
  text-align: center;
  font-size: 11.5px;
  color: var(--pl-ink-dim);
  border-top: 1px solid var(--pl-border);
  padding-top: 14px;
}

.export-card__footer--fancy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  letter-spacing: 0.06em;
  border-top: none;
}
.export-card__footer--fancy strong { color: var(--pl-white); font-weight: 800; }

.export-card table.standings { font-size: 15px; }
.export-card table.standings thead th { font-size: 13px; }
.export-card .topscorer-list { border: 1px solid var(--pl-border); border-radius: var(--radius); padding: 4px 16px; }
.export-card .lineup-card { border: none; background: transparent; padding: 0; }

/* ---------------- Lapangan perspektif untuk share Line Up ---------------- */

.export-pitch-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.export-pitch-card__brand { display: flex; align-items: center; gap: 16px; }
.export-pitch-card__crest { flex-shrink: 0; }

.export-pitch-card__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 28px;
  color: var(--pl-white);
}
.export-pitch-card__title-sep { color: var(--pl-ink-dim); font-weight: 400; margin: 0 4px; }

.export-pitch-card__subtitle {
  font-size: 15px;
  color: var(--pl-ink-soft);
  font-weight: 600;
  margin-top: 2px;
}

.export-pitch-card__badge {
  border: 1.5px solid var(--pl-cyan);
  color: var(--pl-cyan);
  border-radius: var(--radius-pill);
  padding: 8px 18px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.export-pitch {
  position: relative;
  height: 420px;
  overflow: hidden;
  background: linear-gradient(180deg, #123324, #0E2A1D);
}

.export-pitch__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.export-pitch__player {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15,10,20,0.85);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-pill);
  padding: 10px 16px;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.export-pitch__name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
  color: var(--pl-white);
}
.export-pitch__sep { color: var(--pl-ink-dim); }
.export-pitch__pos { font-size: 13px; color: var(--pl-ink-soft); font-weight: 600; }

.export-pitch__player.is-gk { border-color: var(--pl-pink); padding-left: 6px; }
.export-pitch__player.is-gk .export-pitch__name { color: var(--pl-pink); }

.export-pitch__gk-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--pl-bg);
  border: 2px solid var(--pl-cyan);
  color: var(--pl-white);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 10.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-match__score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--pl-border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--pl-white);
}
.export-match__score b {
  font-size: 30px;
  font-weight: 800;
  color: var(--pl-green);
}

.export-match__scorers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  font-size: 13px;
  color: var(--pl-ink-soft);
}
.export-match__scorers em {
  font-style: normal;
  font-weight: 700;
  color: var(--pl-cyan);
}

/* ---------------- Footer ---------------- */

.app-footer {
  text-align: center;
  padding: 18px 20px 30px;
  color: var(--pl-ink-dim);
  font-size: 12px;
}

/* ---------------- Responsive ---------------- */

@media (max-width: 600px) {
  .match-form__teams { grid-template-columns: 1fr; }
  .match-form__vs { text-align: center; padding: 0; }
  .scorers { grid-template-columns: 1fr; }
  .lineup-form__controls { grid-template-columns: 1fr; }
  .lineup-slot { grid-template-columns: 22px 1fr; }
  .lineup-slot__position { grid-column: 1 / -1; }
  .panel { padding: 20px 16px 26px; }
  .hero h1 { font-size: 27px; }

  .pitch { min-height: 640px; padding: 14px 8px; }
  .pitch__center-circle { width: 90px; height: 90px; }
  .pitch__player { flex-basis: 72px; padding: 5px 4px; }
  .pitch__player-name { font-size: 10px; }
  .pitch__player-pos { font-size: 8.5px; }
}

