// Stockage clé/valeur : Upstash Redis (REST) sur Vercel. En local, simple mémoire (volatile).
import { httpError } from "./http.js";

const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const mem = new Map(); // { key -> { v, exp } }
const alive = (e) => e && (!e.exp || e.exp > Date.now());

function ensureConfigured() {
  if (URL_() && TOKEN()) return true;
  if (process.env.VERCEL) {
    throw httpError(503, "Base de données non configurée (KV_REST_API_URL / KV_REST_API_TOKEN).");
  }
  return false; // développement local : mémoire
}

async function cmd(args) {
  const r = await fetch(URL_(), {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN(), "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || "Erreur base de données");
  return j.result;
}

export const kv = {
  async get(key) {
    if (!ensureConfigured()) {
      const e = mem.get(key);
      return alive(e) ? JSON.parse(e.v) : null;
    }
    const v = await cmd(["GET", key]);
    return v == null ? null : JSON.parse(v);
  },

  async set(key, value, ttlSec) {
    if (!ensureConfigured()) {
      mem.set(key, { v: JSON.stringify(value), exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
      return;
    }
    const args = ["SET", key, JSON.stringify(value)];
    if (ttlSec) args.push("EX", String(ttlSec));
    await cmd(args);
  },

  // Écrit seulement si la clé n'existe pas. Retourne true si écrit.
  async setnx(key, value) {
    if (!ensureConfigured()) {
      if (alive(mem.get(key))) return false;
      mem.set(key, { v: JSON.stringify(value), exp: 0 });
      return true;
    }
    return (await cmd(["SET", key, JSON.stringify(value), "NX"])) === "OK";
  },

  async incr(key, ttlSec) {
    if (!ensureConfigured()) {
      const e = mem.get(key);
      const n = alive(e) ? Number(e.v) + 1 : 1;
      mem.set(key, { v: String(n), exp: alive(e) ? e.exp : Date.now() + ttlSec * 1000 });
      return n;
    }
    const n = await cmd(["INCR", key]);
    if (n === 1 && ttlSec) await cmd(["EXPIRE", key, String(ttlSec)]);
    return n;
  },

  async del(key) {
    if (!ensureConfigured()) { mem.delete(key); return; }
    await cmd(["DEL", key]);
  },
};
