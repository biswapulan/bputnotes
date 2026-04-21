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



