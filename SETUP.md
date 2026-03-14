# BPUTNotes — Rebuilt Site Setup Guide

## What Was Done
Full rebuild: all content now loads from Google Sheets. No hardcoded data anywhere.

---

## Your Credentials (already wired in)
- **Sheet ID:** `1hXXQusycfE6CxpwlkeNtAcHgk1TeHeo1MkBacD5NaB4`
- **API Key:** `AIzaSyDlzWcJnH3iDKyIRAzI8_bMShfxPcnMs1Q`
- **Apps Script URL:** `https://script.google.com/macros/s/AKfycbwP-06kbFILzt5Hj2KMb5ddd_RD0QEY-yPrtWLXokYhB0zgI0LdkqbeaAxLOR0t7zQ_/exec`

---

## Google Sheet Structure

Create these **5 tabs** in your Sheet (exact names):

### Tab: Notes
| branch | semester | subject_number | subject_name | drive_link | tags | status |
|--------|----------|---------------|--------------|------------|------|--------|
| cse | 1 | 1 | Engineering Mathematics I | https://drive.google.com/... | Notes,PDF | active |

- `branch`: cse / civil / electrical / mechanical / mining / metallurgy / mineral
- `status`: active or hidden

### Tab: PYQs  ⚡ NEW — year and exam_type columns
| branch | semester | subject_number | subject_name | exam_type | year | drive_link | tags | status |
|--------|----------|---------------|--------------|-----------|------|------------|------|--------|
| cse | 1 | 1 | Engineering Mathematics I | regular | 2024 | https://... | PYQ | active |

- `exam_type`: regular or back
- `year`: 2020, 2021, 2022, 2023, or 2024

### Tab: Books
| branch | semester | subject_number | subject_name | drive_link | tags | status |
(same structure as Notes)

### Tab: Scholarships ⚡ EXPANDED columns
| title | description | category | amount | amount_sublabel | deadline | urgent | status | apply_link | eligibility | tags |
|-------|-------------|----------|--------|----------------|----------|--------|--------|------------|-------------|------|
| Post Matric Scholarship | Central scheme for SC/ST | central | ₹5,000 | per year | Oct 31 | false | open | https://scholarships.gov.in | SC/ST students | Merit |

- `category`: central / state / private / ngo
- `urgent`: true or false
- `status`: open / upcoming / closed

### Tab: Popup (key-value format)
| key | value |
|-----|-------|
| enabled | true |
| eyebrow | Now Open · 2026 |
| heading | We're looking for |
| heading_highlight | passionate BPUTians |
| subtitle | BPUTNotes is 100% student-run. |
| footer_text | Applications close soon |
| cta_text | ✦ Apply Now — It's Free |
| cta_link | careers.html |
| card_1_icon | 🌟 |
| card_1_title | Campus Ambassador |
| card_1_desc | Represent BPUTNotes at your college. |
| card_1_link | careers.html |
| card_1_color | amber |
| card_1_badge | Open |
| card_1_enabled | true |
| card_2_icon | ✍️ |
| card_2_title | Content Contributor |
| ... | ... |

---

## Apps Script Deployment

1. Go to https://script.google.com
2. Create new project
3. Paste the code shown in Admin Panel → Setup Guide
4. Deploy → New Deployment → Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the URL → paste in `js/sheets.js` as `APPS_SCRIPT_URL`

---

## Admin Panel
- URL: `admin.html`
- Username: `admin`
- Password: `bputnotes@admin2024`
- **Change the password** by editing `js/admin.js` line: `const ADMIN_PASS = '...'`

---

## Sheet Must Be Published
1. File → Share → Publish to web
2. Select "Entire Document"
3. Publish (this allows the API key to read it)

---

## File Structure
```
/
├── index.html          ← Homepage with popup (loaded from Sheet)
├── notes.html          ← Notes dashboard (from Sheet)
├── pyq.html            ← PYQ dashboard (from Sheet, with year+type)
├── books.html          ← Books selector (from Sheet)
├── scholarship.html    ← Scholarship hub (from Sheet)
├── admin.html          ← Admin panel (reads+writes Sheet)
├── about.html          ← Static page
├── careers.html        ← Static page
├── internship.html     ← Static page
├── css/
│   ├── style.css       ← Global styles
│   ├── components.css  ← Reusable components
│   └── admin.css       ← Admin panel styles
└── js/
    ├── sheets.js           ← Google Sheets connector (credentials here)
    ├── main.js             ← Global JS (navbar, scroll, etc.)
    ├── notes-loader.js     ← Notes page data loading
    ├── pyq-loader.js       ← PYQ page data loading
    ├── books-loader.js     ← Books page data loading
    ├── scholarship-loader.js ← Scholarship page data loading
    ├── popup-loader.js     ← Homepage popup (reads Popup tab)
    └── admin.js            ← Admin panel logic
```
