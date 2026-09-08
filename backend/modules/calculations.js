/**
 * calculations.js
 * -----------------------------------------------------------------------
 * BACKEND MODULE — Compliance Rule Engine
 * -----------------------------------------------------------------------
 * This is the "brain" of LMAR. It contains the rule-based logic used
 * to decide PASS / FAIL for every test type. No AI, no guesswork — every
 * decision here is a deterministic calculation, which is what a real
 * laboratory compliance system requires (auditable, repeatable results).
 *
 * IMPORTANT (disclosed to the user in the UI/README as well):
 * The Maximum Permissible Error (MPE) table below is a SIMPLIFIED example
 * modeled loosely on the structure of OIML R76 for demo purposes. This is
 * a hackathon prototype, NOT a certified/official compliance calculator.
 * -----------------------------------------------------------------------
 */

// MPE steps (in multiples of "e", the verification scale interval) for
// three successive load ranges, keyed by accuracy class.
// Each entry: [ {uptoE, mpeInE}, ... ] evaluated in order.
const MPE_TABLE = {
  I:   [{ uptoE: 50000,  mpe: 0.5 }, { uptoE: 200000, mpe: 1.0 }, { uptoE: Infinity, mpe: 1.5 }],
  II:  [{ uptoE: 5000,   mpe: 1.0 }, { uptoE: 20000,  mpe: 1.5 }, { uptoE: Infinity, mpe: 2.0 }],
  III:  [{ uptoE: 500,    mpe: 1.5 }, { uptoE: 2000,   mpe: 2.0 }, { uptoE: Infinity, mpe: 2.5 }],
  IIII: [{ uptoE: 50,     mpe: 1.5 }, { uptoE: 200,    mpe: 2.0 }, { uptoE: Infinity, mpe: 2.5 }],
};

/** Returns the Maximum Permissible Error, in real units, for a given load. */
function getMPE({ accuracyClass, verificationScaleInterval, load }) {
  const e = Number(verificationScaleInterval);
  const table = MPE_TABLE[accuracyClass] || MPE_TABLE.III;
  const loadInE = Math.abs(Number(load)) / e;
  const step = table.find((row) => loadInE <= row.uptoE) || table[table.length - 1];
  return +(step.mpe * e).toFixed(6);
}

/** Accuracy / Indication test: several loads, each with a reference + indicated value. */
function evaluateAccuracyTest({ accuracyClass, verificationScaleInterval, readings }) {
  const rows = readings.map((r) => {
    const error = +(Number(r.indicated) - Number(r.reference)).toFixed(6);
    const mpe = getMPE({ accuracyClass, verificationScaleInterval, load: r.reference });
    const pass = Math.abs(error) <= mpe;
    return { ...r, error, mpe, pass };
  });
  const pass = rows.every((r) => r.pass);
  return { rows, pass };
}

/** Eccentricity test: one center reading + up to 4 corner readings at the same load. */
function evaluateEccentricityTest({ accuracyClass, verificationScaleInterval, load, centerReading, cornerReadings }) {
  const mpe = getMPE({ accuracyClass, verificationScaleInterval, load });
  const corners = cornerReadings.map((c) => {
    const deviation = +(Number(c.indicated) - Number(centerReading)).toFixed(6);
    const pass = Math.abs(deviation) <= mpe;
    return { ...c, deviation, pass };
  });
  const maxDeviation = corners.length ? Math.max(...corners.map((c) => Math.abs(c.deviation))) : 0;
  const pass = corners.every((c) => c.pass);
  return { corners, mpe, maxDeviation: +maxDeviation.toFixed(6), pass };
}

/** Repeatability test: same load applied N times; the spread (range) must stay inside MPE. */
function evaluateRepeatabilityTest({ accuracyClass, verificationScaleInterval, load, repeats }) {
  const values = repeats.map((r) => Number(r.indicated));
  const mpe = getMPE({ accuracyClass, verificationScaleInterval, load });
  const range = +(Math.max(...values) - Math.min(...values)).toFixed(6);
  const pass = range <= mpe;
  return { values, mpe, range, pass };
}

/** Temperature test: same load read at different ambient temperatures; drift must stay inside MPE. */
function evaluateTemperatureTest({ accuracyClass, verificationScaleInterval, load, samples }) {
  const values = samples.map((s) => Number(s.indicated));
  const mpe = getMPE({ accuracyClass, verificationScaleInterval, load });
  const drift = +(Math.max(...values) - Math.min(...values)).toFixed(6);
  const pass = drift <= mpe;
  return { samples, mpe, drift, pass };
}

/** Aggregates any set of already-run tests into one overall PASS/FAIL. */
function evaluateOverall(tests) {
  if (!tests.length) return "PENDING";
  return tests.every((t) => t.result === "PASS") ? "PASS" : "FAIL";
}

module.exports = {
  getMPE,
  evaluateAccuracyTest,
  evaluateEccentricityTest,
  evaluateRepeatabilityTest,
  evaluateTemperatureTest,
  evaluateOverall,
};