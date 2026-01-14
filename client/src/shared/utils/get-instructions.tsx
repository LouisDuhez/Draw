export const getInstructions = (type: string) => {
  switch (type) {
    case 'user-list':
      return (
        <>
          Notre liste d'utilisateurs sera ici. : <br />
          <ul>
            <li>
              Créer le composant <code>UserList</code>
            </li>
            <li>
              Au chargement de la page, fetch sur <code>DrawSocket.get('users/get')</code> pour récupérer la liste des users
            </li>
            <li>
              Stocker le résultat dans un store <code>useUsersStore</code> (similaire à <code>useMyUserStore</code>)
            </li>
            <li>
              Puis écouter l'évènement qui met à jour la liste des users renvoyé par le serveur
            </li>
            <li>
              Stocker le nouveau résultat dans le store associé
            </li>
            <li>
              Afficher la liste des users en utilisant l'UI <a href="https://daisyui.com/components/list/" target="_blank" rel="noopener noreferrer"><code>.list</code></a>
            </li>
          </ul>
        </>
      )
    case 'draw-area':
      return (
        <>
          Notre zone de dessin sera ici. : <br />
          <ul>
            <li>
              Créer le composant <code>DrawArea</code>
            </li>
            <li>
              Utiliser un élément HTML5 <code>&lt;canvas&gt;</code> pour la zone de dessin
            </li>
            <li>
              Redimensionner correctement votre canvas
            </li>
            <li>
              Commencer par dessiner sur votre canvas en utilisant le évènements de onMouseMove, onMouseDown, onMouseUp
            </li>
            <li>
              Gérer l'envoi des évènements au serveur 
            </li>
            <li>
              Gérer la réception des envois des évènements du serveur
            </li>
            <li>
              En sachant que le serveur vous renvoie tous les traits contenus dans le dessin à chaque fois, gérer le fait d'afficher les tracés réçus
            </li>
            <li>
              Au chargement de la page, fetch sur <code>DrawSocket.get('/strokes/get')</code> pour récupérer la liste des traits de dessin existants
            </li>
          </ul>
        </>
      );
    case 'toolbar':
      return (
        <>
          Notre barre d'outils sera potentiellement ici : <br />
          <ul>
            <li>
              Créer le composant <code>Toolbar</code>
            </li>
            <li>
              Ajouter des boutons pour sélectionner les outils de dessin (pinceau, gomme, etc.)
            </li>
            <li>
              Ajouter des options pour changer la couleur et la taille du pinceau
            </li>
            <li>
              Stocker les infos nécessaire dans un store pour pouvoir les utiliser dans DrawArea 
            </li>
          </ul>
        </>
      );
    default:
      return <></>
  }
}