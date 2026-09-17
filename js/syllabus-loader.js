/**
 * syllabus-loader.js — Loads Syllabus from Google Sheets (Syllabus + SyllabusMap tabs)
 * Depends on sheets.js being loaded first.
 */

const _BRANCH_NAMES_S = {
  cse: 'Computer Science (CSE)', civil: 'Civil Engineering',
  electrical: 'Electrical Engineering (EEE)', mechanical: 'Mechanical Engineering',
  mining: 'Mining Engineering', metallurgy: 'Metallurgical Engineering',
  mineral: 'Mineral Engineering',
};

let _sylError = false;

async function _renderSyllabus() {
  const branch = document.getElementById('sylBranch')?.value || 'cse';
  const sem = document.getElementById('sylSem')?.value || '1';
  const el = document.getElementById('sylResult');
  if (!el) return;

  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:30px;color:var(--gray-400);"><div style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(37,99,235,0.15);border-top-color:#2563eb;animation:_sylSpin 0.7s linear infinite;"></div>Looking up syllabus...</div>`;

  let doc = null;
  try {
    doc = await window.SheetsDB.getSyllabus(branch, sem);
    _sylError = false;
  } catch (e) {
    console.warn('Syllabus fetch error:', e);
    _sylError = true;
  }

  if (_sylError) {
    el.innerHTML = `<div class="syl-empty">⚠️ Could not load syllabus data right now. Please try again in a moment.</div>`;
    return;
  }

  if (!doc) {
    el.innerHTML = `<div class="syl-empty">📄 Syllabus for <strong>${_BRANCH_NAMES_S[branch] || branch}, Semester ${sem}</strong> isn't uploaded yet. Request it below and we'll add it soon.</div>`;
    return;
  }

  const hasLink = doc.link && doc.link !== '#';
  const tagsHTML = doc.tags.map(t => `<span class="syl-tag">${t}</span>`).join('');

  const otherBranches = (doc.sharedWith || [])
    .filter(s => !(s.branch === branch && parseInt(s.semester) === parseInt(sem)))
    .map(s => `${_BRANCH_NAMES_S[s.branch] || s.branch} (Sem ${s.semester})`);
  const sharedHTML = otherBranches.length
    ? `<div class="syl-card-shared">📎 Same document also used by: ${otherBranches.join(', ')}</div>`
    : '';

  el.innerHTML = `
    <div class="syl-card">
      <div class="syl-card-icon">📄</div>
      <div class="syl-card-body">
        <div class="syl-card-title">${doc.title}</div>
        <div class="syl-card-meta">${_BRANCH_NAMES_S[branch] || branch} · Semester ${sem}${doc.scope ? ' · ' + doc.scope : ''}</div>
        <div>${tagsHTML}</div>
        ${sharedHTML}
      </div>
      ${hasLink
        ? `<a href="${doc.link}" target="_blank" rel="noopener" class="syl-btn">📖 View / Download PDF</a>`
        : `<span class="syl-btn" style="background:var(--gray-300);box-shadow:none;">⏳ Coming Soon</span>`
      }
    </div>`;
}

window.onSylChange = function () {
  _renderSyllabus();
};

// Inject spinner keyframes
if (!document.getElementById('_syl-kf')) {
  const s = document.createElement('style');
  s.id = '_syl-kf';
  s.textContent = '@keyframes _sylSpin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

// Init — wait for SheetsDB
function _sylInit() {
  if (window.SheetsDB) { _renderSyllabus(); }
  else { setTimeout(_sylInit, 50); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _sylInit);
} else {
  _sylInit();
}
