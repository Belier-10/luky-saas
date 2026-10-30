import { STATUSES } from "../../config.js";
import { Field, INPUT, BTN_GHOST } from "../ui.jsx";

const VARS = ["nom", "produit", "montant", "statut", "adresse", "date", "entreprise"];

export default function MessagesTab({ settings, onTemplate, onReset }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-base font-extrabold">Messages WhatsApp</h3>
        <p className="mt-1 text-sm text-muted">
          Un modèle par statut. Variables disponibles :{" "}
          {VARS.map((v) => (
            <code key={v} className="mr-1 rounded bg-ink px-1.5 py-0.5 text-xs text-brand-soft">{"{" + v + "}"}</code>
          ))}
        </p>
      </section>
      {STATUSES.map((s) => (
        <Field key={s} id={"tpl-" + s} label={"Quand la commande est " + s.toLowerCase()}>
          <textarea
            id={"tpl-" + s}
            rows={4}
            value={settings.templates[s]}
            onChange={(e) => onTemplate(s, e.target.value)}
            className={INPUT + " min-h-[6rem] resize-y"}
          />
        </Field>
      ))}
      <button type="button" onClick={onReset} className={BTN_GHOST}>Rétablir les messages par défaut</button>
    </div>
  );
}
