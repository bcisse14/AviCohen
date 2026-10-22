# Site du cabinet des Docteurs Cohen

Next.js 14, React et Tailwind. Le mini CMS intégré est accessible à `/admin`.
Les pages publiques utilisent uniquement la version publiée, jamais le brouillon.
Les requêtes HTTP du pilote Neon désactivent explicitement le cache Next.js
(`cache: "no-store"`) pour lire les publications et les révisions à jour.
Le layout racine est explicitement dynamique, y compris pour les métadonnées
et la page 404, afin de ne pas prégénérer des pages dépendant de ces lectures.
Les dates de suivi du CMS sont affichées dans le fuseau Europe/Paris ; le fuseau
local de programmation est détecté après hydratation pour éviter un décalage
entre le serveur Vercel et le navigateur.

Le serveur `npm run dev` utilise `.next-dev`, tandis que `npm run build` et
`npm start` utilisent `.next`. Cette séparation permet de vérifier une compilation
de production sans écraser les fichiers CSS et JavaScript du serveur de développement.

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
4. Définir `CMS_ADMIN_USERNAME` (par exemple `avicohen`),
   `CMS_ADMIN_PASSWORD_HASH` et `CMS_SESSION_SECRET`
   (au moins 48 caractères ; utiliser la valeur générée par la commande).
   Les installations existantes utilisant `CMS_ADMIN_EMAIL` restent compatibles :
   l'adresse e-mail sert d'identifiant si `CMS_ADMIN_USERNAME` n'est pas défini.
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

Sur `/admin`, saisir l'identifiant configuré et le mot de passe associé à
l'empreinte scrypt. Aucun mot de passe par défaut n'est intégré au code.
Un fichier `.env.development.local` permet de configurer un accès local sans
modifier `.env.local` ; il est ignoré par Git et n'est pas chargé en production.
Pour le site en ligne, définir les mêmes variables dans les secrets Vercel.

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
- **Annonces** : fenêtres au premier plan, locales à une page ou globales, avec texte,
  images, boutons et dates facultatives. Les dates sont saisies à l'heure locale
  du navigateur et stockées en UTC. La fin est exclusive. Les annonces
  programmées apparaissent à leur échéance **si elles ont été publiées**.
  **Toutes les annonces sont obligatoirement fermables**, sans option de blocage :
  un seul bouton **Fermer**, toujours accessible dans l'en-tête, Échap ou clic
  sur le fond. Les annonces apparaissent une par une, sans empiler les fenêtres.
  Les longs contenus défilent dans la fenêtre, sans masquer la fermeture.
  Le focus reste dans la fenêtre ; le défilement de la page est suspendu puis
  restauré à la fermeture, avec retour du focus à son emplacement précédent.
  Une photo peut être agrandie au-dessus de l'annonce : fermer la photo ne ferme
  pas l'annonce.
  La fermeture est conservée par onglet avec `sessionStorage`, pendant la visite,
  y compris les changements de page et les rechargements. Un contenu modifié ou
  une nouvelle programmation peut réafficher l'annonce ; les annonces des autres
  pages restent indépendantes. La prévisualisation n'affecte pas les fermetures
  sur le site public. Si le navigateur refuse le stockage, la fermeture fonctionne
  encore et reste mémorisée pendant la navigation interne, mais pas après
  rechargement ; un avertissement technique est journalisé dans la console.
- **Médiathèque** : réutiliser les images du site, importer de nouvelles images,
  puis modifier leur description accessible et leur légende dans chaque bloc.
  Un aperçu du fichier sélectionné apparaît avant l'import, avec son nom et sa
  taille ; il peut être retiré ou remplacé sans envoyer le fichier. Les images
  des blocs, de la médiathèque et l'image de partage de chaque page sont également
  affichées en aperçu.
  L'import exige un fichier JPEG, PNG ou WebP et une description accessible.
  Le bouton indique les champs manquants ou un fichier invalide par un message
  explicite ; une confirmation s'affiche après un import réussi.
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
  authentifiée, puis choisir le périmètre à publier :
  - **Publier uniquement cette annonce** ou **Publier uniquement ce bloc** en bas
    de son éditeur, pour un élément global ou un bloc d'une page déjà en ligne.
  - **Publier uniquement cette page** pour une page entière, ses informations et
    tous ses blocs. C'est nécessaire lors de la création d'une nouvelle page.
  - **Publier uniquement les réglages** sans les annonces globales ni les pages.
    Les coordonnées, l'équipe et les autres réglages partagés changent sur tout
    le site ; un bloc publié seul utilise les réglages déjà en ligne.
  - **Publier tout** dans la barre supérieure pour tout le brouillon.
  Chaque publication demande confirmation. La publication individuelle enregistre
  aussi les autres modifications en brouillon, sans les mettre en ligne, et
  conserve les suppressions et l'ordre des éléments existants encore publiés.
  Les nouveaux éléments sont insérés près de leurs voisins déjà publiés.
  Pour publier un réordonnancement ou une suppression de bloc ordinaire, publier
  la page entière. Pour les annonces, **Retirer l’annonce du site** supprime
  directement l'annonce du brouillon et de la version publiée, après confirmation,
  sans publier les autres contenus.
  Dans **Annonces sur tout le site**, **Retirer toutes les annonces du site**
  supprime toutes les annonces globales et tous les blocs d'annonce dans les pages,
  y compris les annonces publiées déjà absentes du brouillon. Les autres contenus
  publiés restent inchangés ; les modifications privées sont enregistrées en
  brouillon. Les pages publiques déjà ouvertes doivent être actualisées.
  L'historique conserve le brouillon précédent ; sa restauration ne republie rien.
  Un lien vers une page encore privée bloque la publication individuelle avec une
  explication : publier d'abord cette page. Une page renommée conserve une
  redirection depuis son ancienne adresse sans publier les autres pages.
  Une annonce masquée ou hors de sa période de programmation reste invisible,
  même après publication.
  Ajouter une page au menu reste une action explicite dans les réglages.
- **Historique** : les 30 états précédant les derniers enregistrements/publications
  sont restaurables. La restauration remplace le brouillon et ne publie pas.
  Une modification effectuée dans une autre fenêtre provoque un conflit explicite,
  jamais un écrasement silencieux ; exporter le travail local avant de recharger.
  Les modifications locales non enregistrées sont perdues si le navigateur est
  fermé malgré son avertissement.
- **Sauvegarde** : export/import des contenus en JSON. L'export contient les URLs
  des images, pas les fichiers image. Prévoir aussi des sauvegardes Neon et Blob.
  **Supprimer définitivement** dans la médiathèque efface une image importée et
  son fichier Vercel Blob après confirmation. Cette action irréversible est refusée
  si son URL apparaît dans le brouillon, le site publié, l'une des 30 versions de
  l'historique ou un autre média. Les images d'origine intégrées au projet restent
  protégées. Une URL supprimée est bloquée pour les nouveaux enregistrements,
  y compris depuis un ancien onglet. En cas d'échec du stockage, le média reste
  visible : recharger l'administration puis réessayer sa suppression.

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
