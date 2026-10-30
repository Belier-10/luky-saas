import { useEffect, useState } from "react";
import { fetchSession, redeemCode } from "./services/auth.js";
import { computeAccess } from "./services/license.js";
import { loadSession, saveSession, nowMs } from "./services/session.js";
import { readUserData } from "./lib/storage.js";
import { backupToJSON, backupFileName, shareOrDownload } from "./lib/backup.js";
import Landing from "./components/Landing.jsx";
import Paywall from "./components/Paywall.jsx";
import OrdersApp from "./components/OrdersApp.jsx";

// Heure de confiance, rafraîchie chaque minute et au retour sur l'appli
function useNow(dep) {
  const [n, setN] = useState(() => nowMs());
  useEffect(() => { setN(nowMs()); }, [dep]);
  useEffect(() => {
    const tick = () => setN(nowMs());
    const t = setInterval(tick, 60000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return n;
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const now = useNow(session);

  const handleAuthenticated = (r) => {
    const s = {
      token: r.token,
      user: r.user,
      license: r.license,
      offset: r.serverTime - Date.now(),
    };
    saveSession(s);
    setSession(s);
  };

  const logout = () => {
    saveSession(null);
    setSession(null);
  };

  // Vérifie l'abonnement auprès du serveur au démarrage et au retour sur l'appli (hors ligne : on garde la dernière valeur connue)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const r = await fetchSession(session.token);
        if (cancelled) return;
        const next = { ...loadSession(), user: r.user, license: r.license, offset: r.serverTime - Date.now() };
        saveSession(next);
        setSession(next);
      } catch (err) {
        if (err && err.status === 401) logout();
      }
    };
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refresh);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
    };
  }, [session && session.token]);

  const redeem = async (code) => {
    const r = await redeemCode(session.token, code);
    const next = { ...loadSession(), user: r.user, license: r.license, offset: r.serverTime - Date.now() };
    saveSession(next);
    setSession(next);
  };

  // Même bloqué, l'utilisateur peut récupérer ses données
  const exportData = async () => {
    const rec = readUserData(session.user.id);
    if (!rec || rec.data.orders.length === 0) return "empty";
    return shareOrDownload({
      name: backupFileName("json"),
      mime: "application/json",
      text: backupToJSON(rec.data.orders, rec.data.settings),
    });
  };

  if (!session) return <Landing onAuthenticated={handleAuthenticated} />;

  const access = computeAccess(session.license, now);

  if (access.status === "expired") {
    return (
      <Paywall
        blocked
        identifier={session.user.identifier}
        onRedeem={redeem}
        onLogout={logout}
        onExport={exportData}
      />
    );
  }

  return <OrdersApp key={session.user.id} session={session} access={access} onRedeem={redeem} onLogout={logout} />;
}
