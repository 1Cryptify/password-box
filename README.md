<div align="center">

# PasswordBox

**The offline-first, open-source password & network equipment manager.**

Real passwords. Real equipment. **Zero cloud. Zero tracking. 100% on your device.**

![offline](https://img.shields.io/badge/offline--first-100%25-blue)
![free](https://img.shields.io/badge/free-forever-success)
![open-source](https://img.shields.io/badge/open-source-MIT-blue)
![platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-lightgrey)
![react-native](https://img.shields.io/badge/React%20Native-0.86-informational)
![expo](https://img.shields.io/badge/Expo%20SDK-57-white)
![i18n](https://img.shields.io/badge/languages-13-magenta)

**Gratuit · Open source · 100 % hors ligne · Chiffré · 13 langues**

[Site web](https://1cryptify.github.io/password-box) ·
[Politique de confidentialité](https://1cryptify.github.io/password-box/privacy) ·
[Soumettre un bug](https://github.com/1Cryptify/PASSWORD-BOX/issues)

</div>

---

## Pourquoi PasswordBox ?

> Vos mots de passe ne devraient dépendre ni d'un abonnement, ni d'un serveur, ni de la bonne volonté d'une entreprise.

PasswordBox est un gestionnaire de mots de passe conçu pour les **réseaux informatiques et les équipements physiques** — et pour votre vie personnelle. Il fonctionne **entièrement hors ligne**, protège vos données par **chiffrement local**, et son code est **100 % ouvert** à l'audit.

**L'idée centrale** : nos données nous appartiennent. Pas de compte, pas de serveur, pas de tracker. La seule personne qui voit vos mots de passe, c'est vous.

---

## Ce qui rend PasswordBox unique

- **GPS GNSS 100 % hors ligne** — géolocalisez vos sites sans aucune connexion réseau.
- **Cartes offline** — téléchargez des tuiles OpenStreetMap pour lire la carte sans Internet.
- **Inventaire réseau complet** — sites, datacenters, domiciles, avec position sur carte.
- **Équipements typés** — routeur, switch, firewall, serveur, caméra IP, NAS, UPS… + système d'exploitation.
- **Identifiants multiples** — mot de passe, clé SSH, certificat, token, SNMP, clé API.
- **Mode personnel** — banque, e-mail, réseaux sociaux… dans la même app sécurisée.
- **Export / import `.pass` chiffré** avec liste blanche d'appareils autorisés.
- **Code de récupération** pour réinitialiser votre PIN en cas d'oubli.
- **13 langues**, dont l'arabe (RTL).
- **Verrouillage auto**, protection contre le forçage, effacement complet des données.
- **Gratuit à vie** — pas de version « pro » cachée derrière un paywall.

---

## Fonctionnalités

### Sites & carte
- Créez des sites (entreprise, école, datacenter, hôtel, appartement, hôpital…) avec **position GPS**.
- **Géolocalisation hors ligne** par GPS GNSS pur : aucun recours au réseau ni aux fournisseurs réseau.
- **Carte Leaflet hors ligne** : zooms pré-téléchargés pour un usage sans aucune connexion.
- Chaque site peut contenir des équipements et des identifiants.

### Équipements réseau
- Typés avec précision : **routeur, switch, firewall, serveur, PC, imprimante, point d'accès WiFi, téléphone IP, caméra IP, NAS, UPS, tablette, terminal caisse, PBX, vidéoprojecteur, badgeuse, écran digital**.
- Système d'exploitation renseigné : **Windows Server, Ubuntu, CentOS, Debian, Cisco IOS, RouterOS, pfSense, VMware ESXi, Synology DSM**, etc. + type personnalisé.
- Position de chaque équipement, enregistrée à la demande.

### Identifiants
- Type d'authentification : **mot de passe, clé SSH, certificat, token, SNMP, clé API** (+ personnalisé).
- Notes, port, utilisateur — rattachés à l'équipement.

### Mode personnel
- Catégories du quotidien : réseaux sociaux, messagerie, banque & finance, divertissement, cloud & stockage, e-commerce, jeux, productivité, téléphonie, développement, vie pratique.

### Vie privée & sécurité
- **Aucun serveur, aucune télémétrie, aucun tracker.**
- Données chiffrées localement, protégées par votre **PIN**.
- **Verrouillage automatique** à chaque passage en arrière-plan.
- **Limitation des tentatives** PIN (anti forçage brut).
- **Code de récupération** chiffré, seul secours en cas d'oubli du PIN.
- **Effacement complet** de toutes les données dans les réglages (sites, identifiants, PIN, récupération, cache cartes).

### Internationalisation
- **13 langues** : anglais, français, espagnol, allemand, italien, portugais, néerlandais, **arabe (RTL)**, russe, chinois simplifié, japonais, turc, polonais.

---

## Démarrage rapide

```bash
# 1. Cloner
git clone https://github.com/1Cryptify/PASSWORD-BOX.git
cd password-box

# 2. Installer les dépendances
npm install

# 3. Lancer
npx expo start        # a pour Android, i pour iOS, w pour web
```

> Prérequis : Node.js ≥ 18, Expo CLI, et l'outil Expo Go ou un émulateur Android/iOS.

### Build natif Android

```bash
cd android
./gradlew assembleDebug    # Debug (Metro / hot reload)
./gradlew assembleRelease  # Release autonome (bundle embarqué)
```

---

## Stack technique

| Technologie | Usage |
|---|---|
| **React Native 0.86 / React 19** | Application mobile |
| **Expo SDK 57** / expo-router | Framework & navigation à fichiers |
| **AsyncStorage** | Stockage local des données |
| **expo-secure-store / expo-crypto** | Stockage & chiffrement sensibles |
| **expo-location** | GPS GNSS hors ligne |
| **Leaflet / WebView** | Cartes & tuiles offline (OpenStreetMap) |
| **expo-file-system / expo-sharing / expo-document-picker** | Export/import `.pass` |
| **TypeScript** | Typage strict de bout en bout |
| **i18n maison** | 13 langues + RTL |

---

## Roadmap & idées

- Générateur de mots de passe forts intégré.
- Version desktop (Electron / Tauri).
- Extension navigateur.
- Synchronisation chiffrée auto-hébergeable (optionnelle).
- Suite de tests automatisés (Jest + Detox).

Contributions et suggestions : ouvrez une [issue](https://github.com/1Cryptify/PASSWORD-BOX/issues).

---

## Contribuer

PasswordBox est **open source**, et les contributions sont les bienvenues. Quelques pistes :

1. **Fork** le dépôt ;
2. Créez une branche (`git checkout -b feature/ma-idee`) ;
3. **Commitez** avec un message clair ;
4. **Poussez** et ouvrez une **pull request**.

Vous pouvez participer sans coder : signalez un bug, proposez une fonctionnalité, traduisez, documentez ou partagez le projet.

---

## Soutenir le projet

Ce projet est **gratuit et open source**. Si vous l'appréciez, le meilleur soutien reste de le **partager** et de **laisser une étoile**. Chaque étoile aide le projet à être trouvé par ceux qui ont besoin de reprendre le contrôle de leurs données.

---

## Licence

Ce projet est proposé sous licence **MIT** (licence formelle à confirmer — voir `.git` ou contact si besoin). Vous êtes libres de l'utiliser, de le modifier et de le redistribuer.

> **Avertissement** : PasswordBox stocke des données sensibles. Utilisez-le à vos propres risques, et conservez précieusement votre code de récupération.

---

## Remerciements

- [Leaflet](https://leafletjs.com) & [OpenStreetMap](https://www.openstreetmap.org) pour la cartographie libre.
- La communauté **React Native / Expo**.
- Tous les contributeurs et utilisateurs qui font vivre le projet.

---

<div align="center">

**PasswordBox — vos données vous appartiennent. Point final.**

[Site web](https://1cryptify.github.io/password-box) ·
[Confidentialité](https://1cryptify.github.io/password-box/privacy) ·
[Star sur GitHub](https://github.com/1Cryptify/PASSWORD-BOX)

</div>
