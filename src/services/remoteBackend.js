// Appels vers les fonctions serveur Vercel (dossier /api).
async function call(path, { method = "POST", body, token } = {}) {
  let res;
  try {
    res = await fetch("/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const err = new Error("Connexion impossible. Vérifiez votre accès internet.");
    err.offline = true;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || "Le serveur ne répond pas correctement. Réessayez.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const requestCode = (identifier) => call("/auth/request-code", { body: { identifier } });
export const verifyCode = (identifier, code) => call("/auth/verify-code", { body: { identifier, code } });
export const fetchSession = (token) => call("/auth/session", { method: "GET", token });
export const redeemCode = (token, code) => call("/license/redeem", { token, body: { code } });
