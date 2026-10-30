// MODE DÉMO : simule le serveur dans le navigateur (aucun message n'est envoyé).
// À utiliser uniquement pour tester. En production, le serveur (/api) fait foi.
import { TRIAL_DAYS, PLANS } from "../config.js";
import { LS } from "../lib/storage.js";

const DB_KEY = "luky.demo.db";
const DAY = 86400000;
const DEMO_CODES = { "DEMO-MENSUEL": "monthly", "DEMO-ANNUEL": "yearly", "DEMO-VIE": "lifetime" };
let memDb = null;

function load() {
  if (memDb) return memDb;
  try { memDb = JSON.parse(LS.get(DB_KEY)) || null; } catch (e) { memDb = null; }
  if (!memDb) memDb = { users: {}, otps: {} };
  return memDb;
}
const save = () => LS.set(DB_KEY, JSON.stringify(load()));

// Identifiant stable dérivé de l'e-mail / du numéro
function userIdOf(value) {
  let h = 5381;
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) >>> 0;
  return "demo_" + h.toString(16);
}

const publicUser = (u) => ({ id: u.id, identifier: u.identifier, type: u.type });
const publicLicense = (u) => ({
  trialEndsAt: u.trialEndsAt,
  plan: (u.license && u.license.plan) || null,
  expiresAt: u.license && u.license.expiresAt != null ? u.license.expiresAt : null,
});

export async function requestCode(identifier) {
  const db = load();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.otps[identifier] = { code, exp: Date.now() + 10 * 60000, attempts: 0 };
  save();
  return { sent: true, devCode: code };
}

export async function verifyCode(identifier, code) {
  const db = load();
  const rec = db.otps[identifier];
  if (!rec || rec.exp < Date.now()) throw new Error("Code expiré ou introuvable. Demandez-en un nouveau.");
  if (rec.code !== code) {
    rec.attempts += 1;
    if (rec.attempts >= 5) delete db.otps[identifier];
    save();
    throw new Error("Code incorrect.");
  }
  delete db.otps[identifier];
  const id = userIdOf(identifier);
  let isNew = false;
  if (!db.users[id]) {
    const type = identifier.includes("@") ? "email" : "phone";
    db.users[id] = { id, identifier, type, createdAt: Date.now(), trialEndsAt: Date.now() + TRIAL_DAYS * DAY, license: null };
    isNew = true;
  }
  save();
  const u = db.users[id];
  return { token: "demo." + id, user: publicUser(u), license: publicLicense(u), serverTime: Date.now(), isNew };
}

function userOf(token) {
  const id = String(token || "").replace(/^demo\./, "");
  const u = load().users[id];
  if (!u) { const e = new Error("Session expirée. Reconnectez-vous."); e.status = 401; throw e; }
  return u;
}

export async function fetchSession(token) {
  const u = userOf(token);
  return { user: publicUser(u), license: publicLicense(u), serverTime: Date.now() };
}

export async function redeemCode(token, rawCode) {
  const u = userOf(token);
  const code = String(rawCode || "").trim().toUpperCase();
  const planId = DEMO_CODES[code];
  if (!planId) throw new Error("Code invalide. (Mode démo : DEMO-MENSUEL, DEMO-ANNUEL ou DEMO-VIE)");
  const plan = PLANS.find((p) => p.id === planId);
  if (planId === "lifetime") u.license = { plan: "lifetime", activatedAt: Date.now(), expiresAt: null };
  else {
    const base = Math.max(Date.now(), (u.license && u.license.expiresAt) || 0);
    u.license = { plan: planId, activatedAt: Date.now(), expiresAt: base + plan.days * DAY };
  }
  save();
  return { user: publicUser(u), license: publicLicense(u), serverTime: Date.now() };
}
