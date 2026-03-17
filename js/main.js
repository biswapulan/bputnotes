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

// ── HAMBURGER ONBOARDING TOUR (mobile first-time visitors) ──
function _showHamburgerTour() {
  // Only on mobile
  if (window.innerWidth > 768) return;
  // Only once per user
  if (localStorage.getItem('bputnotes_nav_toured') === '1') return;

  const hamburger = document.querySelector('.hamburger');
  if (!hamburger) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'nav-tour-overlay';
  overlay.innerHTML = `
    <div id="nav-tour-backdrop"></div>
    <div id="nav-tour-pulse"></div>
    <div id="nav-tour-tooltip">
      <div id="nav-tour-arrow">👆</div>
      <div id="nav-tour-text">Tap here to see<br><strong>all pages & features</strong></div>
      <button id="nav-tour-dismiss">Got it!</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Position pulse ring exactly over hamburger button
  function positionTour() {
    const rect = hamburger.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const pulse = document.getElementById('nav-tour-pulse');
    const tooltip = document.getElementById('nav-tour-tooltip');

    pulse.style.cssText = `
      position: fixed;
      left: ${cx - 28}px;
      top: ${cy - 28}px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 3px solid #f59e0b;
      animation: navTourPulse 1.2s ease-out infinite;
      pointer-events: none;
      z-index: 99999;
    `;

    tooltip.style.cssText = `
      position: fixed;
      right: 12px;
      top: ${cy + 36}px;
      background: #0f172a;
      color: #fff;
      border-radius: 14px;
      padding: 14px 18px;
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      line-height: 1.5;
      z-index: 99999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      border: 1.5px solid rgba(245,158,11,0.4);
      max-width: 220px;
      text-align: center;
      animation: navTourFadeIn 0.4s ease both;
    `;
  }

  positionTour();

  // Backdrop style
  const backdrop = document.getElementById('nav-tour-backdrop');
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 99998;
    animation: navTourFadeIn 0.3s ease both;
  `;

  // Arrow style
  document.getElementById('nav-tour-arrow').style.cssText = `
    font-size: 1.6rem;
    margin-bottom: 6px;
    animation: navTourBounce 0.8s ease infinite alternate;
  `;

  // Dismiss button style
  const dismissBtn = document.getElementById('nav-tour-dismiss');
  dismissBtn.style.cssText = `
    margin-top: 10px;
    background: #f59e0b;
    color: #0f172a;
    border: none;
    border-radius: 100px;
    padding: 6px 18px;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    display: block;
    width: 100%;
  `;

  // Inject keyframes
  if (!document.getElementById('nav-tour-styles')) {
    const style = document.createElement('style');
    style.id = 'nav-tour-styles';
    style.textContent = `
      @keyframes navTourPulse {
        0%   { transform: scale(1);   opacity: 1; }
        70%  { transform: scale(1.8); opacity: 0; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      @keyframes navTourFadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes navTourBounce {
        from { transform: translateY(0px); }
        to   { transform: translateY(-6px); }
      }
    `;
    document.head.appendChild(style);
  }

  function dismissTour() {
    localStorage.setItem('bputnotes_nav_toured', '1');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }

  // Dismiss on: Got it button, backdrop tap, hamburger tap, or after 5 seconds
  dismissBtn.addEventListener('click', dismissTour);
  backdrop.addEventListener('click', dismissTour);
  hamburger.addEventListener('click', dismissTour, { once: true });
  setTimeout(dismissTour, 5000);
}

// Show tour after a short delay so page feels loaded first
setTimeout(_showHamburgerTour, 1500);