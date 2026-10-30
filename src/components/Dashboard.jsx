import { useMemo } from "react";
import { STATUSES } from "../config.js";
import { fmtNum, formatFCFA, plural } from "../lib/format.js";
import { STATUS_DOT } from "./ui.jsx";

// Tableau de bord : suit la recherche et les filtres (reçoit les commandes affichées)
export default function Dashboard({ orders, filter, query }) {
  const stats = useMemo(() => {
    const by = {};
    STATUSES.forEach((s) => { by[s] = { count: 0, amount: 0 }; });
    let total = 0;
    orders.forEach((o) => {
      const a = Number(o.amount) || 0;
      total += a;
      if (by[o.status]) { by[o.status].count += 1; by[o.status].amount += a; }
    });
    return { by, total, count: orders.length, avg: orders.length ? Math.round(total / orders.length) : 0 };
  }, [orders]);

  const parts = [];
  if (filter !== "Toutes") parts.push("statut " + filter.toLowerCase());
  if (query.trim()) parts.push("recherche « " + query.trim() + " »");
  const caption = parts.length ? "Commandes affichées : " + parts.join(", ") : "Toutes les commandes";

  return (
    <section aria-label="Tableau de bord" className="mt-4 rounded-2xl border border-edge bg-panel p-4">
      <p className="text-sm font-bold text-muted">Chiffre d’affaires</p>
      <p className="text-xs text-muted/80">{caption}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight">
        {fmtNum(stats.total)} <span className="text-base font-bold text-muted">FCFA</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        {plural(stats.count, "commande")}, panier moyen {formatFCFA(stats.avg)}
      </p>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-ink" role="img" aria-label="Répartition du chiffre d’affaires par statut">
        {stats.total > 0 &&
          STATUSES.map((s) =>
            stats.by[s].amount > 0 ? (
              <div key={s} className={STATUS_DOT[s]} style={{ width: (stats.by[s].amount / stats.total) * 100 + "%" }} />
            ) : null
          )}
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted">
              <span className={"h-2 w-2 rounded-full " + STATUS_DOT[s]} />
              {s} <span className="text-muted/70">({stats.by[s].count})</span>
            </span>
            <span className="font-bold">{formatFCFA(stats.by[s].amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
