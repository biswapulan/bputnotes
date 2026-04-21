/**
 * books-loader.js — Loads Books from Google Sheets
 * 3-column selector: Branch → Semester → Subject → Book card
 */

const _BK_BRANCH_NAMES = {
  cse:'Computer Science (CSE)', civil:'Civil Engineering',
  electrical:'Electrical Engineering (EEE)', mechanical:'Mechanical Engineering',
  mining:'Mining Engineering', metallurgy:'Metallurgical Engineering',
  mineral:'Mineral Engineering',
};

window._booksState = { branch: null, sem: null, subject: null };
const _booksCache     = {};
const _booksCacheTime = {};
const _BOOKS_TTL      = 5 * 60 * 1000; // 5 minutes
let _sheetError = false;

async function _fetchBooksData(branch, sem) {
  const key = `${branch}-${sem}`;
  const now = Date.now();
  if (_booksCache[key] && (now - (_booksCacheTime[key] || 0)) < _BOOKS_TTL) {
    return _booksCache[key];
  }
  let data = [];
  try {
    if (!window.SheetsDB || typeof window.SheetsDB.getBooksForSem !== 'function') {
      throw new Error('SheetsDB not loaded');
    }
    data = await window.SheetsDB.getBooksForSem(branch, sem);
    _sheetError = false;
  } catch(e) {
    console.warn('Books fetch error:', e);
    _sheetError = true;
  }
  _booksCache[key] = data;
  _booksCacheTime[key] = now;
  return data;
}

// ── Semester grid (col 2) ──
function _renderSemGrid() {
  const grid = document.getElementById('semGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 8 }, (_, i) => {
    const sem = i + 1;
    return `<div class="sem-btn ${window._booksState.sem === sem ? 'active' : ''}"
         onclick="window.selectBooksSem(${sem}, this)">Sem ${sem}</div>`;
  }).join('');
}

// ── Subject list (col 3) ──
async function _renderSubjectList() {
  const { branch, sem } = window._booksState;
  const list = document.getElementById('subjectList');
  if (!list || !branch || !sem) return;

  list.innerHTML = `<div class="selector-placeholder"><div class="ph-icon">⏳</div><p>Loading subjects...</p></div>`;

  const books = await _fetchBooksData(branch, sem);

  if (_sheetError) {
    list.innerHTML = `<div class="selector-placeholder"><div class="ph-icon">⚠️</div><p style="color:#ef4444;">Could not connect to Google Sheets. Check your API key &amp; Sheet ID in sheets.js, or open browser console for details.</p></div>`;
    return;
  }

  if (!books.length) {
    list.innerHTML = `<div class="selector-placeholder"><div class="ph-icon">📭</div><p>No books added yet for this branch &amp; semester.<br><span style="font-size:0.7rem;opacity:0.7;">Add entries in the <strong>Books</strong> tab of your Google Sheet.</span></p></div>`;
    return;
  }

  list.innerHTML = books.map(b => `
    <div class="subject-item ${window._booksState.subject === b.num ? 'active' : ''}"
         onclick="window.selectBooksSubject(${b.num}, this)">
      <span class="sub-code">S${b.num}</span>
      <span class="sub-name">${b.name}</span>
      ${b.link && b.link !== '#' ? '<span style="color:#22c55e;font-size:0.75rem;flex-shrink:0;">✓</span>' : ''}
    </div>
  `).join('');
}

// ── Book result panel ──
async function _renderBookResult() {
  const { branch, sem, subject } = window._booksState;
  const section = document.getElementById('booksResultSection');
  const landing = document.getElementById('booksLanding');
  const grid    = document.getElementById('booksGrid');
  const titleEl = document.getElementById('booksResultTitle');
  const breadEl = document.getElementById('booksResultBreadcrumb');
  if (!section || !grid) return;

  landing?.classList.add('hidden');
  section.classList.add('visible');

  const books = await _fetchBooksData(branch, sem);

  if (_sheetError) {
    if (titleEl) titleEl.textContent = 'Sheet Connection Error';
    grid.innerHTML = `<div style="padding:32px;text-align:center;color:#ef4444;">⚠️ Could not load data from Google Sheets. Check your API key and Sheet ID in sheets.js, then open the browser Console (F12) for the exact error.</div>`;
    return;
  }

  const book  = books.find(b => b.num === subject);

  if (!book) {
    if (titleEl) titleEl.textContent = 'No Book Found';
    grid.innerHTML = `<div style="padding:32px;text-align:center;color:var(--gray-400);">No book entry for this subject in the Sheet.</div>`;
    return;
  }

  if (titleEl) titleEl.textContent = book.name;
  if (breadEl) breadEl.innerHTML = `<span>${_BK_BRANCH_NAMES[branch] || branch}</span> › <span>Sem ${sem}</span> › <span>Subject ${subject}</span>`;

  const hasLink = book.link && book.link !== '#';
  const tagHTML = book.tags.map(t => `<span class="book-meta-tag">${t}</span>`).join('');

  const colors = ['linear-gradient(135deg,#2563eb,#60a5fa)', 'linear-gradient(135deg,#f59e0b,#fcd34d)', 'linear-gradient(135deg,#22c55e,#4ade80)'];
  const spineColors = ['linear-gradient(90deg,#2563eb,#60a5fa)', 'linear-gradient(90deg,#f59e0b,#fcd34d)', 'linear-gradient(90deg,#22c55e,#4ade80)'];
  const idx = (subject - 1) % 3;

  grid.innerHTML = `
    <div class="book-card" style="animation:_bkFade 0.35s ease both;">
      <div class="book-card-spine" style="background:${spineColors[idx]};"></div>
      <div class="book-card-body">
        <div class="book-number"><span class="book-number-dot" style="background:${['#2563eb','#f59e0b','#22c55e'][idx]};"></span>Subject ${subject}</div>
        <div class="book-title">${book.name}</div>
        <div class="book-meta">${tagHTML}</div>
      </div>
      <div class="book-card-footer">
        <span class="book-file-name">${hasLink ? 'Google Drive PDF' : 'Not uploaded yet'}</span>
        ${hasLink
          ? `<a href="${book.link}" target="_blank" rel="noopener" class="book-dl-btn book-dl-active">📥 Open Book</a>`
          : `<span class="book-dl-btn book-dl-soon">⏳ Coming Soon</span>`}
      </div>
    </div>`;
}

// ── GLOBAL FUNCTIONS ──

window.selectBranch = function(branch) {
  window._booksState.branch  = branch;
  window._booksState.sem     = null;
  window._booksState.subject = null;

  document.querySelectorAll('.branch-pill').forEach(el => el.classList.remove('active'));
  document.getElementById('bp-' + branch)?.classList.add('active');

  document.getElementById('booksResultSection')?.classList.remove('visible');
  document.getElementById('booksLanding')?.classList.remove('hidden');
  document.getElementById('searchResultsSection')?.classList.remove('visible');

  const subList = document.getElementById('subjectList');
  if (subList) subList.innerHTML = `<div class="selector-placeholder"><div class="ph-icon">📅</div><p>Select a semester first</p></div>`;

  _renderSemGrid();

  // Update step badges
  document.querySelectorAll('.step-badge').forEach((b, i) => {
    b.classList.remove('active', 'done');
    if (i === 1) b.classList.add('active');
    if (i === 0) b.classList.add('done');
  });
};

window.selectBooksSem = function(sem, el) {
  window._booksState.sem     = sem;
  window._booksState.subject = null;

  document.querySelectorAll('.sem-btn').forEach(t => t.classList.remove('active'));
  el?.classList.add('active');

  document.getElementById('booksResultSection')?.classList.remove('visible');
  document.getElementById('booksLanding')?.classList.remove('hidden');

  _renderSubjectList();

  document.querySelectorAll('.step-badge').forEach((b, i) => {
    b.classList.remove('active', 'done');
    if (i === 2) b.classList.add('active');
    if (i < 2) b.classList.add('done');
  });
};

window.selectBooksSubject = function(subjectNum, el) {
  window._booksState.subject = subjectNum;
  document.querySelectorAll('.subject-item').forEach(t => t.classList.remove('active'));
  el?.classList.add('active');
  _renderBookResult();

  document.querySelectorAll('.step-badge').forEach((b, i) => {
    b.classList.remove('active');
    b.classList.add('done');
  });
};

window.handleGlobalSearch = function(val) {
  const q = val.trim().toLowerCase();
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);

  const searchSection = document.getElementById('searchResultsSection');
  const booksSection  = document.getElementById('booksResultSection');
  const landing       = document.getElementById('booksLanding');

  if (q.length < 2) {
    searchSection?.classList.remove('visible');
    if (window._booksState.subject) {
      booksSection?.classList.add('visible');
      landing?.classList.add('hidden');
    }
    return;
  }

  searchSection?.classList.add('visible');
  booksSection?.classList.remove('visible');
  landing?.classList.add('hidden');

  const queryEl = document.getElementById('searchResultQuery');
  if (queryEl) queryEl.textContent = `"${val}"`;

  const listEl = document.getElementById('searchResultsList');
  if (!listEl) return;

  // Gather all cached books
  const results = [];
  Object.entries(_booksCache).forEach(([key, books]) => {
    const parts = key.split('-');
    const branch = parts[0], sem = parts[1];
    books.forEach(b => {
      if (b.name.toLowerCase().includes(q)) results.push({ ...b, branch, sem });
    });
  });

  if (!results.length) {
    listEl.innerHTML = `<div style="padding:32px;text-align:center;color:var(--gray-400);">No books found for "${val}". Try a different search or wait for more data.</div>`;
    return;
  }

  listEl.innerHTML = results.map(b => {
    const hasLink = b.link && b.link !== '#';
    return `<div class="search-result-item">
      <div class="sri-left">
        <div class="sri-breadcrumb"><span class="sri-code">${(_BK_BRANCH_NAMES[b.branch]||b.branch).split(' ')[0]}</span> · Sem ${b.sem}</div>
        <div class="sri-subject">${b.name}</div>
      </div>
      ${hasLink
        ? `<a href="${b.link}" target="_blank" rel="noopener" class="sri-view-btn">📥 Open</a>`
        : `<span class="sri-view-btn" style="opacity:0.4;cursor:default;">⏳ Soon</span>`}
    </div>`;
  }).join('');
};

window.clearSearch = function() {
  const inp = document.getElementById('globalSearchInput');
  if (inp) { inp.value = ''; window.handleGlobalSearch(''); }
  document.getElementById('searchClearBtn')?.classList.remove('visible');
};

// Keyframes
if (!document.getElementById('_bk-kf')) {
  const s = document.createElement('style'); s.id = '_bk-kf';
  s.textContent = '@keyframes _bkFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB to be ready before first render
function _booksInit() {
  if (window.SheetsDB) {
    window.selectBranch('cse');
  } else {
    // sheets.js not parsed yet — retry after a tick
    setTimeout(_booksInit, 50);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _booksInit);
} else {
  _booksInit();
}
