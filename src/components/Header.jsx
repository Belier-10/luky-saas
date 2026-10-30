import { IconSliders } from "./ui.jsx";

function Brand({ company }) {
  const hasBrand = company.name || company.logo;
  if (!hasBrand) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <img src="/icons/logo-light.png" alt="Luky" className="h-7 w-auto" />
        <h1 className="truncate text-sm font-bold text-muted">Suivi Commandes WhatsApp</h1>
      </div>
    );
  }
  const initial = (company.name || "L").trim().charAt(0).toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-3">
      {company.logo ? (
        <img src={company.logo} alt="" className="h-9 w-9 shrink-0 rounded-xl bg-white/5 object-contain" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-extrabold" aria-hidden="true">
          {initial}
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <h1 className="truncate text-sm font-extrabold">{company.name || "Mon entreprise"}</h1>
        <p className="truncate text-xs text-muted">Luky · Suivi Commandes WhatsApp</p>
      </div>
    </div>
  );
}

export default function Header({ company, access, needsBackup, installEvt, onInstall, onSettings, onUpgrade }) {
  const trial = access.status === "trial";
  const urgent = trial && access.daysLeft <= 3;
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-ink/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <Brand company={company} />
        <div className="flex shrink-0 items-center gap-1">
          {installEvt && (
            <button
              type="button"
              onClick={onInstall}
              className="rounded-full border border-edge px-3.5 py-1.5 text-xs font-bold hover:bg-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft"
            >
              Installer l’appli
            </button>
          )}
          {trial && (
            <button
              type="button"
              onClick={onUpgrade}
              aria-label={"Essai gratuit : " + access.daysLeft + " jour" + (access.daysLeft > 1 ? "s" : "") + " restant" + (access.daysLeft > 1 ? "s" : "") + ". Voir les offres"}
              className={
                "rounded-full border px-2.5 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
                (urgent ? "border-accent/60 text-[#FF9A6B]" : "border-edge text-muted hover:text-fg")
              }
            >
              Essai · {access.daysLeft} j
            </button>
          )}
          <button
            type="button"
            onClick={onSettings}
            aria-label={needsBackup ? "Réglages, sauvegarde conseillée" : "Réglages"}
            className="relative rounded-full p-2 text-muted hover:bg-raised hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft"
          >
            <IconSliders />
            {needsBackup && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-ink" />}
          </button>
        </div>
      </div>
    </header>
  );
}
