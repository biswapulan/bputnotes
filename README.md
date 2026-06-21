# BPUTNotes - Static → Next.js Migration: Handover Notes

## Scope - read this first

The job is: **migrate `bputnotes-main` (the static HTML/CSS/JS site) to Next.js, as-is, with zero changes to UI or logic.** That's it. Nothing else in this codebase is in scope.

A previous team started this migration and used an AI coding agent to do most of the implementation work. They got the bulk of it done - the project builds, routing is in place, the data layer is ported - but didn't finish verifying it against the actual current static site, and left some unrelated project files mixed into the same repo. This document audits where things actually stand, so the next developer isn't rediscovering all of this from scratch.

**Django: remove it.** The repo contains a full, separate Django project (an internal staff dashboard for managing interns/supervisors/tasks/attendance - nothing to do with the public site). It is not part of this migration and should be deleted outright. See §2 for exactly what to remove.

---

## 1. The canonical source of truth

`bputnotes-main` (the static site zip) is the **only** source of truth for what the migrated site should look like and do. Don't treat any static HTML/CSS/JS sitting inside the half-finished Next.js repo as authoritative - diffing the two turned up real drift (§4). Always compare against `bputnotes-main` directly.

It's a small, self-contained static site: 8 HTML pages, 3 CSS files, 9 JS files, 2 image assets, a favicon, and a `SETUP.md` that documents how the dynamic content works. Pages:

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Hero, stats, features, recruitment popup |
| Notes | `notes.html` | Branch/semester subject notes, links to Google Drive |
| PYQs | `pyq.html` | Previous-year question papers, filterable by year/exam type |
| Books | `books.html` | Reference book links by branch/semester |
| Scholarships | `scholarship.html` | Scholarship listings, filterable by category |
| About | `about.html` | Team/mission page + contact form |
| Careers | `careers.html` | Recruitment page with embedded Google Form |
| Admin | `admin.html` | Password-gated panel to manage all the above content |

All dynamic content (Notes/PYQs/Books/Scholarships/Popup) comes from a **Google Sheet**, read via the Sheets API, with admin writes going through a Google Apps Script web app. This is documented in `SETUP.md` - read it; it covers the Sheet tab/column structure and Apps Script deployment.

---

## 2. Remove the Django project - do this first

The migration repo has a complete, working Django app bundled in alongside the Next.js code:

```
bput_dashboard/      ← Django project core (settings, urls, wsgi, asgi)
dashboard/            ← Django app (models, views, forms, 8 migrations)
templates/            ← Django templates (admin/supervisor/intern dashboards, login)
manage.py
requirements.txt
runtime.txt
Procfile
```

This is an internal staff-ops tool (login-gated, role-based: admin / supervisor / intern - task assignment, attendance logging, tickets, announcements). It has its own database models and its own deploy pipeline (`gunicorn` + `Procfile`, env vars for Postgres/Render). **Delete all of the above from the repo.**

It's safe to remove as a whole unit - confirmed there's no code-level connection in either direction:
- Nothing in `app/`, `components/`, `lib/`, `package.json`, or `next.config.mjs` references Django, `manage.py`, or any Django URL.
- Nothing in the Django templates/settings references the Next.js site beyond using "bputnotes.in" as plain branding text on the login page.
- Separate databases (Django uses SQLite/Postgres; the public site's data lives entirely in a Google Sheet).

One thing worth knowing, not a blocker: the canonical static site's navbar has a small lock-icon link to `https://studio.bputnotes.in` (see §4) - that's plausibly where this Django dashboard is meant to be hosted, as a separate subdomain/deployment. That's fine. The link itself is just a plain `<a href>` to an external URL and should be carried over as-is; the Django app behind it (if that's what it is) stays out of this repo and gets handled as its own separate project elsewhere.

`run_merge.bat` at the repo root is unrelated to Django - it's a leftover local build-tool reference from the CSS merge step (see §6.4). Don't confuse it for part of the Django cleanup; it has its own line item below.

---

## 3. What's actually in the Next.js migration

### Stack
- Next.js 14.2.30, App Router (`app/`)
- TypeScript (`strict: false`)
- Tailwind is configured but **not used anywhere** - all real styling is in `app/globals.css`, ported from the original CSS files. Tailwind utility classes won't do anything visually right now.
- `aos` (Animate On Scroll) - same library the static site loads via CDN.

### Routing - old file → new route
| Original | Route | Page file | Client component |
|---|---|---|---|
| `index.html` | `/` | `app/page.tsx` | `components/HomePageClient.tsx` |
| `notes.html` | `/notes` | `app/notes/page.tsx` | `components/NotesPageClient.tsx` |
| `pyq.html` | `/pyq` | `app/pyq/page.tsx` | `components/PYQPageClient.tsx` |
| `books.html` | `/books` | `app/books/page.tsx` | `components/BooksPageClient.tsx` |
| `scholarship.html` | `/scholarship` | `app/scholarship/page.tsx` | `components/ScholarshipPageClient.tsx` |
| `about.html` | `/about` | `app/about/page.tsx` | `components/AboutPageClient.tsx` |
| `careers.html` | `/careers` | `app/careers/page.tsx` | none - content written directly in the page file (see §6.3) |
| `admin.html` | `/admin` | `app/admin/page.tsx` | `components/AdminPageClient.tsx` |

Pattern for every page except Careers: a thin Server Component in `app/<route>/page.tsx` (handles `metadata`/SEO/OG tags) rendering a `'use client'` component from `components/` that holds the actual interactive logic - the React equivalent of what each `*-loader.js` file used to do.

### Global UI (renders on every page via `app/layout.tsx`)
| Original behaviour (`js/main.js`) | New component |
|---|---|
| Page loading spinner | `components/PageLoader.tsx` |
| Top scroll-progress bar | `components/ScrollProgress.tsx` |
| Dismissible announcement bar | `components/AnnouncementBar.tsx` |
| Navbar (scroll-shrink, hamburger, active link) | `components/Navbar.tsx` |
| Side social icon rail | `components/SocialRail.tsx` |
| Floating WhatsApp button | `components/WaFloat.tsx` |
| Floating social FAB (mobile) | `components/SocialFab.tsx` |
| Scroll-to-top button | `components/ScrollTopBtn.tsx` |
| Custom mouse cursor (desktop) | `components/CustomCursor.tsx` |
| Mobile bottom tab bar + "More" drawer | `components/MobileBottomNav.tsx` |
| Footer | `components/Footer.tsx` |
| Recruitment popup ("Popup" Sheet tab) | `components/Popup.tsx` (→ `lib/sheets.ts → getPopupConfig()`) |

`components/MobileTabBar.tsx` exists but is **not imported anywhere** - looks like an earlier draft superseded by `MobileBottomNav.tsx`. Decide whether to delete it.

### Data layer - `js/sheets.js` → `lib/sheets.ts`
A TypeScript rewrite covering every function from the original: the same Sheet ID, API key, tab names, 5-minute in-memory cache, per-resource getters (`getNotesForSem`, `getPYQs`, `getBooksForSem`, `getScholarships`, `getPopupConfig`), the `getAll*` admin-read functions, and `adminWrite()` for the Apps Script write-back. Good news: a byte-level diff of `js/sheets.js` against the canonical zip's copy shows **zero drift** - the JS logic the team ported from was already correct and current, so `lib/sheets.ts` is the one piece of this migration with a solid, verified baseline. Still worth a careful line-by-line read against `js/sheets.js`, since every dynamic page depends on it, but there's no evidence of stale source data here.

The Sheet ID, API key, and Apps Script URL are hardcoded directly in `lib/sheets.ts`, matching how they were hardcoded in the original `js/sheets.js`. Consistent with "migrate as-is."

---

## 4. Source drift - the existing Next.js build was made from an older snapshot of the static site

This is the most important finding in this audit. Diffing the canonical `bputnotes-main` zip against the static files that were sitting in the half-finished migration repo shows they are **not the same version** - several real, user-facing pieces are missing from the Next.js build because the team worked from an outdated copy. JS logic files (`sheets.js`, `main.js`, `admin.js`, all the `*-loader.js` files, `spa-router.js`) matched exactly - it's specifically the HTML/CSS content layer that's stale. Concretely, confirmed missing from the Next.js app entirely:

1. **Google Analytics is not wired up at all.** Every page in the canonical static site loads the same `gtag.js` snippet (tag ID `G-G70317S9Q8`) in `<head>`. There is zero trace of this anywhere in `app/layout.tsx` or any component. The migrated site currently has no analytics tracking.

2. **A navbar "Studio" link is missing.** The canonical site has a small lock-icon link (`<a href="https://studio.bputnotes.in" class="nav-studio-lock">`) in the navbar on every public page except Admin, plus a matching `.nav-studio-lock` CSS rule in `style.css`. Neither the link nor the CSS exists anywhere in `Navbar.tsx` or `globals.css`.

3. **The Careers page Google Form points to the wrong form.** The canonical `careers.html` embeds:
   `https://docs.google.com/forms/d/e/1FAIpQLScs_GYlFNShFzSpNmc1BRtTojHMdIhmjqarZW2ycO6_0mFwmg/viewform?usp=dialog`
   The migrated `app/careers/page.tsx` embeds a **different form ID entirely**:
   `https://docs.google.com/forms/d/e/1FAIpQLScZX-kvunoomoh2TbdlS_AuaUSVr08K0SVWwk35RFPm98xisg/viewform?embedded=true`
   This needs fixing before launch - right now applicants would be submitting to a stale/incorrect form.

4. **The About page team section shows outdated placeholder content that should currently be hidden.** In the canonical site, that whole team-bios section is wrapped in an HTML comment (`<!-- ... -->`) - i.e. intentionally not shown on the live site - and the two names that are filled in are real: "Biswajit Pradhan - Founder & Tech Lead" and "Asish Ku" (a third slot is still a generic "Team Member" placeholder, even in the canonical version). The migrated `AboutPageClient.tsx` renders this section **live and visible**, with placeholder text instead of the real names: "Your Name - Founder & Content Lead", "[Your College], BPUT", and "Team Member" twice. Needs both a content fix (use the real names from the canonical source) and a visibility fix (this section should not be rendered at all right now, matching the commented-out state).

5. **The logo image asset differs.** `assets/logo_bputnotes.jpeg` in the canonical zip is 711×672px (13.2 KB); the one in the migration repo is 512×512px (17.7 KB) - a different image, not just a recompression. Worth confirming which one is actually current before shipping either.

**Action for the next developer:** before doing a careful page-by-page logic diff (§5), first pull every piece of static content (HTML/CSS) directly from this canonical zip rather than trusting whatever's already sitting in the migration repo's legacy folders - that legacy copy is itself out of date.

---

## 5. Did it build?

Yes - `npm install && npm run build` completes with no TypeScript or compile errors, all 8 routes statically generate. So this is incomplete, not broken: it runs, but (per §4) some of what it's running is built from stale content, and full logic parity hasn't been verified page-by-page yet.

---

## 6. Other known gaps / cleanup items

### 6.1 Duplicate legacy static folders inside the migration repo
`css/`, `js/`, `assets/`, and all root-level `*.html` files exist a second time under `public/css/`, `public/js/`, `public/assets/`. Confirmed via search: nothing in `app/`/`components/` loads `public/css/*` or `public/js/*` - they're dead code. Only `public/assets/*.png/.jpeg` are actually used (for Open Graph image metadata). Some of the `public/js/` copies were also hand-edited at some point and now diverge even from their own `js/` counterparts (e.g. `public/js/main.js` has Next.js-style route paths rewritten in, but the corresponding `js/main.js` doesn't) - a sign of an abandoned in-place-edit approach before the team switched to rewriting everything as React components. Once content is verified against the canonical zip (§4), delete all of these duplicated/dead folders.

### 6.2 Scroll-reveal (AOS) coverage not confirmed 1:1
`AOS.init()` is only called once, inside `HomePageClient.tsx` - the static site re-initializes it on every page load. If any other page relies on `data-aos` for its own animations, those currently won't run. Also worth a visual check: the canonical `index.html` uses `data-aos` 34 times vs. 28 in `HomePageClient.tsx`.

### 6.3 Careers page structured differently from every other page
Every other route splits into a Server Component (`page.tsx`) + a `'use client'` component (`components/<Page>PageClient.tsx`). Careers is the one exception - all its markup lives directly in `app/careers/page.tsx` with no `CareersPageClient.tsx`. Plausible, since Careers has no Sheets data, but double-check the canonical `careers.html` for any inline `<script>`-driven interactivity (tab toggles, accordions, counters) that a Server Component can't reproduce.

### 6.4 Broken build script
`package.json` has:
```json
"merge-css": "C:\\node\\node.exe C:\\Users\\bisu2\\.gemini\\antigravity\\scratch\\merge_css.js"
```
A hardcoded, Windows-only, machine-specific path. The actual `merge_css.js` script isn't in the repo. This was presumably used once to build `app/globals.css` and never cleaned up - remove it from `package.json`, or get the real script and commit it properly so the CSS build step is reproducible. `run_merge.bat` at the repo root has the same broken path and can go too.

### 6.5 Env vars don't do anything in the Next.js app
`.env.example` only contains Django-style vars (`SECRET_KEY`, `DATABASE_URL`, etc.) - all of that goes away with the Django removal in §2. The Next.js app itself reads zero environment variables (`process.env` has no matches anywhere in `app/`, `components/`, `lib/`); all Sheets credentials are hardcoded in `lib/sheets.ts`, matching the original.

### 6.6 `MobileTabBar.tsx` is orphaned
Not imported anywhere - likely superseded by `MobileBottomNav.tsx`. Delete it, or confirm it was meant to replace the other one.

### 6.7 Admin credentials carried over correctly
Hardcoded login (`admin` / `admin@bputnotes.in`) matches the canonical `js/admin.js` exactly. Note `SETUP.md` documents a different password (`bputnotes@admin2024`) - that mismatch exists in the canonical source itself, not something introduced by the migration. Trust the code, not `SETUP.md`, for the actual password.

---

## 7. What's solid (don't re-verify these from scratch)

- Routing structure matches 1:1 for every page.
- `Navbar.tsx` correctly uses Next.js idioms (`next/link`, `usePathname`) for active-link state and navigation, preserving the original scroll-shrink and hamburger-menu behavior (it's just missing the Studio link, per §4.2).
- `lib/sheets.ts` covers every function in `js/sheets.js`, same caching strategy, and - per §3 - was ported from JS source that matches the canonical zip exactly.
- The old hand-rolled SPA router (`js/spa-router.js`, a `fetch()` + DOM-swap navigation system) was correctly **not** ported - Next.js's own App Router replaces this natively. No action needed here.
- Production build completes cleanly, no compile errors.

---

## 8. Recommended order of work

1. **Remove the Django project** (§2) - quick, zero-risk, do it first so it stops cluttering the repo.
2. **Pull every piece of static content fresh from the canonical `bputnotes-main` zip** and fix the four confirmed drift items in §4 (Analytics tag, Studio link, Careers form ID, About team section).
3. **Page-by-page logic diff** using the mapping table in §3 - original `.html` + `*-loader.js` side-by-side with the matching `*PageClient.tsx`, checking filters/search/sort/status logic exactly.
4. **Clean up §6** items (duplicate static folders, broken build script, orphaned component, AOS init scope) once content parity is confirmed.
5. Anything beyond "migrate as-is" - env vars, Tailwind adoption, etc. - is out of scope unless separately requested.
