# Barde — Marseille · Guide Musical 🎵📍

**Barde** est un guide musical interactif et une Progressive Web App (PWA) conçue pour explorer et découvrir la scène musicale live de Marseille intra-muros.

---

## ✨ Fonctionnalités

- 🗺️ **Carte interactive Leaflet / OpenStreetMap** centrée sur Marseille.
- 📱 **Interface responsive & Mobile-First** avec panneau d'information rétractable et geste *swipe-to-close*.
- 🔎 **Recherche en temps réel** par nom de lieu, quartier, adresse ou genre musical.
- 🏷️ **Filtres dynamiques** : Concerts, Bars musicaux, Jazz, Lieux intimistes, Spots éphémères, Théâtres & Culture, Lieux atypiques.
- 📍 **Géolocalisation GPS** (« Où suis-je ? ») avec indicateur de précision.
- 📲 **Progressive Web App (PWA)** : Installable sur écran d'accueil et consultable **hors-ligne** via Service Worker.
- 📊 **Architecture sans backend (Serverless)** : Les données sont totalement dissociées du code et stockées dans `data/places.json`.

---

## 📂 Structure du projet

```text
barde/
├── index.html          # Structure de l'application & enregistrement PWA
├── manifest.json        # Configuration PWA (icônes, écran d'accueil)
├── service-worker.js    # Mise en cache et gestion du mode hors-ligne
├── README.md            # Documentation du projet
├── css/
│   └── style.css       # Styles, animations & design sombre
├── js/
│   ├── map.js          # Initialisation Leaflet, marqueurs & géolocalisation
│   └── filters.js      # Logique de recherche et de filtrage dynamique
└── data/
    └── places.json     # Base de données JSON des 35 lieux musicaux
```

---

## 🚀 Déploiement rapide sur GitHub Pages

1. Décompressez le fichier ZIP du projet.
2. Créez un nouveau dépôt public sur **GitHub** nommé `barde`.
3. Téléversez l'ensemble des fichiers à la racine du dépôt.
4. Allez dans **Settings** > **Pages** :
   - Source : **Deploy from a branch**
   - Branch : **`main`** / **`/ (root)`**
5. Enregistrez. Votre application est immédiatement accessible publiquement !
