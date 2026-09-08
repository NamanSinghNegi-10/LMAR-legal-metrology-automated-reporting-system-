/**
 * auth.js
 * -----------------------------------------------------------------------
 * BACKEND MODULE — Authentication (demo mode)
 * -----------------------------------------------------------------------
 * For the hackathon demo we intentionally avoid real password hashing /
 * third-party auth providers — those add moving
 * parts that can break a live demo. Instead we issue a simple signed-
 * looking session token for the fixed admin account. Swapping this for
 * real auth later only means editing this file.
 * -----------------------------------------------------------------------
 */
const crypto = require("crypto");

// Replaced Alex and Reviewer with the temporary LMAR admin credentials
const DEMO_USERS = [
  { id: 1, name: "Administrator", username: "admin", role: "admin", password: "password123" }
];

const sessions = new Map(); // token -> user

// Updated to accept 'username' instead of 'email'
function login(username, password) {
  const user = DEMO_USERS.find(
    (u) => u.username.toLowerCase() === String(username || "").toLowerCase()
  );
  
  // Enforce exact match for the temporary admin password
  if (!user || password !== user.password) {
    return { ok: false, error: "Invalid username or password." };
  }
  
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, user);
  const { password: _pw, ...safeUser } = user;
  return { ok: true, token, user: safeUser };
}

function getUserFromToken(token) {
  const user = sessions.get(token);
  if (!user) return null;
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

function listDemoUsers() {
  return DEMO_USERS.map(({ password, ...u }) => u);
}

module.exports = { login, getUserFromToken, listDemoUsers };