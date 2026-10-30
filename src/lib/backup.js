import { todayISO, uid } from "./format.js";
import { sanitizeOrders } from "./orders.js";
import { mergeSettings } from "./settings.js";

/* ---------- Export ---------- */
export function backupToJSON(orders, settings) {
  return JSON.stringify(
    {
      app: "luky",
      version: 3,
      exportedAt: new Date().toISOString(),
      orders,
      settings: { templates: settings.templates, company: settings.company },
    },
    null,
    2
  );
}

const CSV_COLUMNS = [
  ["Date", (o) => o.date],
  ["Nom", (o) => o.name],
  ["Téléphone", (o) => o.phone],
  ["Produit", (o) => o.product],
  ["Montant (FCFA)", (o) => o.amount],
  ["Adresse", (o) => o.address],
  ["Statut", (o) => o.status],
  ["Date de livraison", (o) => o.deliveredAt || ""],
];

const csvCell = (v) => {
  const s = String(v == null ? "" : v);
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

// Séparateur ";" et BOM UTF-8 : s'ouvre correctement dans Excel en français
export function ordersToCSV(orders) {
  const lines = [CSV_COLUMNS.map((c) => c[0]).join(";")];
  orders.forEach((o) => lines.push(CSV_COLUMNS.map((c) => csvCell(c[1](o))).join(";")));
  return "\ufeff" + lines.join("\r\n");
}

// Mobile : feuille de partage (Fichiers, Drive, WhatsApp...). Sinon : téléchargement classique.
export async function shareOrDownload({ name, mime, text }) {
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (coarse && typeof File === "function" && navigator.canShare && navigator.share) {
    try {
      const file = new File([text], name, { type: mime });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return "shared";
      }
    } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
    }
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}

/* ---------- Import ---------- */
const norm = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

export function parseCSV(text) {
  const t = text.replace(/^\uFEFF/, "");
  const first = t.split(/\r?\n/)[0] || "";
  const delim = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') {
        if (t[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const HEADERS = {
  date: "date", datedelacommande: "date",
  nom: "name", client: "name", nomduclient: "name",
  telephone: "phone", whatsapp: "phone", numero: "phone", numerowhatsapp: "phone", contact: "phone",
  produit: "product", produitcommande: "product", article: "product",
  montant: "amount", montantfcfa: "amount", prix: "amount",
  adresse: "address", adressedelivraison: "address", adressedelalivraison: "address",
  statut: "status",
  datedelivraison: "deliveredAt", livreele: "deliveredAt",
};

function normDate(v) {
  const s = String(v || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  return m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : "";
}

function normStatus(v) {
  const n = norm(v);
  if (n === "enpreparation") return "En préparation";
  if (n === "livree" || n === "livre") return "Livrée";
  return "En attente";
}

function csvToOrders(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const cols = rows[0].map((h) => HEADERS[norm(h)] || null);
  if (!cols.includes("name")) throw new Error("Colonne « Nom » introuvable dans ce fichier CSV.");
  return rows.slice(1).map((r) => {
    const o = { id: uid() };
    cols.forEach((key, i) => {
      if (!key) return;
      const v = (r[i] || "").trim();
      if (key === "amount") o.amount = Number(v.replace(/[^\d.,-]/g, "").replace(",", "."));
      else if (key === "date" || key === "deliveredAt") o[key] = normDate(v);
      else if (key === "status") o.status = normStatus(v);
      else o[key] = v;
    });
    return o;
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier."));
    reader.readAsText(file);
  });
}

// Lit un fichier JSON (sauvegarde Luky) ou CSV (export Luky / tableur)
export async function readBackupFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Ce fichier est trop volumineux.");
  const text = await readFileAsText(file);
  const looksJSON = /^\s*[[{]/.test(text.replace(/^\uFEFF/, ""));
  let list;
  let data = null;
  if (looksJSON) {
    try { data = JSON.parse(text); } catch (e) { throw new Error("Ce fichier n’est pas un JSON valide."); }
    list = Array.isArray(data) ? data : data && Array.isArray(data.orders) ? data.orders : null;
    if (!list) throw new Error("Ce fichier n’est pas une sauvegarde Luky.");
  } else {
    list = csvToOrders(text);
  }
  if (list.length === 0) throw new Error("Ce fichier ne contient aucune commande.");
  const orders = sanitizeOrders(list);
  if (orders.length === 0) throw new Error("Aucune commande valide dans ce fichier.");
  return {
    kind: looksJSON ? "json" : "csv",
    orders,
    settings: data && !Array.isArray(data) && data.settings ? mergeSettings(data.settings) : null,
    skipped: list.length - orders.length,
  };
}

export const backupFileName = (kind) => "luky-" + (kind === "csv" ? "commandes-" : "sauvegarde-") + todayISO() + "." + kind;
