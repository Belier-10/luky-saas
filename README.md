# Luky : suivi de commandes WhatsApp (version 4)

Application web installable (PWA) en **React + Tailwind (Vite)**, avec connexion par code, essai gratuit de 14 jours,
abonnements payables par Airtel Money / MTN Mobile Money, marque blanche et rapports de chiffre d'affaires.
Le front-end et les fonctions serveur se déploient ensemble sur **Vercel**.

## 1. Structure des fichiers et liens entre eux

```
luky/
├─ index.html                  Point d'entrée : charge /src/main.jsx, déclare le manifest et les icônes iOS/Android
├─ package.json                Dépendances et commandes (dev, build)
├─ vite.config.js              Configuration Vite (plugin React)
├─ tailwind.config.js          Couleurs de la marque, fichiers analysés par Tailwind
├─ postcss.config.js           Active Tailwind + Autoprefixer
├─ vercel.json                 En-têtes (pas de cache pour le service worker et le manifest)
├─ .env.example                Toutes les variables à renseigner (copier en .env)
│
├─ public/                     Fichiers copiés tels quels à la racine du site
│  ├─ manifest.json            PWA : nom, couleurs, icônes
│  ├─ service-worker.js        PWA : cache, mode hors ligne
│  ├─ admin.html               Petite page pour générer les codes de validation
│  └─ icons/                   Icônes 192/512, maskable, apple-touch, favicon, logo
│
├─ src/                        L'application (côté navigateur)
│  ├─ main.jsx                 Démarre React, charge styles.css, enregistre le service worker
│  ├─ styles.css               Tailwind + styles globaux (fond, police, animations)
│  ├─ config.js                Prix, promo, durée d'essai, numéros de paiement, statuts
│  ├─ App.jsx                  Chef d'orchestre : session → écran de connexion / paywall / application
│  ├─ components/
│  │  ├─ Landing.jsx           Accueil + inscription/connexion (e-mail ou téléphone + code)
│  │  ├─ Paywall.jsx           Écran d'abonnement : promo, prix barrés, instructions Airtel/MTN, code
│  │  ├─ OrdersApp.jsx         L'application : commandes, recherche, filtres, tri, stockage
│  │  ├─ Header.jsx            En-tête : marque blanche + compteur de jours d'essai
│  │  ├─ Dashboard.jsx         Chiffre d'affaires des commandes affichées
│  │  ├─ OrderCard.jsx · DetailSheet.jsx · FormSheet.jsx   Liste, fiche (WhatsApp), formulaire
│  │  ├─ SettingsSheet.jsx     Réglages à onglets, qui assemble :
│  │  │  └─ settings/AccountTab · BrandTab · ReportsTab · DataTab · MessagesTab
│  │  └─ ui.jsx                Boutons, champs, fenêtres, icônes réutilisables
│  ├─ services/
│  │  ├─ auth.js               Choisit le serveur réel (remoteBackend) ou le mode démo (demoBackend)
│  │  ├─ remoteBackend.js      Appelle les fonctions /api
│  │  ├─ demoBackend.js        Simule le serveur dans le navigateur (tests uniquement)
│  │  ├─ license.js            Calcule l'état : essai / abonné / bloqué
│  │  └─ session.js            Session enregistrée + horloge de confiance
│  └─ lib/                     Logique pure, sans interface
│     ├─ format.js · messages.js · orders.js · settings.js
│     ├─ reports.js            CA livré par jour / semaine / mois
│     ├─ storage.js            localStorage + IndexedDB + copie de secours
│     └─ backup.js             Export/import JSON et CSV
│
└─ api/                        Fonctions serveur Vercel (Node)
   ├─ auth/request-code.js     Envoie le code par e-mail ou SMS/WhatsApp
   ├─ auth/verify-code.js      Vérifie le code, crée le compte, démarre l'essai de 14 jours
   ├─ auth/session.js          Renvoie le compte, l'abonnement et l'heure du serveur
   ├─ license/redeem.js        Active l'abonnement avec un code de validation (usage unique)
   ├─ admin/generate-code.js   Génère les codes (protégé par ADMIN_SECRET)
   └─ _lib/                    http.js · kv.js (base Upstash Redis) · auth.js · notify.js (Resend, Twilio)
```

**Le trajet d'un utilisateur**

1. `index.html` charge `main.jsx`, qui affiche `App.jsx`.
2. Sans session, `App.jsx` affiche `Landing.jsx`. Elle appelle `services/auth.js`, qui appelle `/api/auth/request-code` puis `/api/auth/verify-code`.
3. Le serveur crée le compte et fixe la fin de l'essai à **maintenant + 14 jours**. Le navigateur reçoit un jeton signé et l'état de l'abonnement.
4. `App.jsx` passe cet état à `services/license.js` : **essai** (l'app s'ouvre, compteur dans l'en-tête), **abonné**, ou **expiré** (le `Paywall` remplace toute l'application).
5. Au paiement, l'administrateur génère un code (`/admin.html`). Le client le saisit dans le `Paywall`, qui appelle `/api/license/redeem`.

## 2. Tester en local (mode démo, sans serveur)

```bash
npm install
cp .env.example .env      # VITE_BACKEND=demo y est déjà
npm run dev
```
En mode démo, le code de confirmation s'affiche à l'écran, et les codes `DEMO-MENSUEL`, `DEMO-ANNUEL`, `DEMO-VIE` débloquent l'accès.
**Ne déployez jamais en mode démo** : `npm run build` utilise le vrai serveur par défaut.

## 3. Déployer sur Vercel

1. Mettez le dossier sur GitHub, puis **Add New > Project** dans Vercel et importez le dépôt (Vite est détecté automatiquement).
2. **Base de données** : dans l'onglet *Storage* du projet, ajoutez **Upstash Redis**. Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées toutes seules.
3. **Variables d'environnement** (*Settings > Environment Variables*) :
   - `AUTH_SECRET` : une longue chaîne aléatoire (32 caractères ou plus).
   - `ADMIN_SECRET` : votre mot de passe administrateur (12 caractères ou plus).
   - **E-mail** : `RESEND_API_KEY` et `MAIL_FROM` (compte gratuit sur resend.com, domaine à vérifier).
   - **SMS / WhatsApp** : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, et `TWILIO_CHANNEL=sms` ou `whatsapp`.
   - **Affichage** : `VITE_ADMIN_WHATSAPP`, `VITE_AIRTEL_NUMBER`, `VITE_AIRTEL_HOLDER`, `VITE_MTN_NUMBER`, `VITE_MTN_HOLDER`, `VITE_PROMO_END`.
   - Ne mettez **pas** `VITE_BACKEND=demo` ni `LUKY_DEV_ECHO` en production.
4. Redéployez (*Deployments > Redeploy*) : les variables `VITE_*` sont intégrées au moment du build.

Pour tester les fonctions `/api` en local : `npx vercel dev` (avec un fichier `.env` complet, et `LUKY_DEV_ECHO=1` pour recevoir le code dans la réponse).

## 4. Encaisser un abonnement

1. Le client paie le montant au numéro Airtel Money ou MTN affiché, puis vous envoie la preuve par le bouton WhatsApp (message déjà rédigé).
2. Vous vérifiez la réception, puis ouvrez `https://votre-site.vercel.app/admin.html`, saisissez `ADMIN_SECRET`, choisissez l'offre et cliquez sur **Générer**.
3. Vous envoyez le code `LUKY-XXXX-XXXX` au client. Il le saisit : l'accès s'active. Un code ne sert **qu'une fois**.

Un code mensuel (+30 jours) ou annuel (+365 jours) **s'ajoute** à l'abonnement en cours. La licence à vie n'expire jamais.

## 5. Modifier les prix, la promotion, la durée d'essai

- Prix et noms des offres : `PLANS` dans `src/config.js`.
- Fin de la promotion : variable `VITE_PROMO_END` (format `2026-12-31`). Après cette date, les anciens prix s'affichent, sans prix barrés.
- Durée de l'essai : `TRIAL_DAYS` dans `src/config.js` **et** dans `api/_lib/auth.js` (le serveur décide).

## 6. Ce qu'il faut savoir

- **Les commandes restent sur l'appareil** (localStorage + IndexedDB). Le serveur ne garde que les comptes, les abonnements et les codes. Pas de synchronisation entre appareils pour l'instant.
- **Le serveur fait foi pour l'essai et l'abonnement**, donc vider le navigateur ne relance pas l'essai. Mais comme les données et le code de l'application sont dans le navigateur, un utilisateur technique peut contourner l'écran de blocage sur son propre appareil. Pour une protection réelle, il faudra héberger aussi les commandes côté serveur.
- **Hors ligne** : le dernier état d'abonnement connu est utilisé, avec une garde contre le retour en arrière de l'horloge.
- **SMS au Congo** : vérifiez que Twilio livre bien vos opérateurs (sinon, utilisez `TWILIO_CHANNEL=whatsapp` ou un fournisseur local en adaptant `api/_lib/notify.js`).
- **Paiement manuel** : aucune API Airtel/MTN n'est branchée. Chaque paiement est vérifié par l'administrateur.
