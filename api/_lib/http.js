// Petits utilitaires HTTP partagés par les fonctions serveur.
export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function allow(req, res, method) {
  if (req.method !== method) {
    res.setHeader("Allow", method);
    send(res, 405, { error: "Méthode non autorisée." });
    return false;
  }
  return true;
}

export function bodyOf(req) {
  let b = req.body;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch (e) { b = {}; }
  }
  return b && typeof b === "object" ? b : {};
}

export function bearer(req) {
  const h = (req.headers && req.headers.authorization) || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

// Attrape les erreurs : les erreurs "httpError" sont renvoyées telles quelles, les autres masquées.
export function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (!e.status) console.error(e);
      send(res, e.status || 500, { error: e.status ? e.message : "Erreur serveur. Réessayez." });
    }
  };
}
