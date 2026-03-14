/**
 * sheets.js — BPUTNotes Google Sheets Backend
 * Real credentials wired in. All data comes from Google Sheets.
 *
 * ══ SHEET STRUCTURE ══
 *
 * Tab: Notes
 *   A: branch  B: semester  C: subject_number  D: subject_name
 *   E: drive_link  F: tags  G: status
 *
 * Tab: PYQs
 *   A: branch  B: semester  C: subject_number  D: subject_name
 *   E: exam_type (regular|back)  F: year  G: drive_link  H: tags  I: status
 *
 * Tab: Books
 *   A: branch  B: semester  C: subject_number  D: subject_name
 *   E: drive_link  F: tags  G: status
 *
 * Tab: Scholarships
 *   A: title  B: description  C: category  D: amount  E: amount_sublabel
 *   F: deadline  G: urgent (true|false)  H: status (open|closed|upcoming)
 *   I: apply_link  J: eligibility  K: tags
 *
 * Tab: Popup
 *   A: key  B: value
 *   Rows: enabled, eyebrow, heading, heading_highlight, subtitle,
 *         footer_text, cta_text, cta_link
 *         card_1_icon, card_1_title, card_1_desc, card_1_link, card_1_color, card_1_badge, card_1_enabled
 *         card_2_... card_3_... (up to 5 cards)
 */

const SHEETS_CONFIG = {
  SHEET_ID: '17o1aktSV1oM_EpWkSPkx7kVhGw4ZJChi1BuhMIl3jnk',
  API_KEY:  'AIzaSyDlzWcJnH3iDKyIRAzI8_bMShfxPcnMs1Q',
  TABS: {
    notes:        'Notes',
    pyqs:         'PYQs',
    books:        'Books',
    scholarships: 'Scholarships',
    popup:        'Popup',
  },
};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhUjHJuF24O3wgdpam6WeYKYeeSJUX0vVEv9Hr2op_xmnbaGxqUg2ilmhxNQmuumQj0Q/exec';


// ── Cache (5-minute TTL) ──
const _cache = {};
const _cacheTime = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchSheetRows(tabName) {
  const now = Date.now();
  if (_cache[tabName] && (now - (_cacheTime[tabName] || 0)) < CACHE_TTL_MS) {
    return _cache[tabName];
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.SHEET_ID}/values/${encodeURIComponent(tabName)}?key=${SHEETS_CONFIG.API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status}) for tab "${tabName}"`);
  const data = await res.json();
  const rows = (data.values || []).slice(1); // skip header
  _cache[tabName] = rows;
  _cacheTime[tabName] = now;
  return rows;
}

function clearSheetCache(tabName) {
  if (tabName) { delete _cache[tabName]; delete _cacheTime[tabName]; }
  else { Object.keys(_cache).forEach(k => { delete _cache[k]; delete _cacheTime[k]; }); }
}

// ── Notes ──
async function getNotesForSem(branch, semester) {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.notes);
  const results = [];
  for (const row of rows) {
    const [b, sem, subNum, name, link, tags, status] = row;
    if (b === branch && parseInt(sem) === parseInt(semester) && status !== 'hidden') {
      results.push({
        num:    parseInt(subNum) || results.length + 1,
        name:   name || `Subject ${subNum}`,
        link:   link || '#',
        tags:   tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['Notes'],
        status: status || 'active',
      });
    }
  }
  results.sort((a, b) => a.num - b.num);
  return results;
}

// ── PYQs (with year + exam_type) ──
async function getPYQs(branch, semester, examType, year) {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.pyqs);
  const results = [];
  for (const row of rows) {
    const [b, sem, subNum, name, et, yr, link, tags, status] = row;
    const matchBranch = b === branch;
    const matchSem    = parseInt(sem) === parseInt(semester);
    const matchType   = !examType || et === examType;
    const matchYear   = !year    || parseInt(yr) === parseInt(year);
    if (matchBranch && matchSem && matchType && matchYear && status !== 'hidden') {
      results.push({
        num:      parseInt(subNum) || results.length + 1,
        name:     name || `Subject ${subNum}`,
        examType: et || 'regular',
        year:     parseInt(yr) || year,
        link:     link || '#',
        tags:     tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['PYQ'],
        status:   status || 'active',
      });
    }
  }
  results.sort((a, b) => a.num - b.num);
  return results;
}

// For admin — get all PYQs flat
async function getAllPYQs() {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.pyqs);
  return rows.filter(r => r[8] !== 'hidden').map((row, i) => ({
    rowIndex: i + 2,
    branch:   row[0] || '', semester: parseInt(row[1]) || 1,
    subject_number: parseInt(row[2]) || 1, subject_name: row[3] || '',
    exam_type: row[4] || 'regular', year: parseInt(row[5]) || 2024,
    drive_link: row[6] || '#', tags: row[7] || '', status: row[8] || 'active',
  }));
}

// ── Books ──
async function getBooksForSem(branch, semester) {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.books);
  const results = [];
  for (const row of rows) {
    const [b, sem, subNum, name, link, tags, status] = row;
    if (b === branch && parseInt(sem) === parseInt(semester) && status !== 'hidden') {
      results.push({
        num:    parseInt(subNum) || results.length + 1,
        name:   name || `Subject ${subNum}`,
        link:   link || '#',
        tags:   tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['Book'],
        status: status || 'active',
      });
    }
  }
  results.sort((a, b) => a.num - b.num);
  return results;
}

// ── Scholarships ──
async function getScholarships(category) {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.scholarships);
  return rows
    .filter(row => row[7] !== 'hidden' && (!category || category === 'all' || row[2] === category))
    .map((row, i) => ({
      rowIndex:     i + 2,
      title:        row[0]  || '',
      description:  row[1]  || '',
      category:     row[2]  || 'central',
      amount:       row[3]  || '',
      amountSub:    row[4]  || 'per year',
      deadline:     row[5]  || '',
      urgent:       row[6]  === 'true',
      status:       row[7]  || 'open',
      applyLink:    row[8]  || '#',
      eligibility:  row[9]  || '',
      tags:         row[10] ? row[10].split(',').map(t => t.trim()) : [],
    }));
}

// ── Popup ──
async function getPopupConfig() {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.popup);
  const cfg = {};
  for (const row of rows) {
    if (row[0]) cfg[row[0]] = row[1] || '';
  }
  // Parse cards
  const cards = [];
  for (let i = 1; i <= 5; i++) {
    const icon    = cfg[`card_${i}_icon`];
    const title   = cfg[`card_${i}_title`];
    const enabled = cfg[`card_${i}_enabled`];
    if (title) {
      cards.push({
        icon:    icon    || '✦',
        title:   title   || '',
        desc:    cfg[`card_${i}_desc`]    || '',
        link:    cfg[`card_${i}_link`]    || 'careers.html',
        color:   cfg[`card_${i}_color`]   || 'blue',
        badge:   cfg[`card_${i}_badge`]   || 'Open',
        enabled: enabled !== 'false',
      });
    }
  }
  return {
    enabled:          cfg.enabled !== 'false',
    eyebrow:          cfg.eyebrow          || 'Now Open · 2026',
    heading:          cfg.heading          || "We're looking for",
    headingHighlight: cfg.heading_highlight|| 'passionate BPUTians',
    subtitle:         cfg.subtitle         || 'BPUTNotes is 100% student-run.',
    footerText:       cfg.footer_text      || 'Applications close soon',
    ctaText:          cfg.cta_text         || '✦ Apply Now — It\'s Free',
    ctaLink:          cfg.cta_link         || 'careers.html',
    cards,
  };
}

// ── Admin write via Apps Script ──
async function adminWrite(action, payload) {
  const body = JSON.stringify({ action, ...payload });

  let res;
  try {
    // Try cors first — readable response means we can detect Apps Script errors
    res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      mode: 'cors',
    });
  } catch(_) {
    // CORS blocked — fall back to no-cors (opaque response, fire-and-forget)
    res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      mode: 'no-cors',
    });
  }

  // Clear read-cache so frontend sees fresh data on next load
  clearSheetCache();

  // If we got a readable response, surface any Apps Script errors
  if (res && res.type !== 'opaque' && res.ok) {
    try {
      const json = await res.json();
      if (json && json.success === false) {
        throw new Error('Apps Script error: ' + (json.error || 'unknown'));
      }
    } catch(e) {
      if (e.message && e.message.startsWith('Apps Script error')) throw e;
      // JSON parse errors are fine (opaque/empty responses)
    }
  }
}

// ── For admin panel: fetch all rows ──
async function getAllNotes()  {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.notes);
  return rows.map((r,i)=>({ rowIndex:i+2, branch:r[0]||'', semester:parseInt(r[1])||1, subject_number:parseInt(r[2])||1, subject_name:r[3]||'', drive_link:r[4]||'#', tags:r[5]||'', status:r[6]||'active' }));
}
async function getAllBooks()  {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.books);
  return rows.map((r,i)=>({ rowIndex:i+2, branch:r[0]||'', semester:parseInt(r[1])||1, subject_number:parseInt(r[2])||1, subject_name:r[3]||'', drive_link:r[4]||'#', tags:r[5]||'', status:r[6]||'active' }));
}
async function getAllScholarships() {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.scholarships);
  return rows.map((r,i)=>({ rowIndex:i+2, title:r[0]||'', description:r[1]||'', category:r[2]||'', amount:r[3]||'', amount_sublabel:r[4]||'', deadline:r[5]||'', urgent:r[6]||'false', status:r[7]||'open', apply_link:r[8]||'#', eligibility:r[9]||'', tags:r[10]||'' }));
}
async function getPopupRows() {
  const rows = await fetchSheetRows(SHEETS_CONFIG.TABS.popup);
  return rows.map((r,i)=>({ rowIndex:i+2, key:r[0]||'', value:r[1]||'' }));
}

window.SheetsDB = {
  SHEETS_CONFIG, TABS: SHEETS_CONFIG.TABS,
  fetchSheetRows, clearSheetCache,
  getNotesForSem, getPYQs, getAllPYQs, getBooksForSem,
  getScholarships, getPopupConfig,
  getAllNotes, getAllBooks, getAllScholarships, getPopupRows,
  adminWrite,
};
