/**
 * main.js
 * -----------------------------------------------------------------------
 * FRONTEND — App shell, router, and page renderers
 * -----------------------------------------------------------------------
 */

/* ============================== 1. STATE ============================== */
const AppState = {
  user: null,
  get isAuthed() { return !!this.user; },
};

function restoreSession() {
  const raw = sessionStorage.getItem("lmar_user");
  if (raw) AppState.user = JSON.parse(raw);
}
function persistSession(user, token) {
  AppState.user = user;
  sessionStorage.setItem("lmar_user", JSON.stringify(user));
  sessionStorage.setItem("lmar_token", token);
}
function clearSession() {
  AppState.user = null;
  sessionStorage.removeItem("lmar_user");
  sessionStorage.removeItem("lmar_token");
}

/* ============================== 2. ICONS ============================== */
const Icon = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>`,
  instruments: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21h16"/><path d="M12 3v9"/><path d="M6 8l6-5 6 5"/><path d="M4 12l2-4h12l2 4"/><circle cx="8" cy="17" r="2.4"/><circle cx="16" cy="17" r="2.4"/></svg>`,
  newtest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>`,
  reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9.5 13h5M9.5 16.5h5"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="18" cy="8.5" r="2.4"/><path d="M16 14.3c2.4.3 4.2 2 5 5.7"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.7 7.7 0 000-2l2-1.5-2-3.4-2.4.6a7.7 7.7 0 00-1.7-1L14.8 3h-3.9l-.5 2.7a7.7 7.7 0 00-1.7 1l-2.4-.6-2 3.4L6.3 11a7.7 7.7 0 000 2l-2 1.6 2 3.4 2.4-.6a7.7 7.7 0 001.7 1l.5 2.6h3.9l.5-2.6a7.7 7.7 0 001.7-1l2.4.6 2-3.4z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 004 0"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
};

/* ============================== 3. HELPERS ============================== */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function statusBadge(status) {
  const map = {
    Passed: "badge-pass", PASS: "badge-pass",
    Failed: "badge-fail", FAIL: "badge-fail",
    "In Progress": "badge-inprogress",
    Draft: "badge-draft",
    Archived: "badge-archived",
    PENDING: "badge-draft",
  };
  return `<span class="badge ${map[status] || "badge-draft"}">${status}</span>`;
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(message, kind = "info") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = "position:fixed;bottom:22px;right:22px;z-index:999;padding:12px 18px;border-radius:8px;font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .2s;";
    document.body.appendChild(el);
  }
  el.style.background = kind === "error" ? "#B3261E" : "#0E7A61";
  el.style.color = "#fff";
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = "0"), 2600);
}

/* ============================== 4. ROUTER ============================== */
const routes = [];
function route(pattern, handler) {
  const paramNames = [];
  const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, (m) => { paramNames.push(m.slice(1)); return "([^/]+)"; }) + "$");
  routes.push({ regex, paramNames, handler });
}
async function renderRoute() {
  const hash = location.hash.slice(1) || "/login";
  const path = hash.split("?")[0];
  const queryStr = hash.split("?")[1] || "";
  const query = Object.fromEntries(new URLSearchParams(queryStr));

  if (path !== "/login" && !AppState.isAuthed) {
    location.hash = "#/login";
    return;
  }
  if (path === "/login" && AppState.isAuthed) {
    location.hash = "#/dashboard";
    return;
  }

  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.paramNames.forEach((name, i) => (params[name] = m[i + 1]));
      const app = document.getElementById("app");
      try {
        await r.handler(app, params, query);
      } catch (err) {
        console.error(err);
        app.innerHTML = `<div class="content"><div class="alert alert-error">Something went wrong: ${escapeHtml(err.message)}</div></div>`;
      }
      return;
    }
  }
  document.getElementById("app").innerHTML = `<div class="content"><div class="empty-state"><h3>Page not found</h3></div></div>`;
}
window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => { restoreSession(); renderRoute(); });

/* ============================== 5. LAYOUT ============================== */
const NAV_ITEMS = [
  { href: "#/dashboard", label: "Dashboard", icon: "dashboard", match: /^\/dashboard/ },
  { href: "#/instruments", label: "Instruments", icon: "instruments", match: /^\/instruments$/ },
  { href: "#/instruments/new", label: "New Test", icon: "newtest", match: /^\/instruments\/new|\/tests$/ },
  { href: "#/reports", label: "Reports", icon: "reports", match: /^\/reports/ },
  { href: "#/users", label: "Users", icon: "users", match: /^\/users/ },
  { href: "#/settings", label: "Settings", icon: "settings", match: /^\/settings/ },
];

function layout({ title, crumb, actions = "" }, bodyHtml) {
  const path = location.hash.slice(1).split("?")[0];
  const navHtml = NAV_ITEMS.map((item) => `
    <a class="nav-item ${item.match.test(path) ? "active" : ""}" href="${item.href}">
      ${Icon[item.icon]}<span>${item.label}</span>
    </a>`).join("");

  return `
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark" style="background-color: #0E7A61;">LM</div>
        <div>
          <div class="brand-name">LMAR</div>
          <div class="brand-sub">Compliance Platform</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      
      <!-- New Logout Sidebar Foot -->
      <div class="sidebar-foot" style="flex-direction: column; align-items: flex-start; padding: 20px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <div class="avatar" style="width: 30px; height: 30px; font-size: 14px;"><i class="fas fa-user"></i></div>
          <div class="who">
            <div class="name" style="color: #fff; font-size: 14px; font-weight: 500;">admin</div>
          </div>
        </div>
        <button class="logout-btn-red" id="triggerLogout">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="flex" style="align-items:center;gap:14px;">
          <button class="icon-btn menu-toggle" id="menuToggle">${Icon.menu}</button>
          <div class="topbar-title">
            ${crumb ? `<div class="crumb">${crumb}</div>` : ""}
            <h1>${title}</h1>
          </div>
        </div>
        <div class="topbar-actions">
          ${actions}
          <button class="icon-btn" title="Notifications">${Icon.bell}</button>
        </div>
      </header>
      <main class="content">${bodyHtml}</main>
    </div>

    <!-- The Logout Confirmation Modal -->
    <div class="modal-overlay" id="logoutModal">
      <div class="logout-modal">
        <div class="icon-circle"><i class="fas fa-sign-out-alt"></i></div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to logout from LMAR?</p>
        <div class="modal-actions">
          <button class="btn-cancel" id="cancelLogout">Cancel</button>
          <button class="btn-confirm-logout" id="confirmLogoutBtn">Logout</button>
        </div>
      </div>
    </div>
  </div>`;
}

function mountLayoutEvents() {
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });

  // Logout Modal Logic
  const modal = document.getElementById("logoutModal");
  document.getElementById("triggerLogout")?.addEventListener("click", () => {
    modal?.classList.add("active");
  });
  document.getElementById("cancelLogout")?.addEventListener("click", () => {
    modal?.classList.remove("active");
  });
  document.getElementById("confirmLogoutBtn")?.addEventListener("click", () => {
    clearSession();
    location.hash = "#/login";
  });
}

/* ============================== 6. PAGES ============================== */

/* ---------- LOGIN ---------- */
route("/login", async (app) => {
  app.innerHTML = `
  <div class="login-body">
      <div class="login-container">
          <div class="login-sidebar">
              <div class="login-logo">
                  <h2><i class="fas fa-balance-scale"></i> LMAR</h2>
                  <p>Weighing Instrument Testing & Calibration</p>
              </div>
              
              <div class="login-features">
                  <h1>Accurate Measurements.<br>Reliable Results.</h1>
                  <ul>
                      <li>
                          <i class="fas fa-check-circle"></i>
                          <div>
                              <strong>Precision Testing</strong>
                              <p>Ensure accurate performance</p>
                          </div>
                      </li>
                      <li>
                          <i class="fas fa-file-alt"></i>
                          <div>
                              <strong>Comprehensive Reports</strong>
                              <p>Generate detailed test reports</p>
                          </div>
                      </li>
                      <li>
                          <i class="fas fa-shield-alt"></i>
                          <div>
                              <strong>Easy & Secure Access</strong>
                              <p>Login to continue</p>
                          </div>
                      </li>
                  </ul>
              </div>
          </div>

          <div class="login-form-container">
              <div class="login-header">
                  <h2>Welcome Back</h2>
                  <p>Please login to your LMAR account</p>
              </div>
              
              <form id="loginForm">
                  <div class="form-group field">
                      <label><i class="fas fa-user"></i> Username</label>
                      <input type="text" id="username" placeholder="admin" required>
                  </div>
                  
                  <div class="form-group field">
                      <label><i class="fas fa-lock"></i> Password</label>
                      <input type="password" id="password" placeholder="••••••••" required>
                  </div>
                  
                  <div id="loginError"></div>

                  <div class="form-options">
                      <label><input type="checkbox"> Remember me</label>
                      <a href="#" class="forgot-pwd">Forgot password?</a>
                  </div>
                  
                  <button type="submit" class="btn-login btn-primary" id="loginSubmit">
                      <i class="fas fa-sign-in-alt"></i> Login
                  </button>
                  <p class="copyright">© 2026 LMAR. All rights reserved.</p>
              </form>
          </div>
      </div>
  </div>`;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await doLogin(document.getElementById("username").value, document.getElementById("password").value);
  });

  async function doLogin(username, password) {
    const errBox = document.getElementById("loginError");
    const btn = document.getElementById("loginSubmit");
    errBox.innerHTML = "";
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Logging in…`;
    try {
      const { token, user } = await Api.login(username, password);
      persistSession(user, token);
      location.hash = "#/dashboard";
    } catch (err) {
      errBox.innerHTML = `<div class="field"><div class="error-text">${escapeHtml(err.message)}</div></div>`;
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
    }
  }
});

/* ---------- DASHBOARD ---------- */
route("/dashboard", async (app) => {
  app.innerHTML = layout({ title: "Dashboard" }, `<div class="empty-state">Loading dashboard…</div>`);
  mountLayoutEvents();

  const summary = await Api.dashboardSummary();

  const body = `
    <div class="page-head">
      <div>
        <h2>Laboratory activity</h2>
        <div class="sub">Live overview of instruments, tests, and compliance outcomes.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/reports">View Reports</a>
        <a class="btn btn-primary" href="#/instruments/new">${Icon.plus} New Compliance Test</a>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Total Instruments</div><div class="kpi-value">${summary.totalInstruments}</div></div>
      <div class="kpi-card progress"><div class="kpi-label">Tests In Progress</div><div class="kpi-value">${summary.testsInProgress}</div></div>
      <div class="kpi-card accent"><div class="kpi-label">Passed</div><div class="kpi-value">${summary.passed}</div></div>
      <div class="kpi-card fail"><div class="kpi-label">Failed</div><div class="kpi-value">${summary.failed}</div></div>
    </div>

    <div class="section-title">Recent Tests</div>
    <div class="table-wrap">
      ${summary.recent.length === 0 ? `
        <div class="table-empty">No tests recorded yet. Start by registering an instrument and running its first test.</div>
      ` : `
      <table class="data-table">
        <thead><tr><th>Instrument</th><th>Manufacturer</th><th>Test Type</th><th>Date</th><th>Status</th><th>Technician</th><th></th></tr></thead>
        <tbody>
          ${summary.recent.map((r) => `
            <tr>
              <td class="cell-strong">${escapeHtml(r.instrument)}</td>
              <td class="cell-muted">${escapeHtml(r.manufacturer)}</td>
              <td style="text-transform:capitalize;">${escapeHtml(r.testType)}</td>
              <td class="cell-muted">${fmtDate(r.date)}</td>
              <td>${statusBadge(r.status)}</td>
              <td class="cell-muted">${escapeHtml(r.technician)}</td>
              <td><a class="link-btn" href="#/instruments/${r.instrumentId}/tests">Open</a></td>
            </tr>`).join("")}
        </tbody>
      </table>`}
    </div>
  `;
  app.innerHTML = layout({ title: "Dashboard" }, body);
  mountLayoutEvents();
});

/* ---------- INSTRUMENTS LIST ---------- */
route("/instruments", async (app) => {
  app.innerHTML = layout({ title: "Instruments" }, `<div class="empty-state">Loading instruments…</div>`);
  mountLayoutEvents();

  const { instruments } = await Api.listInstruments();

  const rows = instruments.map((i) => `
    <tr>
      <td class="cell-strong">${escapeHtml(i.manufacturer)} ${escapeHtml(i.model)}</td>
      <td class="cell-muted mono">${escapeHtml(i.serialNumber)}</td>
      <td class="cell-muted">${escapeHtml(i.instrumentType)}</td>
      <td>Class ${escapeHtml(i.accuracyClass)}</td>
      <td class="cell-muted">${i.maxCapacity} ${escapeHtml(i.unit)} (e=${i.verificationScaleInterval})</td>
      <td>${statusBadge(i.status)}</td>
      <td><a class="link-btn" href="#/instruments/${i.id}/tests">Perform Tests</a></td>
    </tr>`).join("");

  const body = `
    <div class="page-head">
      <div>
        <h2>Registered Instruments</h2>
        <div class="sub">All weighing instruments submitted for compliance testing.</div>
      </div>
      <div class="page-actions">
        <a class="btn btn-primary" href="#/instruments/new">${Icon.plus} New Compliance Test</a>
      </div>
    </div>
    <div class="table-wrap">
      ${instruments.length === 0 ? `
        <div class="empty-state">
          <h3>No instruments yet</h3>
          <p>Register your first weighing instrument to begin compliance testing.</p>
          <a class="btn btn-primary" href="#/instruments/new">${Icon.plus} New Compliance Test</a>
        </div>` : `
      <table class="data-table">
        <thead><tr><th>Instrument</th><th>Serial No.</th><th>Type</th><th>Accuracy Class</th><th>Capacity</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>
  `;
  app.innerHTML = layout({ title: "Instruments" }, body);
  mountLayoutEvents();
});

/* ---------- NEW INSTRUMENT (3-STEP WIZARD) ---------- */
route("/instruments/new", async (app) => {
  const state = {
    step: 1,
    data: {
      manufacturer: "", model: "", serialNumber: "", instrumentType: "Electronic Platform Scale",
      accuracyClass: "III", maxCapacity: "", verificationScaleInterval: "", unit: "g",
      temperature: "", humidity: "", pressure: "", powerSupply: "AC Mains",
    },
  };
  renderWizard();

  function stepperHtml() {
    const labels = ["Instrument Information", "Environmental Conditions", "Review & Create"];
    return `<div class="stepper">${labels.map((label, idx) => {
      const n = idx + 1;
      const cls = n < state.step ? "done" : n === state.step ? "active" : "";
      return `<div class="step ${cls}"><div class="step-dot">${n < state.step ? "✓" : n}</div><div class="step-label">${label}</div></div>${idx < 2 ? '<div class="step-line"></div>' : ""}`;
    }).join("")}</div>`;
  }

  function stepOneHtml() {
    const d = state.data;
    return `
    <div class="form-grid">
      <div class="field"><label>Manufacturer *</label><input id="f_manufacturer" value="${escapeHtml(d.manufacturer)}" placeholder="e.g. Mettler Cross" /></div>
      <div class="field"><label>Model *</label><input id="f_model" value="${escapeHtml(d.model)}" placeholder="e.g. MC-3000" /></div>
      <div class="field"><label>Serial Number *</label><input id="f_serialNumber" value="${escapeHtml(d.serialNumber)}" placeholder="e.g. SN-88213" /></div>
      <div class="field"><label>Instrument Type *</label>
        <select id="f_instrumentType">
          ${["Electronic Platform Scale", "Bench Scale", "Floor Scale", "Precision Balance", "Crane Scale"].map((t) => `<option ${d.instrumentType === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </div>
      <div class="field"><label>Accuracy Class *</label>
        <select id="f_accuracyClass">
          ${["I", "II", "III", "IIII"].map((c) => `<option value="${c}" ${d.accuracyClass === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>
      <div class="field"><label>Unit *</label>
        <select id="f_unit">${["g", "kg", "mg", "lb"].map((u) => `<option ${d.unit === u ? "selected" : ""}>${u}</option>`).join("")}</select>
      </div>
      <div class="field"><label>Maximum Capacity *</label><input id="f_maxCapacity" type="number" min="0" step="any" value="${d.maxCapacity}" placeholder="e.g. 3000" /></div>
      <div class="field"><label>Verification Scale Interval (e) *</label><input id="f_verificationScaleInterval" type="number" min="0" step="any" value="${d.verificationScaleInterval}" placeholder="e.g. 1" /></div>
    </div>`;
  }

  function stepTwoHtml() {
    const d = state.data;
    return `
    <div class="form-grid">
      <div class="field"><label>Ambient Temperature (°C)</label><input id="f_temperature" type="number" step="any" value="${d.temperature}" placeholder="e.g. 24" /></div>
      <div class="field"><label>Relative Humidity (%)</label><input id="f_humidity" type="number" step="any" value="${d.humidity}" placeholder="e.g. 45" /></div>
      <div class="field"><label>Atmospheric Pressure (hPa)</label><input id="f_pressure" type="number" step="any" value="${d.pressure}" placeholder="e.g. 1012" /></div>
      <div class="field"><label>Power Supply</label>
        <select id="f_powerSupply">${["AC Mains", "Battery", "Solar", "UPS Backup"].map((p) => `<option ${d.powerSupply === p ? "selected" : ""}>${p}</option>`).join("")}</select>
      </div>
    </div>`;
  }

  function stepThreeHtml() {
    const d = state.data;
    const rows = [
      ["Manufacturer", d.manufacturer], ["Model", d.model], ["Serial Number", d.serialNumber],
      ["Instrument Type", d.instrumentType], ["Accuracy Class", d.accuracyClass],
      ["Max Capacity", `${d.maxCapacity} ${d.unit}`], ["Scale Interval (e)", `${d.verificationScaleInterval} ${d.unit}`],
      ["Temperature", d.temperature ? `${d.temperature} °C` : "—"], ["Humidity", d.humidity ? `${d.humidity} %` : "—"],
      ["Pressure", d.pressure ? `${d.pressure} hPa` : "—"], ["Power Supply", d.powerSupply],
    ];
    return `<div class="review-grid">${rows.map(([k, v]) => `<div class="review-row"><span class="k">${k}</span><span class="v">${escapeHtml(String(v))}</span></div>`).join("")}</div>`;
  }

  function validateStep(step) {
    const d = state.data;
    if (step === 1) {
      if (!d.manufacturer || !d.model || !d.serialNumber) return "Manufacturer, model, and serial number are required.";
      if (!d.maxCapacity || Number(d.maxCapacity) <= 0) return "Maximum capacity must be a positive number.";
      if (!d.verificationScaleInterval || Number(d.verificationScaleInterval) <= 0) return "Verification scale interval must be a positive number.";
    }
    return null;
  }

  function collectStepOne() {
    state.data.manufacturer = document.getElementById("f_manufacturer").value.trim();
    state.data.model = document.getElementById("f_model").value.trim();
    state.data.serialNumber = document.getElementById("f_serialNumber").value.trim();
    state.data.instrumentType = document.getElementById("f_instrumentType").value;
    state.data.accuracyClass = document.getElementById("f_accuracyClass").value;
    state.data.unit = document.getElementById("f_unit").value;
    state.data.maxCapacity = document.getElementById("f_maxCapacity").value;
    state.data.verificationScaleInterval = document.getElementById("f_verificationScaleInterval").value;
  }
  function collectStepTwo() {
    state.data.temperature = document.getElementById("f_temperature").value;
    state.data.humidity = document.getElementById("f_humidity").value;
    state.data.pressure = document.getElementById("f_pressure").value;
    state.data.powerSupply = document.getElementById("f_powerSupply").value;
  }

  function renderWizard() {
    const stepBody = state.step === 1 ? stepOneHtml() : state.step === 2 ? stepTwoHtml() : stepThreeHtml();
    const body = `
      <div class="page-head">
        <div><h2>New Compliance Test</h2><div class="sub">Register an instrument before running OIML-style compliance tests.</div></div>
      </div>
      <div class="card card-pad">
        ${stepperHtml()}
        <div id="wizardError"></div>
        <div id="wizardBody">${stepBody}</div>
        <div class="form-actions">
          <button class="btn btn-secondary" id="backBtn" ${state.step === 1 ? "style='visibility:hidden'" : ""}>Back</button>
          <button class="btn btn-primary" id="nextBtn">${state.step === 3 ? "Create Instrument & Start Testing" : "Continue"}</button>
        </div>
      </div>`;
    app.innerHTML = layout({ title: "New Compliance Test", crumb: "Instruments" }, body);
    mountLayoutEvents();

    document.getElementById("backBtn")?.addEventListener("click", () => {
      if (state.step === 1) return;
      if (state.step === 2) collectStepTwo();
      state.step -= 1;
      renderWizard();
    });
    document.getElementById("nextBtn").addEventListener("click", async () => {
      if (state.step === 1) {
        collectStepOne();
        const err = validateStep(1);
        if (err) return showWizardError(err);
        state.step = 2;
        return renderWizard();
      }
      if (state.step === 2) {
        collectStepTwo();
        state.step = 3;
        return renderWizard();
      }
      // step 3: submit
      const btn = document.getElementById("nextBtn");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Creating…`;
      try {
        const { instrument } = await Api.createInstrument({ ...state.data, createdBy: AppState.user?.name });
        toast(`Instrument ${instrument.manufacturer} ${instrument.model} registered.`);
        location.hash = `#/instruments/${instrument.id}/tests`;
      } catch (err) {
        showWizardError(err.message);
        btn.disabled = false;
        btn.innerHTML = "Create Instrument & Start Testing";
      }
    });
  }

  function showWizardError(msg) {
    document.getElementById("wizardError").innerHTML = `<div class="alert alert-error">${escapeHtml(msg)}</div>`;
  }
});

/* ---------- TEST WORKFLOW ---------- */
route("/instruments/:id/tests", async (app, params) => {
  const instrumentId = Number(params.id);
  let instrument, tests;
  try {
    ({ instrument, tests } = await Api.getInstrument(instrumentId));
  } catch (err) {
    app.innerHTML = layout({ title: "Not found" }, `<div class="alert alert-error">${escapeHtml(err.message)}</div>`);
    mountLayoutEvents();
    return;
  }

  const TEST_TYPES = [
    { key: "accuracy", label: "Accuracy / Indication" },
    { key: "eccentricity", label: "Eccentricity" },
    { key: "repeatability", label: "Repeatability" },
    { key: "temperature", label: "Temperature" },
  ];
  const state = { tab: "accuracy", rows: {} };
  resetRows("accuracy");

  function latestResultFor(type) {
    const matches = tests.filter((t) => t.testType === type);
    return matches.length ? matches[matches.length - 1] : null;
  }

  function resetRows(type) {
    const suggestedLoads = [0.25, 0.5, 0.9].map((f) => Math.round(instrument.maxCapacity * f));
    if (type === "accuracy") {
      state.rows.accuracy = suggestedLoads.map((ref) => ({ reference: ref, indicated: "" }));
    } else if (type === "eccentricity") {
      state.rows.eccentricity = {
        load: suggestedLoads[1], centerReading: "",
        corners: ["Front-Left", "Front-Right", "Back-Left", "Back-Right"].map((label) => ({ label, indicated: "" })),
      };
    } else if (type === "repeatability") {
      state.rows.repeatability = { load: suggestedLoads[1], repeats: [1, 2, 3].map(() => ({ indicated: "" })) };
    } else if (type === "temperature") {
      state.rows.temperature = { load: suggestedLoads[1], samples: ["Low (10°C)", "Ambient (23°C)", "High (35°C)"].map((label) => ({ label, indicated: "" })) };
    }
  }

  function tabTickHtml(type) {
    const result = latestResultFor(type);
    if (!result) return "";
    return result.result === "PASS" ? `<span class="tick">${Icon.check}</span>` : `<span class="cross">✕</span>`;
  }

  function instrumentSummaryHtml() {
    return `
    <div class="card card-pad" style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
      <div>
        <div style="font-weight:700;font-size:15px;">${escapeHtml(instrument.manufacturer)} ${escapeHtml(instrument.model)}</div>
        <div class="text-muted" style="font-size:12.5px;margin-top:3px;">
          S/N ${escapeHtml(instrument.serialNumber)} · Class ${escapeHtml(instrument.accuracyClass)} ·
          Capacity ${instrument.maxCapacity}${escapeHtml(instrument.unit)} · e=${instrument.verificationScaleInterval}${escapeHtml(instrument.unit)}
        </div>
      </div>
      <div class="flex gap-8" style="align-items:center;">
        ${statusBadge(instrument.status)}
        <button class="btn btn-primary" id="genReportBtn" ${tests.length === 0 ? "disabled" : ""}>Generate Report</button>
      </div>
    </div>`;
  }

  function accuracyFormHtml() {
    const rows = state.rows.accuracy;
    return `
    <div class="reading-row head"><div>Load #</div><div>Reference Value (${instrument.unit})</div><div>Indicated Value (${instrument.unit})</div><div></div><div></div><div></div></div>
    ${rows.map((r, i) => `
      <div class="reading-row" data-row="${i}">
        <div>Load ${i + 1}</div>
        <input type="number" step="any" class="acc-ref" value="${r.reference}" />
        <input type="number" step="any" class="acc-ind" value="${r.indicated}" placeholder="Enter reading" />
        <div></div><div></div>
        <button class="btn-ghost" style="color:var(--fail-700);font-size:12px;" data-remove="${i}">Remove</button>
      </div>`).join("")}
    <button class="mini-btn" id="addAccRow">+ Add load point</button>
    <div class="form-actions" style="border-top:none;margin-top:16px;padding-top:0;justify-content:flex-end;">
      <button class="btn btn-primary" id="runAccuracy">Run Accuracy Test</button>
    </div>`;
  }

  function eccentricityFormHtml() {
    const d = state.rows.eccentricity;
    return `
    <div class="form-grid" style="margin-bottom:16px;">
      <div class="field"><label>Test Load (${instrument.unit})</label><input id="ecc-load" type="number" step="any" value="${d.load}" /></div>
      <div class="field"><label>Center Reading (${instrument.unit})</label><input id="ecc-center" type="number" step="any" value="${d.centerReading}" placeholder="Reading with load at center" /></div>
    </div>
    <div class="section-title">Corner Readings</div>
    ${d.corners.map((c, i) => `
      <div class="reading-row" style="grid-template-columns:140px 1fr;">
        <div>${c.label}</div>
        <input type="number" step="any" class="ecc-corner" data-i="${i}" value="${c.indicated}" placeholder="Indicated value" />
      </div>`).join("")}
    <div class="form-actions" style="border-top:none;margin-top:16px;padding-top:0;justify-content:flex-end;">
      <button class="btn btn-primary" id="runEccentricity">Run Eccentricity Test</button>
    </div>`;
  }

  function repeatabilityFormHtml() {
    const d = state.rows.repeatability;
    return `
    <div class="form-grid" style="margin-bottom:16px;">
      <div class="field"><label>Test Load (${instrument.unit})</label><input id="rep-load" type="number" step="any" value="${d.load}" /></div>
    </div>
    <div class="section-title">Repeated Readings at Same Load</div>
    ${d.repeats.map((r, i) => `
      <div class="reading-row" style="grid-template-columns:140px 1fr;">
        <div>Trial ${i + 1}</div>
        <input type="number" step="any" class="rep-val" data-i="${i}" value="${r.indicated}" placeholder="Indicated value" />
      </div>`).join("")}
    <button class="mini-btn" id="addRepRow">+ Add trial</button>
    <div class="form-actions" style="border-top:none;margin-top:16px;padding-top:0;justify-content:flex-end;">
      <button class="btn btn-primary" id="runRepeatability">Run Repeatability Test</button>
    </div>`;
  }

  function temperatureFormHtml() {
    const d = state.rows.temperature;
    return `
    <div class="form-grid" style="margin-bottom:16px;">
      <div class="field"><label>Test Load (${instrument.unit})</label><input id="tmp-load" type="number" step="any" value="${d.load}" /></div>
    </div>
    <div class="section-title">Readings Across Temperature Conditions</div>
    ${d.samples.map((s, i) => `
      <div class="reading-row" style="grid-template-columns:180px 1fr;">
        <div>${s.label}</div>
        <input type="number" step="any" class="tmp-val" data-i="${i}" value="${s.indicated}" placeholder="Indicated value" />
      </div>`).join("")}
    <div class="form-actions" style="border-top:none;margin-top:16px;padding-top:0;justify-content:flex-end;">
      <button class="btn btn-primary" id="runTemperature">Run Temperature Test</button>
    </div>`;
  }

  function resultBannerHtml(type) {
    const result = latestResultFor(type);
    if (!result) return "";
    const ev = result.evaluation;
    let detail = "";
    if (type === "accuracy") {
      detail = `<table class="mini-table" style="margin-top:10px;width:100%;"><thead><tr><th>Reference</th><th>Indicated</th><th>Error</th><th>MPE</th><th>Result</th></tr></thead>
        <tbody>${ev.rows.map((r) => `<tr><td>${r.reference}</td><td>${r.indicated}</td><td>${r.error}</td><td>±${r.mpe}</td><td>${r.pass ? "Pass" : "Fail"}</td></tr>`).join("")}</tbody></table>`;
    } else if (type === "eccentricity") {
      detail = `<div class="text-muted" style="margin-top:8px;font-size:12.5px;">Max deviation ${ev.maxDeviation} ${instrument.unit} against ±${ev.mpe} ${instrument.unit} MPE.</div>`;
    } else if (type === "repeatability") {
      detail = `<div class="text-muted" style="margin-top:8px;font-size:12.5px;">Spread ${ev.range} ${instrument.unit} against ±${ev.mpe} ${instrument.unit} MPE.</div>`;
    } else if (type === "temperature") {
      detail = `<div class="text-muted" style="margin-top:8px;font-size:12.5px;">Drift ${ev.drift} ${instrument.unit} against ±${ev.mpe} ${instrument.unit} MPE.</div>`;
    }
    return `<div class="result-banner ${result.result === "PASS" ? "pass" : "fail"}">${result.result === "PASS" ? "PASS — within tolerance" : "FAIL — exceeds tolerance"}</div>${detail}`;
  }

  function tabBodyHtml() {
    if (state.tab === "accuracy") return accuracyFormHtml() + resultBannerHtml("accuracy");
    if (state.tab === "eccentricity") return eccentricityFormHtml() + resultBannerHtml("eccentricity");
    if (state.tab === "repeatability") return repeatabilityFormHtml() + resultBannerHtml("repeatability");
    return temperatureFormHtml() + resultBannerHtml("temperature");
  }

  function render() {
    const tabsHtml = TEST_TYPES.map((t) => `
      <button type="button" class="test-tab ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}" aria-selected="${state.tab === t.key}">${t.label} ${tabTickHtml(t.key)}</button>
    `).join("");

    const body = `
      ${instrumentSummaryHtml()}
      <div class="card card-pad">
        <div class="test-tabs">${tabsHtml}</div>
        <div id="testError"></div>
        <div id="tabBody">${tabBodyHtml()}</div>
      </div>`;
    app.innerHTML = layout({ title: "Perform Tests", crumb: "Instruments" }, body);
    mountLayoutEvents();
    bindEvents();
  }

  function showError(msg) {
    document.getElementById("testError").innerHTML = `<div class="alert alert-error">${escapeHtml(msg)}</div>`;
  }

  async function submitTest(payload) {
    document.getElementById("testError").innerHTML = "";
    try {
      const res = await Api.submitTest(instrumentId, { ...payload, performedBy: AppState.user?.name });
      tests.push(res.test);
      instrument.status = res.instrumentStatus;
      toast(`${payload.testType[0].toUpperCase() + payload.testType.slice(1)} test recorded: ${res.test.result}`, res.test.result === "PASS" ? "info" : "error");
      render();
    } catch (err) {
      showError(err.message);
    }
  }

  function bindEvents() {
    document.querySelectorAll(".test-tab").forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        const tab = el.getAttribute("data-tab");
        if (!tab || state.tab === tab) return;
        state.tab = tab;
        if (!state.rows[tab]) resetRows(tab);
        render();
      });
    });
    document.getElementById("genReportBtn")?.addEventListener("click", async () => {
      const btn = document.getElementById("genReportBtn");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Generating…`;
      try {
        const { report } = await Api.createReport({ instrumentId, generatedBy: AppState.user?.name });
        location.hash = `#/reports/${report.id}`;
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
        btn.innerHTML = "Generate Report";
      }
    });

    if (state.tab === "accuracy") {
      document.getElementById("addAccRow")?.addEventListener("click", () => {
        state.rows.accuracy.push({ reference: "", indicated: "" });
        render();
      });
      document.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.rows.accuracy.splice(Number(btn.dataset.remove), 1);
          render();
        });
      });
      document.getElementById("runAccuracy")?.addEventListener("click", () => {
        const refs = [...document.querySelectorAll(".acc-ref")].map((i) => i.value);
        const inds = [...document.querySelectorAll(".acc-ind")].map((i) => i.value);
        if (inds.some((v) => v === "") || refs.some((v) => v === "")) return showError("Every load point needs both a reference and an indicated value.");
        const readings = refs.map((ref, i) => ({ reference: Number(ref), indicated: Number(inds[i]) }));
        submitTest({ testType: "accuracy", readings });
      });
    }

    if (state.tab === "eccentricity") {
      document.getElementById("runEccentricity")?.addEventListener("click", () => {
        const load = document.getElementById("ecc-load").value;
        const center = document.getElementById("ecc-center").value;
        const cornerInputs = [...document.querySelectorAll(".ecc-corner")];
        if (!load || center === "" || cornerInputs.some((c) => c.value === "")) return showError("Fill in the test load, center reading, and all four corner readings.");
        const cornerReadings = cornerInputs.map((c, i) => ({ label: state.rows.eccentricity.corners[i].label, indicated: Number(c.value) }));
        submitTest({ testType: "eccentricity", load: Number(load), centerReading: Number(center), cornerReadings });
      });
    }

    if (state.tab === "repeatability") {
      document.getElementById("addRepRow")?.addEventListener("click", () => {
        state.rows.repeatability.repeats.push({ indicated: "" });
        render();
      });
      document.getElementById("runRepeatability")?.addEventListener("click", () => {
        const load = document.getElementById("rep-load").value;
        const vals = [...document.querySelectorAll(".rep-val")].map((i) => i.value);
        if (!load || vals.some((v) => v === "")) return showError("Fill in the test load and every trial reading.");
        submitTest({ testType: "repeatability", load: Number(load), repeats: vals.map((v) => ({ indicated: Number(v) })) });
      });
    }

    if (state.tab === "temperature") {
      document.getElementById("runTemperature")?.addEventListener("click", () => {
        const load = document.getElementById("tmp-load").value;
        const vals = [...document.querySelectorAll(".tmp-val")].map((i) => i.value);
        if (!load || vals.some((v) => v === "")) return showError("Fill in the test load and every temperature reading.");
        submitTest({ testType: "temperature", load: Number(load), samples: vals.map((v) => ({ indicated: Number(v) })) });
      });
    }
  }

  render();
});

/* ---------- REPORTS LIST (search + filter) ---------- */
route("/reports", async (app) => {
  const state = { q: "", status: "" };

  async function render() {
    const { reports } = await Api.listReports({ q: state.q, status: state.status });
    const body = `
      <div class="page-head">
        <div><h2>Report Repository</h2><div class="sub">Every compliance report generated, searchable by instrument or report number.</div></div>
      </div>
      <div class="table-wrap">
        <div class="table-toolbar">
          <input class="search-input" id="searchInput" placeholder="Search by report number, manufacturer, model, or serial…" value="${escapeHtml(state.q)}" />
          <select class="filter-select" id="statusFilter">
            <option value="">All results</option>
            <option value="PASS" ${state.status === "PASS" ? "selected" : ""}>Pass</option>
            <option value="FAIL" ${state.status === "FAIL" ? "selected" : ""}>Fail</option>
          </select>
        </div>
        ${reports.length === 0 ? `<div class="table-empty">No reports match your search yet.</div>` : `
        <table class="data-table">
          <thead><tr><th>Report #</th><th>Instrument</th><th>Serial No.</th><th>Generated</th><th>Generated By</th><th>Result</th><th></th></tr></thead>
          <tbody>
            ${reports.map((r) => `
              <tr>
                <td class="cell-strong mono">${r.reportNumber}</td>
                <td>${escapeHtml(r.instrument.manufacturer)} ${escapeHtml(r.instrument.model)}</td>
                <td class="cell-muted mono">${escapeHtml(r.instrument.serialNumber)}</td>
                <td class="cell-muted">${fmtDate(r.generatedAt)}</td>
                <td class="cell-muted">${escapeHtml(r.generatedBy)}</td>
                <td>${statusBadge(r.overallResult)}</td>
                <td><a class="link-btn" href="#/reports/${r.id}">View</a></td>
              </tr>`).join("")}
          </tbody>
        </table>`}
      </div>`;
    app.innerHTML = layout({ title: "Reports" }, body);
    mountLayoutEvents();

    let debounce;
    document.getElementById("searchInput").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { state.q = e.target.value; render(); }, 250);
    });
    document.getElementById("statusFilter").addEventListener("change", (e) => {
      state.status = e.target.value;
      render();
    });
  }
  await render();
});

/* ---------- SINGLE REPORT (printable / PDF export) ---------- */
route("/reports/:id", async (app, params) => {
  const { report } = await Api.getReport(Number(params.id));
  const i = report.instrument;

  function testRowsHtml() {
    return report.tests.map((t) => `
      <tr>
        <td style="text-transform:capitalize;">${t.testType}</td>
        <td>${fmtDate(t.performedAt)}</td>
        <td>${t.performedBy}</td>
        <td>${statusBadge(t.result)}</td>
      </tr>`).join("");
  }

  const body = `
    <div class="page-head no-print">
      <div><h2>Compliance Report</h2><div class="sub">${report.reportNumber}</div></div>
      <div class="page-actions">
        <a class="btn btn-secondary" href="#/reports">Back to Reports</a>
        <button class="btn btn-primary" id="printBtn">Download / Print PDF</button>
      </div>
    </div>

    <div class="report-doc">
      <div class="report-head">
        <div>
          <div class="report-title">LMAR Compliance Report</div>
          <div class="report-num">${report.reportNumber}</div>
        </div>
        <div class="report-verdict">
          ${statusBadge(report.overallResult).replace('class="badge', 'class="badge big-badge')}
          <div class="text-muted" style="font-size:11.5px;margin-top:6px;">Generated ${fmtDate(report.generatedAt)}</div>
        </div>
      </div>

      <div class="report-section">
        <h4>Instrument Under Test</h4>
        <table class="mini-table" style="width:100%;">
          <tr><th>Manufacturer</th><td>${escapeHtml(i.manufacturer)}</td><th>Model</th><td>${escapeHtml(i.model)}</td></tr>
          <tr><th>Serial Number</th><td>${escapeHtml(i.serialNumber)}</td><th>Instrument Type</th><td>${escapeHtml(i.instrumentType)}</td></tr>
          <tr><th>Accuracy Class</th><td>${escapeHtml(i.accuracyClass)}</td><th>Max Capacity</th><td>${i.maxCapacity} ${escapeHtml(i.unit)}</td></tr>
          <tr><th>Scale Interval (e)</th><td>${i.verificationScaleInterval} ${escapeHtml(i.unit)}</td><th>Power Supply</th><td>${escapeHtml(i.powerSupply || "—")}</td></tr>
        </table>
      </div>

      <div class="report-section">
        <h4>Environmental Conditions</h4>
        <table class="mini-table" style="width:100%;">
          <tr><th>Temperature</th><td>${i.temperature ?? "—"} °C</td><th>Humidity</th><td>${i.humidity ?? "—"} %</td><th>Pressure</th><td>${i.pressure ?? "—"} hPa</td></tr>
        </table>
      </div>

      <div class="report-section">
        <h4>Tests Performed</h4>
        <table class="mini-table" style="width:100%;">
          <thead><tr><th>Test</th><th>Performed At</th><th>Technician</th><th>Result</th></tr></thead>
          <tbody>${testRowsHtml()}</tbody>
        </table>
      </div>

      <div class="report-section">
        <h4>Overall Compliance Determination</h4>
        <p style="font-size:13.5px;">
          Based on ${report.tests.length} test(s) performed under the conditions above, this instrument is determined to
          <strong>${report.overallResult === "PASS" ? "COMPLY" : "NOT COMPLY"}</strong> with the configured tolerance thresholds
          for Accuracy Class ${escapeHtml(i.accuracyClass)}.
        </p>
      </div>

      <div class="report-section" style="margin-bottom:0;">
        <h4>Sign-off</h4>
        <table class="mini-table" style="width:100%;">
          <tr><th>Reviewed & Generated By</th><td>${escapeHtml(report.generatedBy)}</td><th>Date</th><td>${fmtDate(report.generatedAt)}</td></tr>
        </table>
      </div>
    </div>
  `;
  app.innerHTML = layout({ title: "Report Preview", crumb: "Reports" }, body);
  mountLayoutEvents();
  document.getElementById("printBtn").addEventListener("click", () => window.print());
});

/* ---------- USERS ---------- */
route("/users", async (app) => {
  const { users } = await Api.demoUsers(); // API now only returns the sole admin user
  const body = `
    <div class="page-head"><div><h2>Users</h2><div class="sub">Currently active user credentials for testing.</div></div></div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Username</th><th>Role</th></tr></thead>
        <tbody>${users.map((u) => `<tr><td class="cell-strong">${escapeHtml(u.username)}</td><td><span class="role-chip">${escapeHtml(u.role)}</span></td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  app.innerHTML = layout({ title: "Users" }, body);
  mountLayoutEvents();
});

/* ---------- SETTINGS ---------- */
route("/settings", async (app) => {
  const body = `
    <div class="page-head"><div><h2>Settings</h2><div class="sub">Prototype configuration for this hackathon build.</div></div></div>
    <div class="card card-pad" style="max-width:620px;">
      <div class="review-row"><span class="k">Product</span><span class="v">LMAR — Digital Weighing Instrument Compliance Platform</span></div>
      <div class="review-row"><span class="k">Build</span><span class="v">Hackathon MVP</span></div>
      <div class="review-row"><span class="k">Rule engine</span><span class="v">Simplified example thresholds, modeled on OIML R76 structure</span></div>
      <div class="review-row"><span class="k">Signed in as</span><span class="v">${escapeHtml(AppState.user?.name || "Administrator")} (${escapeHtml(AppState.user?.role || "admin")})</span></div>
      <div class="alert alert-info mt-16" style="margin-bottom:0;">
        This is an independent compliance-testing prototype and is not an official OIML or government certification tool.
      </div>
    </div>`;
  app.innerHTML = layout({ title: "Settings" }, body);
  mountLayoutEvents();
});