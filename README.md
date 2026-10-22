# Site du cabinet des Docteurs Cohen

Next.js 14, React et Tailwind. Le mini CMS intégré est accessible à `/admin`.
Les pages publiques utilisent uniquement la version publiée, jamais le brouillon.

## Installation

```sh
npm ci
cp .env.example .env.local
npm run cms:password
```

La dernière commande demande un mot de passe masqué de 12 caractères minimum et
affiche son empreinte scrypt ainsi qu'une clé de session. Conserver ces deux valeurs
dans les secrets de l'hébergeur, jamais dans Git. Ne pas communiquer le mot de passe
dans une conversation ni le passer en argument de commande.

### Configuration Vercel

1. Connecter ce dépôt à Vercel, avec Node.js **22**.
2. Ajouter une intégration **Neon PostgreSQL** au projet, de préférence dans la même
   région européenne que l'exécution des fonctions. Renseigner `DATABASE_URL` avec
   la chaîne PostgreSQL Neon fournie par l'intégration.
3. Créer un **Vercel Blob Store public** et le connecter au projet :
   `BLOB_READ_WRITE_TOKEN` permet l'import d'images.
4. Définir `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD_HASH` et `CMS_SESSION_SECRET`
   (au moins 48 caractères ; utiliser la valeur générée par la commande).
5. Pour le formulaire de contact, conserver `RESEND_API_KEY` et
   `CONTACT_EMAIL_FROM`. L'expéditeur doit être autorisé chez Resend.
6. Déployer puis ouvrir `/admin`. La création des tables `cms_*` et l'import
   initial sont automatiques et idempotents : aucune donnée existante n'est écrasée.
   L'initialisation du schéma est protégée par un verrou transactionnel PostgreSQL.
7. Dans les réglages du CMS, vérifier le domaine public, les adresses, les horaires
   et le **destinataire du formulaire**. Publier les réglages et tester un envoi réel.

Ne jamais préfixer ces secrets par `NEXT_PUBLIC_`. Le CMS n'envoie ni les secrets
ni le destinataire interne du formulaire dans les propriétés du menu public.
Les images et les textes publiés sont publics : aucun dossier patient ne doit
être stocké dans le CMS.

Sans `DATABASE_URL`, le site affiche explicitement son contenu initial et
l'administration indique les variables manquantes. Il ne s'agit pas d'un stockage
local de substitution. Si une base configurée devient indisponible, l'erreur est
remontée : le site ne prétend pas avoir enregistré ou publié un contenu.
Sans clé Blob, les images existantes sont utilisables, mais les imports sont
désactivés avec une explication dans l'interface.

`CONTACT_EMAIL_TO` reste utilisé **uniquement avant l'activation du CMS**.
Après activation, le destinataire se modifie dans `/admin`, sans redéploiement.

## Utilisation par le client

- **Pages** : modifier les textes, créer, dupliquer ou supprimer une page.
  Chaque page dispose d'un titre SEO, d'une description, d'une image de partage
  et d'une option de non-indexation.
- **Blocs** : texte, texte et photos, photo, galerie, annonce, cartes/étapes,
  questions-réponses, équipe, spécialités, coordonnées/carte, formulaire et boutons.
  Les blocs texte/photos peuvent aussi contenir des détails repliables.
  Réordonner avec les poignées de déplacement ou les boutons monter/descendre.
  Les textes acceptent titres, listes, liens, gras et italique via les outils
  de mise en forme. Le HTML arbitraire n'est pas exécuté.
- **Disposition** : largeur étroite, standard, large ou pleine largeur ; alignement ;
  fond ; une à quatre colonnes ; photos à gauche ou à droite ; format, cadrage et
  point d'intérêt par image. Les colonnes s'empilent automatiquement sur mobile.
  Les annonces et les textes n'ont pas de hauteur fixe.
- **Annonces** : bloc dans une page ou annonces globales sous le menu, avec texte,
  images, boutons et dates facultatives. Les dates sont saisies à l'heure locale
  du navigateur et stockées en UTC. La fin est exclusive. Les annonces
  programmées apparaissent à leur échéance **si elles ont été publiées**.
  **Toutes les annonces sont obligatoirement fermables**, sans option de blocage :
  boutons visibles en haut et en bas (utile pour les textes longs), utilisables
  au clavier et sur mobile ; Échap ferme l'annonce lorsque le focus est dedans.
  Après fermeture, le focus rejoint le contenu suivant. Aucune annonce ne bloque
  le défilement ou la navigation.
  La fermeture est conservée par onglet avec `sessionStorage`, pendant la visite,
  y compris les changements de page et les rechargements. Un contenu modifié ou
  une nouvelle programmation peut réafficher l'annonce ; les annonces des autres
  pages restent indépendantes. La prévisualisation n'affecte pas les fermetures
  sur le site public. Si le navigateur refuse le stockage, la fermeture fonctionne
  encore et reste mémorisée pendant la navigation interne, mais pas après
  rechargement ; un avertissement technique est journalisé dans la console.
- **Médiathèque** : réutiliser les images du site, importer de nouvelles images,
  puis modifier leur description accessible et leur légende dans chaque bloc.
  JPEG, PNG et WebP non animés, 3 Mo et 25 mégapixels maximum par fichier ;
  conversion WebP, métadonnées supprimées et côté maximal de 2 400 pixels.
  Ne publier des photos cliniques qu'avec les autorisations appropriées.
  Les images agrandies s'ouvrent dans une fenêtre accessible : fermeture par bouton,
  Échap ou clic autour de la photo, focus clavier contenu dans la fenêtre puis
  rendu à la photo d'origine, et défilement de la page restauré à la fermeture.
  Le menu de rendez-vous se ferme aussi par bouton, Échap ou clic extérieur.
  Le menu mobile se ferme par sa commande dédiée (également en bas du menu),
  Échap, clic extérieur ou choix d'un lien.
- **Réglages** : identité, adresse, téléphone, adresses e-mail, horaires, praticiens,
  liens de rendez-vous, spécialités, menus/sous-menus, liens du pied de page et
  couleur d'accent. Au-delà de six entrées principales, le menu passe en mode
  compact, même sur ordinateur, pour rester utilisable. Les blocs partagés et les données structurées suivent ces
  réglages. Les variables `{{practiceName}}`, `{{name}}`, `{{tagline}}`, `{{email}}`,
  `{{emails}}`, `{{phone}}` et `{{address}}` restent synchronisées dans les blocs.
  L'option de liens de rendez-vous synchronisés suit les modifications de l'équipe.
- **Adresses des pages** : appliquer un changement d'adresse met à jour les
  liens structurés internes et les liens Markdown simples. Une redirection
  permanente de l'ancienne adresse vers la page est conservée. Les liens externes
  qui ont été copiés manuellement doivent être vérifiés.
- **Brouillon et publication** : enregistrer, prévisualiser dans une page privée
  authentifiée, puis cliquer sur **Publier tout**. Cette action publie l'ensemble
  des pages et des réglages du brouillon, pas seulement la page affichée.
  Ajouter une page au menu reste une action explicite dans les réglages.
- **Historique** : les 30 états précédant les derniers enregistrements/publications
  sont restaurables. La restauration remplace le brouillon et ne publie pas.
  Une modification effectuée dans une autre fenêtre provoque un conflit explicite,
  jamais un écrasement silencieux ; exporter le travail local avant de recharger.
  Les modifications locales non enregistrées sont perdues si le navigateur est
  fermé malgré son avertissement.
- **Sauvegarde** : export/import des contenus en JSON. L'export contient les URLs
  des images, pas les fichiers image. Prévoir aussi des sauvegardes Neon et Blob.
  Retirer une image importée de la médiathèque **ne supprime pas son fichier** :
  les publications et les anciennes versions continuent à fonctionner. La purge
  définitive du stockage reste une opération technique, après contrôle des usages.

Le modèle encadre volontairement le design pour éviter de casser le mobile :
pas de positionnement absolu, scripts, HTML libre ou éditeur CSS. Limites de
protection : 100 pages, 80 blocs/page, 100 images/bloc, 20 annonces globales,
30 000 caractères/texte, 2 Mo par enregistrement global.
Les pages non indexées restent publiques ; ce n'est pas un contrôle d'accès.

### Accès administrateur

Un seul compte administrateur, configuré par secrets serveur. Les sessions sont
signées, valables huit heures, dans un cookie HttpOnly/SameSite strict, Secure
en production. Les écritures vérifient l'origine de la requête. La connexion est
limitée à 30 tentatives par fenêtre de 15 minutes, partagées entre les instances.
Changer l'e-mail, l'empreinte du mot de passe ou la clé de session puis redéployer
invalide les sessions existantes. Les prévisualisations et l'administration sont
non indexables, sans cache partagé et protégées contre l'intégration en iframe.

## Développement et vérifications

```sh
npm run dev
npm run test:cms
npm run typecheck
npm run lint
npm run build
```

Les tests utilisent PostgreSQL embarqué (PGlite), pas un stockage simulé, pour
vérifier brouillons, publication, conflits de révision, historique et médias.
Ils couvrent aussi la validation des contenus, les dates d'annonce, les liens,
les redirections, les signatures de session, les limites de requête et l'origine.
Les services Neon, Vercel Blob et Resend doivent également être vérifiés avec
les secrets réels de l'environnement de déploiement.

Le contenu migré des neuf pages est dans
[initial-content.json](./lib/cms/initial-content.json). Il sert uniquement à
l'initialisation d'une nouvelle base et au mode d'installation. Une fois le CMS
actif, toute modification éditoriale passe par l'administration.
