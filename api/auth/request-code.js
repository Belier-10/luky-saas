import { allow, bodyOf, send, wrap } from "../_lib/http.js";
import { hashOtp, normalizeIdentifier, randomCode } from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";
import { deliverCode } from "../_lib/notify.js";

// POST /api/auth/request-code  { identifier }  ->  envoie un code à 6 chiffres (valable 10 min)
export default wrap(async (req, res) => {
  if (!allow(req, res, "POST")) return;
  const identity = normalizeIdentifier(bodyOf(req).identifier);
  if (!identity) return send(res, 400, { error: "Entrez un e-mail ou un numéro de téléphone valide." });

  // Limite : 5 demandes par 15 minutes et par identifiant
  const n = await kv.incr("rl:" + identity.value, 900);
  if (n > 5) return send(res, 429, { error: "Trop de demandes. Réessayez dans 15 minutes." });

  const code = randomCode();
  await kv.set("otp:" + identity.value, { hash: hashOtp(code, identity.value), attempts: 0 }, 600);

  const echo = process.env.LUKY_DEV_ECHO === "1" && !process.env.VERCEL_ENV?.startsWith("prod");
  if (!echo) await deliverCode(identity, code);

  send(res, 200, { sent: true, channel: identity.type, ...(echo ? { devCode: code } : {}) });
});
