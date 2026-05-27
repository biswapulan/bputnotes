// ── ANNOUNCEMENT BAR — runs immediately (not inside DOMContentLoaded) ──
(function() {
  // In-memory flag — resets on every full page load, preserved during SPA navigation
  var _annDismissed = false;

  function isHome() {
    var file = window.location.pathname.split("/").pop();
    return file === "" || file === "index.html";
  }

  function hideBar(bar) {
    _annDismissed = true;
    bar.style.transition = "opacity 0.32s ease, height 0.32s ease, padding 0.32s ease, min-height 0.32s ease";
    bar.style.opacity = "0";
    bar.style.height = "0";
    bar.style.minHeight = "0";
    bar.style.padding = "0";
    bar.style.overflow = "hidden";
    document.body.classList.remove("has-announcement");
    // Also hide close button
    var closeBtn = document.getElementById("annCloseBtn");
    if (closeBtn) closeBtn.style.display = "none";
    setTimeout(function() { bar.style.display = "none"; }, 340);
  }

  function initBar() {
    var bar = document.getElementById("ambassadorBar");
    if (!bar) return;
    var closeBtn = document.getElementById("annCloseBtn");
    if (!isHome()) {
      // Non-home page — hide bar and close button
      bar.style.display = "none";
      bar.style.opacity = "";
      bar.style.height = "";
      bar.style.minHeight = "";
      bar.style.padding = "";
      bar.style.overflow = "";
      bar.style.transition = "";
      if (closeBtn) closeBtn.style.display = "none";
      document.body.classList.remove("has-announcement");
    } else {
      // Home page — show unless user dismissed it this session
      if (_annDismissed) {
        bar.style.display = "none";
        if (closeBtn) closeBtn.style.display = "none";
        document.body.classList.remove("has-announcement");
        return;
      }
      bar.style.display = "";
      bar.style.opacity = "";
      bar.style.height = "";
      bar.style.minHeight = "";
      bar.style.padding = "";
      bar.style.overflow = "";
      bar.style.transition = "";
      if (closeBtn) closeBtn.style.display = "";
      document.body.classList.add("has-announcement");
      var nav = document.querySelector(".navbar");
      if (nav) nav.classList.remove("scrolled");
    }
  }

  // Run immediately — script is at bottom of body so DOM is ready
  initBar();

  // Expose for SPA reinit after navigation
  window._initAnnBar = initBar;

  // Close button — event delegation, attached once, survives SPA swaps
  document.addEventListener("click", function(e) {
    if (e.target.closest("#annCloseBtn")) {
      var bar = document.getElementById("ambassadorBar");
      if (bar) hideBar(bar);
    }
  });
})();

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

  // ── ANNOUNCEMENT BAR — handled by IIFE above, nothing needed here ──

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

  // ── CUSTOM CARTOON CURSOR ──
  const isTouch = window.matchMedia("(max-width: 1023px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isTouch) {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.innerHTML = `
      <div class="cursor-arrow"></div>
      <div class="cursor-bubble">Hello</div>
    `;
    document.body.appendChild(cursor);
    document.documentElement.classList.add("has-custom-cursor");

    const bubble = cursor.querySelector(".cursor-bubble");
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    let isMoving = false;

    window.addEventListener("mousemove", (e) => {
      if (!isMoving) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        currentX = mouseX;
        currentY = mouseY;
        cursor.classList.add("is-visible");
        isMoving = true;
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    });

    document.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-visible");
      isMoving = false;
    });

    // Inertial lag for cursor movement
    function tick() {
      if (isMoving) {
        currentX += (mouseX - currentX) * 0.22;
        currentY += (mouseY - currentY) * 0.22;
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Event listener for dynamic cursor bubbles on hover
    document.addEventListener("mouseover", (e) => {
      // Invert color on dark backgrounds
      const isDarkSection = e.target.closest("footer, .footer, .page-hero, .cta-banner");
      if (isDarkSection) {
        cursor.classList.add("on-dark");
      } else {
        cursor.classList.remove("on-dark");
      }

      const target = e.target.closest("a, button, .btn, .filter-tab, .branch-pill, .subject-item, [onclick]");
      if (target) {
        cursor.classList.add("hovering");
        
        // Determine context-based text
        const href = target.getAttribute("href") || "";
        const text = (target.innerText || "").toLowerCase();
        
        if (target.classList.contains("btn-share") || text.includes("share")) {
          bubble.innerText = "Share";
        } else if (href.includes(".pdf") || text.includes("download") || target.hasAttribute("download")) {
          bubble.innerText = "Download";
        } else if (target.getAttribute("target") === "_blank") {
          bubble.innerText = "Open";
        } else if (text.includes("apply")) {
          bubble.innerText = "Apply";
        } else {
          bubble.innerText = "View";
        }
      }
    });

    document.addEventListener("mouseout", (e) => {
      // Clean up hover state
      const target = e.target.closest("a, button, .btn, .filter-tab, .branch-pill, .subject-item, [onclick]");
      if (target) {
        cursor.classList.remove("hovering");
        bubble.innerText = "Hello";
      }
    });
  }
  // ── END CUSTOM CARTOON CURSOR ──

  // ── MOBILE BOTTOM NAVIGATION INJECTION ──
  function initMobileNav() {
    // Only run if viewport is <= 768px
    if (window.innerWidth > 768) {
      // Remove mobile nav elements if window is resized above 768px
      const existingNav = document.querySelector(".mobile-bottom-nav");
      const existingOverlay = document.getElementById("mobileDrawerOverlay");
      const existingDrawer = document.getElementById("mobileMoreDrawer");
      if (existingNav) existingNav.remove();
      if (existingOverlay) existingOverlay.remove();
      if (existingDrawer) existingDrawer.remove();
      return;
    }

    // Prevent duplicate injection
    if (document.querySelector(".mobile-bottom-nav")) return;

    // Define icons (Option A - Highly Distinct Contours)
    const icons = {
      home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      notes: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12.5v5c0 1.5 2.5 2.5 6 2.5s6-1 6-2.5v-5"/></svg>`,
      pyq: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      books: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5c0 .8.7 1.5 1.5 1.5H20"/><path d="M4 4.5c0-.8.7-1.5 1.5-1.5H20v18H5.5C4.7 21 4 20.3 4 19.5Z"/><path d="M10 3v9l2.5-2 2.5 2V3"/></svg>`,
      more: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`
    };

    // Determine current active page
    const path = window.location.pathname.split("/").pop() || "index.html";
    
    // Create Bottom Nav Bar
    const bottomNav = document.createElement("div");
    bottomNav.className = "mobile-bottom-nav";
    bottomNav.innerHTML = `
      <a href="index.html" class="mobile-tab-item ${path === "index.html" ? "active" : ""}">
        <div class="tab-icon-wrap">${icons.home}</div>
        <span class="tab-label">Home</span>
      </a>
      <a href="notes.html" class="mobile-tab-item ${path === "notes.html" ? "active" : ""}">
        <div class="tab-icon-wrap">${icons.notes}</div>
        <span class="tab-label">Notes</span>
      </a>
      <a href="pyq.html" class="mobile-tab-item ${path === "pyq.html" ? "active" : ""}">
        <div class="tab-icon-wrap">${icons.pyq}</div>
        <span class="tab-label">PYQs</span>
      </a>
      <a href="books.html" class="mobile-tab-item ${path === "books.html" ? "active" : ""}">
        <div class="tab-icon-wrap">${icons.books}</div>
        <span class="tab-label">Books</span>
      </a>
      <button class="mobile-tab-item" id="openMobileMoreDrawer">
        <div class="tab-icon-wrap">${icons.more}</div>
        <span class="tab-label">More</span>
      </button>
    `;

    // Create Drawer Overlay & Slide-up Sheet
    const drawerOverlay = document.createElement("div");
    drawerOverlay.className = "mobile-drawer-overlay";
    drawerOverlay.id = "mobileDrawerOverlay";

    const drawerMore = document.createElement("div");
    drawerMore.className = "mobile-more-drawer";
    drawerMore.id = "mobileMoreDrawer";
    drawerMore.innerHTML = `
      <div class="drawer-grabber"></div>
      <div class="drawer-header">
        <div class="drawer-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12.5v5c0 1.5 2.5 2.5 6 2.5s6-1 6-2.5v-5"/></svg>
          BPUTNotes Menu
        </div>
        <button class="drawer-close" id="closeMobileMoreDrawer" aria-label="Close">✕</button>
      </div>
      <div class="drawer-grid">
        <a href="https://results.bputnotes.in/" target="_blank" rel="noopener" class="drawer-results-card">
          <div class="drawer-results-left">
            <span class="drawer-results-badge">LIVE</span>
            <span class="drawer-results-title">BPUT Results</span>
            <span class="drawer-results-sub">Check semester results instantly</span>
          </div>
          <span class="drawer-results-arrow">↗</span>
        </a>
        <a href="scholarship.html" class="drawer-item">
          <span class="drawer-item-icon">🏛️</span>
          <span class="drawer-item-label">Scholarships</span>
        </a>
        <a href="careers.html" class="drawer-item">
          <span class="drawer-item-icon">💼</span>
          <span class="drawer-item-label">Careers</span>
        </a>
        <a href="about.html" class="drawer-item">
          <span class="drawer-item-icon">ℹ️</span>
          <span class="drawer-item-label">About Us</span>
        </a>
        <a href="notes.html" class="drawer-item">
          <span class="drawer-item-icon">📚</span>
          <span class="drawer-item-label">Study Notes</span>
        </a>
      </div>
      <div class="drawer-social-label">Follow BPUTNotes</div>
      <div class="drawer-social-row">
        <a href="https://www.linkedin.com/company/bputnotes-in/" target="_blank" class="drawer-social-btn s-li" title="LinkedIn">
          <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
        <a href="https://www.instagram.com/bputnotes.in?igsh=MWVjdjNqa3dvZWNoNw==" target="_blank" class="drawer-social-btn s-ig" title="Instagram">
          <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="https://www.youtube.com/@bputnotes-in" target="_blank" class="drawer-social-btn s-yt" title="YouTube">
          <svg viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
        </a>
        <a href="https://wa.me/918249185682" target="_blank" class="drawer-social-btn s-wa" title="WhatsApp">
          <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.338 5.393.003 11.95.003c3.176 0 6.161 1.237 8.407 3.486 2.246 2.248 3.481 5.234 3.48 8.411-.004 6.557-5.338 11.892-11.893 11.892-2.007 0-3.974-.509-5.727-1.48L0 24zm6.59-3.235l.387.23a9.851 9.851 0 005.023 1.378h.004c5.45 0 9.886-4.437 9.889-9.888.002-2.64-1.03-5.124-2.898-6.992A9.825 9.825 0 0012.053 2.5c-5.457 0-9.893 4.437-9.896 9.889-.001 2.006.518 3.969 1.503 5.71l.245.433-1.015 3.704 3.793-.996zM17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
        </a>
      </div>
    `;

    // Append to document
    document.body.appendChild(drawerOverlay);
    document.body.appendChild(drawerMore);
    document.body.appendChild(bottomNav);

    // Event Listeners for drawer
    const openBtn = document.getElementById("openMobileMoreDrawer");
    const closeBtn = document.getElementById("closeMobileMoreDrawer");
    
    function toggleDrawer(open) {
      if (open) {
        drawerOverlay.classList.add("open");
        drawerMore.classList.add("open");
      } else {
        drawerOverlay.classList.remove("open");
        drawerMore.classList.remove("open");
      }
    }

    if (openBtn) openBtn.addEventListener("click", () => toggleDrawer(true));
    if (closeBtn) closeBtn.addEventListener("click", () => toggleDrawer(false));
    drawerOverlay.addEventListener("click", () => toggleDrawer(false));

    // Also close drawer when clicking the grabber
    const grabber = drawerMore.querySelector(".drawer-grabber");
    if (grabber) grabber.addEventListener("click", () => toggleDrawer(false));
  }

  // Initialize mobile nav
  initMobileNav();
  window.addEventListener("resize", initMobileNav);

  // ── SPA ROUTER HOOK ──
  // Expose re-runnable inits so spa-router.js can call them after each
  // client-side navigation without doing a full page reload.
  window._spaReinit = function () {
    // Re-inject mobile bottom nav for the new page
    initMobileNav();

    // Re-wire social FAB toggle (lost after SPA swap)
    const fabWrap2 = document.querySelector(".social-fab-wrap");
    const fabToggle2 = document.querySelector(".social-fab-toggle");
    if (fabWrap2 && fabToggle2) {
      const newToggle = fabToggle2.cloneNode(true);
      fabToggle2.replaceWith(newToggle);
      newToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        fabWrap2.classList.toggle("open");
      });
      document.addEventListener("click", (e) => {
        if (!fabWrap2.contains(e.target)) fabWrap2.classList.remove("open");
      });
    }

    // Re-wire hamburger (nav links may have changed)
    const hamburger2 = document.querySelector(".hamburger");
    const navLinks2  = document.querySelector(".nav-links");
    if (hamburger2 && navLinks2) {
      // Clone to remove old listeners, then re-add
      const h2 = hamburger2.cloneNode(true);
      hamburger2.replaceWith(h2);
      h2.addEventListener("click", () => {
        h2.classList.toggle("open");
        navLinks2.classList.toggle("open");
      });
      navLinks2.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          h2.classList.remove("open");
          navLinks2.classList.remove("open");
        });
      });
    }

    // Re-wire scroll-to-top button
    const scrollBtn2 = document.querySelector(".scroll-top");
    if (scrollBtn2) {
      const sb2 = scrollBtn2.cloneNode(true);
      scrollBtn2.replaceWith(sb2);
      sb2.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: "smooth" }),
      );
    }

    // Re-observe .reveal elements added by the new page
    const reveals2 = document.querySelectorAll(".reveal:not(.visible)");
    if (reveals2.length) {
      const obs2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add("visible"), i * 80);
              obs2.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 },
      );
      reveals2.forEach((el) => obs2.observe(el));
    }

    // Re-wire filter tabs
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", function () {
        const group = this.closest(".filter-tabs");
        group.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
        const filter = this.dataset.filter;
        const target = document.querySelector(this.dataset.target || ".filterable-grid");
        if (!target) return;
        target.querySelectorAll("[data-category]").forEach((item) => {
          item.style.display =
            filter === "all" || item.dataset.category === filter ? "" : "none";
        });
      });
    });

    // Hide/show announcement bar based on page
    if (window._initAnnBar) window._initAnnBar();
  };
});

// ── GLOBAL WHATSAPP SHARING LOOP ──
window.shareResource = function (title, link, type) {
  let text = "";
  const currentUrl = window.location.origin + window.location.pathname;
  
  if (type === 'note') {
    text = `📚 Hey! Check out these subject notes for "${title}" on BPUTNotes. Clean, free, and directly download from Google Drive here: ${link}`;
  } else if (type === 'pyq') {
    text = `📝 Hey! Check out this Previous Year Question Paper for "${title}" on BPUTNotes. Download here: ${link}`;
  } else if (type === 'book') {
    text = `📖 Hey! Check out this university-recommended textbook for "${title}" on BPUTNotes. Download it here: ${link}`;
  } else {
    text = `🌟 Check out BPUTNotes for subject notes, PYQs, and textbooks: ${currentUrl}`;
  }
  
  // Try copying to clipboard
  navigator.clipboard.writeText(text).then(() => {
    // Show premium visual toast notification
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:12px 24px;border-radius:100px;font-family:'Sora',sans-serif;font-size:0.82rem;font-weight:600;box-shadow:0 10px 30px rgba(16,185,129,0.3);z-index:99999;transition:opacity 0.3s, transform 0.3s;opacity:0;transform:translate(-50%, 10px);display:flex;align-items:center;gap:8px;";
    toast.innerHTML = `<span>📋</span> Share link & message copied!`;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translate(-50%, 0)";
    }, 50);
    
    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 10px)";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
    
    // Open WhatsApp
    setTimeout(() => {
      const encodedText = encodeURIComponent(text);
      const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
      window.open(waUrl, "_blank");
    }, 500);
  }).catch(err => {
    // Fallback if copy fails
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, "_blank");
  });
};