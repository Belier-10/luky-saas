import { randomInt } from "node:crypto";
import { allow, bodyOf, httpError, send, wrap } from "../_lib/http.js";
import { PLANS, safeEqual } from "../_lib/auth.js";
import { kv } from "../_lib/kv.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter les confusions
const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join("");

// POST /api/admin/generate-code  { plan: "monthly"|"yearly"|"lifetime", count?: 1..50 }
// En-tête requis : x-admin-secret = ADMIN_SECRET
export default wrap(async (req, res) => {
  if (!allow(req, res, "POST")) return;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || adminSecret.length < 12) throw httpError(500, "Serveur non configuré (ADMIN_SECRET manquant ou trop court).");
  const provided = (req.headers && req.headers["x-admin-secret"]) || "";
  if (!safeEqual(provided, adminSecret)) throw httpError(401, "Accès refusé.");

  const body = bodyOf(req);
  if (!PLANS.includes(body.plan)) throw httpError(400, "Offre invalide (monthly, yearly ou lifetime).");
  const count = Math.min(50, Math.max(1, parseInt(body.count, 10) || 1));

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = "LUKY-" + block() + "-" + block();
    await kv.set("code:" + code, { plan: body.plan, createdAt: Date.now() });
    codes.push(code);
  }
  send(res, 200, { plan: body.plan, codes });
});
