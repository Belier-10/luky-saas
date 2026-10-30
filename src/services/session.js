import { LS } from "../lib/storage.js";

// Session du compte connecté + horloge « de confiance » (décalage serveur + garde anti-retour en arrière)
const KEY = "luky.session.v1";
const SEEN = "luky.lastseen";
let mem;

export function loadSession() {
  if (mem !== undefined) return mem;
  try {
    const raw = LS.get(KEY);
    mem = raw ? JSON.parse(raw) : null;
  } catch (e) { mem = null; }
  return mem;
}

export function saveSession(s) {
  mem = s || null;
  if (s) LS.set(KEY, JSON.stringify(s));
  else LS.remove(KEY);
}

// Heure actuelle : horloge de l'appareil corrigée par le décalage mesuré avec le serveur,
// et jamais en dessous de la dernière heure observée (empêche de prolonger l'essai en reculant l'horloge).
export function nowMs() {
  const s = loadSession();
  const offset = (s && s.offset) || 0;
  const seen = Number(LS.get(SEEN)) || 0;
  const t = Math.max(Date.now() + offset, seen);
  if (t - seen > 60000) LS.set(SEEN, String(t));
  return t;
}
