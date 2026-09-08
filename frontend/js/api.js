/**
 * api.js
 * -----------------------------------------------------------------------
 * FRONTEND MODULE — API client
 * -----------------------------------------------------------------------
 * Every call the UI makes to the backend goes through this one file.
 * Keeping it isolated means:
 *   - the rest of the frontend never touches fetch() directly
 *   - swapping the backend URL, or adding retry/error handling, is a
 *     one-file change
 *   - in the judging demo this file is the clear boundary between
 *     "frontend work" and "backend work"
 * -----------------------------------------------------------------------
 */
const Api = (() => {
  const BASE = ""; // same-origin: backend serves the frontend too

  function token() {
    // Rebranded to LMAR session tokens
    return sessionStorage.getItem("lmar_token") || localStorage.getItem("lmar_session");
  }

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const t = token();
    if (t) headers["Authorization"] = `Bearer ${t}`;

    const res = await fetch(BASE + path, { ...options, headers });
    let body;
    try {
      body = await res.json();
    } catch (e) {
      body = {};
    }
    if (!res.ok) {
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return body;
  }

  return {
    // ---- auth ----
    // Modified to accept 'username' instead of 'email' for the admin login
    login: (username, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    demoUsers: () => request("/api/auth/demo-users"),
    me: () => request("/api/me"),

    // ---- dashboard ----
    dashboardSummary: () => request("/api/dashboard/summary"),

    // ---- instruments ----
    listInstruments: () => request("/api/instruments"),
    getInstrument: (id) => request(`/api/instruments/${id}`),
    createInstrument: (payload) => request("/api/instruments", { method: "POST", body: JSON.stringify(payload) }),

    // ---- tests ----
    listTests: (instrumentId) => request(`/api/instruments/${instrumentId}/tests`),
    submitTest: (instrumentId, payload) => request(`/api/instruments/${instrumentId}/tests`, { method: "POST", body: JSON.stringify(payload) }),

    // ---- reports ----
    listReports: (query = {}) => {
      const qs = new URLSearchParams(query).toString();
      return request(`/api/reports${qs ? "?" + qs : ""}`);
    },
    createReport: (payload) => request("/api/reports", { method: "POST", body: JSON.stringify(payload) }),
    getReport: (id) => request(`/api/reports/${id}`),
  };
})();