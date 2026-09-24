/**
 * winter-promo.js — Winter Python Bootcamp 2026 promotion for bputnotes.in
 * ---------------------------------------------------------------------
 * Adds, on every page:
 *   1. a slim top banner            (dismissible)
 *   2. a purple + snow corner card  (bottom-left, dismissible)
 *   3. a "Winter Python Bootcamp" section BELOW THE HERO with a
 *      Register Now button. It is drawn into a placeholder that each page
 *      carries right after its hero:   <div data-wbp-section></div>
 * and, on the HOME page only:
 *   4. full-page snowfall
 *
 * HOME PAGE: the banner flows normally above the sticky navbar.
 * OTHER PAGES: the navbar is position:fixed, so the banner is pinned above
 * it and JS pushes the navbar + page content down by the banner's height.
 *
 * SPA SAFE: js/spa-router.js swaps the page body and rewrites
 * <body class="...">. A MutationObserver below re-applies the banner layout
 * and re-draws the section after every swap, so nothing disappears.
 *
 * EDIT THE SETTINGS BELOW to change wording, price, link or dates.
 * The whole promotion switches itself off after PROMO.endsAt.
 * Self-contained: injects its own CSS (all classes prefixed wbp-).
 */
(function () {
  "use strict";
  if (window.__wbpLoaded) return;          // never run twice
  window.__wbpLoaded = true;

  /* ── SETTINGS ─────────────────────────────────────────────── */
  var PROMO = {
    endsAt:   "2026-10-03T23:59:00+05:30",  // promo auto-hides after this
    link:     "winter-bootcamp.html",       // "View details" target
    regLink:  "winter-bootcamp.html#register", // "Register now" target
    barTitle: "Winter Python Bootcamp 2026",
    barExtra: "Starts 5 Oct \u00B7 \u20B91,499 \u00B7 Register by 3 Oct",
    barBtn:   "Register",
    cardTitle:"Winter Python Bootcamp 2026",
    cardText: "1-month online Python program for first-year engineering students in Odisha. Only 6 students per batch.",
    cardMeta: "Starts 5 Oct 2026 \u00B7 \u20B91,499",
    cardBtn:  "View details",
    cardDelayMs: 10000,                     // card appears after 10 s (or after scrolling)
    snowOnHome: true,

    /* section below the hero */
    secKicker: "WINTER BOOTCAMP 2026",
    secTitle:  "Learn Python this winter \u2014 built for 1st-year engineering students",
    secText:   "A 1-month, hands-on online Python program from beginner to OOP with a real project. Live classes, weekly tests and personal mentor access, in a batch of just 6 students.",
    secBtn:    "Register now",
    secBtn2:   "View details",
    secNote:   "Starts 5 Oct 2026 \u00B7 Last date to register: 3 Oct, 11:59 PM",
    secStats: [
      ["12", "Live classes"],
      ["24", "Live hours"],
      ["6",  "Students / batch"],
      ["\u20B91,499", "Total fee"]
    ]
  };
  /* ─────────────────────────────────────────────────────────── */

  try { if (Date.now() > new Date(PROMO.endsAt).getTime()) return; } catch (e) {}

  var doc = document, body = doc.body;
  if (!body) return;

  function store(get, key, val) {
    try { if (get) return sessionStorage.getItem(key); sessionStorage.setItem(key, val); } catch (e) {}
    return null;
  }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isHome() {
    var f = location.pathname.split("/").pop();
    return f === "" || f === "index.html";
  }

  var SNOW = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 4 12 6.5 14.5 4M9.5 20l2.5-2.5 2.5 2.5"/></svg>';
  var X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  /* ── CSS (all classes prefixed wbp- so nothing else is affected) ── */
  var css =
    /* top banner */
    "#wbp-bar{position:relative;z-index:999999;background:linear-gradient(120deg,#33227a 0%,#2b1d6e 55%,#221758 100%);color:#fff;font-weight:600;font-size:13.5px;line-height:1.4;font-family:inherit;text-align:center;padding:8px 46px 8px 14px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 12px}" +
    "#wbp-bar .wbp-t{display:inline-flex;align-items:center;gap:8px}" +
    "#wbp-bar .wbp-t svg{color:#bcd3ff;flex:none}" +
    "#wbp-bar .wbp-x{color:#dcd6ff;font-weight:500}" +
    "#wbp-bar a.wbp-btn{background:#fbbf24;color:#1f1300;text-decoration:none;font-weight:700;border-radius:999px;padding:4px 14px;white-space:nowrap}" +
    "#wbp-bar a.wbp-btn:hover{background:#fcd34d}" +
    /* fixed mode: applied via JS only on non-home pages */
    "body.wbp-bar-fixed #wbp-bar{position:fixed;top:0;left:0;right:0}" +
    "body.wbp-bar-pushed{padding-top:var(--wbp-bar-h,0px);transition:padding-top .25s ease}" +
    "body.wbp-bar-pushed .navbar{top:var(--wbp-bar-h,0px)!important;transition:top .25s ease}" +
    "body.wbp-bar-pushed .navbar.scrolled{top:calc(var(--wbp-bar-h,0px) + 10px)!important}" +
    ".wbp-close{position:absolute;top:50%;right:8px;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}" +
    ".wbp-close:hover{background:rgba(255,255,255,.16)}" +
    ".wbp-close:focus-visible,#wbp-bar a:focus-visible,#wbp-card a:focus-visible,.wbp-sec a:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}" +
    /* ── bottom-left corner card — purple + snow ── */
    "#wbp-card{position:fixed;left:18px;bottom:18px;z-index:9990;width:328px;max-width:calc(100vw - 36px);color:#fff;border-radius:20px;padding:20px 20px 18px;font-family:inherit;overflow:hidden;isolation:isolate;background:linear-gradient(165deg,#4c3ce0 0%,#3221a0 46%,#1c1350 100%);border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 54px -16px rgba(20,12,64,.6),0 2px 0 rgba(255,255,255,.06) inset;opacity:0;transform:translateY(18px) scale(.97);pointer-events:none;transition:opacity .4s ease,transform .4s cubic-bezier(.2,.8,.2,1)}" +
    "#wbp-card.wbp-on{opacity:1;transform:none;pointer-events:auto}" +
    "#wbp-card::before{content:'';position:absolute;left:-30%;right:-30%;top:-60%;height:75%;background:radial-gradient(closest-side,rgba(255,255,255,.16),transparent 72%);pointer-events:none;z-index:0}" +
    "#wbp-card::after{content:'';position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(to top,rgba(255,255,255,.10),transparent);pointer-events:none;z-index:0}" +
    "#wbp-snowc{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:inherit}" +
    "#wbp-snowc span{position:absolute;top:-16px;color:#fff;opacity:.6;line-height:0;filter:drop-shadow(0 0 2px rgba(255,255,255,.4));animation:wbp-fallc linear infinite;will-change:transform}" +
    "@keyframes wbp-fallc{to{transform:translate3d(var(--dx,10px),260px,0) rotate(200deg)}}" +
    "#wbp-card .wbp-close{top:10px;right:10px;transform:none;color:#e7e2ff;z-index:2}" +
    "#wbp-card .wbp-close:hover{background:rgba(255,255,255,.16)}" +
    "#wbp-card .wbp-k{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.12);color:#ffe6a8;border:1px solid rgba(255,224,150,.45);border-radius:999px;padding:4px 11px;font-size:11px;font-weight:700;letter-spacing:.05em;margin-bottom:10px}" +
    "#wbp-card .wbp-k svg{color:#ffe6a8}" +
    "#wbp-card h3{position:relative;z-index:1;margin:0 28px 6px 0;font-size:16.5px;line-height:1.3;color:#fff}" +
    "#wbp-card p{position:relative;z-index:1;margin:0 0 8px;font-size:13.5px;line-height:1.55;color:#dad4ff}" +
    "#wbp-card .wbp-m{position:relative;z-index:1;font-weight:700;color:#ffe6a8;font-size:13px}" +
    "#wbp-card a.wbp-btn{position:relative;z-index:1;display:inline-block;margin-top:9px;background:linear-gradient(135deg,#fcd34d,#f59e0b);color:#241400;text-decoration:none;font-weight:800;font-size:13.5px;border-radius:10px;padding:9px 17px;box-shadow:0 10px 20px -8px rgba(245,158,11,.65)}" +
    "#wbp-card a.wbp-btn:hover{filter:brightness(1.06);transform:translateY(-1px)}" +
    /* full-page snow (home only) */
    "#wbp-snow{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:60}" +
    "#wbp-snow span{position:absolute;top:-24px;color:#9db4ff;opacity:.75;line-height:0;will-change:transform;animation:wbp-fall linear infinite}" +
    "@keyframes wbp-fall{to{transform:translate3d(var(--dx,20px),108vh,0) rotate(200deg)}}" +

    /* ── section below the hero ── */
    ".wbp-sec{padding:28px 24px 8px;font-family:inherit;box-sizing:border-box}" +
    ".wbp-sec *{box-sizing:border-box}" +
    ".wbp-sec-card{position:relative;isolation:isolate;overflow:hidden;max-width:1180px;margin:0 auto;border-radius:26px;color:#fff;padding:40px 44px;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:32px;align-items:center;background:linear-gradient(135deg,#4c3ce0 0%,#3221a0 48%,#1c1350 100%);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 60px -28px rgba(34,23,88,.7)}" +
    ".wbp-sec-card::before{content:'';position:absolute;z-index:0;left:-10%;top:-55%;width:70%;height:110%;background:radial-gradient(closest-side,rgba(255,255,255,.17),transparent 72%);pointer-events:none}" +
    ".wbp-sec-card::after{content:'';position:absolute;z-index:0;left:0;right:0;bottom:0;height:70px;background:linear-gradient(to top,rgba(255,255,255,.10),transparent);pointer-events:none}" +
    ".wbp-sec-snow{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:inherit}" +
    ".wbp-sec-snow span{position:absolute;top:-20px;color:#fff;opacity:.55;line-height:0;filter:drop-shadow(0 0 2px rgba(255,255,255,.4));will-change:transform;animation:wbp-fallsec linear infinite}" +
    "@keyframes wbp-fallsec{to{transform:translate3d(var(--dx,10px),680px,0) rotate(220deg)}}" +
    ".wbp-sec-l,.wbp-sec-r{position:relative;z-index:1;min-width:0}" +
    ".wbp-sec .wbp-k{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.12);color:#ffe6a8;border:1px solid rgba(255,224,150,.45);border-radius:999px;padding:5px 13px;font-size:11.5px;font-weight:700;letter-spacing:.06em;margin:0 0 14px}" +
    ".wbp-sec .wbp-k svg{color:#ffe6a8}" +
    ".wbp-sec h2{margin:0 0 12px;font-size:clamp(1.45rem,2.6vw,2.05rem);line-height:1.2;font-weight:800;letter-spacing:-.01em;color:#fff}" +
    ".wbp-sec p.wbp-sec-p{margin:0 0 20px;font-size:1rem;line-height:1.65;color:#dad4ff;max-width:56ch}" +
    ".wbp-sec-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center}" +
    ".wbp-sec a.wbp-reg{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fcd34d,#f59e0b);color:#241400;text-decoration:none;font-weight:800;font-size:1rem;border-radius:12px;padding:13px 26px;box-shadow:0 14px 26px -10px rgba(245,158,11,.75);transition:transform .2s ease,filter .2s ease}" +
    ".wbp-sec a.wbp-reg:hover{filter:brightness(1.06);transform:translateY(-2px)}" +
    ".wbp-sec a.wbp-ghost{display:inline-flex;align-items:center;color:#fff;text-decoration:none;font-weight:700;font-size:.95rem;border:1.5px solid rgba(255,255,255,.4);border-radius:12px;padding:12px 22px;transition:background .2s ease}" +
    ".wbp-sec a.wbp-ghost:hover{background:rgba(255,255,255,.14)}" +
    ".wbp-sec .wbp-note{margin:16px 0 0;font-size:.85rem;font-weight:600;color:#ffe6a8}" +
    ".wbp-sec-r{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
    ".wbp-stat{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:18px 14px;text-align:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}" +
    ".wbp-stat b{display:block;font-size:clamp(1.5rem,2.4vw,1.9rem);line-height:1.1;font-weight:800;color:#fff}" +
    ".wbp-stat span{display:block;margin-top:6px;font-size:.8rem;font-weight:600;color:#cfc8ff}" +
    "@media(max-width:860px){.wbp-sec-card{grid-template-columns:1fr;padding:30px 24px;gap:24px;border-radius:22px}}" +
    "@media(max-width:768px){#wbp-card{left:10px;bottom:calc(76px + env(safe-area-inset-bottom,0px));width:auto;max-width:calc(100vw - 96px)}}" +
    "@media(max-width:600px){#wbp-bar .wbp-x{display:none}#wbp-bar{font-size:13px}.wbp-sec{padding:20px 14px 4px}.wbp-sec-card{padding:26px 18px}.wbp-sec-acts a{flex:1 1 100%;justify-content:center}.wbp-stat{padding:14px 8px}}" +
    "@media(prefers-reduced-motion:reduce){#wbp-card{transition:none}#wbp-snow,#wbp-snowc,.wbp-sec-snow{display:none}body.wbp-bar-pushed,body.wbp-bar-pushed .navbar{transition:none}.wbp-sec a.wbp-reg{transition:none}}";
  var st = doc.createElement("style");
  st.id = "wbp-style";
  st.textContent = css;
  doc.head.appendChild(st);

  /* ── 1. TOP BANNER ── */
  var bar = null, barRO = null;

  function setBarH() {
    if (!bar) return;
    var h = bar.offsetHeight + "px";
    if (doc.documentElement.style.getPropertyValue("--wbp-bar-h") !== h)
      doc.documentElement.style.setProperty("--wbp-bar-h", h);
  }
  function unpinBar() {
    if (body.classList.contains("wbp-bar-fixed")) body.classList.remove("wbp-bar-fixed");
    if (body.classList.contains("wbp-bar-pushed")) body.classList.remove("wbp-bar-pushed");
    doc.documentElement.style.setProperty("--wbp-bar-h", "0px");
  }
  /* Idempotent: safe to call any time. Home = normal flow, other pages = pinned above the fixed navbar. */
  function layoutBar() {
    if (!bar || !bar.parentNode) return;
    if (isHome()) { unpinBar(); return; }
    if (!body.classList.contains("wbp-bar-fixed"))  body.classList.add("wbp-bar-fixed");
    if (!body.classList.contains("wbp-bar-pushed")) body.classList.add("wbp-bar-pushed");
    setBarH();
  }

  if (!store(true, "wbp_bar")) {
    bar = doc.createElement("div");
    bar.id = "wbp-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Winter bootcamp announcement");
    bar.innerHTML =
      '<span class="wbp-t">' + SNOW + '<span>' + PROMO.barTitle + '</span></span>' +
      '<span class="wbp-x">' + PROMO.barExtra + '</span>' +
      '<a class="wbp-btn" href="' + PROMO.regLink + '">' + PROMO.barBtn + '</a>' +
      '<button type="button" class="wbp-close" aria-label="Close announcement">' + X + '</button>';
    body.insertBefore(bar, body.firstChild);

    layoutBar();
    // keep the pushed-down offset correct when the banner wraps to 1/2/3 lines
    if (window.ResizeObserver) { barRO = new ResizeObserver(setBarH); barRO.observe(bar); }
    else addEventListener("resize", function () { setTimeout(setBarH, 150); });

    bar.querySelector(".wbp-close").addEventListener("click", function () {
      unpinBar();
      if (barRO) barRO.disconnect();
      bar.remove();
      bar = null;
      store(false, "wbp_bar", "1");
    });
  }

  /* ── 2. CORNER CARD — purple + snow, on every page (once per visit) ── */
  if (!store(true, "wbp_card")) {
    var card = doc.createElement("aside");
    card.id = "wbp-card";
    card.setAttribute("aria-label", "Winter bootcamp");

    var snowSpans = "";
    var flakeCount = 6;
    for (var c = 0; c < flakeCount; c++) {
      var left = Math.round(c * (100 / flakeCount) + Math.random() * (60 / flakeCount));
      var size = (9 + Math.random() * 8).toFixed(1);
      var dur = (9 + Math.random() * 6).toFixed(1);
      var delay = (Math.random() * 12).toFixed(1);
      var dx = Math.round(Math.random() * 40 - 20);
      snowSpans += '<span style="left:' + left + '%;font-size:' + size + 'px;animation-duration:' + dur + 's;animation-delay:-' + delay + 's;--dx:' + dx + 'px">' + SNOW + '</span>';
    }

    card.innerHTML =
      '<div id="wbp-snowc" aria-hidden="true">' + snowSpans + '</div>' +
      '<button type="button" class="wbp-close" aria-label="Close winter bootcamp card">' + X + '</button>' +
      '<span class="wbp-k">' + SNOW + 'WINTER BOOTCAMP</span>' +
      '<h3>' + PROMO.cardTitle + '</h3>' +
      '<p>' + PROMO.cardText + '</p>' +
      '<p class="wbp-m">' + PROMO.cardMeta + '</p>' +
      '<a class="wbp-btn" href="' + PROMO.link + '">' + PROMO.cardBtn + '</a>';
    body.appendChild(card);
    var shown = false, timer;
    var showCard = function () {
      if (shown) return; shown = true;
      clearTimeout(timer); removeEventListener("scroll", onScroll);
      if (!doc.getElementById("wbp-card")) return;
      card.classList.add("wbp-on");
      store(false, "wbp_card", "1");
    };
    var onScroll = function () { if ((window.scrollY || 0) > 700) showCard(); };
    timer = setTimeout(showCard, PROMO.cardDelayMs);
    addEventListener("scroll", onScroll, { passive: true });
    card.querySelector(".wbp-close").addEventListener("click", function () {
      shown = true; clearTimeout(timer); removeEventListener("scroll", onScroll);
      card.classList.remove("wbp-on");
      store(false, "wbp_card", "1");
      setTimeout(function () { card.remove(); }, 400);
    });
  }

  /* ── 3. SECTION BELOW THE HERO ──
     Each page holds an empty <div data-wbp-section></div> right after its hero.
     This fills it (and refills it after an SPA page swap). */
  function daysLeftText() {
    var ms = new Date(PROMO.endsAt).getTime() - Date.now();
    if (isNaN(ms) || ms <= 0) return "";
    var d = Math.ceil(ms / 86400000);
    return d <= 1 ? "Last day to register!" : d + " days left to register";
  }
  function buildSection() {
    var flakes = "";
    for (var i = 0; i < 14; i++) {
      var left = Math.round(i * (100 / 14) + Math.random() * 5);
      var size = (10 + Math.random() * 10).toFixed(1);
      var dur = (12 + Math.random() * 9).toFixed(1);
      var delay = (Math.random() * 16).toFixed(1);
      var dx = Math.round(Math.random() * 60 - 30);
      flakes += '<span style="left:' + left + '%;font-size:' + size + 'px;animation-duration:' + dur + 's;animation-delay:-' + delay + 's;--dx:' + dx + 'px">' + SNOW + '</span>';
    }
    var stats = "";
    for (var s = 0; s < PROMO.secStats.length; s++) {
      stats += '<div class="wbp-stat"><b>' + PROMO.secStats[s][0] + '</b><span>' + PROMO.secStats[s][1] + '</span></div>';
    }
    var dl = daysLeftText();
    return '<section class="wbp-sec" aria-label="Winter Python Bootcamp 2026">' +
      '<div class="wbp-sec-card">' +
        '<div class="wbp-sec-snow" aria-hidden="true">' + flakes + '</div>' +
        '<div class="wbp-sec-l">' +
          '<span class="wbp-k">' + SNOW + PROMO.secKicker + '</span>' +
          '<h2>' + PROMO.secTitle + '</h2>' +
          '<p class="wbp-sec-p">' + PROMO.secText + '</p>' +
          '<div class="wbp-sec-acts">' +
            '<a class="wbp-reg" href="' + PROMO.regLink + '">' + PROMO.secBtn + ' <span aria-hidden="true">\u2192</span></a>' +
            '<a class="wbp-ghost" href="' + PROMO.link + '">' + PROMO.secBtn2 + '</a>' +
          '</div>' +
          '<p class="wbp-note">' + PROMO.secNote + (dl ? ' \u00B7 ' + dl : '') + '</p>' +
        '</div>' +
        '<div class="wbp-sec-r">' + stats + '</div>' +
      '</div></section>';
  }
  function mountSection() {
    var slots = doc.querySelectorAll("[data-wbp-section]");
    for (var i = 0; i < slots.length; i++) {
      if (!slots[i].children.length) slots[i].innerHTML = buildSection();
    }
  }
  mountSection();

  /* ── 4. SNOWFALL — HOME PAGE ONLY (full page) ── */
  function startSnow() {
    if (!PROMO.snowOnHome || reduce || doc.getElementById("wbp-snow") || !isHome()) return;
    var n = innerWidth < 700 ? 6 : 11;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) n = Math.ceil(n / 2);
    var wrap = doc.createElement("div");
    wrap.id = "wbp-snow";
    wrap.setAttribute("aria-hidden", "true");
    for (var i = 0; i < n; i++) {
      var s = doc.createElement("span");
      s.style.left = (i * (100 / n) + Math.random() * (60 / n)) + "%";
      s.style.fontSize = (11 + Math.random() * 11) + "px";
      s.style.animationDuration = (14 + Math.random() * 10) + "s";
      s.style.animationDelay = "-" + (Math.random() * 16) + "s";
      s.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
      s.innerHTML = SNOW;
      wrap.appendChild(s);
    }
    body.appendChild(wrap);
  }
  function syncSnow() {
    if (!isHome()) { var w = doc.getElementById("wbp-snow"); if (w) w.remove(); }
    else startSnow();
  }
  startSnow();

  /* ── SPA SAFETY ──
     spa-router.js replaces content and rewrites <body class>. Watch for that and
     re-apply the banner layout, snow state, and section. All handlers are idempotent. */
  function resync() { layoutBar(); syncSnow(); mountSection(); }
  try {
    new MutationObserver(resync).observe(body, { attributes: true, attributeFilter: ["class"], childList: true });
  } catch (e) {}
  var _push = history.pushState;
  history.pushState = function () { var r = _push.apply(this, arguments); setTimeout(resync, 0); return r; };
  addEventListener("popstate", function () { setTimeout(resync, 0); });
})();
