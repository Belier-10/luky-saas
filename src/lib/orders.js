import { STATUSES } from "../config.js";
import { todayISO, uid } from "./format.js";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeOrders(list) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((o) => {
    if (!o || typeof o !== "object") return;
    let id = typeof o.id === "string" && o.id ? o.id : uid();
    if (seen.has(id)) id = uid();
    seen.add(id);
    const amount = Number(o.amount);
    const status = STATUSES.includes(o.status) ? o.status : "En attente";
    const date = typeof o.date === "string" && ISO_RE.test(o.date) ? o.date : todayISO();
    out.push({
      id,
      name: typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Sans nom",
      phone: typeof o.phone === "string" || typeof o.phone === "number" ? String(o.phone).trim() : "",
      product: typeof o.product === "string" ? o.product.trim() : "",
      amount: Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : 0,
      address: typeof o.address === "string" ? o.address.trim() : "",
      status,
      date,
      deliveredAt:
        status === "Livrée" && typeof o.deliveredAt === "string" && ISO_RE.test(o.deliveredAt)
          ? o.deliveredAt
          : "",
    });
  });
  return out;
}

// Enregistre la date de livraison quand une commande passe en "Livrée" (sert aux rapports de CA)
export function applyDelivery(prev, next) {
  if (next.status !== "Livrée") return { ...next, deliveredAt: "" };
  if (prev && prev.status === "Livrée") return { ...next, deliveredAt: prev.deliveredAt || prev.date };
  return { ...next, deliveredAt: prev ? todayISO() : next.date };
}

export function filterAndSort(orders, { filter, query, sortDir }) {
  const q = query.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  return orders
    .filter((o) => filter === "Toutes" || o.status === filter)
    .filter((o) => {
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        (o.product || "").toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        (qd && String(o.phone).replace(/\D/g, "").includes(qd))
      );
    })
    .slice()
    .sort((a, b) => (sortDir === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
}
