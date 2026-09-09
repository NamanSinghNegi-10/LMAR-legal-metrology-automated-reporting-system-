# LMAR — Digital Weighing Instrument Compliance Platform

A hackathon MVP that digitizes the lab workflow for testing weighing
instruments: **Login → Dashboard → Register Instrument → Run Tests →
Auto-calculate PASS/FAIL → Review → Generate Report → Search past
reports.**

No build tools, no npm install, no external database — just Node.js
and a browser. This was a deliberate choice so the demo can never break
on stage from a missing dependency or a flaky network.

---

## 1. How to run it

```bash
node backend/server.js
```

Then open **http://localhost:4000** in a browser.

Log in with **Demo Login** (one click) or manually with:
- `technician@metrilab.demo` / `demo123`
- `reviewer@metrilab.demo` / `demo123`

---

## 2. Project structure — who built what

This layout is intentionally split so a judge can open the folder and
immediately see which part of the stack each teammate owned, just from
the file tree:

```
LMAR/
├── backend/                     ← BACKEND DEVELOPER(S)
│   ├── server.js                   HTTP server, routing, REST API
│   ├── modules/
│   │   ├── calculations.js         Compliance rule engine (PASS/FAIL logic)
│   │   ├── db.js                   Data layer (JSON-file "database")
│   │   ├── auth.js                 Demo authentication / sessions
│   │   └── reports.js              Report assembly
│   └── data/db.json                Seed data + persisted records
│
├── frontend/                    ← FRONTEND DEVELOPER(S)
│   ├── index.html                  App shell / single entry point
│   ├── css/style.css                Design system (colors, type, components)
│   └── js/
│       ├── api.js                   API client — the ONLY file that calls fetch()
│       └── main.js                  Router, layout, and every page/screen
│
└── README.md                    ← This file (architecture + team notes)
```

**Suggested role mapping for your presentation:**

| Role | Owns | What to point at during judging |
|---|---|---|
| **Backend Developer** | `backend/` | `calculations.js` — show the deterministic MPE/PASS-FAIL rule engine (no AI, fully rule-based per the brief). `server.js` — show the REST routes. |
| **Frontend Developer** | `frontend/js/main.js`, `css/style.css` | The router (`route()` calls), the multi-step instrument wizard, and the test-entry tabs. |
| **UI/UX Designer** | `frontend/css/style.css` | The design-token block at the top of the file (colors, type, spacing) and how it's applied consistently across every screen. |
| **Data/Domain Lead** | `backend/modules/calculations.js` | The MPE table and the 4 test evaluators — this is the "domain knowledge" of the app. |
| **QA / Integration** | End-to-end flow | Walk the judges through Login → New Instrument → Run all 4 tests → Generate Report → Search it in Reports. |

Edit the table above with your actual teammates' names before presenting.

---

## 3. Architecture, in one paragraph

The **backend** (`backend/server.js`) is a plain Node.js HTTP server —
no Express, no npm install required. It exposes a small REST API
(`/api/...`) and also serves the frontend's static files, so the whole
app runs from a single `node` process. All compliance math lives in
`backend/modules/calculations.js`, kept separate from the HTTP layer so
it's easy to point judges at "this is the actual logic" without wading
through routing code. The **frontend** (`frontend/`) is a vanilla-JS
single-page app: `api.js` is the one file that talks to the backend,
and `main.js` contains a tiny hash router plus one render function per
screen. Data is stored in `backend/data/db.json`, a flat JSON file
acting as a zero-setup database — swapping it for Postgres/Mongo later
only means rewriting `backend/modules/db.js`.

---

## 4. Compliance rule engine (how PASS/FAIL is decided)

Every decision is a deterministic calculation — **no AI is used to
decide compliance**, per the brief. The engine computes a Maximum
Permissible Error (MPE) from the instrument's accuracy class and load,
using a simplified table structured like OIML R76:

- **Accuracy / Indication test** — error = indicated − reference, checked
  against MPE at each load point.
- **Eccentricity test** — deviation of each corner reading from the
  center reading, checked against MPE.
- **Repeatability test** — spread (max − min) across repeated readings
  at one load, checked against MPE.
- **Temperature test** — drift (max − min) across readings taken at
  different temperatures, checked against MPE.

> **Disclosure:** the MPE table is a simplified example for demo
> purposes. MetriLab is an independent prototype and does not claim to
> be an official OIML or government-certified tool.

---

## 5. Why these technical choices (good talking points for judges)

- **No external dependencies** → the demo can run offline, on any
  machine with Node installed, with zero setup risk.
- **PDF export via the browser's print dialog** (Report page →
  "Download / Print PDF") instead of a PDF library → one less thing
  that can break live, and it produces a clean, print-styled report.
- **Rule-based engine, not AI** → every PASS/FAIL is explainable and
  reproducible, which is what a real compliance lab needs.
- **Architecture built to extend** — adding a new test type means
  adding one function to `calculations.js` and one tab in `main.js`;
  the OIML R76 test catalog was intentionally not fully implemented in
  this MVP, per the brief.

---

## 6. Known scope limits (be upfront about these if asked)

- Authentication is demo-only (fixed accounts, no password hashing) —
  fine for a hackathon demo, not for production.
- The JSON-file "database" is not concurrency-safe for multiple
  simultaneous writers — fine for a single-laptop demo.
- The MPE/tolerance table is illustrative, not a certified standard.
