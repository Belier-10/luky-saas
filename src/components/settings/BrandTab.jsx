import { useRef, useState } from "react";
import { Field, INPUT, BTN_GHOST, BTN_DANGER } from "../ui.jsx";

// Réduit l'image à 192 px max et la convertit en PNG (léger, stocké dans les réglages)
async function fileToLogo(file) {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez un fichier image (PNG, JPG, WebP).");
  if (file.size > 5 * 1024 * 1024) throw new Error("Cette image est trop lourde (5 Mo maximum).");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Impossible de lire cette image."));
      i.src = url;
    });
    const iw = img.naturalWidth || 192;
    const ih = img.naturalHeight || 192;
    const ratio = Math.min(1, 192 / Math.max(iw, ih));
    const w = Math.max(1, Math.round(iw * ratio));
    const h = Math.max(1, Math.round(ih * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function BrandTab({ company, onChange }) {
  const fileRef = useRef(null);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    setError("");
    if (!file) return;
    try {
      onChange({ ...company, logo: await fileToLogo(file) });
    } catch (err) {
      setError((err && err.message) || "Logo impossible à charger.");
    } finally {
      input.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-base font-extrabold">Votre entreprise</h3>
        <p className="mt-1 text-sm text-muted">
          Le nom et le logo s’affichent en haut de l’application, à côté de la mention Luky.
        </p>
      </section>

      <Field id="brand-name" label="Nom de l’entreprise">
        <input
          id="brand-name"
          className={INPUT}
          value={company.name}
          maxLength={60}
          onChange={(e) => onChange({ ...company, name: e.target.value })}
          placeholder="Ex. Boutique Grâce"
          autoComplete="organization"
        />
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-bold text-muted">Logo</p>
        <div className="flex items-center gap-4">
          {company.logo ? (
            <img src={company.logo} alt="Logo actuel" className="h-16 w-16 rounded-2xl bg-white/5 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-edge text-xs text-muted">Aucun</div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className={BTN_GHOST}>
              {company.logo ? "Changer le logo" : "Ajouter un logo"}
            </button>
            {company.logo && (
              <button type="button" onClick={() => onChange({ ...company, logo: "" })} className={BTN_DANGER}>Retirer</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      </div>

      <p className="text-xs text-muted">
        Astuce : dans les messages WhatsApp, la variable <code className="rounded bg-ink px-1.5 py-0.5 text-brand-soft">{"{entreprise}"}</code> insère le nom de votre entreprise.
      </p>
    </div>
  );
}
