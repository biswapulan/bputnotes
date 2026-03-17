/**
 * notes-loader.js — Loads Notes from Google Sheets
 * Depends on sheets.js being loaded first.
 */

const _BRANCH_NAMES_N = {
  cse:'Computer Science (CSE)', civil:'Civil Engineering',
  electrical:'Electrical Engineering (EEE)', mechanical:'Mechanical Engineering',
  mining:'Mining Engineering', metallurgy:'Metallurgical Engineering',
  mineral:'Mineral Engineering',
};
const _BRANCH_EMOJI_N = {
  cse:'💻', civil:'🏗️', electrical:'⚡', mechanical:'⚙️',
  mining:'⛏️', metallurgy:'🔩', mineral:'💎',
};

window._notesState = { branch: 'cse', sem: 1 };
const _notesCache     = {};
const _notesCacheTime = {};
const _NOTES_TTL      = 5 * 60 * 1000; // 5 minutes

let _notesSheetError = false;

async function _fetchNotesData(branch, sem) {
  const key = `${branch}-${sem}`;
  const now = Date.now();
  if (_notesCache[key] && (now - (_notesCacheTime[key] || 0)) < _NOTES_TTL) {
    return _notesCache[key];
  }
  let data = [];
  try {
    data = await window.SheetsDB.getNotesForSem(branch, sem);
    _notesSheetError = false;
  } catch(e) {
    console.warn('Notes fetch error:', e);
    _notesSheetError = true;
    data = [];
  }
  _notesCache[key] = data;
  _notesCacheTime[key] = now;
  return data;
}

function _setTopbar() {
  const { branch, sem } = window._notesState;
  const el = document.getElementById('topbar-branch-name');
  const sl = document.getElementById('topbar-sem-label');
  const ml = document.getElementById('mobileBranchLabel');
  if (el) el.textContent = _BRANCH_NAMES_N[branch] || branch;
  if (sl) sl.textContent = `Semester ${sem}`;
  if (ml) ml.textContent = `${_BRANCH_EMOJI_N[branch] || '📚'} ${_BRANCH_NAMES_N[branch] || branch}`;
}

async function _renderNotesGrid(searchTerm = '') {
  const { branch, sem } = window._notesState;
  const grid = document.getElementById('notesGrid');
  if (!grid) return;

  // Loading state
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:44px;color:var(--gray-400);display:flex;align-items:center;justify-content:center;gap:10px;"><div style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(37,99,235,0.15);border-top-color:#2563eb;animation:_nSpin 0.7s linear infinite;"></div>Loading notes...</div>`;

  const subjects = await _fetchNotesData(branch, sem);
  const term = searchTerm.toLowerCase();
  const filtered = term
    ? subjects.filter(s => s.name.toLowerCase().includes(term))
    : subjects;

  if (!filtered.length) {
    grid.innerHTML = _notesSheetError
      ? `<div class="notes-empty"><div class="e-icon">⚠️</div><p style="color:#ef4444;">Could not connect to Google Sheets.<br><span style="font-size:0.78rem;color:var(--gray-400);">Check your API key & Sheet ID in sheets.js, or open the browser Console (F12) for details.</span></p></div>`
      : `<div class="notes-empty"><div class="e-icon">🔍</div><p>${term ? `No subjects match "<strong>${searchTerm}</strong>".` : 'No notes available for this branch & semester yet.'}</p>${!term ? '<p style="margin-top:8px;font-size:0.8rem;">Data may not be in the Sheet yet. <a href="https://wa.me/918249185682" target="_blank" style="color:var(--blue-500);">Request on WhatsApp</a></p>' : ''}</div>`;
    return;
  }

  grid.innerHTML = filtered.map((s, i) => {
    const hasLink = s.link && s.link !== '#';
    const tagHTML = s.tags.map(t => `<span class="note-tag">${t}</span>`).join('');
    const btn = hasLink
      ? `<a href="${s.link}" target="_blank" rel="noopener" class="note-btn note-btn-active">📖 Open Notes</a>`
      : `<span class="note-btn note-btn-soon">⏳ Coming Soon</span>`;
    return `<div class="note-card" style="animation:_nFadeUp 0.3s ease ${i * 0.05}s both;">
      <div class="note-num">Subject ${s.num}</div>
      <div class="note-name">${s.name}</div>
      <div class="note-tags">${tagHTML}</div>
      ${btn}
    </div>`;
  }).join('');
}

// ── GLOBAL FUNCTIONS (called by inline onclick) ──

window.selectBranch = function(branch) {
  window._notesState.branch = branch;
  window._notesState.sem = 1;
  document.querySelectorAll('.sidebar-branch').forEach(el => el.classList.remove('active'));
  document.getElementById('sb-' + branch)?.classList.add('active');
  document.querySelectorAll('.sem-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  const inp = document.getElementById('noteSearchInput'); if (inp) inp.value = '';
  _setTopbar();
  window.closeMobileSidebar();
  _renderNotesGrid();
};

window.selectSem = function(sem, tabEl) {
  window._notesState.sem = sem;
  document.querySelectorAll('.sem-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  const el = document.getElementById('topbar-sem-label'); if (el) el.textContent = `Semester ${sem}`;
  const inp = document.getElementById('noteSearchInput'); if (inp) inp.value = '';
  _renderNotesGrid();
};

window.filterNotes = function(val) { _renderNotesGrid(val); };

window.toggleMobileSidebar = function() {
  const s = document.getElementById('notesSidebar');
  const a = document.getElementById('mobileToggleArrow');
  if (!s) return;
  const open = s.classList.contains('open');
  s.classList.toggle('open', !open);
  if (a) a.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
};
window.closeMobileSidebar = function() {
  document.getElementById('notesSidebar')?.classList.remove('open');
  const a = document.getElementById('mobileToggleArrow'); if (a) a.style.transform = 'rotate(0deg)';
};

// Inject keyframes
if (!document.getElementById('_n-kf')) {
  const s = document.createElement('style'); s.id = '_n-kf';
  s.textContent = '@keyframes _nSpin{to{transform:rotate(360deg)}}@keyframes _nFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB
function _notesInit() {
  if (window.SheetsDB) { _renderNotesGrid(); }
  else { setTimeout(_notesInit, 50); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _notesInit);
} else {
  _notesInit();
}

// ── NOTES PAGE TOUR (mobile 3-step guide) ──
function _runNotesTour() {
  if (window.innerWidth > 900) return;
  if (typeof window._runPageTour !== 'function') return;

  window._runPageTour([
    {
      targetId: 'mobileBranchToggle',
      title: 'Step 1 of 3 — Pick your Branch',
      body: 'Tap this button to choose your engineering branch (CSE, Civil, EEE…)',
    },
    {
      targetId: 'semTabsWrap',
      title: 'Step 2 of 3 — Choose Semester',
      body: 'Select which semester you want notes for (Sem 1 to Sem 8).',
    },
    {
      targetId: 'notesGrid',
      title: 'Step 3 of 3 — Open Your Notes',
      body: 'Your subjects appear here. Tap <strong>📖 Open Notes</strong> on any subject to access the PDF.',
    },
  ]);
}

// Run tour 2 seconds after page loads (after notes grid renders)
setTimeout(() => {
  if (window.innerWidth <= 900) setTimeout(_runNotesTour, 2000);
}, 500);