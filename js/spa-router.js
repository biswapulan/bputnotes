/**
 * spa-router.js — BPUTNotes SPA Navigation
 * Intercepts internal link clicks, fetches the target page,
 * swaps body content without a full reload.
 */

(function () {
  "use strict";

  const INTERNAL_PAGES = new Set([
    "index.html", "notes.html", "pyq.html",
    "books.html", "scholarship.html", "about.html", "careers.html",
  ]);

  const PAGE_SCRIPTS = {
    "notes.html":       { src: "js/notes-loader.js",      init: "_initNotes" },
    "pyq.html":         { src: "js/pyq-loader.js",         init: "_initPYQ" },
    "books.html":       { src: "js/books-loader.js",       init: "_initBooks" },
    "scholarship.html": { src: "js/scholarship-loader.js", init: "_initScholarship" },
    "index.html":       { src: "js/popup-loader.js",       init: null },
  };

  let _navigating = false;
  const _cache    = {};

  // ── HELPERS ─────────────────────────────────────────────────

  function toPageFile(href) {
    try {
      const url  = new URL(href, location.href);
      if (url.origin !== location.origin) return null;
      const file = url.pathname.split("/").pop() || "index.html";
      return INTERNAL_PAGES.has(file) ? file : null;
    } catch { return null; }
  }

  /**
   * Extract everything the new page needs:
   *  - preNav:     nodes before <nav> (announcement bar, scroll-progress, etc.)
   *  - content:    nodes between </nav> and <footer>
   *  - pageStyles: inline <style> blocks from <head>
   *  - inlineScripts: inline <script> blocks from <body> (re-executed after swap)
   *  - title, bodyClass
   */
  function extractContent(html) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, "text/html");

    const nav    = doc.querySelector("nav.navbar");
    const footer = doc.querySelector("footer.footer");
    if (!nav || !footer) return null;

    // ── Nodes BEFORE <nav> (announcement bar, scroll-progress…) ──
    const preNavNodes = [];
    let n = nav.previousSibling;
    while (n) {
      preNavNodes.unshift(n.cloneNode(true));
      n = n.previousSibling;
    }

    // ── Nodes BETWEEN </nav> and <footer> ──
    const contentNodes = [];
    let node = nav.nextSibling;
    while (node && node !== footer) {
      contentNodes.push(node.cloneNode(true));
      node = node.nextSibling;
    }

    // ── Inline <style> blocks from <head> ──
    const pageStyles = Array.from(doc.querySelectorAll("head style"))
      .map(s => s.textContent).join("\n");

    // ── Inline <script> blocks from <body> (NOT external src= scripts) ──
    // These contain the typing animation, particles, tilt cards, etc.
    const inlineScripts = Array.from(doc.querySelectorAll("body script:not([src])"))
      .map(s => s.textContent);

    const title     = doc.title || "";
    const bodyClass = doc.body.className || "";

    return { preNavNodes, contentNodes, pageStyles, inlineScripts, title, bodyClass };
  }

  /** Remove everything before <nav> that we injected (tagged with data-spa-pre) */
  function clearPreNav() {
    document.querySelectorAll("[data-spa-pre]").forEach(el => el.remove());
  }

  /** Remove everything between <nav> and <footer> */
  function clearContent() {
    const nav    = document.querySelector("nav.navbar");
    const footer = document.querySelector("footer.footer");
    if (!nav || !footer) return;
    const toRemove = [];
    let node = nav.nextSibling;
    while (node && node !== footer) {
      toRemove.push(node);
      node = node.nextSibling;
    }
    toRemove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
  }

  /** Remove singleton elements that must be freshly injected per page */
  function removeVolatile() {
    ["page-loader", "mobileMoreDrawer", "mobileDrawerOverlay"].forEach(id => {
      document.getElementById(id)?.remove();
    });
    document.querySelector(".mobile-bottom-nav")?.remove();
    // Remove duplicate custom cursors (keep at most one)
    const cursors = document.querySelectorAll(".custom-cursor");
    cursors.forEach((c, i) => { if (i > 0) c.remove(); });
  }

  /** Re-execute an array of JS strings in order, in the global scope */
  function runInlineScripts(scripts) {
    scripts.forEach(code => {
      try {
        // Using Function to run in global scope (same as a <script> tag)
        // eslint-disable-next-line no-new-func
        const fn = new Function(code);
        fn.call(window);
      } catch (e) {
        console.warn("[spa-router] Inline script error:", e);
      }
    });
  }

  /** Update active tab in desktop nav and mobile bottom nav */
  function updateActiveStates(pageFile) {
    document.querySelectorAll(".nav-links a").forEach(a => {
      a.classList.toggle("active", toPageFile(a.href) === pageFile);
    });
    setTimeout(() => {
      document.querySelectorAll(".mobile-tab-item").forEach(a => {
        if (!a.href) return;
        a.classList.toggle("active", toPageFile(a.href) === pageFile);
      });
    }, 50);
  }

  /** Load an external script once, return a Promise */
  function loadScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[data-spa-src="${src}"]`)) {
        resolve(); return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.dataset.spaSrc = src;
      s.onload  = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  /** Re-run everything that needs to fire after a content swap */
  async function reinitPage(pageFile) {
    // Re-run main.js idempotent inits (mobile nav, hamburger, scroll-top…)
    if (typeof window._spaReinit === "function") window._spaReinit();

    // Re-init AOS for newly added elements
    if (window.AOS) AOS.init({ duration: 680, once: true, offset: 55, easing: "ease-out-cubic" });

    // Load + run page-specific external module
    const mod = PAGE_SCRIPTS[pageFile];
    if (mod) {
      await loadScript(mod.src);
      if (mod.init && typeof window[mod.init] === "function") window[mod.init]();
    }
  }

  // ── CORE NAVIGATION ─────────────────────────────────────────

  async function navigate(pageFile, pushState = true) {
    if (_navigating) return;
    if (pageFile === (location.pathname.split("/").pop() || "index.html")) return;

    _navigating = true;
    const mobileNav = document.querySelector(".mobile-bottom-nav");
    if (mobileNav) mobileNav.style.opacity = "0.6";

    try {
      if (!_cache[pageFile]) {
        const res = await fetch(pageFile, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        _cache[pageFile] = await res.text();
      }

      const result = extractContent(_cache[pageFile]);
      if (!result) throw new Error("Could not parse page content");

      const { preNavNodes, contentNodes, pageStyles, inlineScripts, title, bodyClass } = result;

      // ── 1. Clear old content ──
      clearPreNav();
      clearContent();
      removeVolatile();

      // ── 2. Inject page styles ──
      document.querySelectorAll("style[data-spa-page]").forEach(s => s.remove());
      if (pageStyles) {
        const styleEl = document.createElement("style");
        styleEl.setAttribute("data-spa-page", pageFile);
        styleEl.textContent = pageStyles;
        document.head.appendChild(styleEl);
      }

      // ── 3. Inject pre-nav nodes (announcement bar, scroll-progress…) ──
      const nav = document.querySelector("nav.navbar");
      preNavNodes.forEach(n => {
        // Tag each node so we can remove it on next navigation
        if (n.nodeType === 1) n.setAttribute("data-spa-pre", "1");
        nav.parentNode.insertBefore(n, nav);
      });

      // ── 4. Inject main content ──
      const footer = document.querySelector("footer.footer");
      const frag = document.createDocumentFragment();
      contentNodes.forEach(n => frag.appendChild(n));
      footer.parentNode.insertBefore(frag, footer);

      // ── 5. Update meta ──
      document.title = title;
      document.body.className = bodyClass;

      // ── 6. History ──
      if (pushState) history.pushState({ pageFile }, title, pageFile);

      // ── 7. Scroll to top ──
      window.scrollTo({ top: 0, behavior: "instant" });

      // ── 8. Update active tab ──
      updateActiveStates(pageFile);

      // ── 9. Re-run external script inits ──
      await reinitPage(pageFile);

      // ── 10. Re-run inline scripts (typing anim, particles, etc.) ──
      // Small delay so the DOM is fully painted first
      setTimeout(() => runInlineScripts(inlineScripts), 50);

      // ── 11. Force-hide the page loader immediately ──
      // The inline script uses window.addEventListener('load', ...) which
      // never fires again on SPA navigation, so the loader gets stuck.
      // We hide it ourselves right after content is ready.
      setTimeout(() => {
        const loader = document.getElementById("page-loader");
        if (loader) loader.classList.add("hide");
      }, 100);

    } catch (err) {
      console.warn("[spa-router] Navigation failed, falling back:", err);
      location.href = pageFile;
      return;
    } finally {
      _navigating = false;
      const mbn = document.querySelector(".mobile-bottom-nav");
      if (mbn) mbn.style.opacity = "";
    }
  }

  // ── EVENT WIRING ─────────────────────────────────────────────

  function isHomePage(pf) {
    return pf === "index.html" || pf === "" || pf === "/";
  }

  function onClick(e) {
    const a = e.target.closest("a[href]");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target && a.target !== "_self" && a.target !== "") return;
    if ((a.getAttribute("href") || "").startsWith("#")) return;
    const pageFile = toPageFile(a.href);
    if (!pageFile) return;
    // Always do a real reload for home so the announcement bar runs fresh
    if (isHomePage(pageFile)) {
      location.href = a.href;
      return;
    }
    e.preventDefault();
    navigate(pageFile, true);
  }

  function onPopState(e) {
    const pageFile = (e.state && e.state.pageFile)
      || (location.pathname.split("/").pop() || "index.html");
    // Real reload for home on back/forward too
    if (isHomePage(pageFile)) {
      location.href = pageFile || "index.html";
      return;
    }
    navigate(pageFile, false);
  }

  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", onPopState);

  history.replaceState(
    { pageFile: location.pathname.split("/").pop() || "index.html" },
    document.title,
    location.href
  );

  console.log("[spa-router] Loaded ✓");
})();