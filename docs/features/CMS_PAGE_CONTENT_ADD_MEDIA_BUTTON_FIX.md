# CMS Page Content — Fix bouton « Ajouter un média » (slider hero)

## Contexte
Dans l’éditeur CMS (section **Content → Hero → Background media**), le bouton **« Ajouter un média »** devait créer une nouvelle entrée de slide dans `heroBackgroundItems` sans quitter le CMS.

## Comportement attendu
- Le clic sur **Ajouter un média** reste dans le CMS.
- Une nouvelle slide est ajoutée au state du formulaire `homeContentForm.heroBackgroundItems`.
- L’éditeur peut ensuite configurer les champs de la slide (media desktop/tablette/mobile, vidéo, overlay, alt, etc.).
- L’action de navigation vers la médiathèque est distincte et explicite via **« Ouvrir la médiathèque CMS »**.

## Correctifs appliqués
1. Le handler d’ajout de média est centralisé dans `pageContentHeroActions.ts`.
2. Le handler appelle explicitement `preventDefault()` et `stopPropagation()` avant mutation de state pour empêcher toute navigation non voulue.
3. Le bouton « Ajouter un média » déclenche ce handler et ajoute une slide vide structurée.
4. Un bouton séparé « Ouvrir la médiathèque CMS » bascule vers la section interne CMS `media` (pas de lien public).

## Contrat CMS vs site public
- **Actions d’édition CMS**: ajout/suppression/édition de slides, sélection média, sauvegarde API CMS.
- **Actions de preview/public**: doivent rester isolées des actions d’édition et clairement libellées.

## Save / render pipeline attendu
1. Ajouter une slide dans `heroBackgroundItems`.
2. Affecter les références média (`media:asset-id` ou URL legacy tolérée selon validation en place).
3. Sauvegarder via `saveHomePageContent`.
4. Rechargement CMS: la slide persiste dans `homeContentForm`.
5. Site public: rendu via la résolution media du hero home page.

## Tests
- Test unitaire: ajout de slide dans le state.
- Test unitaire: le handler empêche la navigation par défaut.
- Test rendu section: présence des actions CMS explicites et absence de labels de navigation publique dans la zone d’édition.
