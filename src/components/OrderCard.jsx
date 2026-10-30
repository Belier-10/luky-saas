import { formatDate, formatFCFA } from "../lib/format.js";
import { StatusBadge } from "./ui.jsx";

export default function OrderCard({ order, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(order.id)}
        className="w-full rounded-2xl border border-edge bg-panel p-4 text-left transition-colors hover:bg-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold">{order.name}</p>
            <p className="text-sm text-muted">{order.phone}</p>
          </div>
          <p className="shrink-0 text-base font-extrabold">{formatFCFA(order.amount)}</p>
        </div>
        {order.product && <p className="mt-2 truncate text-sm font-semibold">{order.product}</p>}
        <p className={"truncate text-sm text-fg/80" + (order.product ? "" : " mt-2")}>{order.address}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <StatusBadge status={order.status} />
          <span className="text-xs text-muted">{formatDate(order.date)}</span>
        </div>
      </button>
    </li>
  );
}
