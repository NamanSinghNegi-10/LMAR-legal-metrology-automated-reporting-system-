/**
 * server.js
 * -----------------------------------------------------------------------
 * BACKEND — Entry point
 * -----------------------------------------------------------------------
 * Plain Node.js HTTP server (no Express, no npm install required).
 * Responsibilities:
 *   1. Serve the static frontend (frontend/ folder)
 *   2. Expose a JSON REST API under /api/*
 *   3. Enforce the compliance rule engine on every test submission
 *
 * Run:  node backend/server.js
 * Then open: http://localhost:4000
 * -----------------------------------------------------------------------
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const db = require("./modules/db");
const auth = require("./modules/auth");
const calc = require("./modules/calculations");
const { buildReport } = require("./modules/reports");

const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------
function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getAuthUser(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return token ? auth.getUserFromToken(token) : null;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const fullPath = path.join(FRONTEND_DIR, filePath);
  if (!fullPath.startsWith(FRONTEND_DIR)) return sendJSON(res, 403, { error: "Forbidden" });

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      // SPA fallback -> index.html for client-side routes
      fs.readFile(path.join(FRONTEND_DIR, "index.html"), (err2, indexContent) => {
        if (err2) return sendJSON(res, 404, { error: "Not found" });
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(indexContent);
      });
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

// ---------------------------------------------------------------------
// API route handlers
// ---------------------------------------------------------------------
async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;
  const method = req.method;

  // ---- AUTH ------------------------------------------------------
  if (pathname === "/api/auth/login" && method === "POST") {
    const body = await readBody(req);
    // Uses the new username login scheme setup in auth.js
    const result = auth.login(body.username, body.password);
    return sendJSON(res, result.ok ? 200 : 401, result);
  }

  if (pathname === "/api/auth/demo-users" && method === "GET") {
    return sendJSON(res, 200, { users: auth.listDemoUsers() });
  }

  if (pathname === "/api/me" && method === "GET") {
    const user = getAuthUser(req);
    if (!user) return sendJSON(res, 401, { error: "Not authenticated" });
    return sendJSON(res, 200, { user });
  }

  // ---- DASHBOARD ---------------------------------------------------
  if (pathname === "/api/dashboard/summary" && method === "GET") {
    const data = db.load();
    const totalInstruments = data.instruments.length;
    const testsInProgress = data.instruments.filter((i) => i.status === "In Progress" || i.status === "Draft").length;
    const passed = data.instruments.filter((i) => i.status === "Passed").length;
    const failed = data.instruments.filter((i) => i.status === "Failed").length;

    const recent = [...data.tests]
      .sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt))
      .slice(0, 8)
      .map((t) => {
        const instrument = data.instruments.find((i) => i.id === t.instrumentId);
        return {
          testId: t.id,
          instrument: instrument ? `${instrument.manufacturer} ${instrument.model}` : "Unknown",
          manufacturer: instrument ? instrument.manufacturer : "-",
          testType: t.testType,
          date: t.performedAt,
          status: t.result,
          technician: t.performedBy,
          instrumentId: t.instrumentId,
        };
      });

    return sendJSON(res, 200, { totalInstruments, testsInProgress, passed, failed, recent });
  }

  // ---- INSTRUMENTS ---------------------------------------------------
  if (pathname === "/api/instruments" && method === "GET") {
    const data = db.load();
    return sendJSON(res, 200, { instruments: data.instruments });
  }

  if (pathname === "/api/instruments" && method === "POST") {
    const body = await readBody(req);
    const data = db.load();
    const required = ["manufacturer", "model", "serialNumber", "instrumentType", "accuracyClass", "maxCapacity", "verificationScaleInterval", "unit"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === "") {
        return sendJSON(res, 400, { error: `Missing required field: ${field}` });
      }
    }
    if (Number(body.maxCapacity) <= 0 || Number(body.verificationScaleInterval) <= 0) {
      return sendJSON(res, 400, { error: "Capacity and scale interval must be positive numbers." });
    }
    const instrument = {
      id: db.nextId(data.instruments),
      manufacturer: body.manufacturer,
      model: body.model,
      serialNumber: body.serialNumber,
      instrumentType: body.instrumentType,
      accuracyClass: body.accuracyClass,
      maxCapacity: Number(body.maxCapacity),
      verificationScaleInterval: Number(body.verificationScaleInterval),
      unit: body.unit,
      temperature: body.temperature ?? null,
      humidity: body.humidity ?? null,
      pressure: body.pressure ?? null,
      powerSupply: body.powerSupply ?? null,
      createdBy: body.createdBy || "admin",
      createdAt: new Date().toISOString(),
      status: "Draft",
    };
    data.instruments.push(instrument);
    db.save(data);
    return sendJSON(res, 201, { instrument });
  }

  const instrumentMatch = pathname.match(/^\/api\/instruments\/(\d+)$/);
  if (instrumentMatch && method === "GET") {
    const data = db.load();
    const instrument = data.instruments.find((i) => i.id === Number(instrumentMatch[1]));
    if (!instrument) return sendJSON(res, 404, { error: "Instrument not found" });
    const tests = data.tests.filter((t) => t.instrumentId === instrument.id);
    return sendJSON(res, 200, { instrument, tests });
  }

  // ---- TESTS ---------------------------------------------------------
  const testsMatch = pathname.match(/^\/api\/instruments\/(\d+)\/tests$/);
  if (testsMatch && method === "GET") {
    const data = db.load();
    const tests = data.tests.filter((t) => t.instrumentId === Number(testsMatch[1]));
    return sendJSON(res, 200, { tests });
  }

  if (testsMatch && method === "POST") {
    const instrumentId = Number(testsMatch[1]);
    const body = await readBody(req);
    const data = db.load();
    const instrument = data.instruments.find((i) => i.id === instrumentId);
    if (!instrument) return sendJSON(res, 404, { error: "Instrument not found" });

    const ctx = { accuracyClass: instrument.accuracyClass, verificationScaleInterval: instrument.verificationScaleInterval };
    let evaluation;
    try {
      switch (body.testType) {
        case "accuracy":
          evaluation = calc.evaluateAccuracyTest({ ...ctx, readings: body.readings });
          break;
        case "eccentricity":
          evaluation = calc.evaluateEccentricityTest({ ...ctx, load: body.load, centerReading: body.centerReading, cornerReadings: body.cornerReadings });
          break;
        case "repeatability":
          evaluation = calc.evaluateRepeatabilityTest({ ...ctx, load: body.load, repeats: body.repeats });
          break;
        case "temperature":
          evaluation = calc.evaluateTemperatureTest({ ...ctx, load: body.load, samples: body.samples });
          break;
        default:
          return sendJSON(res, 400, { error: "Unknown testType" });
      }
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid test input: " + e.message });
    }

    const test = {
      id: db.nextId(data.tests),
      instrumentId,
      testType: body.testType,
      input: body,
      evaluation,
      result: evaluation.pass ? "PASS" : "FAIL",
      performedBy: body.performedBy || "admin",
      performedAt: new Date().toISOString(),
    };
    data.tests.push(test);

    // Roll up instrument status from all tests performed so far
    const instrumentTests = data.tests.filter((t) => t.instrumentId === instrumentId);
    instrument.status = calc.evaluateOverall(instrumentTests) === "PENDING" ? "In Progress" : calc.evaluateOverall(instrumentTests) === "PASS" ? "Passed" : "Failed";

    db.save(data);
    return sendJSON(res, 201, { test, instrumentStatus: instrument.status });
  }

  // ---- REPORTS ---------------------------------------------------------
  if (pathname === "/api/reports" && method === "GET") {
    const data = db.load();
    const q = (searchParams.get("q") || "").toLowerCase();
    const status = searchParams.get("status") || "";
    let list = data.reports;
    if (q) {
      list = list.filter((r) =>
        [r.reportNumber, r.instrument.manufacturer, r.instrument.model, r.instrument.serialNumber]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (status) list = list.filter((r) => r.overallResult === status);
    list = [...list].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    return sendJSON(res, 200, { reports: list });
  }

  if (pathname === "/api/reports" && method === "POST") {
    const body = await readBody(req);
    const data = db.load();
    const instrument = data.instruments.find((i) => i.id === Number(body.instrumentId));
    if (!instrument) return sendJSON(res, 404, { error: "Instrument not found" });
    const tests = data.tests.filter((t) => t.instrumentId === instrument.id);
    if (!tests.length) return sendJSON(res, 400, { error: "Cannot generate a report with zero tests performed." });

    data.counters.report += 1;
    const reportNumber = `LMR-${data.counters.report}`;
    const report = buildReport({
      id: db.nextId(data.reports),
      reportNumber,
      instrument,
      tests,
      generatedBy: body.generatedBy || "admin",
    });
    data.reports.push(report);
    db.save(data);
    return sendJSON(res, 201, { report });
  }

  const reportMatch = pathname.match(/^\/api\/reports\/(\d+)$/);
  if (reportMatch && method === "GET") {
    const data = db.load();
    const report = data.reports.find((r) => r.id === Number(reportMatch[1]));
    if (!report) return sendJSON(res, 404, { error: "Report not found" });
    return sendJSON(res, 200, { report });
  }

  return sendJSON(res, 404, { error: "Unknown API route" });
}

// ---------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Basic CORS (harmless for a same-origin demo, useful if frontend is opened separately)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url.pathname);
    }
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`LMAR backend running: http://localhost:${PORT}`);
});