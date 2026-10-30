import { allow, send, wrap } from "../_lib/http.js";
import { requireUser, sessionPayload } from "../_lib/auth.js";

// GET /api/auth/session  (Authorization: Bearer <token>)  ->  compte + abonnement + heure du serveur
export default wrap(async (req, res) => {
  if (!allow(req, res, "GET")) return;
  const user = await requireUser(req);
  send(res, 200, sessionPayload(user));
});
