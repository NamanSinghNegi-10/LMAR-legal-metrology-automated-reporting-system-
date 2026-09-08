/**
 * reports.js
 * -----------------------------------------------------------------------
 * BACKEND MODULE — Report assembly
 * -----------------------------------------------------------------------
 * Builds the final compliance report record from an instrument + its
 * tests. The frontend renders this JSON into a printable page and the
 * user exports it to PDF using the browser's native print-to-PDF, which
 * keeps the stack dependency-free and demo-safe (no PDF library needed).
 * -----------------------------------------------------------------------
 */
const { evaluateOverall } = require("./calculations");

function buildReport({ id, reportNumber, instrument, tests, generatedBy }) {
  return {
    id,
    reportNumber,
    instrument,
    tests,
    overallResult: evaluateOverall(tests),
    generatedBy,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildReport };