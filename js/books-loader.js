/**
 * books-loader.js — Loads Books from Google Sheets
 * Flat, searchable, paginated list of ALL books (no branch/sem/subject drill-down).
 */

const _BK_BRANCH_NAMES = {
  cse:'Computer Science (CSE)', civil:'Civil Engineering',
  electrical:'Electrical Engineering (EEE)', mechanical:'Mechanical Engineering',
  mining:'Mining Engineering', metallurgy:'Metallurgical Engineering',
  mineral:'Mineral Engineering',
};

const _BOOKS_TTL   = 5 * 60 * 1000; // 5 minutes
const _BATCH_SIZE  = 24;

let _allBooksCache = null;
let _allBooksTime  = 0;
let _sheetError    = false;

let _filteredBooks = []; // current search result set (or all books if no query)
let _visibleCount  = 0;  // how many of _filteredBooks are currently rendered

// ── Fetch every row from the Books tab once, cache for 5 min ──
async function _fetchAllBooks() {
  const now = Date.now();
  if (_allBooksCache && (now - _allBooksTime) < _BOOKS_TTL) return _allBooksCache;

  let rows = [];
  try {
    if (!window.SheetsDB || typeof window.SheetsDB.getAllBooks !== 'function') {
      throw new Error('SheetsDB not loaded');
    }
    rows = await window.SheetsDB.getAllBooks();
    _sheetError = false;
  } catch (e) {
    console.warn('Books fetch error:', e);
    _sheetError = true;
  }

  _allBooksCache = rows.filter(r => r.status !== 'hidden');
  _allBooksTime  = now;
  return _allBooksCache;
}

function _matchesQuery(book, q) {
  if (!q) return true;
  return (
    (book.book_name || '').toLowerCase().includes(q) ||
    (book.subject_name || '').toLowerCase().includes(q) ||
    (_BK_BRANCH_NAMES[book.branch] || book.branch || '').toLowerCase().includes(q) ||
    (book.tags || '').toLowerCase().includes(q)
  );
}

// ── Render the currently visible slice of _filteredBooks ──
function _renderBooks(reset) {
  const grid        = document.getElementById('booksGrid');
  const countEl      = document.getElementById('booksResultCount');
  const loadMoreBtn  = document.getElementById('loadMoreBtn');
  const emptyState   = document.getElementById('booksEmptyState');
  if (!grid) return;

  if (_sheetError) {
    grid.innerHTML = `<div style="padding:32px;text-align:center;color:#ef4444;grid-column:1/-1;">⚠️ Could not load data from Google Sheets. Check your API key and Sheet ID in sheets.js, then open the browser Console (F12) for the exact error.</div>`;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (countEl) countEl.textContent = '';
    return;
  }

  if (reset) _visibleCount = _BATCH_SIZE;

  if (!_filteredBooks.length) {
    grid.innerHTML = '';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `<div style="padding:48px 24px;text-align:center;color:var(--gray-400);"><div style="font-size:2.8rem;margin-bottom:12px;">📭</div><p>No books found. Try a different search term.</p></div>`;
    }
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (countEl) countEl.textContent = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const toShow = _filteredBooks.slice(0, _visibleCount);
  if (countEl) countEl.textContent = `${toShow.length} of ${_filteredBooks.length}`;

  const accent = '#FDC086'; // single flat accent used across all cards

  grid.innerHTML = toShow.map((book, idx) => {
    const hasLink = book.drive_link && book.drive_link !== '#';
    const tags = book.tags ? book.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tagHTML = tags.slice(0, 2).map(t => `<span class="book-meta-tag">${t}</span>`).join('');
    const branchShort = (_BK_BRANCH_NAMES[book.branch] || book.branch || '?').split(' ')[0].slice(0, 4).toUpperCase();
    const callNo = `${branchShort}·S${book.semester}`;
    const shareBtn = hasLink
      ? `<button class="book-icon-btn book-icon-share" title="Share" onclick="window.shareResource('${(book.book_name||'').replace(/'/g, "\\'")}', '${book.drive_link}', 'book')">Share</button>`
      : '';

    return `
    <div class="book-card" style="--card-accent:${accent};animation:_bkFade 0.25s ease both;animation-delay:${(idx % _BATCH_SIZE) * 0.015}s;" title="${(book.book_name||'').replace(/"/g,'&quot;')} — ${(book.subject_name||'').replace(/"/g,'&quot;')}">
      <div class="book-card-body">
        <div class="book-callno">${callNo}</div>
        <div class="book-title">${book.book_name}</div>
        <div class="book-subject">${book.subject_name}</div>
        <div class="book-meta">${tagHTML}</div>
      </div>
      <div class="book-card-footer">
        ${shareBtn}
        ${hasLink
          ? `<a href="${book.drive_link}" target="_blank" rel="noopener" class="book-icon-btn book-icon-dl" title="Open Book">Download</a>`
          : `<span class="book-icon-btn book-icon-dl soon" title="Coming soon">Soon</span>`}
      </div>
    </div>`;
  }).join('');

  if (loadMoreBtn) {
    loadMoreBtn.style.display = _visibleCount < _filteredBooks.length ? 'inline-flex' : 'none';
  }
}

// ── GLOBAL FUNCTIONS ──

window.loadMoreBooks = function () {
  _visibleCount += _BATCH_SIZE;
  _renderBooks(false);
};

window.handleGlobalSearch = async function (val) {
  const q = (val || '').trim().toLowerCase();
  document.getElementById('searchClearBtn')?.classList.toggle('visible', q.length > 0);

  const all = await _fetchAllBooks();
  _filteredBooks = all.filter(b => _matchesQuery(b, q));
  _renderBooks(true);
};

window.clearSearch = function () {
  const inp = document.getElementById('globalSearchInput');
  if (inp) inp.value = '';
  window.handleGlobalSearch('');
};

// Keyframes
if (!document.getElementById('_bk-kf')) {
  const s = document.createElement('style'); s.id = '_bk-kf';
  s.textContent = '@keyframes _bkFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB to be ready, then load everything once
async function _booksInit() {
  if (!window.SheetsDB) {
    setTimeout(_booksInit, 50); // sheets.js not parsed yet — retry after a tick
    return;
  }
  const grid = document.getElementById('booksGrid');
  if (grid) grid.innerHTML = `<div style="padding:32px;text-align:center;color:var(--gray-400);grid-column:1/-1;">Loading books…</div>`;

  const all = await _fetchAllBooks();
  _filteredBooks = all;
  _renderBooks(true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _booksInit);
} else {
  _booksInit();
}