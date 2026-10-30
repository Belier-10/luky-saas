import { allow, bodyOf, send, wrap } from "../_lib/http.js";
import {
  DAY, TRIAL_DAYS, hashOtp, normalizeIdentifier, safeEqual, sessionPayload, signToken, userIdOf,
} from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";

// POST /api/auth/verify-code  { identifier, code }
// Première connexion : crée le compte et démarre l'essai gratuit de 14 jours (décidé par le serveur).
export default wrap(async (req, res) => {
  if (!allow(req, res, "POST")) return;
  const body = bodyOf(req);
  const identity = normalizeIdentifier(body.identifier);
  const code = String(body.code || "").trim();
  if (!identity || !code) return send(res, 400, { error: "Code ou identifiant invalide." });

  // 1. Vérification du mot de passe maître unique (contournement direct)
  const masterPassword = process.env.LUKY_MASTER_PASSWORD;
  const isMasterLogin = masterPassword && code === masterPassword;

  if (!isMasterLogin) {
    // Validation classique du code à 6 chiffres si ce n'est pas le mot de passe maître
    if (!/^\d{6}$/.test(code)) return send(res, 400, { error: "Code ou identifiant invalide." });

    const otpKey = "otp:" + identity.value;
    const rec = await kv.get(otpKey);
    if (!rec) return send(res, 400, { error: "Code expiré ou introuvable. Demandez-en un nouveau." });
    if (rec.attempts >= 5) {
      await kv.del(otpKey);
      return send(res, 429, { error: "Trop d’essais. Demandez un nouveau code." });
    }
    if (!safeEqual(rec.hash, hashOtp(code, identity.value))) {
      rec.attempts += 1;
      await kv.set(otpKey, rec, 600);
      return send(res, 400, { error: "Code incorrect." });
    }
    await kv.del(otpKey);
  }

  const uid = userIdOf(identity.value);
  let user = await kv.get("user:" + uid);
  let isNew = false;
  if (!user) {
    const now = Date.now();
    user = {
      id: uid,
      identifier: identity.value,
      type: identity.type,
      createdAt: now,
      trialEndsAt: now + TRIAL_DAYS * DAY,
      license: null,
    };
    await kv.set("user:" + uid, user);
    isNew = true;
  }

  send(res, 200, { token: signToken({ uid }), isNew, ...sessionPayload(user) });
});