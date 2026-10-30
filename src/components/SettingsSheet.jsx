import { useState } from "react";
import { Sheet } from "./ui.jsx";
import AccountTab from "./settings/AccountTab.jsx";
import BrandTab from "./settings/BrandTab.jsx";
import ReportsTab from "./settings/ReportsTab.jsx";
import DataTab from "./settings/DataTab.jsx";
import MessagesTab from "./settings/MessagesTab.jsx";

const TABS = [
  ["account", "Compte"],
  ["brand", "Entreprise"],
  ["reports", "Rapports"],
  ["data", "Données"],
  ["messages", "Messages"],
];

export default function SettingsSheet({ initialTab = "account", onClose, ...p }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <Sheet title="Réglages" onClose={onClose} wide>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label="Sections des réglages">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            id={"tab-" + id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={"panel-" + id}
            onClick={() => setTab(id)}
            className={
              "shrink-0 rounded-full border px-3.5 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft " +
              (tab === id ? "border-brand bg-brand text-white" : "border-edge text-muted hover:text-fg")
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div id={"panel-" + tab} role="tabpanel" aria-labelledby={"tab-" + tab} className="pb-3">
        {tab === "account" && (
          <AccountTab session={p.session} access={p.access} onOpenPaywall={p.onOpenPaywall} onLogout={p.onLogout} />
        )}
        {tab === "brand" && <BrandTab company={p.settings.company} onChange={p.onCompany} />}
        {tab === "reports" && <ReportsTab orders={p.orders} />}
        {tab === "data" && (
          <DataTab
            settings={p.settings}
            ordersCount={p.orders.length}
            storageStatus={p.storageStatus}
            persisted={p.persisted}
            onExport={p.onExport}
            onImport={p.onImport}
            onPersist={p.onPersist}
          />
        )}
        {tab === "messages" && <MessagesTab settings={p.settings} onTemplate={p.onTemplate} onReset={p.onResetTemplates} />}
      </div>
    </Sheet>
  );
}
