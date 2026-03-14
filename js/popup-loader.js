/**
 * popup-loader.js — Loads popup config from Popup tab in Google Sheets
 * Falls back to defaults if Sheet data not available.
 *
 * Popup Sheet (Tab: Popup) — key/value format:
 *   Row 1: enabled | true
 *   Row 2: eyebrow | Now Open · 2026
 *   Row 3: heading | We're looking for
 *   Row 4: heading_highlight | passionate BPUTians
 *   Row 5: subtitle | BPUTNotes is 100% student-run.
 *   Row 6: footer_text | Applications close soon
 *   Row 7: cta_text | ✦ Apply Now — It's Free
 *   Row 8: cta_link | careers.html
 *   Row 9:  card_1_icon | 🌟
 *   Row 10: card_1_title | Campus Ambassador
 *   Row 11: card_1_desc | Represent BPUTNotes at your college.
 *   Row 12: card_1_link | careers.html
 *   Row 13: card_1_color | amber
 *   Row 14: card_1_badge | Open
 *   Row 15: card_1_enabled | true
 *   (repeat card_2_, card_3_, etc.)
 */

(function () {
  const DISMISSED_KEY = 'bputnotes_popup_dismissed';
  const DISMISSED_VER = 'bputnotes_popup_ver';

  async function init() {
    const overlay = document.getElementById('bput-popup-overlay');
    if (!overlay) return;

    // Try loading config from Sheet first (need it for version check)
    let cfg = _defaultConfig();
    try {
      cfg = await window.SheetsDB.getPopupConfig();
    } catch (e) {
      console.warn('Popup config load failed, using defaults:', e);
    }

    // If disabled by admin, always remove
    if (!cfg.enabled) {
      overlay.remove();
      return;
    }

    // Version-based dismiss: use eyebrow+heading as a version fingerprint
    // If admin updates content, fingerprint changes → popup shows again
    const currentVer = (cfg.eyebrow + '|' + cfg.heading + '|' + cfg.headingHighlight).trim();
    const savedVer   = localStorage.getItem(DISMISSED_VER);
    const dismissed  = localStorage.getItem(DISMISSED_KEY) === '1';

    if (dismissed && savedVer === currentVer) {
      overlay.remove();
      return;
    }

    // Content changed since last dismiss — show popup again
    if (dismissed && savedVer !== currentVer) {
      localStorage.removeItem(DISMISSED_KEY);
    }

    // Apply config to DOM
    _applyConfig(cfg, overlay);

    // Wire close buttons
    const closeBtn = document.getElementById('popupClose');
    const skipBtn  = document.getElementById('popupSkip');
    const popup    = document.getElementById('bputPopup');

    function closePopup(permanent) {
      if (permanent) {
        localStorage.setItem(DISMISSED_KEY, '1');
        localStorage.setItem(DISMISSED_VER, currentVer);
      }
      overlay.classList.add('closing');
      popup?.classList.add('closing');
      setTimeout(() => overlay.remove(), 340);
    }

    closeBtn?.addEventListener('click', () => closePopup(false));
    skipBtn?.addEventListener('click',  () => closePopup(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(false); });
  }

  function _defaultConfig() {
    return {
      enabled: true,
      eyebrow: 'Now Open · 2026',
      heading: "We're looking for",
      headingHighlight: 'passionate BPUTians',
      subtitle: 'BPUTNotes is 100% student-run. Join our growing community — no experience needed, just passion.',
      footerText: 'Applications close soon',
      ctaText: '✦ Apply Now — It\'s Free',
      ctaLink: 'careers.html',
      cards: [
        { icon: '🌟', title: 'Campus Ambassador', desc: 'Represent BPUTNotes at your college. Lead, network & grow.', link: 'careers.html', color: 'amber', badge: 'Open', enabled: true },
        { icon: '✍️', title: 'Content Contributor', desc: 'Share notes, write summaries & help students study smarter.', link: 'careers.html', color: 'blue',  badge: 'Open', enabled: true },
        { icon: '💻', title: 'Tech Intern — Frontend', desc: 'Build features, fix bugs & improve the platform for 2000+ students.', link: 'careers.html', color: 'green', badge: 'Open', enabled: true },
      ],
    };
  }

  function _applyConfig(cfg, overlay) {
    // Eyebrow
    const eyebrow = overlay.querySelector('.popup-eyebrow');
    if (eyebrow && cfg.eyebrow) {
      const pulse = eyebrow.querySelector('.eyebrow-pulse');
      eyebrow.textContent = ' ' + cfg.eyebrow;
      if (pulse) eyebrow.prepend(pulse);
    }

    // Heading
    const heading = overlay.querySelector('.popup-heading');
    if (heading) {
      heading.innerHTML = `${cfg.heading || ''}<br><span class="highlight">${cfg.headingHighlight || ''}</span> 🎓`;
    }

    // Subtitle
    const sub = overlay.querySelector('.popup-sub');
    if (sub && cfg.subtitle) sub.textContent = cfg.subtitle;

    // Footer text
    const footerLeft = overlay.querySelector('.popup-footer-left');
    if (footerLeft && cfg.footerText) {
      const dot = footerLeft.querySelector('.live-dot');
      footerLeft.textContent = ' ' + cfg.footerText;
      if (dot) footerLeft.prepend(dot);
    }

    // CTA button
    const ctaBtn = overlay.querySelector('.popup-cta-btn');
    if (ctaBtn) {
      if (cfg.ctaText) ctaBtn.textContent = cfg.ctaText;
      if (cfg.ctaLink) ctaBtn.href = cfg.ctaLink;
    }

    // Cards
    const activeCards = (cfg.cards || []).filter(c => c.enabled !== false && c.title);
    if (activeCards.length) {
      const list = overlay.querySelector('.program-list');
      if (list) {
        const colorMap = {
          amber:  { icon: 'rgba(245,158,11,0.14)',  badge: 'rgba(245,158,11,0.15)',  color: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
          blue:   { icon: 'rgba(59,130,246,0.14)',   badge: 'rgba(59,130,246,0.15)',  color: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
          green:  { icon: 'rgba(34,197,94,0.14)',    badge: 'rgba(34,197,94,0.15)',   color: '#86efac', border: 'rgba(34,197,94,0.25)' },
          purple: { icon: 'rgba(167,139,250,0.14)',  badge: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: 'rgba(167,139,250,0.25)' },
        };
        list.innerHTML = activeCards.map(c => {
          const cs = colorMap[c.color] || colorMap.blue;
          return `<a href="${c.link || 'careers.html'}" class="prog-card ${c.color || 'blue'}">
            <div class="prog-icon ${c.color || 'blue'}">${c.icon || '✦'}</div>
            <div class="prog-info">
              <div class="prog-title">${c.title}</div>
              <div class="prog-desc">${c.desc || ''}</div>
            </div>
            <span class="prog-badge ${c.color || 'blue'}">${c.badge || 'Open'}</span>
            <span class="prog-arrow">→</span>
          </a>`;
        }).join('');
      }
    }
  }

  // Run after SheetsDB is available
  function _waitForSheets() {
    if (window.SheetsDB) { init(); }
    else { setTimeout(_waitForSheets, 50); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _waitForSheets);
  } else {
    _waitForSheets();
  }
})();
