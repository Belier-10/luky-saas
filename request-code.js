import { allow, bodyOf, send, wrap } from "../_lib/http.js";
import { normalizeIdentifier } from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";

// POST /api/auth/request-code  { identifier }
export default wrap(async (req, res) => {
  if (!allow(req, res, "POST")) return;
  const identity = normalizeIdentifier(bodyOf(req).identifier);
  if (!identity) return send(res, 400, { error: "Entrez un e-mail valide." });

  // Limite : 5 demandes par 15 minutes et par identifiant
  const n = await kv.incr("rl:" + identity.value, 900);
  if (n > 5) return send(res, 429, { error: "Trop de demandes. Réessayez dans 15 minutes." });

  // Mode contournement par mot de passe maître : on valide la demande instantanément
  send(res, 200, { 
    sent: true, 
    channel: identity.type, 
    devCode: process.env.LUKY_MASTER_PASSWORD ? "MAÎTRE_ACTIF" : undefined 
  });
});