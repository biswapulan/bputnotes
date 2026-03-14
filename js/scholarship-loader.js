/**
 * scholarship-loader.js — Loads Scholarships from Google Sheets
 * Sheet columns: title, description, category, amount, amount_sublabel,
 *                deadline, urgent, status, apply_link, eligibility, tags
 */

const _SCH_CAT_LABELS = {
  all:     'All Scholarships',
  central: 'Central Government',
  state:   'Odisha State Govt.',
  private: 'Private / Corporate',
  ngo:     'NGO / Foundation',
};
const _SCH_CAT_EMOJIS = {
  all: '📋', central: '🏛️', state: '🏵️', private: '🏢', ngo: '🤝',
};

let _schState = { cat: 'all' };
let _schData  = [];

async function _loadScholarships() {
  const container = document.getElementById('schCardContainer');
  if (!container) return;
  container.innerHTML = `<div style="padding:44px;text-align:center;color:var(--gray-400);display:flex;align-items:center;justify-content:center;gap:10px;"><div style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(5,150,105,0.15);border-top-color:#059669;animation:_schSpin 0.7s linear infinite;"></div>Loading scholarships...</div>`;
  try {
    _schData = await window.SheetsDB.getScholarships();
    _updateCounts();
    _renderScholarships();
  } catch(e) {
    console.warn('Scholarship fetch error:', e);
    container.innerHTML = `<div class="sch-empty"><div class="e-icon">⚠️</div><p style="color:#ef4444;">Could not connect to Google Sheets.<br><span style="font-size:0.78rem;opacity:0.7;">Check your API key &amp; Sheet ID in sheets.js, or open the browser Console (F12) for details.</span></p></div>`;
  }
}

function _updateCounts() {
  const cats = ['all', 'central', 'state', 'private', 'ngo'];
  cats.forEach(cat => {
    const count = cat === 'all' ? _schData.length : _schData.filter(s => s.category === cat).length;
    const el = document.querySelector(`#cat-${cat} .cat-count`);
    if (el) el.textContent = count;
    const el2 = document.getElementById(`cat-${cat}`);
    if (el2) {
      // Update the count in the button text
      const countSpan = el2.querySelector('.cat-count');
      if (countSpan) countSpan.textContent = count;
    }
  });
  // Update topbar count
  _updateTopbar();
}

function _updateTopbar() {
  const cat = _schState.cat;
  const filtered = cat === 'all' ? _schData : _schData.filter(s => s.category === cat);
  const countEl = document.getElementById('topbarCount');
  const nameEl  = document.getElementById('topbarCatName');
  const badgeEl = document.getElementById('topbarCatBadge');
  const dotEl   = document.getElementById('topbarDot');
  const labelEl = document.getElementById('topbarCatLabel');
  const mobileEl= document.getElementById('mobileCatLabel');

  if (countEl) countEl.textContent = `${filtered.length} scholarship${filtered.length !== 1 ? 's' : ''}`;
  if (nameEl)  nameEl.textContent  = cat === 'all' ? 'Showing all categories' : _SCH_CAT_LABELS[cat];
  if (badgeEl) badgeEl.className   = `sch-cat-badge ${cat}`;
  if (dotEl)   dotEl.className     = `topbar-dot-sch ${cat}`;
  if (labelEl) labelEl.textContent = _SCH_CAT_LABELS[cat];
  if (mobileEl) mobileEl.textContent = `${_SCH_CAT_EMOJIS[cat]} ${_SCH_CAT_LABELS[cat]}`;
}

function _renderScholarships() {
  const container = document.getElementById('schCardContainer');
  if (!container) return;
  const cat = _schState.cat;

  if (!_schData.length) {
    container.innerHTML = `<div class="sch-empty"><div class="e-icon">📭</div><p>No scholarships in the Sheet yet. Add them via the Admin Panel.</p></div>`;
    return;
  }

  if (cat === 'all') {
    const groups = [
      { key: 'central', label: 'Central Government', emoji: '🏛️' },
      { key: 'state',   label: 'Odisha State Govt.', emoji: '🏵️' },
      { key: 'private', label: 'Private / Corporate', emoji: '🏢' },
      { key: 'ngo',     label: 'NGO / Foundation',   emoji: '🤝' },
    ];
    container.innerHTML = groups.map(g => {
      const items = _schData.filter(s => s.category === g.key);
      if (!items.length) return '';
      return `<div class="sch-section-heading">
        <div class="sch-sh-bar ${g.key}"></div>
        <span class="sch-sh-text">${g.emoji} ${g.label}</span>
        <span class="sch-sh-count">${items.length} scholarships</span>
      </div>
      <hr class="sch-section-hr"/>
      <div class="sch-grid" style="margin-bottom:28px;">${items.map((s, i) => _renderSchCard(s, i)).join('')}</div>`;
    }).join('');
  } else {
    const items = _schData.filter(s => s.category === cat);
    container.innerHTML = items.length
      ? `<div class="sch-section-heading">
           <div class="sch-sh-bar ${cat}"></div>
           <span class="sch-sh-text">${_SCH_CAT_EMOJIS[cat]} ${_SCH_CAT_LABELS[cat]}</span>
           <span class="sch-sh-count">${items.length} scholarships</span>
         </div>
         <hr class="sch-section-hr"/>
         <div class="sch-grid">${items.map((s, i) => _renderSchCard(s, i)).join('')}</div>`
      : `<div class="sch-empty"><div class="e-icon">📭</div><p>No scholarships in this category yet.</p></div>`;
  }
}

function _renderSchCard(s, i) {
  const statusBadge = {
    open:     '<span class="sch-badge open">✅ Open</span>',
    closed:   '<span class="sch-badge closed">❌ Closed</span>',
    upcoming: '<span class="sch-badge upcoming">🔜 Upcoming</span>',
  }[s.status] || '';

  const catLabel = { central:'Central Govt.', state:'Odisha State', private:'Private', ngo:'NGO / Foundation' };
  const catEmoji = { central:'🏛️', state:'🏵️', private:'🏢', ngo:'🤝' };

  return `<div class="sch-card cat-${s.category}" style="animation:_schFade 0.3s ease ${i * 0.07}s both;">
    <div class="card-top-row">
      <div class="card-badges">
        <span class="sch-badge ${s.category}">${catEmoji[s.category] || ''} ${catLabel[s.category] || s.category}</span>
        ${statusBadge}
      </div>
      <div class="card-amount">
        <div class="amount-value">${s.amount}</div>
        <div class="amount-label">${s.amountSub}</div>
      </div>
    </div>
    <div class="card-title">${s.title}</div>
    <div class="card-desc">${s.description}</div>
    <div class="card-meta-row">
      ${s.eligibility ? `<div class="card-meta-item"><span class="mi">📋</span><span>${s.eligibility}</span></div>` : ''}
      ${s.deadline    ? `<div class="card-meta-item"><span class="mi">📅</span><span>${s.deadline}</span></div>` : ''}
    </div>
    <div class="card-footer">
      <span class="card-deadline${s.urgent ? ' urgent' : ''}">⏰ ${s.deadline || 'Check portal'}</span>
      <a href="${s.applyLink || '#'}" target="_blank" rel="noopener" class="sch-apply-btn ${s.category}">Apply Now →</a>
    </div>
  </div>`;
}

// ── GLOBAL FUNCTIONS ──

window.selectCat = function(cat) {
  _schState.cat = cat;
  ['all', 'central', 'state', 'private', 'ngo'].forEach(c => {
    const btn = document.getElementById('cat-' + c);
    if (btn) btn.className = 'cat-toggle-btn' + (c === cat ? ` active-${c}` : '');
  });
  _updateTopbar();
  window.clearSchSearch();
  _renderScholarships();
  window.closeMobileSidebar();
};

window.handleSchSearch = function(val) {
  const q = val.trim().toLowerCase();
  const content = document.getElementById('schContent');
  const panel   = document.getElementById('schSearchPanel');
  if (q.length < 2) {
    panel?.classList.remove('active');
    if (content) content.style.display = 'block';
    return;
  }
  if (content) content.style.display = 'none';
  panel?.classList.add('active');
  const found = _schData.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.eligibility.toLowerCase().includes(q)
  );
  const grid  = document.getElementById('schSearchGrid');
  const noRes = document.getElementById('schNoResults');
  const label = document.getElementById('schSearchLabel');
  if (grid)  grid.innerHTML = found.map((s, i) => _renderSchCard(s, i)).join('');
  if (noRes) noRes.style.display = found.length === 0 ? 'block' : 'none';
  if (label) label.textContent = `${found.length} result${found.length !== 1 ? 's' : ''} for "${val}"`;
};

window.clearSchSearch = function() {
  const inp = document.getElementById('schSearchInput'); if (inp) inp.value = '';
  document.getElementById('schSearchPanel')?.classList.remove('active');
  const c = document.getElementById('schContent'); if (c) c.style.display = 'block';
};

window.toggleMobileSidebar = function() {
  const s = document.getElementById('schSidebar');
  const a = document.getElementById('mobileToggleArrow');
  if (!s) return;
  const open = s.classList.contains('open');
  s.classList.toggle('open', !open);
  if (a) a.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
};
window.closeMobileSidebar = function() {
  document.getElementById('schSidebar')?.classList.remove('open');
  const a = document.getElementById('mobileToggleArrow'); if (a) a.style.transform = 'rotate(0deg)';
};

// Keyframes
if (!document.getElementById('_sch-kf')) {
  const s = document.createElement('style'); s.id = '_sch-kf';
  s.textContent = '@keyframes _schSpin{to{transform:rotate(360deg)}}@keyframes _schFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB
function _scholarInit() {
  if (window.SheetsDB) { _loadScholarships(); }
  else { setTimeout(_scholarInit, 50); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _scholarInit);
} else {
  _scholarInit();
}
