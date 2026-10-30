import { useState } from "react";
import { PLANS, PAYMENT, PROMO_END } from "../config.js";
import { isDemo } from "../services/auth.js";
import { cleanPhone, fmtNum, formatDate, formatFCFA, plainFCFA, todayISO } from "../lib/format.js";
import { Field, INPUT, BTN_PRIMARY, BTN_GHOST } from "./ui.jsx";

const discount = (p) => Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);

export default function Paywall({ blocked, identifier, onClose, onRedeem, onLogout, onExport }) {
  const promo = todayISO() <= PROMO_END;
  const [planId, setPlanId] = useState("yearly");
  const [methodId, setMethodId] = useState(PAYMENT.methods[0].id);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const plan = PLANS.find((p) => p.id === planId);
  const method = PAYMENT.methods.find((m) => m.id === methodId);
  const price = promo ? plan.price : plan.oldPrice;

  const waText =
    "Bonjour, j’ai payé l’offre " + plan.label + " (" + plainFCFA(price) + ") via " + method.name +
    " pour le compte " + identifier + ". ID de la transaction : ";
  const waHref = "https://wa.me/" + cleanPhone(PAYMENT.adminWhatsapp) + "?text=" + encodeURIComponent(waText);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(method.number);
      setNote("Numéro copié.");
    } catch (e) {
      setNote("Copie impossible : recopiez le numéro à la main.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNote("");
    if (!code.trim()) { setError("Entrez le code de validation reçu de l’administrateur."); return; }
    setBusy(true);
    try {
      await onRedeem(code.trim());
      setNote("Accès débloqué. Merci !");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    setError("");
    try {
      const res = await onExport();
      setNote(res === "empty" ? "Aucune commande à exporter." : "Vos données ont été exportées.");
    } catch (e) {
      setError("Export impossible, réessayez.");
    }
  };

  return (
    <div className="min-h-dvh bg-ink pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-xl px-5 pb-16 pt-6">
        <div className="flex items-center justify-between gap-3">
          <img src="/icons/logo-light.png" alt="Luky" className="h-8 w-auto" />
          {!blocked && (
            <button type="button" onClick={onClose} className={BTN_GHOST}>Retour à l’application</button>
          )}
        </div>

        <h1 className="mt-6 text-2xl font-extrabold leading-tight">
          {blocked ? "Votre essai gratuit est terminé" : "Choisir une offre"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {blocked
            ? "Souscrivez à une offre pour retrouver l’accès à vos commandes. Vos données restent sur votre appareil."
            : "Passez à un abonnement à tout moment : la durée s’ajoute à votre essai restant."}
        </p>

        {promo && (
          <div className="mt-5 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3">
            <p className="text-base font-extrabold text-[#FFB08F]">Promotion de fin d’année</p>
            <p className="text-sm text-fg/80">Tarifs réduits jusqu’au {formatDate(PROMO_END)}.</p>
          </div>
        )}

        <div className="mt-5 space-y-3" role="group" aria-label="Offres">
          {PLANS.map((p) => {
            const active = p.id === planId;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPlanId(p.id)}
                className={
                  "w-full rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
                  (active ? "border-brand-soft bg-brand/20" : "border-edge bg-panel hover:bg-raised")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-base font-extrabold">
                      {p.label}
                      {promo && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-[#1A0B04]">
                          -{discount(p)} %
                        </span>
                      )}
                      {p.highlight && (
                        <span className="rounded-full border border-brand-soft/60 px-2 py-0.5 text-xs font-bold text-brand-soft">
                          Le plus choisi
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">{p.note}</p>
                    {p.id === "yearly" && (
                      <p className="text-sm text-muted">Soit {formatFCFA(Math.round(price / 12))} par mois</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {promo && (
                      <p className="text-sm text-muted">
                        <span className="sr-only">Ancien prix : </span>
                        <s>{formatFCFA(p.oldPrice)}</s>
                      </p>
                    )}
                    <p className="text-2xl font-extrabold leading-none">
                      {fmtNum(promo ? p.price : p.oldPrice)}{" "}
                      <span className="text-sm font-bold text-muted">FCFA</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">{p.unit}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <section className="mt-8" aria-labelledby="pay-title">
          <h2 id="pay-title" className="text-lg font-extrabold">Comment payer</h2>

          <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl bg-panel p-1" role="group" aria-label="Moyen de paiement">
            {PAYMENT.methods.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={methodId === m.id}
                onClick={() => setMethodId(m.id)}
                className={
                  "rounded-xl px-3 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
                  (methodId === m.id ? "bg-brand text-white" : "text-muted hover:text-fg")
                }
              >
                {m.name}
              </button>
            ))}
          </div>

          <ol className="mt-4 space-y-4 text-[15px]">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-extrabold">1</span>
              <div className="min-w-0">
                <p>
                  Envoyez <strong>{formatFCFA(price)}</strong> par {method.name} au{" "}
                  <strong className="whitespace-nowrap">{method.number}</strong> ({method.holder}).
                </p>
                <button type="button" onClick={copyNumber} className="mt-2 rounded-lg border border-edge px-3 py-1.5 text-xs font-bold hover:bg-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft">
                  Copier le numéro
                </button>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-extrabold">2</span>
              <div className="min-w-0">
                <p>Envoyez l’ID de la transaction (ou une capture du reçu) à l’administrateur sur WhatsApp.</p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block rounded-lg bg-[#25D366] px-3.5 py-2 text-sm font-extrabold text-[#06210F] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Envoyer la preuve sur WhatsApp
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-extrabold">3</span>
              <p>Vous recevez un code de validation : saisissez-le ci-dessous pour débloquer l’accès.</p>
            </li>
          </ol>

          <form onSubmit={submit} noValidate className="mt-5 space-y-3">
            <Field id="redeem" label="Code de validation" error={error}>
              <input
                id="redeem"
                className={INPUT + " uppercase tracking-wider"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="LUKY-XXXX-XXXX"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <button type="submit" disabled={busy} className={BTN_PRIMARY + " w-full"}>
              {busy ? "Vérification…" : "Débloquer l’accès"}
            </button>
          </form>

          <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-[#6FE8AE]">{note}</p>
          {isDemo && (
            <p className="mt-1 text-xs text-muted">Mode démo : codes de test DEMO-MENSUEL, DEMO-ANNUEL, DEMO-VIE.</p>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-edge pt-5">
          {blocked && onExport && (
            <button type="button" onClick={exportData} className={BTN_GHOST}>Exporter mes données</button>
          )}
          <button type="button" onClick={onLogout} className={BTN_GHOST}>Changer de compte</button>
        </div>
        <p className="mt-3 text-xs text-muted">Connecté avec {identifier}.</p>
      </div>
    </div>
  );
}
