// main.js — global JS for bputnotes.in

document.addEventListener("DOMContentLoaded", () => {
  // ── AOS (scroll animations) ──
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 600, once: true, offset: 60 });
  }

  // ── NAVBAR SCROLL ──
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 30);
      const btn = document.querySelector(".scroll-top");
      if (btn) btn.classList.toggle("visible", window.scrollY > 400);
    });
  }

  // ── HAMBURGER MENU ──
  const hamburger = document.querySelector(".hamburger");
  const navLinks  = document.querySelector(".nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        hamburger.classList.remove("open");
        navLinks.classList.remove("open");
      });
    });
  }

  // ── ACTIVE NAV LINK ──
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === currentPage) a.classList.add("active");
  });

  // ── SCROLL REVEAL ──
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("visible"), i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  reveals.forEach((el) => observer.observe(el));

  // ── SCROLL TO TOP ──
  const scrollBtn = document.querySelector(".scroll-top");
  if (scrollBtn) {
    scrollBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  // ── FILTER TABS ──
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      const group = this.closest(".filter-tabs");
      group
        .querySelectorAll(".filter-tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      const filter = this.dataset.filter;
      const target = document.querySelector(
        this.dataset.target || ".filterable-grid",
      );
      if (!target) return;
      target.querySelectorAll("[data-category]").forEach((item) => {
        if (filter === "all" || item.dataset.category === filter) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  });

  // ── ANNOUNCEMENT BAR CLOSE ──
  const annBar = document.querySelector(".announcement-bar");
  const closeAnn = document.querySelector(".ann-close");
  if (annBar && closeAnn) {
    closeAnn.addEventListener("click", () => {
      annBar.style.display = "none";
      document.body.classList.remove("has-announcement");
    });
  }

  // ── COUNTER ANIMATION ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 1800;
    const start = performance.now();
    const update = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(update);
      else
        el.textContent =
          target.toLocaleString("en-IN") + (el.dataset.suffix || "");
    };
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  document
    .querySelectorAll(".stat-number[data-target]")
    .forEach((el) => counterObserver.observe(el));
  // ── SOCIAL FAB TOGGLE (mobile) ──
  const fabWrap = document.querySelector(".social-fab-wrap");
  const fabToggle = document.querySelector(".social-fab-toggle");
  if (fabWrap && fabToggle) {
    fabToggle.addEventListener("click", () => {
      fabWrap.classList.toggle("open");
    });
    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!fabWrap.contains(e.target)) fabWrap.classList.remove("open");
    });
  }
});

// ── SHARED TOUR ENGINE ──
// Provides window._runPageTour(steps) used by notes/pyq/books loaders
(function() {
  window._runPageTour = function(steps) {
    if (window.innerWidth > 900) return;
    if (!steps || !steps.length) return;
    let current = 0;

    if (!document.getElementById('_tour-engine-styles')) {
      const s = document.createElement('style');
      s.id = '_tour-engine-styles';
      s.textContent = `
        #_tour-backdrop{position:fixed;inset:0;z-index:88888;background:rgba(0,0,0,0.62);transition:opacity 0.3s;}
        #_tour-box{position:fixed;z-index:88890;background:#0f172a;color:#fff;border-radius:16px;padding:16px 18px;
          left:16px;right:16px;box-shadow:0 12px 40px rgba(0,0,0,0.5);border:1.5px solid rgba(245,158,11,0.5);
          font-family:'Sora',sans-serif;animation:_tourFadeIn 0.3s ease both;}
        #_tour-box-title{font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
        #_tour-box-body{font-size:0.84rem;line-height:1.5;color:rgba(255,255,255,0.9);margin-bottom:12px;}
        #_tour-box-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;}
        #_tour-progress{font-size:0.7rem;color:rgba(255,255,255,0.4);}
        #_tour-next{background:#f59e0b;color:#0f172a;border:none;border-radius:100px;padding:7px 18px;
          font-family:'Sora',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;}
        #_tour-skip{font-size:0.7rem;color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;
          font-family:'Sora',sans-serif;padding:4px;}
        ._tour-highlight{position:relative;z-index:88889!important;border-radius:12px;
          animation:_tourPulseRing 1.5s ease infinite!important;}
        @keyframes _tourFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes _tourPulseRing{
          0%{box-shadow:0 0 0 4px #f59e0b,0 0 0 8px rgba(245,158,11,0.3)}
          50%{box-shadow:0 0 0 4px #f59e0b,0 0 0 16px rgba(245,158,11,0.08)}
          100%{box-shadow:0 0 0 4px #f59e0b,0 0 0 8px rgba(245,158,11,0.3)}}
      `;
      document.head.appendChild(s);
    }

    const backdrop = document.createElement('div');
    backdrop.id = '_tour-backdrop';
    document.body.appendChild(backdrop);

    const box = document.createElement('div');
    box.id = '_tour-box';
    box.innerHTML = `
      <div id="_tour-box-title"></div>
      <div id="_tour-box-body"></div>
      <div id="_tour-box-footer">
        <div style="display:flex;gap:6px;align-items:center">
          <button id="_tour-skip">Skip tour</button>
          <span id="_tour-progress"></span>
        </div>
        <button id="_tour-next">Next →</button>
      </div>`;
    document.body.appendChild(box);

    let lastHL = null;

    function showStep(i) {
      const step = steps[i];
      const target = document.getElementById(step.targetId);
      if (lastHL) { lastHL.classList.remove('_tour-highlight'); lastHL = null; }
      if (target) {
        target.classList.add('_tour-highlight');
        target.scrollIntoView({ behavior:'smooth', block:'center' });
        lastHL = target;
      }
      document.getElementById('_tour-box-title').textContent = step.title;
      document.getElementById('_tour-box-body').innerHTML = step.body;
      document.getElementById('_tour-progress').textContent = `${i+1} / ${steps.length}`;
      document.getElementById('_tour-next').textContent = i === steps.length-1 ? '✓ Got it!' : 'Next →';

      setTimeout(() => {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const bh = box.offsetHeight || 140;
        const spaceBelow = window.innerHeight - rect.bottom;
        box.style.top = spaceBelow > bh + 24
          ? (rect.bottom + 12) + 'px'
          : Math.max(8, rect.top - bh - 12) + 'px';
      }, 380);
    }

    function endTour() {
      if (lastHL) { lastHL.classList.remove('_tour-highlight'); }
      [backdrop, box].forEach(el => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
      });
      setTimeout(() => { backdrop.remove(); box.remove(); }, 320);
    }

    document.getElementById('_tour-next').addEventListener('click', () => {
      current < steps.length-1 ? showStep(++current) : endTour();
    });
    document.getElementById('_tour-skip').addEventListener('click', endTour);
    backdrop.addEventListener('click', endTour);
    showStep(0);
  };
})();

// ── HAMBURGER PERMANENT PULSE (until tapped) ──
function _startHamburgerPulse() {
  if (window.innerWidth > 768) return;
  const hamburger = document.querySelector('.hamburger');
  if (!hamburger) return;

  // Inject pulse styles
  if (!document.getElementById('_hb-pulse-styles')) {
    const s = document.createElement('style');
    s.id = '_hb-pulse-styles';
    s.textContent = `
      .hamburger._pulsing {
        position: relative;
      }
      .hamburger._pulsing::before {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2.5px solid #f59e0b;
        animation: _hbRing 1.4s ease-out infinite;
        pointer-events: none;
      }
      .hamburger._pulsing::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2.5px solid #f59e0b;
        animation: _hbRing 1.4s ease-out infinite 0.5s;
        pointer-events: none;
      }
      @keyframes _hbRing {
        0%   { transform: scale(0.85); opacity: 0.9; }
        80%  { transform: scale(1.7);  opacity: 0; }
        100% { transform: scale(1.7);  opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  hamburger.classList.add('_pulsing');

  // Stop pulsing the moment they tap it
  hamburger.addEventListener('click', () => {
    hamburger.classList.remove('_pulsing');
  }, { once: true });
}

// ── HAMBURGER ONBOARDING TOUR ──
function _showHamburgerTour() {
  if (window.innerWidth > 768) return;
  const hamburger = document.querySelector('.hamburger');
  if (!hamburger) return;

  const overlay = document.createElement('div');
  overlay.id = 'nav-tour-overlay';

  const rect = hamburger.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  overlay.innerHTML = `
    <div id="nav-tour-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99998;animation:_tourFadeIn 0.3s ease both;"></div>
    <div id="nav-tour-pulse" style="position:fixed;left:${cx-28}px;top:${cy-28}px;width:56px;height:56px;border-radius:50%;border:3px solid #f59e0b;animation:_hbRing 1.2s ease-out infinite;pointer-events:none;z-index:99999;"></div>
    <div id="nav-tour-tooltip" style="position:fixed;right:12px;top:${cy+40}px;background:#0f172a;color:#fff;border-radius:14px;padding:14px 18px;font-family:'Sora',sans-serif;font-size:0.85rem;line-height:1.5;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1.5px solid rgba(245,158,11,0.45);max-width:220px;text-align:center;animation:_tourFadeIn 0.4s ease both;">
      <div style="font-size:1.5rem;margin-bottom:6px;animation:_tourBounce 0.8s ease infinite alternate;">👆</div>
      <div>Tap here to see<br><strong>all pages & features</strong></div>
      <button id="nav-tour-dismiss" style="margin-top:10px;background:#f59e0b;color:#0f172a;border:none;border-radius:100px;padding:6px 18px;font-family:'Sora',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;display:block;width:100%;">Got it!</button>
    </div>`;
  document.body.appendChild(overlay);

  if (!document.getElementById('_nav-tour-kf')) {
    const s = document.createElement('style');
    s.id = '_nav-tour-kf';
    s.textContent = `
      @keyframes _tourFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes _tourBounce{from{transform:translateY(0)}to{transform:translateY(-6px)}}
    `;
    document.head.appendChild(s);
  }

  function dismissTour() {
    overlay.style.transition = 'opacity 0.3s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  document.getElementById('nav-tour-dismiss').addEventListener('click', dismissTour);
  document.getElementById('nav-tour-backdrop').addEventListener('click', dismissTour);
  hamburger.addEventListener('click', dismissTour, { once: true });
  setTimeout(dismissTour, 5000);
}

function _initHamburgerTour() {
  if (window.innerWidth > 768) return;

  // Start permanent pulse immediately
  _startHamburgerPulse();

  const popupOverlay = document.getElementById('bput-popup-overlay');
  if (popupOverlay) {
    // Wait for popup to close, then show spotlight tour
    const obs = new MutationObserver(() => {
      if (!document.getElementById('bput-popup-overlay')) {
        obs.disconnect();
        setTimeout(_showHamburgerTour, 800);
      }
    });
    obs.observe(document.body, { childList: true });
    // Safety fallback after 15s
    setTimeout(() => {
      obs.disconnect();
      if (!document.getElementById('nav-tour-overlay')) _showHamburgerTour();
    }, 15000);
  } else {
    setTimeout(_showHamburgerTour, 1500);
  }
}

setTimeout(_initHamburgerTour, 1000);