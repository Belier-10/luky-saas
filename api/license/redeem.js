import { allow, bodyOf, httpError, send, wrap } from "../_lib/http.js";
import { DAY, PLAN_DAYS, requireUser, sessionPayload } from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";

// POST /api/license/redeem  { code }  ->  active l'abonnement correspondant au code (usage unique)
export default wrap(async (req, res) => {
  if (!allow(req, res, "POST")) return;
  const user = await requireUser(req);
  const code = String(bodyOf(req).code || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,30}$/.test(code)) throw httpError(400, "Code invalide.");

  const rec = await kv.get("code:" + code);
  if (!rec) throw httpError(400, "Code invalide.");
  if (user.license && user.license.plan === "lifetime") throw httpError(400, "Vous avez déjà la licence à vie.");

  // Verrou : un code ne peut servir qu'une seule fois, même si deux appareils l'envoient en même temps
  const locked = await kv.setnx("codeused:" + code, { uid: user.id, at: Date.now() });
  if (!locked) throw httpError(400, "Ce code a déjà été utilisé.");

  const now = Date.now();
  if (rec.plan === "lifetime") {
    user.license = { plan: "lifetime", activatedAt: now, expiresAt: null };
  } else {
    const base = Math.max(now, (user.license && user.license.expiresAt) || 0); // la durée s'ajoute à l'abonnement en cours
    user.license = { plan: rec.plan, activatedAt: now, expiresAt: base + PLAN_DAYS[rec.plan] * DAY };
  }
  await kv.set("user:" + user.id, user);
  send(res, 200, sessionPayload(user));
});
