/**
 * admin.js — BPUTNotes Admin Panel Logic
 * Reads from Google Sheets via SheetsDB, writes via Apps Script.
 */

/* ════════════════ AUTH ════════════════ */
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin@bputnotes.in';

document.getElementById('login-pass')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('bputnotes_admin', '1');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('topbar-user-label').textContent = `👤 ${user}`;
    initApp();
  } else {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
}

function doLogout() {
  sessionStorage.removeItem('bputnotes_admin');
  location.reload();
}

if (sessionStorage.getItem('bputnotes_admin') === '1') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('topbar-user-label').textContent = `👤 ${ADMIN_USER}`;
}

/* ════════════════ DATA STORE ════════════════ */
let DB = { notes: [], pyqs: [], books: [], scholarships: [] };

async function initApp() {
  showPanel('dashboard');
  await refreshAll();
  initPopupPanel();
  testSheetConnection(true);
}

async function refreshAll() {
  showToast('🔄 Loading from Google Sheets…', 'info');
  try {
    const [notes, pyqs, books, scholar] = await Promise.all([
      window.SheetsDB.getAllNotes().catch(() => []),
      window.SheetsDB.getAllPYQs().catch(() => []),
      window.SheetsDB.getAllBooks().catch(() => []),
      window.SheetsDB.getAllScholarships().catch(() => []),
    ]);
    DB.notes        = notes;
    DB.pyqs         = pyqs;
    DB.books        = books;
    DB.scholarships = scholar;
    updateStats();
    loadPanel(getCurrentPanel());
    showToast('✅ Data loaded from Google Sheets', 'success');
  } catch(e) {
    showToast('❌ Failed to load from Sheets: ' + e.message, 'error');
  }
}

function updateStats() {
  document.getElementById('stat-notes').textContent   = DB.notes.length;
  document.getElementById('stat-pyqs').textContent    = DB.pyqs.length;
  document.getElementById('stat-books').textContent   = DB.books.length;
  document.getElementById('stat-scholar').textContent = DB.scholarships.length;
  document.getElementById('cnt-notes').textContent    = DB.notes.length;
  document.getElementById('cnt-pyqs').textContent     = DB.pyqs.length;
  document.getElementById('cnt-books').textContent    = DB.books.length;
  document.getElementById('cnt-scholar').textContent  = DB.scholarships.length;
}

/* ════════════════ NAV ════════════════ */
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.getElementById('nav-' + name)?.classList.add('active');
  if (name === 'popup') initPopupPanel();
  else if (name !== 'dashboard' && name !== 'setup') loadPanel(name);
}

function getCurrentPanel() {
  const active = document.querySelector('.panel.active');
  return active ? active.id.replace('panel-', '') : 'dashboard';
}

/* ════════════════ TABLE RENDERING ════════════════ */
function loadPanel(name) {
  if (['dashboard', 'setup', 'popup'].includes(name)) return;
  if (name === 'scholarships') { renderScholarships(); return; }
  if (name === 'pyqs') { renderPYQTable(); return; }
  renderResourceTable(name);
}

const BRANCH_COLOR = {
  cse:'#3b82f6', civil:'#f59e0b', electrical:'#22c55e', mechanical:'#a78bfa',
  mining:'#ef4444', metallurgy:'#06b6d4', mineral:'#ec4899',
};

function branchPill(b) {
  const c = BRANCH_COLOR[b] || '#6b7280';
  return `<span style="font-size:0.72rem;font-weight:700;background:${c}22;color:${c};border-radius:5px;padding:2px 7px;">${(b||'').toUpperCase()}</span>`;
}

function statusBadge(row) {
  if (!row.drive_link || row.drive_link === '#')
    return `<span class="status-badge status-soon">Pending</span>`;
  return row.status === 'hidden'
    ? `<span class="status-badge status-hidden">Hidden</span>`
    : `<span class="status-badge status-active">Live</span>`;
}

function filterRows(type) {
  const bf  = document.getElementById(`${type}-branch-filter`)?.value || '';
  const sf  = parseInt(document.getElementById(`${type}-sem-filter`)?.value) || 0;
  const q   = (document.getElementById(`${type}-search`)?.value || '').toLowerCase();
  return DB[type].filter(r => {
    if (bf && r.branch !== bf) return false;
    if (sf && r.semester !== sf) return false;
    if (q  && !(r.subject_name || '').toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderResourceTable(type) {
  const tbody = document.getElementById(`${type}-table-body`);
  const rows  = filterRows(type);
  if (!rows.length) {
    tbody.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div><p>No entries. Add one with the + button, or check your Sheet.</p></div>`;
    return;
  }
  tbody.innerHTML = rows.map((row, idx) => `
    <div class="table-row row-notes">
      ${branchPill(row.branch)}
      <div class="cell-mono">S${row.semester}</div>
      <div class="cell-dim">#${row.subject_number}</div>
      <div style="min-width:0;" title="${row.subject_name}"><span style="font-size:0.83rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;">${row.subject_name}</span></div>
      <div class="cell-link">${row.drive_link && row.drive_link !== '#' ? `<a href="${row.drive_link}" target="_blank">🔗 Drive</a>` : '<span style="color:var(--text-mute);">—</span>'}</div>
      ${statusBadge(row)}
      <div class="row-actions">
        <button class="btn-icon" onclick="openEditModal('${type}', ${idx})" title="Edit">✏️</button>
        <button class="btn-icon danger" onclick="deleteEntry('${type}', ${idx})" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

function renderPYQTable() {
  const tbody = document.getElementById('pyqs-table-body');
  const bf    = document.getElementById('pyqs-branch-filter')?.value || '';
  const sf    = parseInt(document.getElementById('pyqs-sem-filter')?.value) || 0;
  const tf    = document.getElementById('pyqs-type-filter')?.value || '';
  const yf    = parseInt(document.getElementById('pyqs-year-filter')?.value) || 0;
  const q     = (document.getElementById('pyqs-search')?.value || '').toLowerCase();

  const rows = DB.pyqs.filter(r => {
    if (bf && r.branch !== bf) return false;
    if (sf && r.semester !== sf) return false;
    if (tf && r.exam_type !== tf) return false;
    if (yf && r.year !== yf) return false;
    if (q  && !(r.subject_name || '').toLowerCase().includes(q)) return false;
    return true;
  });

  if (!rows.length) {
    tbody.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div><p>No PYQ entries match these filters.</p></div>`;
    return;
  }
  const typeColor = { regular: '#f59e0b', back: '#ef4444' };
  tbody.innerHTML = rows.map((row, idx) => `
    <div class="table-row row-pyqs">
      ${branchPill(row.branch)}
      <div class="cell-mono">S${row.semester}</div>
      <div class="cell-dim">#${row.subject_number}</div>
      <div style="min-width:0;" title="${row.subject_name}"><span style="font-size:0.83rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;">${row.subject_name}</span></div>
      <div><span style="font-size:0.68rem;font-weight:700;padding:2px 7px;border-radius:5px;background:${typeColor[row.exam_type]||'#6b7280'}22;color:${typeColor[row.exam_type]||'#6b7280'};">${row.exam_type === 'back' ? 'Back' : 'Regular'}</span></div>
      <div class="cell-mono">${row.year}</div>
      <div class="cell-link">${row.drive_link && row.drive_link !== '#' ? `<a href="${row.drive_link}" target="_blank">🔗 Drive</a>` : '<span style="color:var(--text-mute);">—</span>'}</div>
      <span class="status-badge ${row.status === 'hidden' ? 'status-hidden' : row.drive_link && row.drive_link !== '#' ? 'status-active' : 'status-soon'}">${row.status === 'hidden' ? 'Hidden' : row.drive_link && row.drive_link !== '#' ? 'Live' : 'Pending'}</span>
      <div class="row-actions">
        <button class="btn-icon" onclick="openEditPYQModal(${idx})" title="Edit">✏️</button>
        <button class="btn-icon danger" onclick="deletePYQEntry(${idx})" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

function renderScholarships() {
  const tbody  = document.getElementById('scholarships-table-body');
  const catF   = document.getElementById('scholar-cat-filter')?.value || '';
  const q      = (document.getElementById('scholar-search')?.value || '').toLowerCase();
  const catColor = { central:'#3b82f6', state:'#22c55e', private:'#f59e0b', ngo:'#a78bfa' };
  const rows = DB.scholarships.filter(r => {
    if (catF && r.category !== catF) return false;
    if (q    && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });
  if (!rows.length) {
    tbody.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div><p>No scholarships found.</p></div>`;
    return;
  }
  tbody.innerHTML = rows.map((row, idx) => {
    const cc = catColor[row.category] || '#6b7280';
    return `<div class="table-row row-scholar">
      <div style="min-width:0;">
        <div style="font-size:0.84rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${row.title}">${row.title}</div>
        <div style="font-size:0.7rem;color:var(--text-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${row.description}">${row.description}</div>
      </div>
      <span style="font-size:0.68rem;font-weight:700;background:${cc}22;color:${cc};border-radius:5px;padding:2px 7px;">${(row.category||'').toUpperCase()}</span>
      <div style="font-size:0.82rem;color:var(--text-dim);">${row.amount}</div>
      <span class="status-badge ${row.status === 'open' ? 'status-active' : row.status === 'closed' ? 'status-hidden' : 'status-soon'}">${row.status || 'open'}</span>
      <div class="row-actions">
        <button class="btn-icon" onclick="openEditScholarModal(${idx})" title="Edit">✏️</button>
        <button class="btn-icon danger" onclick="deleteScholar(${idx})" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

/* ════════════════ MODALS ════════════════ */
let _ctx = { type: null, editIdx: null };

const BRANCHES = ['cse','civil','electrical','mechanical','mining','metallurgy','mineral'];
const SEMS     = [1,2,3,4,5,6,7,8];
const YEARS    = [2024,2023,2022,2021,2020];

function branchOptions(sel) {
  return BRANCHES.map(b => `<option value="${b}" ${sel===b?'selected':''}>${b.toUpperCase()}</option>`).join('');
}
function semOptions(sel) {
  return SEMS.map(s => `<option value="${s}" ${parseInt(sel)===s?'selected':''}>${s}</option>`).join('');
}

function openAddModal(type) {
  _ctx = { type, editIdx: null };
  document.getElementById('modal-title').textContent = `+ Add ${type === 'scholarships' ? 'Scholarship' : type.slice(0,1).toUpperCase()+type.slice(1)} Entry`;
  document.getElementById('modal-body').innerHTML = type === 'scholarships' ? scholarForm() : type === 'pyqs' ? pyqForm() : resourceForm();
  document.getElementById('modal-save-btn').textContent = 'Add Entry';
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(type, idx) {
  const rows = filterRows(type);
  const row  = rows[idx];
  const actualIdx = DB[type].indexOf(row);
  _ctx = { type, editIdx: actualIdx };
  document.getElementById('modal-title').textContent = '✏️ Edit Entry';
  document.getElementById('modal-body').innerHTML = resourceForm(row);
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditPYQModal(idx) {
  const bf   = document.getElementById('pyqs-branch-filter')?.value || '';
  const sf   = parseInt(document.getElementById('pyqs-sem-filter')?.value) || 0;
  const tf   = document.getElementById('pyqs-type-filter')?.value || '';
  const yf   = parseInt(document.getElementById('pyqs-year-filter')?.value) || 0;
  const q    = (document.getElementById('pyqs-search')?.value || '').toLowerCase();
  const rows = DB.pyqs.filter(r => {
    if (bf && r.branch !== bf) return false;
    if (sf && r.semester !== sf) return false;
    if (tf && r.exam_type !== tf) return false;
    if (yf && r.year !== yf) return false;
    if (q  && !(r.subject_name||'').toLowerCase().includes(q)) return false;
    return true;
  });
  const row = rows[idx];
  _ctx = { type: 'pyqs', editIdx: DB.pyqs.indexOf(row) };
  document.getElementById('modal-title').textContent = '✏️ Edit PYQ Entry';
  document.getElementById('modal-body').innerHTML = pyqForm(row);
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditScholarModal(idx) {
  const catF = document.getElementById('scholar-cat-filter')?.value || '';
  const q    = (document.getElementById('scholar-search')?.value || '').toLowerCase();
  const rows = DB.scholarships.filter(r => {
    if (catF && r.category !== catF) return false;
    if (q    && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });
  const row = rows[idx];
  _ctx = { type: 'scholarships', editIdx: DB.scholarships.indexOf(row) };
  document.getElementById('modal-title').textContent = '✏️ Edit Scholarship';
  document.getElementById('modal-body').innerHTML = scholarForm(row);
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('modal-overlay').classList.add('open');
}

function resourceForm(row = {}) {
  return `<div class="form-grid">
    <div class="form-group"><label class="form-label">Branch *</label><select class="form-select" id="f-branch">${branchOptions(row.branch)}</select></div>
    <div class="form-group"><label class="form-label">Semester *</label><select class="form-select" id="f-semester">${semOptions(row.semester)}</select></div>
    <div class="form-group"><label class="form-label">Subject #</label><select class="form-select" id="f-subnum">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${row.subject_number==n?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="f-status"><option value="active" ${row.status==='active'?'selected':''}>Active</option><option value="hidden" ${row.status==='hidden'?'selected':''}>Hidden</option></select></div>
    <div class="form-group full"><label class="form-label">Subject Name *</label><input type="text" class="form-input" id="f-name" value="${row.subject_name||''}" placeholder="e.g. Data Structures & Algorithms" /></div>
    <div class="form-group full"><label class="form-label">Google Drive Link</label><input type="url" class="form-input" id="f-link" value="${row.drive_link!=='#'?row.drive_link||'':''}" placeholder="https://drive.google.com/…" /><div class="form-hint">Leave blank if not available yet</div></div>
    <div class="form-group full"><label class="form-label">Tags (comma-separated)</label><input type="text" class="form-input" id="f-tags" value="${row.tags||''}" placeholder="Notes, PDF, 4 Credits" /></div>
  </div>`;
}

function pyqForm(row = {}) {
  return `<div class="form-grid">
    <div class="form-group"><label class="form-label">Branch *</label><select class="form-select" id="f-branch">${branchOptions(row.branch)}</select></div>
    <div class="form-group"><label class="form-label">Semester *</label><select class="form-select" id="f-semester">${semOptions(row.semester)}</select></div>
    <div class="form-group"><label class="form-label">Subject #</label><select class="form-select" id="f-subnum">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${row.subject_number==n?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Exam Type *</label><select class="form-select" id="f-examtype"><option value="regular" ${row.exam_type==='regular'?'selected':''}>Regular</option><option value="back" ${row.exam_type==='back'?'selected':''}>Back Paper</option></select></div>
    <div class="form-group"><label class="form-label">Year *</label><select class="form-select" id="f-year">${YEARS.map(y=>`<option value="${y}" ${row.year==y?'selected':''}>${y}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="f-status"><option value="active" ${row.status==='active'?'selected':''}>Active</option><option value="hidden" ${row.status==='hidden'?'selected':''}>Hidden</option></select></div>
    <div class="form-group full"><label class="form-label">Subject Name *</label><input type="text" class="form-input" id="f-name" value="${row.subject_name||''}" placeholder="e.g. Engineering Mathematics I" /></div>
    <div class="form-group full"><label class="form-label">Google Drive Link</label><input type="url" class="form-input" id="f-link" value="${row.drive_link!=='#'?row.drive_link||'':''}" placeholder="https://drive.google.com/…" /></div>
    <div class="form-group full"><label class="form-label">Tags</label><input type="text" class="form-input" id="f-tags" value="${row.tags||''}" placeholder="PYQ, 2024" /></div>
  </div>`;
}

function scholarForm(row = {}) {
  return `<div class="form-grid">
    <div class="form-group full"><label class="form-label">Title *</label><input type="text" class="form-input" id="s-title" value="${row.title||''}" placeholder="e.g. Post Matric Scholarship" /></div>
    <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="s-cat"><option value="central" ${row.category==='central'?'selected':''}>Central Govt.</option><option value="state" ${row.category==='state'?'selected':''}>Odisha State</option><option value="private" ${row.category==='private'?'selected':''}>Private</option><option value="ngo" ${row.category==='ngo'?'selected':''}>NGO / Foundation</option></select></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="s-status"><option value="open" ${row.status==='open'?'selected':''}>Open</option><option value="upcoming" ${row.status==='upcoming'?'selected':''}>Upcoming</option><option value="closed" ${row.status==='closed'?'selected':''}>Closed</option></select></div>
    <div class="form-group full"><label class="form-label">Description</label><textarea class="form-textarea" id="s-desc">${row.description||''}</textarea></div>
    <div class="form-group"><label class="form-label">Amount</label><input type="text" class="form-input" id="s-amount" value="${row.amount||''}" placeholder="₹5,000" /></div>
    <div class="form-group"><label class="form-label">Amount Sub-label</label><input type="text" class="form-input" id="s-amountsub" value="${row.amount_sublabel||'per year'}" placeholder="per year" /></div>
    <div class="form-group"><label class="form-label">Deadline</label><input type="text" class="form-input" id="s-deadline" value="${row.deadline||''}" placeholder="Oct 31" /></div>
    <div class="form-group"><label class="form-label">Urgent?</label><select class="form-select" id="s-urgent"><option value="false" ${row.urgent!=='true'?'selected':''}>No</option><option value="true" ${row.urgent==='true'?'selected':''}>Yes</option></select></div>
    <div class="form-group full"><label class="form-label">Apply Link</label><input type="url" class="form-input" id="s-link" value="${row.apply_link!=='#'?row.apply_link||'':''}" placeholder="https://scholarships.gov.in" /></div>
    <div class="form-group full"><label class="form-label">Eligibility</label><input type="text" class="form-input" id="s-elig" value="${row.eligibility||''}" placeholder="SC/ST students, income < ₹8 LPA" /></div>
    <div class="form-group full"><label class="form-label">Tags</label><input type="text" class="form-input" id="s-tags" value="${row.tags||''}" placeholder="Merit, SC/ST, Odisha" /></div>
  </div>`;
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalIfOutside(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

async function saveModalData() {
  const { type, editIdx } = _ctx;
  const isNew = editIdx === null;

  let entry, tabName, row;

  if (type === 'scholarships') {
    const title = document.getElementById('s-title')?.value.trim();
    if (!title) { showToast('❌ Title is required', 'error'); return; }
    entry = {
      title, description: document.getElementById('s-desc')?.value.trim() || '',
      category: document.getElementById('s-cat')?.value || 'central',
      amount: document.getElementById('s-amount')?.value.trim() || '',
      amount_sublabel: document.getElementById('s-amountsub')?.value.trim() || 'per year',
      deadline: document.getElementById('s-deadline')?.value.trim() || '',
      urgent: document.getElementById('s-urgent')?.value || 'false',
      status: document.getElementById('s-status')?.value || 'open',
      apply_link: document.getElementById('s-link')?.value.trim() || '#',
      eligibility: document.getElementById('s-elig')?.value.trim() || '',
      tags: document.getElementById('s-tags')?.value.trim() || '',
    };
    row = [entry.title, entry.description, entry.category, entry.amount, entry.amount_sublabel, entry.deadline, entry.urgent, entry.status, entry.apply_link, entry.eligibility, entry.tags];
    tabName = 'Scholarships';
  } else if (type === 'pyqs') {
    const name = document.getElementById('f-name')?.value.trim();
    if (!name) { showToast('❌ Subject name is required', 'error'); return; }
    entry = {
      branch: document.getElementById('f-branch')?.value || 'cse',
      semester: parseInt(document.getElementById('f-semester')?.value) || 1,
      subject_number: parseInt(document.getElementById('f-subnum')?.value) || 1,
      subject_name: name,
      exam_type: document.getElementById('f-examtype')?.value || 'regular',
      year: parseInt(document.getElementById('f-year')?.value) || 2024,
      drive_link: document.getElementById('f-link')?.value.trim() || '#',
      tags: document.getElementById('f-tags')?.value.trim() || '',
      status: document.getElementById('f-status')?.value || 'active',
    };
    row = [entry.branch, entry.semester, entry.subject_number, entry.subject_name, entry.exam_type, entry.year, entry.drive_link, entry.tags, entry.status];
    tabName = 'PYQs';
  } else {
    const name = document.getElementById('f-name')?.value.trim();
    if (!name) { showToast('❌ Subject name is required', 'error'); return; }
    entry = {
      branch: document.getElementById('f-branch')?.value || 'cse',
      semester: parseInt(document.getElementById('f-semester')?.value) || 1,
      subject_number: parseInt(document.getElementById('f-subnum')?.value) || 1,
      subject_name: name,
      drive_link: document.getElementById('f-link')?.value.trim() || '#',
      tags: document.getElementById('f-tags')?.value.trim() || '',
      status: document.getElementById('f-status')?.value || 'active',
    };
    row = [entry.branch, entry.semester, entry.subject_number, entry.subject_name, entry.drive_link, entry.tags, entry.status];
    tabName = type === 'notes' ? 'Notes' : 'Books';
  }

  closeModal();
  // Optimistic local update first (instant UI feedback)
  if (isNew) {
    entry.rowIndex = DB[type].length + 2;
    DB[type].push(entry);
  } else {
    entry.rowIndex = DB[type][editIdx].rowIndex;
    DB[type][editIdx] = entry;
  }
  updateStats();
  loadPanel(type);
  showToast('⏳ Saving to Google Sheet…', 'info');

  // Actually write to Sheet, then re-fetch to confirm
  try {
    await window.SheetsDB.adminWrite(isNew ? 'append' : 'update', { tab: tabName, rowIndex: entry.rowIndex, row });
    showToast(isNew ? '✅ Entry added to Sheet' : '✅ Entry updated in Sheet', 'success');
  } catch(e) {
    showToast('❌ Sheet write failed: ' + e.message, 'error');
    console.error('adminWrite error:', e);
    return;
  }

  // Re-fetch from Sheet after 1.5s to confirm data landed (verifies write succeeded)
  setTimeout(async () => {
    await refreshAll();
    loadPanel(type);
  }, 1500);
}

async function deleteEntry(type, idx) {
  const rows  = filterRows(type);
  const row   = rows[idx];
  const aIdx  = DB[type].indexOf(row);
  if (!confirm(`Delete "${row.subject_name}"?`)) return;
  const tabName = type === 'notes' ? 'Notes' : 'Books';

  // Optimistic local remove
  DB[type].splice(aIdx, 1);
  updateStats(); loadPanel(type);
  showToast('⏳ Deleting from Sheet…', 'info');

  try {
    await window.SheetsDB.adminWrite('delete', { tab: tabName, rowIndex: row.rowIndex });
    showToast('🗑️ Entry deleted from Sheet', 'info');
  } catch(e) {
    showToast('❌ Delete failed: ' + e.message, 'error');
    console.error('deleteEntry error:', e);
  }
  setTimeout(async () => { await refreshAll(); loadPanel(type); }, 1500);
}

async function deletePYQEntry(idx) {
  const bf  = document.getElementById('pyqs-branch-filter')?.value || '';
  const sf  = parseInt(document.getElementById('pyqs-sem-filter')?.value) || 0;
  const tf  = document.getElementById('pyqs-type-filter')?.value || '';
  const yf  = parseInt(document.getElementById('pyqs-year-filter')?.value) || 0;
  const q   = (document.getElementById('pyqs-search')?.value || '').toLowerCase();
  const rows= DB.pyqs.filter(r => {
    if (bf && r.branch !== bf) return false;
    if (sf && r.semester !== sf) return false;
    if (tf && r.exam_type !== tf) return false;
    if (yf && r.year !== yf) return false;
    if (q  && !(r.subject_name||'').toLowerCase().includes(q)) return false;
    return true;
  });
  const row  = rows[idx];
  const aIdx = DB.pyqs.indexOf(row);
  if (!confirm(`Delete "${row.subject_name}"?`)) return;

  DB.pyqs.splice(aIdx, 1);
  updateStats(); loadPanel('pyqs');
  showToast('⏳ Deleting from Sheet…', 'info');

  try {
    await window.SheetsDB.adminWrite('delete', { tab: 'PYQs', rowIndex: row.rowIndex });
    showToast('🗑️ PYQ deleted from Sheet', 'info');
  } catch(e) {
    showToast('❌ Delete failed: ' + e.message, 'error');
    console.error('deletePYQEntry error:', e);
  }
  setTimeout(async () => { await refreshAll(); loadPanel('pyqs'); }, 1500);
}

async function deleteScholar(idx) {
  const catF = document.getElementById('scholar-cat-filter')?.value || '';
  const q    = (document.getElementById('scholar-search')?.value || '').toLowerCase();
  const rows = DB.scholarships.filter(r => {
    if (catF && r.category !== catF) return false;
    if (q    && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });
  const row  = rows[idx];
  const aIdx = DB.scholarships.indexOf(row);
  if (!confirm(`Delete "${row.title}"?`)) return;

  DB.scholarships.splice(aIdx, 1);
  updateStats(); renderScholarships();
  showToast('⏳ Deleting from Sheet…', 'info');

  try {
    await window.SheetsDB.adminWrite('delete', { tab: 'Scholarships', rowIndex: row.rowIndex });
    showToast('🗑️ Scholarship deleted from Sheet', 'info');
  } catch(e) {
    showToast('❌ Delete failed: ' + e.message, 'error');
    console.error('deleteScholar error:', e);
  }
  setTimeout(async () => { await refreshAll(); renderScholarships(); }, 1500);
}

/* ════════════════ POPUP MANAGER ════════════════ */
let _popupCards   = [];
let _popupEnabled = true;

async function initPopupPanel() {
  try {
    const cfg = await window.SheetsDB.getPopupConfig();
    _popupEnabled = cfg.enabled !== false;
    _popupCards = cfg.cards || [];
    if (cfg.eyebrow)          document.getElementById('pop-eyebrow').value           = cfg.eyebrow;
    if (cfg.heading)          document.getElementById('pop-heading').value            = cfg.heading;
    if (cfg.headingHighlight) document.getElementById('pop-heading-highlight').value  = cfg.headingHighlight;
    if (cfg.subtitle)         document.getElementById('pop-subtitle').value           = cfg.subtitle;
    if (cfg.footerText)       document.getElementById('pop-footer-text').value        = cfg.footerText;
    if (cfg.ctaText)          document.getElementById('pop-cta-text').value           = cfg.ctaText;
    if (cfg.ctaLink)          document.getElementById('pop-cta-link').value           = cfg.ctaLink;
  } catch(e) {
    _popupCards = [
      { icon:'🌟', title:'Campus Ambassador', desc:'Represent BPUTNotes at your college.', link:'careers.html', color:'amber', badge:'Open', enabled:true },
      { icon:'✍️', title:'Content Contributor', desc:'Share notes & help students.', link:'careers.html', color:'blue', badge:'Open', enabled:true },
      { icon:'💻', title:'Tech Intern — Frontend', desc:'Build the platform.', link:'careers.html', color:'green', badge:'Open', enabled:true },
    ];
  }
  updatePopupToggleUI();
  renderPopupCards();
}

function togglePopupEnabled() {
  _popupEnabled = !_popupEnabled;
  updatePopupToggleUI();
}

function updatePopupToggleUI() {
  const track = document.getElementById('popup-toggle-track');
  const thumb = document.getElementById('popup-toggle-thumb');
  const label = document.getElementById('popup-status-label');
  if (!track) return;
  track.style.background = _popupEnabled ? 'var(--green)' : 'rgba(107,114,128,0.4)';
  thumb.style.transform  = _popupEnabled ? 'translateX(20px)' : 'translateX(0px)';
  if (label) label.textContent = _popupEnabled ? 'Enabled' : 'Disabled';
}

function renderPopupCards() {
  const list = document.getElementById('popup-cards-list');
  if (!list) return;
  list.innerHTML = _popupCards.map((card, idx) => `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="text" value="${card.icon}" style="width:38px;text-align:center;font-size:1rem;padding:4px;background:var(--bg2);border:1px solid var(--border);border-radius:7px;color:var(--text);" onchange="updateCard(${idx},'icon',this.value)" title="Emoji" />
          <span style="font-size:0.72rem;color:var(--text-mute);">Card ${idx+1}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:0.72rem;color:var(--text-dim);">
            <input type="checkbox" ${card.enabled!==false?'checked':''} onchange="updateCard(${idx},'enabled',this.checked)" /> Show
          </label>
          <button onclick="removeCard(${idx})" style="background:rgba(239,68,68,0.1);border:none;color:var(--red);border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:0.8rem;">✕</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="form-group"><label class="form-label" style="font-size:0.62rem;">Title</label><input type="text" class="form-input" style="padding:7px 10px;font-size:0.8rem;" value="${card.title}" onchange="updateCard(${idx},'title',this.value)" /></div>
        <div class="form-group"><label class="form-label" style="font-size:0.62rem;">Badge</label><input type="text" class="form-input" style="padding:7px 10px;font-size:0.8rem;" value="${card.badge||'Open'}" onchange="updateCard(${idx},'badge',this.value)" /></div>
        <div class="form-group" style="grid-column:1/-1;"><label class="form-label" style="font-size:0.62rem;">Description</label><input type="text" class="form-input" style="padding:7px 10px;font-size:0.8rem;" value="${card.desc}" onchange="updateCard(${idx},'desc',this.value)" /></div>
        <div class="form-group"><label class="form-label" style="font-size:0.62rem;">Link</label><input type="text" class="form-input" style="padding:7px 10px;font-size:0.8rem;" value="${card.link}" onchange="updateCard(${idx},'link',this.value)" /></div>
        <div class="form-group"><label class="form-label" style="font-size:0.62rem;">Color</label><select class="form-select" style="padding:7px 10px;font-size:0.8rem;" onchange="updateCard(${idx},'color',this.value)">${['amber','blue','green','purple','red'].map(c=>`<option value="${c}" ${card.color===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
    </div>`).join('');
}

function updateCard(idx, field, value) { _popupCards[idx][field] = value; }
function addPopupCard() {
  _popupCards.push({ icon:'✦', title:'New Program', desc:'Description here.', link:'careers.html', color:'blue', badge:'Open', enabled:true });
  renderPopupCards();
}
function removeCard(idx) { _popupCards.splice(idx, 1); renderPopupCards(); }

function getPopupData() {
  return {
    enabled:          _popupEnabled,
    eyebrow:          document.getElementById('pop-eyebrow')?.value.trim()            || '',
    heading:          document.getElementById('pop-heading')?.value.trim()             || '',
    heading_highlight:document.getElementById('pop-heading-highlight')?.value.trim()   || '',
    subtitle:         document.getElementById('pop-subtitle')?.value.trim()            || '',
    footer_text:      document.getElementById('pop-footer-text')?.value.trim()         || '',
    cta_text:         document.getElementById('pop-cta-text')?.value.trim()            || '',
    cta_link:         document.getElementById('pop-cta-link')?.value.trim()            || '',
    cards: _popupCards,
  };
}

async function savePopupToSheet() {
  const data = getPopupData();
  showToast('💾 Saving popup to Sheet…', 'info');
  try {
    // Build full key-value rows array
    const rows = [
      ['enabled',           data.enabled ? 'true' : 'false'],
      ['eyebrow',           data.eyebrow],
      ['heading',           data.heading],
      ['heading_highlight', data.heading_highlight],
      ['subtitle',          data.subtitle],
      ['footer_text',       data.footer_text],
      ['cta_text',          data.cta_text],
      ['cta_link',          data.cta_link],
    ];
    data.cards.forEach((c, i) => {
      const n = i + 1;
      rows.push(
        [`card_${n}_icon`,    c.icon    || ''],
        [`card_${n}_title`,   c.title   || ''],
        [`card_${n}_desc`,    c.desc    || ''],
        [`card_${n}_link`,    c.link    || ''],
        [`card_${n}_color`,   c.color   || 'blue'],
        [`card_${n}_badge`,   c.badge   || 'Open'],
        [`card_${n}_enabled`, c.enabled !== false ? 'true' : 'false'],
      );
    });

    // Single atomic write — replaces entire Popup tab at once
    await window.SheetsDB.adminWrite('replacePopup', { tab: 'Popup', rows });
    window.SheetsDB.clearSheetCache('Popup');
    showToast('✅ Popup saved! Changes live within 5 minutes.', 'success');
  } catch(e) {
    showToast('❌ Save failed: ' + e.message, 'error');
    console.error('savePopupToSheet error:', e);
  }
}
function previewPopup() {
  const data  = getPopupData();
  const box   = document.getElementById('popup-preview-box');
  const inner = document.getElementById('popup-preview-inner');
  if (!box || !inner) return;
  box.style.display = 'block';
  const colorMap = {
    amber:  'rgba(245,158,11,0.14)', blue: 'rgba(59,130,246,0.14)',
    green:  'rgba(34,197,94,0.14)', purple:'rgba(167,139,250,0.14)', red:'rgba(239,68,68,0.14)',
  };
  const cardsHTML = (data.cards||[]).filter(c=>c.enabled!==false).map(c=>`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);margin-bottom:8px;">
      <div style="width:40px;height:40px;border-radius:11px;background:${colorMap[c.color]||colorMap.blue};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${c.icon||'✦'}</div>
      <div style="flex:1;"><div style="font-size:0.86rem;font-weight:700;color:#fff;">${c.title}</div><div style="font-size:0.7rem;color:rgba(255,255,255,0.42);">${c.desc}</div></div>
      <span style="font-size:0.62rem;font-weight:700;padding:3px 9px;border-radius:100px;background:rgba(255,255,255,0.1);color:#fff;">${c.badge||'Open'}</span>
    </div>`).join('');
  inner.innerHTML = `<div style="font-family:'Sora',sans-serif;">
    <div style="display:inline-flex;align-items:center;gap:7px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.28);border-radius:100px;padding:4px 12px;font-size:0.62rem;font-weight:800;text-transform:uppercase;color:#fcd34d;margin-bottom:14px;letter-spacing:0.1em;">${data.eyebrow}</div>
    <h3 style="font-size:1.3rem;font-weight:800;color:#fff;line-height:1.2;margin-bottom:8px;">${data.heading}<br><span style="background:linear-gradient(135deg,#f59e0b,#fcd34d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${data.heading_highlight}</span> 🎓</h3>
    <p style="font-size:0.8rem;color:rgba(255,255,255,0.48);margin-bottom:18px;line-height:1.65;">${data.subtitle}</p>
    ${cardsHTML}
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(255,255,255,0.07);margin-top:8px;flex-wrap:wrap;gap:10px;">
      <span style="font-size:0.72rem;color:rgba(255,255,255,0.35);">● ${data.footer_text}</span>
      <a style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:0.78rem;font-weight:700;padding:9px 18px;border-radius:100px;text-decoration:none;">${data.cta_text}</a>
    </div>
    ${!_popupEnabled?'<div style="margin-top:14px;padding:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:0.75rem;color:#fca5a5;text-align:center;">⚠️ Popup is currently DISABLED</div>':''}
  </div>`;
  box.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ════════════════ SHEET TEST ════════════════ */
async function testSheetConnection(silent = false) {
  const resultEl = document.getElementById('test-result');
  const statusEl = document.getElementById('sheetStatus');
  if (!silent && resultEl) resultEl.innerHTML = '<span style="color:var(--text-dim);">Testing…</span>';
  try {
    window.SheetsDB.clearSheetCache();
    const rows = await window.SheetsDB.fetchSheetRows('Notes');
    const msg  = `✅ Connected! Notes tab has ${rows.length} data rows.`;
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--green);">${msg}</span>`;
    if (!silent && resultEl) resultEl.innerHTML = `<span style="color:var(--green);">${msg}</span>`;
    if (!silent) showToast(msg, 'success');
  } catch(e) {
    const msg = `❌ Connection failed: ${e.message}`;
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--red);">${msg} — Check Sheet ID, API key, and that the Sheet is published.</span>`;
    if (!silent && resultEl) resultEl.innerHTML = `<span style="color:var(--red);">${msg}</span>`;
    if (!silent) showToast(msg, 'error');
  }
}

/* ════════════════ TOAST ════════════════ */
function showToast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

/* ════════════════ AUTO INIT ════════════════ */
if (sessionStorage.getItem('bputnotes_admin') === '1') {
  // Already shown app by auth check above — init once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
