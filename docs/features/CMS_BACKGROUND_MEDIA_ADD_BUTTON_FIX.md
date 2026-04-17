# CMS Background Media — Fix du bouton « Ajouter un média »

## Contexte

Dans l’éditeur **CMS → Contenus pages → Hero → Background media**, le bouton **« Ajouter un média »** doit uniquement déclencher une action d’édition CMS (ajout d’une slide), sans aucune navigation vers le site public.

## Comportement attendu

- Le clic sur **Ajouter un média** reste dans le CMS.
- Le clic ajoute une nouvelle entrée dans `heroBackgroundItems`.
- La nouvelle entrée expose les champs d’édition média (desktop/tablet/mobile/vidéo, overlay, position, etc.).
- Après sauvegarde, les slides ajoutées sont persistées dans le payload de page content et utilisées par le rendu public du hero.

## Correctif appliqué

1. Le bouton **Ajouter un média** utilise désormais un handler CMS explicite qui :
   - appelle `preventDefault()` et `stopPropagation()`,
   - applique directement `appendHeroBackgroundItem` sur l’état `homeContentForm`.
2. L’action d’ajout de slide est séparée des actions de preview/navigation publique (qui restent des contrôles distincts ailleurs dans le dashboard).
3. Les tests CMS couvrent l’intention :
   - création d’une slide vide structurée,
   - protection contre toute navigation par défaut,
   - présence d’un vrai bouton `type="button"` pour l’action d’ajout.

## Contrat save/render

- Côté CMS, la structure `heroBackgroundItems` est sauvegardée via `savePageContent`.
- Côté API, les références média hero sont validées/normalisées.
- Côté site public, le hero lit les items sauvegardés pour composer le slider/fond dynamique.
