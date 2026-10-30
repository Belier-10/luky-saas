import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { bearer, httpError } from "./http.js";
import { kv } from "./kv.js";

export const DAY = 86400000;
export const TRIAL_DAYS = 14;
export const PLAN_DAYS = { monthly: 30, yearly: 365 };
export const PLANS = ["monthly", "yearly", "lifetime"];

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw httpError(500, "Serveur non configuré (AUTH_SECRET manquant ou trop court).");
  return s;
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------- Identifiant : e-mail ou numéro de téléphone ---------- */
export function normalizeIdentifier(raw) {
  const v = String(raw || "").trim();
  if (!v || v.length > 120) return null;
  if (v.includes("@")) {
    const email = v.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? { type: "email", value: email } : null;
  }
  if (/[a-z]/i.test(v)) return null;
  let d = v.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("0")) d = "242" + d; // numéro local congolais
  return d.length >= 8 && d.length <= 15 ? { type: "phone", value: d } : null;
}

export const userIdOf = (identifier) => createHash("sha256").update(identifier).digest("hex").slice(0, 24);

/* ---------- Codes de confirmation ---------- */
export const randomCode = () => String(randomInt(0, 1000000)).padStart(6, "0");
export const hashOtp = (code, identifier) =>
  createHmac("sha256", secret()).update(identifier + ":" + code).digest("hex");

/* ---------- Jetons de session (signés, sans dépendance) ---------- */
export function signToken(payload, ttlSec = 60 * 86400) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + sig;
}

export function verifyToken(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return p.exp && p.exp * 1000 > Date.now() ? p : null;
  } catch (e) {
    return null;
  }
}

export async function requireUser(req) {
  const payload = verifyToken(bearer(req));
  if (!payload || !payload.uid) throw httpError(401, "Session expirée. Reconnectez-vous.");
  const user = await kv.get("user:" + payload.uid);
  if (!user) throw httpError(401, "Compte introuvable. Reconnectez-vous.");
  return user;
}

/* ---------- Vue publique du compte ---------- */
export const publicUser = (u) => ({ id: u.id, identifier: u.identifier, type: u.type });
export const publicLicense = (u) => ({
  trialEndsAt: u.trialEndsAt,
  plan: (u.license && u.license.plan) || null,
  expiresAt: u.license && u.license.expiresAt != null ? u.license.expiresAt : null,
});
export const sessionPayload = (u) => ({
  user: publicUser(u),
  license: publicLicense(u),
  serverTime: Date.now(),
});
