import { useMemo } from "react";
import { deliveredReport } from "../../lib/reports.js";
import { fmtNum, formatDate, plural } from "../../lib/format.js";

function Card({ title, caption, data }) {
  return (
    <div className="rounded-2xl border border-edge bg-raised/50 p-4">
      <p className="text-sm font-bold text-muted">{title}</p>
      <p className="text-xs text-muted/80">{caption}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">
        {fmtNum(data.amount)} <span className="text-sm font-bold text-muted">FCFA</span>
      </p>
      <p className="mt-0.5 text-sm text-muted">{plural(data.count, "commande")} livrée{data.count > 1 ? "s" : ""}</p>
    </div>
  );
}

export default function ReportsTab({ orders }) {
  const r = useMemo(() => deliveredReport(orders), [orders]);
  const monthName = new Date(r.monthKey + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const todayLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-base font-extrabold">Chiffre d’affaires des commandes livrées</h3>
        <p className="mt-1 text-sm text-muted">
          Seules les commandes au statut « Livrée » comptent, à la date où elles sont passées en livrées.
        </p>
      </section>
      <Card title="Aujourd’hui" caption={todayLabel} data={r.day} />
      <Card title="Cette semaine" caption={"Du " + formatDate(r.weekStart) + " au " + formatDate(r.weekEnd)} data={r.week} />
      <Card title="Ce mois" caption={monthName} data={r.month} />
      <p className="text-sm text-muted">
        Total livré depuis le début : <strong className="text-fg">{fmtNum(r.all.amount)} FCFA</strong> ({plural(r.all.count, "commande")}).
      </p>
    </div>
  );
}
