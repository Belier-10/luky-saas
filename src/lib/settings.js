import { STATUSES } from "../config.js";
import { DEFAULT_TEMPLATES, OLD_DEFAULT_TEMPLATES } from "./messages.js";

const LOGO_RE = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/;

// Réglages d'un compte : modèles de messages, marque blanche, date de dernière sauvegarde
export function mergeSettings(raw) {
  const src = raw && raw.templates && typeof raw.templates === "object" ? raw.templates : {};
  const templates = {};
  STATUSES.forEach((s) => {
    const custom = typeof src[s] === "string" && src[s].trim() && src[s] !== OLD_DEFAULT_TEMPLATES[s];
    templates[s] = custom ? src[s] : DEFAULT_TEMPLATES[s];
  });
  const last = raw ? Number(raw.lastBackupAt) : 0;
  const c = raw && raw.company && typeof raw.company === "object" ? raw.company : {};
  const company = {
    name: typeof c.name === "string" ? c.name.slice(0, 60) : "",
    logo: typeof c.logo === "string" && LOGO_RE.test(c.logo) && c.logo.length < 400000 ? c.logo : "",
  };
  return { templates, lastBackupAt: last > 0 ? last : 0, company };
}
