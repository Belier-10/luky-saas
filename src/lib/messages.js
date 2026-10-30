import { formatDate, plainFCFA } from "./format.js";

// Variables : {nom} {produit} {montant} {statut} {adresse} {date} {entreprise}
export const DEFAULT_TEMPLATES = {
  "En attente":
    "Bonjour {nom}, nous avons bien reçu votre commande : {produit}, pour un montant de {montant}. Elle est actuellement {statut}. Nous revenons vers vous très vite pour la suite.",
  "En préparation":
    "Bonjour {nom}, votre commande ({produit}, {montant}) est {statut}. Nous vous prévenons dès qu’elle part en livraison à {adresse}.",
  "Livrée":
    "Bonjour {nom}, votre commande ({produit}, {montant}) est marquée comme {statut}. Merci pour votre confiance, n’hésitez pas à nous écrire pour toute question.",
};

// Modèles par défaut de la version précédente : remplacés automatiquement par les nouveaux.
export const OLD_DEFAULT_TEMPLATES = {
  "En attente":
    "Bonjour {nom}, nous avons bien reçu votre commande de {montant}. Elle est actuellement {statut}. Nous revenons vers vous très vite pour la suite.",
  "En préparation":
    "Bonjour {nom}, votre commande de {montant} est {statut}. Nous vous prévenons dès qu’elle part en livraison à {adresse}.",
  "Livrée":
    "Bonjour {nom}, votre commande de {montant} est marquée comme {statut}. Merci pour votre confiance, n’hésitez pas à nous écrire pour toute question.",
};

export function fillTemplate(template, order, company) {
  const values = {
    nom: order.name,
    produit: order.product && order.product.trim() ? order.product.trim() : "votre produit",
    montant: plainFCFA(order.amount),
    statut: String(order.status).toLowerCase(),
    adresse: order.address,
    date: formatDate(order.date),
    entreprise: company && company.name ? company.name : "",
  };
  return String(template).replace(/\{(\w+)\}/g, (match, key) => {
    const k = key.toLowerCase();
    return Object.prototype.hasOwnProperty.call(values, k) ? values[k] : match;
  });
}

export function templateFor(settings, status) {
  const t = settings.templates[status];
  return typeof t === "string" && t.trim() ? t : DEFAULT_TEMPLATES[status];
}
