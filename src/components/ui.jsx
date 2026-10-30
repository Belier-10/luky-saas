import { useEffect, useRef } from "react";
import { STATUSES } from "../config.js";

export const INPUT =
  "w-full rounded-xl border border-edge bg-ink px-3.5 py-3 text-base text-fg placeholder:text-muted/70 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft";

export const BTN_PRIMARY =
  "rounded-xl bg-accent px-4 py-3.5 text-sm font-extrabold text-[#1A0B04] hover:brightness-110 disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white";
export const BTN_BRAND =
  "rounded-xl bg-brand px-4 py-3.5 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft";
export const BTN_GHOST =
  "rounded-xl border border-edge px-4 py-3 text-sm font-bold hover:bg-raised disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft";
export const BTN_DANGER =
  "rounded-xl border border-red-400/40 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

export const STATUS_BADGE = {
  "En attente": "bg-accent/15 text-[#FF9A6B] ring-accent/40",
  "En préparation": "bg-[#6C8EF0]/15 text-[#9DB4FF] ring-[#6C8EF0]/40",
  "Livrée": "bg-[#3DD68C]/15 text-[#6FE8AE] ring-[#3DD68C]/40",
};
export const STATUS_DOT = {
  "En attente": "bg-accent",
  "En préparation": "bg-[#6C8EF0]",
  "Livrée": "bg-[#3DD68C]",
};

/* ---------- Icônes ---------- */
const Svg = ({ children, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
export const IconSearch = () => (<Svg><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Svg>);
export const IconPlus = () => (<Svg><path d="M5 12h14" /><path d="M12 5v14" /></Svg>);
export const IconClose = () => (<Svg><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>);
export const IconChat = () => (<Svg className="h-6 w-6"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Svg>);
export const IconSliders = () => (
  <Svg>
    <path d="M21 4h-7" /><path d="M10 4H3" /><path d="M21 12h-9" /><path d="M8 12H3" />
    <path d="M21 20h-5" /><path d="M12 20H3" /><path d="M14 2v4" /><path d="M8 10v4" /><path d="M16 18v4" />
  </Svg>
);

/* ---------- Composants ---------- */
export function StatusBadge({ status }) {
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset " + STATUS_BADGE[status]}>
      <span className={"h-1.5 w-1.5 rounded-full " + STATUS_DOT[status]} />
      {status}
    </span>
  );
}

export function StatusPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-ink p-1" role="group" aria-label="Statut de la commande">
      {STATUSES.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s)}
            className={
              "rounded-xl px-1 py-2.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
              (active ? "bg-brand text-white" : "text-muted hover:text-fg")
            }
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-muted">{label}</label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted/80">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-red-300">{error}</p>}
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

export function Sheet({ title, onClose, children, wide }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={"sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-edge bg-panel pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl " + (wide ? "sm:max-w-lg" : "sm:max-w-md")}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-panel px-5 pb-3 pt-5">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 text-muted hover:bg-raised hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft"
          >
            <IconClose />
          </button>
        </div>
        <div className="px-5 pb-1">{children}</div>
      </div>
    </div>
  );
}
