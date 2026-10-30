import { useEffect, useMemo, useRef, useState } from "react";
import { STATUSES, BACKUP_REMINDER_DAYS } from "../config.js";
import { uid, plural } from "../lib/format.js";
import { applyDelivery, filterAndSort } from "../lib/orders.js";
import { DEFAULT_TEMPLATES } from "../lib/messages.js";
import { mergeSettings } from "../lib/settings.js";
import { readUserData, readIdbData, persistUserData } from "../lib/storage.js";
import { backupToJSON, ordersToCSV, shareOrDownload, backupFileName } from "../lib/backup.js";
import { isStandalone } from "../lib/format.js";
import Header from "./Header.jsx";
import Dashboard from "./Dashboard.jsx";
import OrderCard from "./OrderCard.jsx";
import DetailSheet from "./DetailSheet.jsx";
import FormSheet from "./FormSheet.jsx";
import SettingsSheet from "./SettingsSheet.jsx";
import Paywall from "./Paywall.jsx";
import { IconPlus, IconSearch, INPUT, BTN_PRIMARY } from "./ui.jsx";

export default function OrdersApp({ session, access, onRedeem, onLogout }) {
  const userId = session.user.id;
  const [boot] = useState(() => readUserData(userId));

  const [orders, setOrders] = useState(() => (boot ? boot.data.orders : []));
  const [settings, setSettings] = useState(() => (boot ? boot.data.settings : mergeSettings(null)));
  const [hydrated, setHydrated] = useState(Boolean(boot));
  const [storageStatus, setStorageStatus] = useState("ok");
  const [persisted, setPersisted] = useState(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Toutes");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // null | { order: null | Order }
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [toast, setToast] = useState("");
  const [installEvt, setInstallEvt] = useState(null);
  const toastTimer = useRef(null);
  const latest = useRef({});
  latest.current = { orders, settings, hydrated };

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  /* --- Démarrage : si localStorage est vide ou effacé, on tente de récupérer depuis IndexedDB --- */
  useEffect(() => {
    if (boot && boot.source === "legacy") notify("Vos commandes précédentes ont été reprises sur ce compte");
    if (hydrated) return;
    let cancelled = false;
    (async () => {
      const rec = await readIdbData(userId);
      if (cancelled) return;
      if (rec) {
        setOrders(rec.data.orders);
        setSettings(rec.data.settings);
        if (rec.data.orders.length > 0) notify("Commandes récupérées");
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  /* --- Enregistrement automatique (léger délai pour regrouper les modifications) --- */
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(async () => {
      setStorageStatus(await persistUserData(userId, orders, settings));
    }, 300);
    return () => clearTimeout(t);
  }, [orders, settings, hydrated]);

  /* --- Enregistrement immédiat quand l'appli passe en arrière-plan ou se ferme (iOS/Android) --- */
  useEffect(() => {
    const flush = () => {
      const l = latest.current;
      if (l.hydrated) persistUserData(userId, l.orders, l.settings);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  /* --- Stockage durable : demandé automatiquement seulement si l'appli est installée --- */
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        if (!(navigator.storage && navigator.storage.persisted)) return;
        let p = await navigator.storage.persisted();
        if (!p && isStandalone() && navigator.storage.persist) p = await navigator.storage.persist();
        setPersisted(Boolean(p));
      } catch (e) {}
    })();
  }, [hydrated]);

  const requestPersist = async () => {
    try {
      const p = await navigator.storage.persist();
      setPersisted(Boolean(p));
      notify(p ? "Stockage durable activé" : "Le navigateur n’a pas accepté");
    } catch (e) {
      notify("Activation impossible");
    }
  };

  /* --- Installation PWA --- */
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch (e) {}
    setInstallEvt(null);
  };

  /* --- Données affichées --- */
  const counts = useMemo(() => {
    const c = { Toutes: orders.length };
    STATUSES.forEach((s) => { c[s] = orders.filter((o) => o.status === s).length; });
    return c;
  }, [orders]);

  const visible = useMemo(() => filterAndSort(orders, { filter, query, sortDir }), [orders, filter, query, sortDir]);
  const selected = orders.find((o) => o.id === selectedId) || null;

  const lastBackup = settings.lastBackupAt;
  const needsBackup = orders.length > 0 && (!lastBackup || Date.now() - lastBackup > BACKUP_REMINDER_DAYS * 86400000);

  /* --- Actions --- */
  const saveOrder = (data) => {
    if (form && form.order) {
      const id = form.order.id;
      setOrders((os) => os.map((o) => (o.id === id ? applyDelivery(o, { ...o, ...data }) : o)));
      notify("Commande modifiée");
    } else {
      setOrders((os) => [applyDelivery(null, { id: uid(), ...data }), ...os]);
      notify("Commande ajoutée");
    }
    setForm(null);
  };

  const changeStatus = (status) => {
    setOrders((os) => os.map((o) => (o.id === selectedId ? applyDelivery(o, { ...o, status }) : o)));
    notify("Statut mis à jour");
  };

  const deleteOrder = () => {
    setOrders((os) => os.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    notify("Commande supprimée");
  };

  const setTemplate = (status, text) =>
    setSettings((s) => ({ ...s, templates: { ...s.templates, [status]: text } }));
  const resetTemplates = () => {
    setSettings((s) => ({ ...s, templates: { ...DEFAULT_TEMPLATES } }));
    notify("Messages rétablis");
  };
  const setCompany = (company) => setSettings((s) => ({ ...s, company }));

  const doExport = async (kind) => {
    try {
      const text = kind === "csv" ? ordersToCSV(orders) : backupToJSON(orders, settings);
      const mime = kind === "csv" ? "text/csv;charset=utf-8" : "application/json";
      const res = await shareOrDownload({ name: backupFileName(kind), mime, text });
      if (res === "cancelled") return;
      if (kind === "json") setSettings((s) => ({ ...s, lastBackupAt: Date.now() }));
      notify(kind === "csv" ? "Fichier CSV exporté" : "Sauvegarde exportée");
    } catch (e) {
      notify("Export impossible, réessayez");
    }
  };

  const doImport = (mode, data) => {
    if (mode === "replace") {
      setOrders(data.orders);
      if (data.settings) setSettings((s) => ({ ...s, templates: data.settings.templates, company: data.settings.company }));
      notify("Fichier restauré : " + plural(data.orders.length, "commande"));
    } else {
      const ids = new Set(orders.map((o) => o.id));
      const added = data.orders.filter((o) => !ids.has(o.id));
      if (added.length > 0) setOrders((os) => [...added, ...os]);
      notify(
        added.length > 0
          ? plural(added.length, "commande") + " ajoutée" + (added.length > 1 ? "s" : "")
          : "Aucune nouvelle commande à ajouter"
      );
    }
    setShowSettings(false);
  };

  const redeem = async (code) => {
    await onRedeem(code);
    setShowPaywall(false);
    notify("Abonnement activé");
  };

  if (showPaywall) {
    return (
      <Paywall
        blocked={false}
        identifier={session.user.identifier}
        onClose={() => setShowPaywall(false)}
        onRedeem={redeem}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <Header
        company={settings.company}
        access={access}
        needsBackup={needsBackup}
        installEvt={installEvt}
        onInstall={install}
        onSettings={() => setShowSettings(true)}
        onUpgrade={() => setShowPaywall(true)}
      />

      {storageStatus === "memory" && (
        <div role="alert" className="mx-auto max-w-2xl px-4 pt-3">
          <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            Le navigateur bloque l’enregistrement des données (navigation privée ?). Exportez une sauvegarde dans les réglages pour ne rien perdre.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 pt-4">
        {/* Recherche */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><IconSearch /></span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, un produit, un numéro"
            aria-label="Rechercher une commande par nom, produit, numéro ou adresse"
            className={INPUT + " pl-11"}
          />
        </div>

        {/* Filtres */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtrer par statut">
          {["Toutes", ...STATUSES].map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(s)}
                className={
                  "shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
                  (active ? "border-brand bg-brand text-white" : "border-edge text-muted hover:text-fg")
                }
              >
                {s} <span className={active ? "text-white/80" : "text-muted/80"}>{counts[s]}</span>
              </button>
            );
          })}
        </div>

        {/* Tableau de bord : suit la recherche et les filtres */}
        {hydrated && orders.length > 0 && <Dashboard orders={visible} filter={filter} query={query} />}

        {/* Tri chronologique */}
        {hydrated && orders.length > 0 && (
          <div className="mb-3 mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{plural(visible.length, "commande")}</p>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="rounded-full border border-edge px-3 py-1.5 text-xs font-bold text-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft"
            >
              {sortDir === "desc" ? "Plus récentes d’abord" : "Plus anciennes d’abord"}
            </button>
          </div>
        )}

        {/* Liste */}
        <div className={orders.length > 0 ? "" : "mt-4"}>
          {!hydrated ? (
            <p className="py-10 text-center text-sm text-muted">Chargement des commandes…</p>
          ) : visible.length > 0 ? (
            <ul className="space-y-3" data-testid="order-list">
              {visible.map((o) => (
                <OrderCard key={o.id} order={o} onOpen={setSelectedId} />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-edge px-6 py-10 text-center">
              {orders.length === 0 ? (
                <>
                  <p className="font-extrabold">Aucune commande pour l’instant</p>
                  <p className="mt-1 text-sm text-muted">Ajoutez votre première commande, ou restaurez une sauvegarde dans les réglages.</p>
                  <button type="button" onClick={() => setForm({ order: null })} className={BTN_PRIMARY + " mt-4"}>
                    Ajouter une commande
                  </button>
                </>
              ) : (
                <>
                  <p className="font-extrabold">Aucune commande trouvée</p>
                  <p className="mt-1 text-sm text-muted">Modifiez la recherche ou changez de filtre.</p>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bouton d'ajout */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-2xl justify-end px-4">
          <button
            type="button"
            onClick={() => setForm({ order: null })}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-extrabold text-[#1A0B04] shadow-lg shadow-black/40 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <IconPlus />
            Nouvelle commande
          </button>
        </div>
      </div>

      {selected && !form && !showSettings && (
        <DetailSheet
          order={selected}
          settings={settings}
          onClose={() => setSelectedId(null)}
          onEdit={() => setForm({ order: selected })}
          onStatus={changeStatus}
          onDelete={deleteOrder}
        />
      )}

      {form && <FormSheet initial={form.order} onSave={saveOrder} onClose={() => setForm(null)} />}

      {showSettings && (
        <SettingsSheet
          session={session}
          access={access}
          settings={settings}
          orders={orders}
          storageStatus={storageStatus}
          persisted={persisted}
          onClose={() => setShowSettings(false)}
          onOpenPaywall={() => { setShowSettings(false); setShowPaywall(true); }}
          onLogout={onLogout}
          onCompany={setCompany}
          onTemplate={setTemplate}
          onResetTemplates={resetTemplates}
          onExport={doExport}
          onImport={doImport}
          onPersist={requestPersist}
        />
      )}

      <div
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <p className="rounded-full border border-edge bg-raised px-4 py-2 text-sm font-bold shadow-lg shadow-black/40">{toast}</p>
        )}
      </div>
    </div>
  );
}
