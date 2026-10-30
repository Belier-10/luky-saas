import { toISO, todayISO } from "./format.js";

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Lundi de la semaine qui contient la date donnée
export function weekStartISO(iso) {
  const d = new Date(iso + "T00:00:00");
  const offset = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - offset);
  return toISO(d);
}

// Chiffre d'affaires des commandes "Livrées" : jour, semaine (lundi-dimanche), mois
export function deliveredReport(orders, today = todayISO()) {
  const weekStart = weekStartISO(today);
  const weekEnd = addDays(weekStart, 6);
  const month = today.slice(0, 7);
  const zero = () => ({ amount: 0, count: 0 });
  const r = { day: zero(), week: zero(), month: zero(), all: zero(), weekStart, weekEnd, monthKey: month };
  orders.forEach((o) => {
    if (o.status !== "Livrée") return;
    const d = o.deliveredAt || o.date;
    const a = Number(o.amount) || 0;
    const add = (b) => { b.amount += a; b.count += 1; };
    add(r.all);
    if (d === today) add(r.day);
    if (d >= weekStart && d <= weekEnd) add(r.week);
    if (d.slice(0, 7) === month) add(r.month);
  });
  return r;
}
