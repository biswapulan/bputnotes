/**
 * pyq-loader.js — Loads PYQs from Google Sheets
 * Sheet columns: branch, semester, subject_number, subject_name,
 *                exam_type (regular|back), year, drive_link, tags, status
 */

const _BRANCH_NAMES_P = {
  cse:'Computer Science (CSE)', civil:'Civil Engineering',
  electrical:'Electrical Engineering (EEE)', mechanical:'Mechanical Engineering',
  mining:'Mining Engineering', metallurgy:'Metallurgical Engineering',
  mineral:'Mineral Engineering',
};
const _BRANCH_EMOJI_P = {
  cse:'💻', civil:'🏗️', electrical:'⚡', mechanical:'⚙️',
  mining:'⛏️', metallurgy:'🔩', mineral:'💎',
};

window._pyqState = { branch: 'cse', sem: 1, year: 2024, examType: 'regular' };

async function _renderPYQ() {
  const { branch, sem, year, examType } = window._pyqState;
  const grid = document.getElementById('pyqGrid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:44px;color:var(--gray-400);display:flex;align-items:center;justify-content:center;gap:10px;"><div style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(217,119,6,0.15);border-top-color:#f59e0b;animation:_pSpin 0.7s linear infinite;"></div>Loading papers...</div>`;

  let papers = [];
  let _pyqSheetError = false;
  try {
    papers = await window.SheetsDB.getPYQs(branch, sem, examType, year);
  } catch(e) {
    console.warn('PYQ fetch error:', e);
    _pyqSheetError = true;
  }

  if (!papers.length) {
    grid.innerHTML = _pyqSheetError
      ? `<div class="pyq-empty"><div class="e-icon">⚠️</div><p style="color:#ef4444;">Could not connect to Google Sheets.<br><span style="font-size:0.78rem;opacity:0.7;">Check your API key &amp; Sheet ID in sheets.js, or open the browser Console (F12) for details.</span></p></div>`
      : `<div class="pyq-empty"><div class="e-icon">📭</div><p>No papers available for ${branch.toUpperCase()} Sem ${sem} · ${examType === 'regular' ? 'Regular' : 'Back Paper'} · ${year}.</p><p style="margin-top:8px;font-size:0.8rem;"><a href="https://wa.me/918249185682" target="_blank" style="color:var(--pyq-accent);">Request on WhatsApp →</a></p></div>`;
    return;
  }

  grid.innerHTML = papers.map((p, i) => {
    const hasLink = p.link && p.link !== '#';
    const btnCls = hasLink ? `card-dl-btn ${examType}-btn` : 'card-dl-btn soon-btn';
    const btn = hasLink
      ? `<a href="${p.link}" target="_blank" rel="noopener" class="${btnCls}">📥 Download PDF</a>`
      : `<span class="${btnCls}">⏳ Coming Soon</span>`;
    return `<div class="pyq-card ${examType}-card" style="animation:_pFadeUp 0.3s ease ${i * 0.05}s both;">
      <div class="card-sub-num">Subject ${p.num}</div>
      <div class="card-sub-name">${p.name}</div>
      <span class="card-code ${examType}">${p.examType === 'regular' ? 'Regular' : 'Back'} · ${p.year}</span>
      <div class="card-meta">BPUT · ${_BRANCH_NAMES_P[branch]} · Sem ${sem}</div>
      ${btn}
    </div>`;
  }).join('');
}

// ── GLOBAL FUNCTIONS ──

window.selectBranch = function(branch) {
  window._pyqState.branch = branch;
  window._pyqState.sem = 1;
  const type = window._pyqState.examType;
  document.querySelectorAll('.sidebar-branch').forEach(el => el.classList.remove('active', 'active-back'));
  document.getElementById('sb-' + branch)?.classList.add(type === 'regular' ? 'active' : 'active-back');
  document.querySelectorAll('.sem-tab').forEach((t, i) => {
    t.classList.remove('active', 'active-back');
    if (i === 0) t.classList.add(type === 'regular' ? 'active' : 'active-back');
  });
  const tb = document.getElementById('topbarBranch'); if (tb) tb.textContent = _BRANCH_NAMES_P[branch] || branch;
  const ts = document.getElementById('topbarSem');    if (ts) ts.textContent = 'Semester 1';
  const ml = document.getElementById('mobileBranchLabel'); if (ml) ml.textContent = `${_BRANCH_EMOJI_P[branch] || '📚'} ${_BRANCH_NAMES_P[branch] || branch}`;
  window.closeMobileSidebar();
  window.clearSearch();
  _renderPYQ();
};

window.selectSem = function(sem, tabEl) {
  window._pyqState.sem = sem;
  const type = window._pyqState.examType;
  document.querySelectorAll('.sem-tab').forEach(t => t.classList.remove('active', 'active-back'));
  tabEl.classList.add(type === 'regular' ? 'active' : 'active-back');
  const ts = document.getElementById('topbarSem'); if (ts) ts.textContent = `Semester ${sem}`;
  window.clearSearch();
  _renderPYQ();
};

window.selectYear = function(year, btnEl) {
  window._pyqState.year = year;
  const type = window._pyqState.examType;
  document.querySelectorAll('.year-btn').forEach(t => t.classList.remove('active', 'active-back'));
  btnEl.classList.add(type === 'regular' ? 'active' : 'active-back');
  const ty = document.getElementById('topbarYear'); if (ty) ty.textContent = year;
  window.clearSearch();
  _renderPYQ();
};

window.setExamType = function(type) {
  window._pyqState.examType = type;
  const { branch, sem, year } = window._pyqState;

  // Sync sidebar toggle (desktop)
  document.getElementById('toggleRegular')?.classList.toggle('active-regular', type === 'regular');
  document.getElementById('toggleBack')?.classList.toggle('active-back', type === 'back');
  // Sync mobile standalone toggle
  document.getElementById('mobileToggleRegular')?.classList.toggle('active-regular', type === 'regular');
  document.getElementById('mobileToggleBack')?.classList.toggle('active-back', type === 'back');

  document.querySelectorAll('.sidebar-branch').forEach(el => el.classList.remove('active', 'active-back'));
  document.getElementById('sb-' + branch)?.classList.add(type === 'regular' ? 'active' : 'active-back');

  document.querySelectorAll('.sem-tab').forEach((t, i) => {
    t.classList.remove('active', 'active-back');
    if (i === sem - 1) t.classList.add(type === 'regular' ? 'active' : 'active-back');
  });
  document.querySelectorAll('.year-btn').forEach(t => {
    t.classList.remove('active', 'active-back');
    if (parseInt(t.textContent.trim()) === year) t.classList.add(type === 'regular' ? 'active' : 'active-back');
  });

  // Update topbar badge
  const badge = document.getElementById('topbarExamBadge');
  const dot   = document.getElementById('topbarDot');
  const label = document.getElementById('topbarExamLabel');
  if (badge) badge.className = `exam-badge ${type}`;
  if (dot)   dot.className   = `topbar-dot ${type}`;
  if (label) label.textContent = type === 'regular' ? 'Regular Exam' : 'Back Paper';

  _renderPYQ();
};

window.handleSearch = function(val) {
  const q = val.trim().toLowerCase();
  const content = document.getElementById('pyqContent');
  const panel   = document.getElementById('searchResultsPanel');
  if (q.length < 2) {
    panel?.classList.remove('active');
    if (content) content.style.display = 'block';
    return;
  }
  if (content) content.style.display = 'none';
  panel?.classList.add('active');
  const cards = [...document.querySelectorAll('.pyq-card')].filter(c => c.textContent.toLowerCase().includes(q));
  const grid  = document.getElementById('searchGrid');
  const noRes = document.getElementById('searchNoResults');
  const label = document.getElementById('searchLabel');
  if (grid)  grid.innerHTML = cards.map(c => c.outerHTML).join('');
  if (noRes) noRes.style.display = cards.length === 0 ? 'block' : 'none';
  if (label) label.textContent = `${cards.length} result(s) for "${val}"`;
};

window.clearSearch = function() {
  const inp = document.getElementById('codeSearchInput'); if (inp) inp.value = '';
  document.getElementById('searchResultsPanel')?.classList.remove('active');
  const c = document.getElementById('pyqContent'); if (c) c.style.display = 'block';
};

window.toggleMobileSidebar = function() {
  const s = document.getElementById('pyqSidebar');
  const a = document.getElementById('mobileToggleArrow');
  if (!s) return;
  const open = s.classList.contains('open');
  s.classList.toggle('open', !open);
  if (a) a.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
};
window.closeMobileSidebar = function() {
  document.getElementById('pyqSidebar')?.classList.remove('open');
  const a = document.getElementById('mobileToggleArrow'); if (a) a.style.transform = 'rotate(0deg)';
};

// Keyframes
if (!document.getElementById('_p-kf')) {
  const s = document.createElement('style'); s.id = '_p-kf';
  s.textContent = '@keyframes _pSpin{to{transform:rotate(360deg)}}@keyframes _pFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB
function _pyqInit() {
  if (window.SheetsDB) { _renderPYQ(); }
  else { setTimeout(_pyqInit, 50); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _pyqInit);
} else {
  _pyqInit();
}

// ── PYQ PAGE TOUR (mobile 4-step guide) ──
function _runPYQTour() {
  if (window.innerWidth > 900) return;
  if (typeof window._runPageTour !== 'function') return;

  window._runPageTour([
    {
      targetId: 'mobileBranchToggle',
      title: 'Step 1 of 4 — Pick your Branch',
      body: 'Tap the button below to choose your engineering branch.',
      clickToAdvance: true,
    },
    {
      targetId: 'mobileExamToggle',
      title: 'Step 2 of 4 — Regular or Back Paper?',
      body: '<strong>Regular</strong> = main semester exam.<br><strong>Back</strong> = supplementary exam.<br>Tap one to select.',
      clickToAdvance: true,
    },
    {
      targetId: 'semTabsWrap',
      title: 'Step 3 of 4 — Choose Semester',
      body: 'Tap the semester you want papers for.',
      clickToAdvance: true,
    },
    {
      targetId: 'pyqGrid',
      title: 'Step 4 of 4 — Download Papers ✓',
      body: 'Your papers appear here. Tap <strong>📄 Open Paper</strong> on any subject to view the PDF.',
    },
  ]);
}

setTimeout(() => {
  if (window.innerWidth <= 900) setTimeout(_runPYQTour, 2000);
}, 500);