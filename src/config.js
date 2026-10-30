// Réglages généraux de Luky. Les valeurs VITE_* se définissent dans .env (ou dans Vercel).

// "demo" : tout en local, sans serveur (tests). "remote" : fonctions /api (production).
export const BACKEND =
  import.meta.env.VITE_BACKEND || (import.meta.env.DEV ? "demo" : "remote");

export const TRIAL_DAYS = 14;
export const DEFAULT_COUNTRY_CODE = "242"; // Congo-Brazzaville
export const BACKUP_REMINDER_DAYS = 7;
export const STATUSES = ["En attente", "En préparation", "Livrée"];

// Promotion de fin d'année : jusqu'à cette date (incluse), les nouveaux prix s'affichent.
export const PROMO_END = import.meta.env.VITE_PROMO_END || "2026-12-31";

export const PLANS = [
  { id: "monthly", label: "Mensuel", unit: "/ mois", oldPrice: 5000, price: 3500, days: 30,
    note: "À renouveler chaque mois" },
  { id: "yearly", label: "Annuel", unit: "/ an", oldPrice: 45000, price: 30000, days: 365,
    note: "12 mois d’accès", highlight: true },
  { id: "lifetime", label: "Licence à vie", unit: "paiement unique", oldPrice: 120000, price: 95000, days: null,
    note: "Aucun renouvellement" },
];

export const PAYMENT = {
  adminWhatsapp: import.meta.env.VITE_ADMIN_WHATSAPP || "242060000000",
  methods: [
    {
      id: "airtel",
      name: "Airtel Money",
      number: import.meta.env.VITE_AIRTEL_NUMBER || "05 000 00 00",
      holder: import.meta.env.VITE_AIRTEL_HOLDER || "Nom du titulaire",
    },
    {
      id: "mtn",
      name: "MTN Mobile Money",
      number: import.meta.env.VITE_MTN_NUMBER || "06 000 00 00",
      holder: import.meta.env.VITE_MTN_HOLDER || "Nom du titulaire",
    },
  ],
};
