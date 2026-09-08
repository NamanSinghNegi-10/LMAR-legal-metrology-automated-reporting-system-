/**
 * db.js
 * -----------------------------------------------------------------------
 * BACKEND MODULE — Data layer
 * -----------------------------------------------------------------------
 * A dependency-free JSON-file "database". This keeps the hackathon build
 * runnable with nothing but plain Node.js (no npm install, no external
 * DB server), while still keeping data access behind a clean module so
 * it can be swapped for a real database (Postgres/Mongo/etc.) later
 * without touching server.js's route logic.
 * -----------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function load() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function nextId(collection) {
  return collection.length ? Math.max(...collection.map((c) => c.id)) + 1 : 1;
}

module.exports = { load, save, nextId };