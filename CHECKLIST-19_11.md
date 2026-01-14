## Checklist du TD du 19/11/2025

## Étape 1 : Tracer une ligne nette
- [ ] Je peux dessiner une ligne continue avec la souris onMouseDown -> onMouseMove -> onMouseUp
- [ ] Le canvas est net sur Retina (DPR correctement géré)
- [ ] Les listeners mouse sont bien nettoyés  (removeEventListener dans le onMouseUp)
- [ ] J'utilise les refs de manière appropriée (pas de re-render inutiles) et elles sont nettoyées au onMouseUp 

## Étape 2 : Communication de base avec le serveur
- [ ] Au mouseDown, mon client envoie l'event draw:start au serveur
- [ ] Au mouseMove, mon client envoie l'event draw:move au serveur
- [ ] Au mouseUp, mon client envoie l'event draw:end au serveur
- [ ] Les types SocketClientToServerEvents sont bien modifés dans le SocketManager pour le draw:start, draw:move, draw:end

## Étape 3 : Créer une fonction réutilisable de dessin
- [ ] J'ai créé une fonction qui permet de tracer une ligne entre un point de départ et un point d'arrivée
- [ ] Cette fonction gère à minima un beginPath, moveTo et un lineTo
- [ ] Cette fonction est appelée dans le onMouseDown, onMouseMove, onMouseUp

## Étape 4 : Affichage des tracés des autres utilisateurs 
- [ ] J'écoute les événements de dessin (draw:start, draw:move, draw:end) venant du serveur
- [ ] Je réutilise ma fonction de dessin pour afficher les tracés des autres
- [ ] Je peux voir les tracés des autres utilisateurs en temps réel 
- [ ] Je ne vois pas mes propres tracés en double (entre ceux renvoyés par le serveur et ceux que j'ai en local)
- [ ] Je nettoie correctement les listeners Socket.IO

## Étape 5 : Stocker les points localement
- [ ] Je stocke mon tracé en cours avec ses points dans une ref (au onMouseUp, onMouseMove, onMouseEnd)
- [ ] Je trace mes tracés en cours à partir de cette même donnée stockée (dans une ref)
- [ ] Je nettoie cette information au onMouseUp


## Étape 6 : Side case: Affichage d'une ligne dans un clic simple
- [ ] Au clic simple, sans move, mon tracé s'affiche 
- [ ] Je simule un 2e point pour mon tracé lorsque j'effectue un clic simple  

## Etape 7 : Coordonnées relatives pour multi-écrans
- [ ] J'ai créé une fonction pour convertir coordonnées absolues (pixels) → relatives (0-1)
- [ ] J'ai créé une fonction pour convertir coordonnées relatives (0-1) → absolues (pixels)
- [ ] Je renvoie au serveur uniquement des coordonnées relative entre 0 et 1
- [ ] Le serveur me renvoie uniquement des coordonées relative entre 0 et 1
- [ ] Je convertis les données relatives en absolues en local
- [ ] Quand j'ouvre le client sur 2 pages différentes avec des largeurs différentes, le rendu est proportionnel

## Étape 8 : Récupération de tous les tracés 
- [ ] J'ai créé une fonction clearCanvas() qui efface tout le canvas
- [ ] J'ai créé une fonction pour récupérer les tracés depuis le serveur (SocketManager.get('strokes'))
- [ ] J'ai créé une fonction pour redessiner tous les tracés (boucle sur chaque stroke et chaque point)
- [ ] Quand je me connecte, je vois les dessins déjà créés

## Étape 9 : Optimisation du resize
- [ ] Lors d'un resize, le canvas se redimensionne correctement (setCanvasDimensions)
- [ ] Lors d'un resize, tous mes tracés sont redessinés
- [ ] J'ai mis en place un système de debounce avec setTimeout / clearTimeout
- [ ] Mon debounce attend la fin du resize avant de recharger les tracés (évite le spam)
- [ ] J'ai une ref pour stocker le timer (resizeTimerRef)
- [ ] Je nettoie le timer dans le cleanup du useEffect