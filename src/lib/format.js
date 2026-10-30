import { DEFAULT_COUNTRY_CODE } from "../config.js";

export const uid = () =>
  window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}
export const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};
export const todayISO = () => isoDaysAgo(0);

export const fmtNum = (n) => new Intl.NumberFormat("fr-FR").format(Number(n) || 0);
export const formatFCFA = (n) => fmtNum(n) + " FCFA";
// Pour les messages : espaces normaux (les espaces insécables fines s'affichent mal dans certains clients)
export const plainFCFA = (n) => formatFCFA(n).replace(/[\u202f\u00a0]/g, " ");
export const plural = (n, word) => n + " " + word + (n > 1 ? "s" : "");

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};
export const formatLongDate = (ms) =>
  new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
export const formatDateTime = (ts) =>
  new Date(ts).toLocaleString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export const isStandalone = () =>
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  window.navigator.standalone === true;
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// "242 06 123 45 67" -> "242061234567"
// "+242 06 123 45 67" -> "242061234567"
// "06 123 45 67" (local) -> "242061234567"
export function cleanPhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("0")) d = DEFAULT_COUNTRY_CODE + d;
  return d;
}

export function waLink(phone, message) {
  const text = String(message || "").trim();
  return "https://wa.me/" + cleanPhone(phone) + (text ? "?text=" + encodeURIComponent(text) : "");
}

// Identifiant de connexion : e-mail ou numéro de téléphone
export function parseIdentifier(raw) {
  const v = String(raw || "").trim();
  if (!v) return null;
  if (v.includes("@")) {
    const email = v.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? { type: "email", value: email } : null;
  }
  if (/[a-z]/i.test(v)) return null;
  const digits = cleanPhone(v);
  return digits.length >= 8 && digits.length <= 15 ? { type: "phone", value: digits } : null;
}
