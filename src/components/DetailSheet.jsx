import { useEffect, useState } from "react";
import { formatDate, formatFCFA, waLink } from "../lib/format.js";
import { fillTemplate, templateFor } from "../lib/messages.js";
import { Sheet, StatusBadge, StatusPicker, InfoRow, IconChat, INPUT, BTN_GHOST, BTN_DANGER } from "./ui.jsx";

export default function DetailSheet({ order, settings, onClose, onEdit, onStatus, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const template = templateFor(settings, order.status);
  const company = settings.company;
  const [msg, setMsg] = useState(() => fillTemplate(template, order, company));

  // Le message se régénère quand le statut ou les infos de la commande changent
  useEffect(() => {
    setMsg(fillTemplate(template, order, company));
  }, [order.id, order.status, order.name, order.product, order.amount, order.address, order.date, template, company.name]);

  return (
    <Sheet title="Détail de la commande" onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-tight">{order.name}</p>
          <p className="mt-0.5 text-sm text-muted">{order.phone}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight">{formatFCFA(order.amount)}</p>

      <dl className="mt-4 divide-y divide-edge rounded-2xl border border-edge bg-raised/50 text-sm">
        <InfoRow label="Produit commandé" value={order.product || "Non précisé"} />
        <InfoRow label="Adresse de livraison" value={order.address} />
        <InfoRow label="Date de la commande" value={formatDate(order.date)} />
        {order.status === "Livrée" && (
          <InfoRow label="Date de livraison" value={formatDate(order.deliveredAt || order.date)} />
        )}
      </dl>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-muted">Changer le statut</p>
        <StatusPicker value={order.status} onChange={onStatus} />
      </div>

      <div className="mt-5">
        <label htmlFor="wa-msg" className="mb-1.5 block text-sm font-bold text-muted">Message WhatsApp</label>
        <textarea
          id="wa-msg"
          rows={4}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className={INPUT + " min-h-[6rem] resize-y"}
        />
        <p className="mt-1.5 text-xs text-muted/80">Le message suit le statut. Vous pouvez le modifier avant l’envoi.</p>
      </div>

      <a
        href={waLink(order.phone, msg)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-4 py-4 text-base font-extrabold text-[#06210F] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <IconChat />
        Contacter sur WhatsApp
      </a>

      {!confirming ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onEdit} className={BTN_GHOST}>Modifier</button>
          <button type="button" onClick={() => setConfirming(true)} className={BTN_DANGER}>Supprimer</button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
          <p className="text-sm font-semibold">Supprimer la commande de {order.name} ? Cette action est définitive.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setConfirming(false)} className={BTN_GHOST}>Annuler</button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl bg-red-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
