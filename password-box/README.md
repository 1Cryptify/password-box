# PasswordBox — Guide pour développeurs

Documentation technique pour comprendre, lancer et contribuer au code source de **PasswordBox**. Pour la présentation générale, la roadmap et la licence, voir le [README racine](../README.md).

---

## 🧭 Vue d'ensemble

PasswordBox est une application **React Native / Expo** (Expo SDK 57, React Native 0.86, React 19, expo-router, TypeScript strict).

**Principes fondamentaux** :
- **Offline-first** : tout fonctionne sans Internet, y compris le GPS et les cartes.
- **Aucun backend** : pas de serveur, aucune donnée ne quitte l'appareil.
- **Open source** pyramidal : les données sensibles sont chiffrées localement.

---

## 📁 Structure du projet

```
password-box/
├── app/                     # Écrans & navigation (expo-router, fichier = route)
│   ├── _layout.tsx          # Layout racine (Provider i18n, Splash, Stack)
│   ├── index.tsx            # Route "/" : aiguillage setup / PIN / accueil
│   ├── pin.tsx, setup.tsx   # Création / saisie du PIN, premier lancement
│   ├── recovery.tsx         # Récupération du PIN via code de récupération
│   ├── site/                # Nouveau / édition / détail / carte d'un site
│   ├── equipment/           # Équipements : nouveau / localisation / détail
│   ├── credential/          # Identifiants : nouveau / détail
│   └── settings/            # Réglages, PIN, langue, import
├── components/              # UI réutilisable (cartes, PIN, recherche, splash, LeafletMap)
├── constants/theme.ts       # Couleurs, espacements, typos (dark theme)
├── i18n/                    # Internationalisation (13 langues + RTL)
│   ├── index.tsx            # I18nProvider, useI18n() → { t, tt, lang, setLang, isRTL }
│   ├── languages.ts         # Registre des langues (code, nom natif, RTL)
│   └── translations/*.ts    # 13 dictionnaires typés (338 clés chacun)
├── lib/                     # Logique métier & stockage
│   ├── database.ts          # CRUD AsyncStorage, gestion PIN, clearAllData
│   ├── encryption.ts        # Hachage de PIN, clés
│   ├── location.ts          # GPS GNSS 100% hors ligne (getPrecisePosition)
│   ├── passfile.ts          # Export/import .pass chiffré (listes blanches)
│   ├── recovery.ts          # Code de récupération chiffré
│   ├── tile-cache.ts        # Tuiles carto offline (Leaflet / OSM)
│   └── types.ts             # Types + libellés (référencent des clés i18n)
├── assets/                  # Icônes, splash
├── android/                 # Projet natif généré (builds Gradle)
└── dist/                    # Export web statique (GitHub Pages)
```

---

## 🚀 Lancer le projet

```bash
npm install
npx expo start          # dev : a (Android), i (iOS), w (web)
```

**Android natif** (utile pour toucher au splash natif / plugins) :

```bash
cd android
export JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"   # Windows (si pas sur PATH)
.\gradlew.bat assembleDebug
```

---

## 🌍 Comment fonctionne l'internationalisation

Toute l'UI passe par le hook `useI18n()` :

```tsx
import { useI18n } from '../i18n';

function Screen() {
  const { t, tt, lang, setLang, isRTL } = useI18n();
  return <Text>{t('site.type.entreprise')}</Text>;        // clé + interpolation optionnelle {param}
}
```

- **`t(clé, {params})`** : clé typée `TranslationKey` (les clés manquantes afficheraient la clé brute → jamais de traduction oubliée silencieuse).
- **`tt(texteOuClé)`** : traduit si c'est une clé connue, sinon renvoie le texte tel quel (p. ex. `customType` / `customOS` saisis par l'utilisateur).
- Libellés de `lib/types.ts` (`SITE_TYPE_LABELS`, `EQUIPMENT_TYPE_LABELS`, `OS_LABELS`, `AUTH_TYPE_LABELS`, catégories perso) = **clés i18n** : les afficher via `t(...)`.
- **Persistance** : langue stockée dans AsyncStorage `@passwordbox_lang`.
- **RTL** : l'arabe force `I18nManager` + reload (aucun module natif supplémentaire requis).

### Ajouter une langue (ou la compléter)

1. Créez `i18n/translations/xx.ts` avec **exactement les 338 clés** de `en.ts` (même ordre).
2. Déclarez-la dans `i18n/translations/index.ts`.
3. Ajoutez-la à `i18n/languages.ts` (code, nom natif, `rtl`).

> 💡 Contrainte : `settings.clearPhrase` vaut `"JE VEUX TOUT EFFACER"` en français et `"I WANT TO DELETE EVERYTHING"` pour toutes les autres langues — ne pas traduire librement cette valeur.

---

## 🛰 GPS & cartes hors ligne

- **`lib/location.ts`** — `getPrecisePosition(targetAccuracy, minGoodSamples, maxDurationMs, maxRounds)` : purement **GPS GNSS**, aucun fournisseur réseau, rejet des positions simulées, moyennage multi-échantillons.
- **`components/LeafletMap.tsx` + `lib/tile-cache.ts`** — cartes Leaflet/OSM avec **téléchargement de tuiles pour usage hors ligne** (`clearTileCache()` pour purger).

---

## 🔐 Sécurité

- PIN **haché** (jamais stocké en clair) et verrouillage automatique en arrière-plan.
- Anti forçage brut : compteur de tentatives + verrouillage temporaire.
- **Code de récupération** chiffré (`lib/recovery.ts`) : seul secours en cas de PIN oublié.
- Export/import **`.pass` chiffré** avec **liste blanche** d'appareils autorisés (`lib/passfile.ts`).
- **`clearAllData()`** (`lib/database.ts`) : efface intégralement sites, identifiants, PIN, récupération et cache cartes — après confirmation par phrase + PIN.

---

## 🧪 Qualité

- **TypeScript strict** : `npx tsc --noEmit` doit passer.
- Les suites automatisées (Jest/Detox) sont prévues à la roadmap.

---

## 🤝 Contribuer

1. **Fork** puis créez une branche (`feature/…`, `fix/…`).
2. Respectez le style existant et **aucun commentaire superflu**.
3. Vérifiez : `npx tsc --noEmit` sans erreur, l'app se recharge sans erreur de bundle.
4. Ouvrez une **pull request** avec une description claire.

Ou plus simple : signalez un [bug](https://github.com/1Cryptify/PASSWORD-BOX/issues) / [proposez une idée](https://github.com/1Cryptify/PASSWORD-BOX/issues) / aidez à traduire.

---

## 📄 Licence

Voir le [README racine](../README.md) (proposition MIT).

PasswordBox — open source, gratuit, 100% hors ligne. 🔐
