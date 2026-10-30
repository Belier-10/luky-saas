import { formatLongDate, plural } from "../../lib/format.js";
import { PLANS } from "../../config.js";
import { BTN_BRAND, BTN_GHOST } from "../ui.jsx";

export default function AccountTab({ session, access, onOpenPaywall, onLogout }) {
  const planLabel = (id) => (PLANS.find((p) => p.id === id) || {}).label || id;
  let statusText;
  if (access.status === "trial") {
    statusText = "Essai gratuit : " + plural(access.daysLeft, "jour") + " restant" + (access.daysLeft > 1 ? "s" : "") +
      " (jusqu’au " + formatLongDate(access.endsAt) + ").";
  } else if (access.plan === "lifetime") {
    statusText = "Licence à vie active. Aucun renouvellement nécessaire.";
  } else {
    statusText = "Abonnement " + planLabel(access.plan).toLowerCase() + " actif jusqu’au " + formatLongDate(access.endsAt) +
      " (" + plural(access.daysLeft, "jour") + " restant" + (access.daysLeft > 1 ? "s" : "") + ").";
  }

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-base font-extrabold">Compte</h3>
        <p className="mt-1 text-sm text-muted">
          {session.user.type === "email" ? "Adresse e-mail" : "Téléphone"} : <span className="font-bold text-fg">{session.user.type === "email" ? session.user.identifier : "+" + session.user.identifier}</span>
        </p>
      </section>
      <section>
        <h3 className="text-base font-extrabold">Abonnement</h3>
        <p className="mt-1 text-sm text-muted">{statusText}</p>
        {access.plan !== "lifetime" && (
          <button type="button" onClick={onOpenPaywall} className={BTN_BRAND + " mt-3 w-full"}>
            {access.status === "trial" ? "Voir les offres" : "Prolonger mon abonnement"}
          </button>
        )}
      </section>
      <section className="border-t border-edge pt-5">
        <button type="button" onClick={onLogout} className={BTN_GHOST + " w-full"}>Se déconnecter</button>
        <p className="mt-2 text-xs text-muted">Vos commandes restent enregistrées sur cet appareil et réapparaissent à la prochaine connexion.</p>
      </section>
    </div>
  );
}
