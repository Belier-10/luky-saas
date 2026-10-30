import { useState } from "react";
import { cleanPhone, todayISO } from "../lib/format.js";
import { Sheet, Field, StatusPicker, INPUT, BTN_PRIMARY, BTN_GHOST } from "./ui.jsx";

export default function FormSheet({ initial, onSave, onClose }) {
  const editing = Boolean(initial);
  const [f, setF] = useState(() => ({
    name: initial ? initial.name : "",
    phone: initial ? initial.phone : "",
    product: initial ? initial.product || "" : "",
    amount: initial ? String(initial.amount) : "",
    address: initial ? initial.address : "",
    status: initial ? initial.status : "En attente",
    date: initial ? initial.date : todayISO(),
  }));
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));

  const amount = Number(f.amount);
  const errors = {};
  if (!f.name.trim()) errors.name = "Indiquez le nom du client.";
  if (cleanPhone(f.phone).length < 8) errors.phone = "Entrez un numéro WhatsApp valide, par exemple 242 06 123 45 67.";
  if (!f.product.trim()) errors.product = "Indiquez le produit commandé.";
  if (f.amount === "" || !Number.isFinite(amount) || amount < 0) errors.amount = "Indiquez le montant en FCFA.";
  if (!f.address.trim()) errors.address = "Indiquez l’adresse de livraison.";
  if (!f.date) errors.date = "Indiquez la date de la commande.";
  const show = submitted ? errors : {};

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    onSave({
      name: f.name.trim(),
      phone: f.phone.trim(),
      product: f.product.trim(),
      amount: Math.round(amount),
      address: f.address.trim(),
      status: f.status,
      date: f.date,
    });
  };

  return (
    <Sheet title={editing ? "Modifier la commande" : "Nouvelle commande"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field id="f-name" label="Nom du client" error={show.name}>
          <input id="f-name" className={INPUT} value={f.name} onChange={set("name")} placeholder="Ex. Grâce Mabiala" autoComplete="off" />
        </Field>
        <Field id="f-phone" label="Numéro WhatsApp" error={show.phone}>
          <input id="f-phone" className={INPUT} value={f.phone} onChange={set("phone")} placeholder="242 06 123 45 67" type="tel" inputMode="tel" autoComplete="off" />
        </Field>
        <Field id="f-product" label="Produit commandé" error={show.product}>
          <input id="f-product" className={INPUT} value={f.product} onChange={set("product")} placeholder="Ex. Robe wax taille M, 2 sacs de riz" autoComplete="off" />
        </Field>
        <Field id="f-amount" label="Montant (FCFA)" error={show.amount}>
          <input id="f-amount" className={INPUT} value={f.amount} onChange={set("amount")} placeholder="25000" type="number" inputMode="numeric" min="0" step="1" />
        </Field>
        <Field id="f-address" label="Adresse de livraison" error={show.address}>
          <input id="f-address" className={INPUT} value={f.address} onChange={set("address")} placeholder="Quartier, rue, repère" autoComplete="off" />
        </Field>
        <Field id="f-date" label="Date de la commande" error={show.date}>
          <input id="f-date" className={INPUT} value={f.date} onChange={set("date")} type="date" />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-bold text-muted">Statut</p>
          <StatusPicker value={f.status} onChange={(s) => setF((prev) => ({ ...prev, status: s }))} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Annuler</button>
          <button type="submit" className={BTN_PRIMARY + " col-span-2"}>
            {editing ? "Enregistrer les modifications" : "Ajouter la commande"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
