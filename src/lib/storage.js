import { sanitizeOrders } from "./orders.js";
import { mergeSettings } from "./settings.js";

/* Stockage robuste (iOS / Android) : un espace par compte
     1. localStorage  : lecture instantanée au démarrage
     2. IndexedDB     : copie miroir, plus durable
     3. copie .bak    : état précédent, si la principale est corrompue
     4. mémoire       : si tout est bloqué (navigation privée...)                      */

export const LEGACY_KEY = "luky.commandes.v1"; // données des versions précédentes (sans compte)
const CLAIM_KEY = "luky.legacy.claimedBy";
export const dataKey = (uid) => "luky.data." + uid;

export const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });

export const LS = {
  ok: null,
  available() {
    if (this.ok !== null) return this.ok;
    try {
      const k = "__luky_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      this.ok = true;
    } catch (e) { this.ok = false; }
    return this.ok;
  },
  get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  remove(k) { try { window.localStorage.removeItem(k); } catch (e) {} },
};

let dbPromise = null;
function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB indisponible")); return; }
    let req;
    try { req = indexedDB.open("luky", 1); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("kv")) req.result.createObjectStore("kv");
    };
    req.onsuccess = () => {
      const db = req.result;
      // iOS ferme parfois la connexion quand l'appli passe en arrière-plan : on la rouvrira à la demande
      db.onclose = () => { dbPromise = null; };
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error || new Error("Ouverture impossible"));
    req.onblocked = () => reject(new Error("Ouverture bloquée"));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

async function idbGet(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const req = db.transaction("kv", "readonly").objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { dbPromise = null; reject(e); }
  });
}

async function idbSet(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Transaction annulée"));
    } catch (e) { dbPromise = null; reject(e); }
  });
}

// Lit l'ancien format (tableau simple) comme les enveloppes { v, savedAt, orders, settings }
export function parseSaved(raw) {
  if (!raw) return null;
  try {
    const d = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(d)) return { orders: sanitizeOrders(d), settings: mergeSettings(null), savedAt: 0 };
    if (d && Array.isArray(d.orders)) {
      return { orders: sanitizeOrders(d.orders), settings: mergeSettings(d.settings), savedAt: Number(d.savedAt) || 0 };
    }
  } catch (e) {}
  return null;
}

const readKey = (key) => parseSaved(LS.get(key)) || parseSaved(LS.get(key + ".bak"));

// Lecture synchrone au démarrage. Les données des versions sans compte sont reprises
// par le premier compte qui se connecte sur cet appareil.
export function readUserData(uid) {
  const own = readKey(dataKey(uid));
  if (own) return { data: own, source: "own" };
  if (!LS.get(CLAIM_KEY)) {
    const legacy = readKey(LEGACY_KEY);
    if (legacy && legacy.orders.length > 0) {
      LS.set(CLAIM_KEY, uid);
      return { data: legacy, source: "legacy" };
    }
  }
  return null;
}

// Récupération depuis IndexedDB quand localStorage a été effacé
export async function readIdbData(uid) {
  try {
    const own = parseSaved(await withTimeout(idbGet(dataKey(uid)), 3000));
    if (own) return { data: own, source: "own" };
    if (!LS.get(CLAIM_KEY)) {
      const legacy = parseSaved(await withTimeout(idbGet(LEGACY_KEY), 3000));
      if (legacy && legacy.orders.length > 0) {
        LS.set(CLAIM_KEY, uid);
        return { data: legacy, source: "legacy" };
      }
    }
  } catch (e) {}
  return null;
}

// Retourne "ok" si au moins un des deux supports a enregistré, sinon "memory"
export async function persistUserData(uid, orders, settings) {
  const key = dataKey(uid);
  const payload = JSON.stringify({ v: 3, savedAt: Date.now(), orders, settings });
  let ok = false;

  if (LS.available()) {
    const previous = LS.get(key);
    let saved = LS.set(key, payload);
    if (!saved) {            // quota atteint : on libère la copie de secours et on réessaie
      LS.remove(key + ".bak");
      saved = LS.set(key, payload);
    }
    if (saved) {
      ok = true;
      if (previous && previous !== payload) LS.set(key + ".bak", previous);
    }
  }

  try {
    await withTimeout(idbSet(key, payload), 4000);
    ok = true;
  } catch (e) {}

  return ok ? "ok" : "memory";
}
