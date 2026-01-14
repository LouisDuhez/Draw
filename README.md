# Draw

Application de dessin collaborative en temps réel avec canvas responsive, prise en charge de la gomme, de l’épaisseur du trait et du choix de couleur.

## Fonctionnalités
- Crayon (dessin libre lissé)
- Gomme (efface réellement les pixels du canvas)
- Couleur du trait
- Épaisseur du trait
- Lissage des traits (courbes quadratiques pour un rendu fluide)
- Collaboration temps réel (WebSockets)
- Canvas responsive (ratio 16:9) et net sur écrans haute densité (DPR)
- Redessin automatique après redimensionnement (recharge de l’historique)
- Réinitialisation du canvas (événement `canvas:reset`)

## Prérequis
- Node.js 18+ et npm (ou pnpm/yarn)
- Un serveur Socket disponible (utilisé par `SocketManager`)

## Installation
- Installer les dépendances du client:
  - `cd client`
  - `npm install`

## Démarrage
- Lancer le client:
  - `npm run dev`
- Assurez-vous que le serveur Socket est démarré et accessible par le client.

## Utilisation
- Dessiner: clic maintenu et déplacer la souris dans la zone de dessin.
- Point: clic rapide sans déplacer.
- Changer d’outil: sélectionner crayon ou gomme dans l’UI.
- Couleur: sélectionner une couleur dans l’UI.
- Épaisseur: ajuster via le contrôle d’épaisseur.
- Redimensionnement: le canvas se recalcule automatiquement (ratio 16:9) et tout l’historique est redessiné.

## Concepts clés
- Coordonnées relatif/absolu:
  - Envoi réseau en coordonnées relatives (0–1) pour un rendu identique sur toutes tailles d’écran.
  - Conversion en pixels à l’affichage selon la taille CSS courante.
- DPR (haute densité):
  - Mise à l’échelle interne du canvas selon `window.devicePixelRatio` pour éviter le flou.
- Lissage:
  - Les segments sont tracés via courbes quadratiques (point de contrôle au milieu) pour un tracé fluide.

## Événements Socket (côté client)
- `draw:start`
  - Début de trait, inclut style.
  - Payload:
    ```json
    {
      "x": 0.25,
      "y": 0.4,
      "strokeWidth": 4,
      "color": "#000000",
      "isEraser": false,
      "socketId": "optional (fourni côté serveur sur réception)"
    }
    ```
- `draw:move`
  - Points intermédiaires du trait (mêmes champs que `draw:start`).
- `draw:end`
  - Fin de trait (pas de payload ou payload minimal).
- `canvas:reset`
  - Efface le canvas chez tous les clients.

- Récupération de l’historique:
  - `GET strokes` via `SocketManager.get('strokes')`
  - Réponse:
    ```json
    {
      "strokes": [
        {
          "socketId": "abc",
          "color": "#000000",
          "strokeWidth": 4,
          "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.12, "y": 0.22 }],
          "isEraser": false
        }
      ]
    }
    ```

## Architecture (aperçu)
- `client/src/features/drawing/components/DrawArea/DrawArea.tsx`
  - Gère:
    - Canvas et contexte 2D
    - Système de coordonnées relatif/absolu
    - Entrées souris (down/move/up)
    - Lissage (courbes quadratiques)
    - Gomme via `globalCompositeOperation='destination-out'`
    - Responsive + DPR
    - Écoute/émission des événements Socket
    - Redessin complet après resize via historique

## Dépannage
- Canvas flou:
  - Vérifier le DPR et la logique de `scale(dpr, dpr)`.
- Rien ne s’affiche:
  - Vérifier que le serveur Socket est accessible et que `strokes` renvoie des données.
- Latence ou saccades:
  - Éviter les setState pendant le dessin; les refs sont déjà utilisées pour la performance.