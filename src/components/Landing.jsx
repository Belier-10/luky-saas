import { useEffect, useState } from "react";
import { requestCode, verifyCode, isDemo } from "../services/auth.js";
import { parseIdentifier } from "../lib/format.js";
import { TRIAL_DAYS } from "../config.js";
import { Field, INPUT, BTN_PRIMARY, BTN_GHOST } from "./ui.jsx";

const BENEFITS = [
  "Suivez chaque commande : produit, montant, adresse et statut.",
  "Écrivez au client sur WhatsApp en un clic, avec un message déjà prêt.",
  "Voyez votre chiffre d’affaires du jour, de la semaine et du mois.",
];

export default function Landing({ onAuthenticated }) {
  const [method, setMethod] = useState("email");
  const [value, setValue] = useState("");
  const [step, setStep] = useState("identify"); // identify | code
  const [identity, setIdentity] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (e) => {
    if (e) e.preventDefault();
    setError("");
    const id = step === "code" ? identity : parseIdentifier(value);
    if (!id || (step === "identify" && id.type !== method)) {
      setError(
        method === "email"
          ? "Entrez une adresse e-mail valide."
          : "Entrez un numéro de téléphone valide, par exemple 242 06 123 45 67."
      );
      return;
    }
    setBusy(true);
    try {
      const r = await requestCode(id.value);
      setIdentity(id);
      setStep("code");
      setCode("");
      setDemoCode(r.devCode || "");
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    const c = code.trim();
    if (!/^\d{6}$/.test(c)) { setError("Entrez le code à 6 chiffres."); return; }
    setBusy(true);
    try {
      const r = await verifyCode(identity.value, c);
      onAuthenticated(r);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const back = () => { setStep("identify"); setError(""); setCode(""); };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <img src="/icons/logo-light.png" alt="Luky" className="h-10 w-auto self-start" />
      <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight">
        Vos commandes WhatsApp, enfin sous contrôle.
      </h1>
      <ul className="mt-5 space-y-2.5 text-[15px] text-fg/85">
        {BENEFITS.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-3xl border border-edge bg-panel p-5" aria-labelledby="auth-title">
        <h2 id="auth-title" className="text-lg font-extrabold">
          {step === "identify" ? "Créer un compte ou se connecter" : "Entrez votre code"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {step === "identify"
            ? TRIAL_DAYS + " jours d’essai gratuit avec toutes les fonctions, sans paiement. Nous vous envoyons un code de confirmation."
            : "Code envoyé à " + (identity.type === "email" ? identity.value : "+" + identity.value) + "."}
        </p>

        {isDemo && (
          <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs text-[#FFB08F]">
            Mode démo : aucun message n’est envoyé, le code s’affiche à l’écran. Réservé aux tests.
          </p>
        )}

        {step === "identify" ? (
          <form onSubmit={send} noValidate className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-ink p-1" role="group" aria-label="Méthode de connexion">
              {[["email", "E-mail"], ["phone", "Téléphone"]].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={method === id}
                  onClick={() => { setMethod(id); setValue(""); setError(""); }}
                  className={
                    "rounded-xl px-3 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
                    (method === id ? "bg-brand text-white" : "text-muted hover:text-fg")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <Field id="auth-id" label={method === "email" ? "Adresse e-mail" : "Numéro de téléphone"} error={error}>
              <input
                id="auth-id"
                className={INPUT}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={method === "email" ? "email" : "tel"}
                inputMode={method === "email" ? "email" : "tel"}
                autoComplete={method === "email" ? "email" : "tel"}
                placeholder={method === "email" ? "vous@exemple.com" : "242 06 123 45 67"}
              />
            </Field>
            <button type="submit" disabled={busy} className={BTN_PRIMARY + " w-full"}>
              {busy ? "Envoi en cours…" : "Recevoir mon code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} noValidate className="mt-4 space-y-4">
            {demoCode && (
              <p className="rounded-xl bg-ink px-3.5 py-3 text-sm">
                Votre code (mode démo) : <strong className="tracking-widest">{demoCode}</strong>
              </p>
            )}
            <Field id="auth-code" label="Code de confirmation" error={error}>
              <input
                id="auth-code"
                className={INPUT + " text-center text-xl tracking-[0.4em]"}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
              />
            </Field>
            <button type="submit" disabled={busy} className={BTN_PRIMARY + " w-full"}>
              {busy ? "Vérification…" : "Valider"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={back} className={BTN_GHOST}>Modifier</button>
              <button type="button" onClick={send} disabled={busy || cooldown > 0} className={BTN_GHOST}>
                {cooldown > 0 ? "Renvoyer (" + cooldown + " s)" : "Renvoyer le code"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
