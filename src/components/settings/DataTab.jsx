import { useRef, useState } from "react";
import { readBackupFile } from "../../lib/backup.js";
import { formatDateTime, isIOS, isStandalone, plural } from "../../lib/format.js";
import { BTN_BRAND, BTN_GHOST, BTN_DANGER, BTN_PRIMARY } from "../ui.jsx";

export default function DataTab({ settings, ordersCount, storageStatus, persisted, onExport, onImport, onPersist }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const pick = async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    setError("");
    setPending(null);
    if (!file) return;
    try {
      const data = await readBackupFile(file);
      setPending({ ...data, name: file.name });
    } catch (err) {
      setError((err && err.message) || "Impossible de lire ce fichier.");
    } finally {
      input.value = ""; // permet de re-sélectionner le même fichier
    }
  };

  const run = async (kind) => {
    setBusy(kind);
    try { await onExport(kind); } finally { setBusy(""); }
  };

  const iosTab = isIOS() && !isStandalone();
  let storageText = "Vos données sont enregistrées sur cet appareil.";
  if (persisted === true) storageText = "Stockage durable activé : le navigateur ne l’efface pas automatiquement.";
  if (persisted === false) storageText = "Stockage standard : le navigateur peut l’effacer s’il manque de place ou après une longue période sans usage.";

  return (
    <div className="space-y-6">
      <section aria-labelledby="h-backup">
        <h3 id="h-backup" className="text-base font-extrabold">Sauvegarde et restauration</h3>
        <p className="mt-1 text-sm text-muted">
          Exportez vos commandes pour les garder en sécurité ou les transférer sur un autre téléphone.
          Le fichier JSON contient aussi vos messages et votre logo ; le CSV s’ouvre dans Excel.
        </p>
        <p className="mt-2 text-sm">
          {settings.lastBackupAt ? "Dernière sauvegarde : " + formatDateTime(settings.lastBackupAt) : "Aucune sauvegarde pour l’instant."}
        </p>

        <div className="mt-3 grid gap-2.5">
          <button type="button" onClick={() => run("json")} disabled={Boolean(busy)} className={BTN_BRAND}>
            Exporter une sauvegarde (JSON)
          </button>
          <button type="button" onClick={() => run("csv")} disabled={Boolean(busy) || ordersCount === 0} className={BTN_GHOST}>
            Exporter les commandes (CSV)
          </button>
          <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className={BTN_GHOST}>
            Restaurer depuis un fichier (JSON ou CSV)
          </button>
          <input ref={fileRef} type="file" accept=".json,.csv,application/json,text/csv" onChange={pick} className="hidden" />
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">{error}</p>
        )}

        {pending && (
          <div className="mt-3 rounded-2xl border border-brand-soft/40 bg-brand/15 p-4">
            <p className="break-all text-sm font-bold">{pending.name}</p>
            <p className="mt-1 text-sm text-fg/80">
              Ce fichier contient {plural(pending.orders.length, "commande")}.
              {pending.skipped > 0 ? " Entrées invalides ignorées : " + pending.skipped + "." : ""}
            </p>
            <div className="mt-3 grid gap-2">
              <button type="button" onClick={() => onImport("merge", pending)} className={BTN_PRIMARY}>
                Ajouter à mes commandes
              </button>
              <p className="-mt-1 px-1 text-xs text-muted">
                {pending.kind === "csv"
                  ? "Chaque ligne du fichier devient une nouvelle commande."
                  : "Les commandes déjà présentes sur cet appareil sont conservées."}
              </p>
              <button type="button" onClick={() => onImport("replace", pending)} className={BTN_DANGER}>
                Tout remplacer par ce fichier
              </button>
              <p className="-mt-1 px-1 text-xs text-muted">
                {ordersCount > 0
                  ? "Supprime les " + plural(ordersCount, "commande") + " actuelles."
                  : "Aucune commande actuelle à supprimer."}
              </p>
              <button type="button" onClick={() => setPending(null)} className={BTN_GHOST}>Annuler</button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="h-storage" className="border-t border-edge pt-5">
        <h3 id="h-storage" className="text-base font-extrabold">Stockage sur l’appareil</h3>
        {storageStatus === "memory" ? (
          <p role="alert" className="mt-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">
            Le navigateur bloque l’enregistrement (navigation privée ?). Vos commandes seront perdues à la fermeture : exportez une sauvegarde.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">{storageText}</p>
        )}
        {persisted === false && (
          <button type="button" onClick={onPersist} className={BTN_GHOST + " mt-3"}>Activer le stockage durable</button>
        )}
        {iosTab && (
          <p className="mt-3 text-sm text-muted">
            Sur iPhone, Safari peut effacer les données d’un site peu utilisé. Ajoutez Luky à l’écran d’accueil pour un stockage plus fiable.
          </p>
        )}
      </section>
    </div>
  );
}
