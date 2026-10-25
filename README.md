# Starter site vitrine — Astro + Keystatic

Site vitrine statique, très rapide, avec un back-office simple pour le client.

- **Astro 7** génère toutes les pages en HTML au moment du build : environ 15 Ko de HTML, 4 Ko de CSS et 1 Ko de JavaScript par page publique.
- **Keystatic** fournit le back-office (`/keystatic`). Le contenu est stocké en fichiers YAML/Markdoc dans le projet, sans base de données.
- **SEO intégré** : title et meta description éditables par page, balise canonical, Open Graph, sitemap, robots.txt, fil d'Ariane, et données structurées JSON-LD générées automatiquement (LocalBusiness, WebSite, BreadcrumbList, FAQPage, Service, BlogPosting).
- **Images optimisées au build** : AVIF et WebP en plusieurs tailles, dimensions fixes (pas de décalage de mise en page), chargement différé.
- **Accessibilité** : lien d'évitement, navigation au clavier, menu mobile accessible, contrastes AA.
- **Aucun cookie** par défaut. Formulaire de contact avec anti-spam (Netlify Forms, Web3Forms ou Formspree).
- **Deux hébergements gratuits prêts à l'emploi** : **Cloudflare** (section 3) ou **Netlify** (section 4). Le projet détecte tout seul où il est construit.

---

## 1. Démarrer en local

Prérequis : **Node.js 22.22 ou plus récent** ([nodejs.org](https://nodejs.org)).

```bash
npm install
npm run dev
```

- Le site s'ouvre sur http://127.0.0.1:4321
- Le back-office est sur http://127.0.0.1:4321/keystatic

En local, chaque enregistrement dans le back-office écrit directement dans les fichiers de `src/content/` et `src/assets/images/`. La page se recharge toute seule.

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run build` | Génère le site dans `dist/` |
| `npm run preview` | Prévisualise le build |

---

## 2. Ce que le client peut modifier

| Rubrique du back-office | Contenu |
|---|---|
| **Page d'accueil** | SEO et blocs de la page |
| **Pages** | Pages libres (À propos, Contact, Mentions légales…) → `/adresse/` |
| **Services** | Une fiche par service → `/services/adresse/`, liste automatique sur `/services/` |
| **Actualités** | Articles → `/actualites/adresse/`, avec mode brouillon |
| **Coordonnées et réglages** | Nom, logo, couleur principale, téléphone, adresse, zone d'intervention, horaires, réseaux sociaux, type d'entreprise, image de partage, formulaire, code de mesure d'audience |
| **Menu** | Liens du menu, bouton d'appel, liens du pied de page |

Les blocs disponibles sur chaque page sont : bandeau d'en-tête, texte, texte + image, cartes, liste des services, chiffres clés, galerie, témoignages, FAQ, appel à l'action et formulaire de contact. Le client les ajoute, les réordonne par glisser-déposer et les supprime.

Bon à savoir :
- Le premier **bandeau** d'une page porte le H1. Sans bandeau, le titre de la page s'affiche automatiquement en H1.
- Chaque bloc **FAQ** génère les données structurées FAQPage, sans action de la part du client.
- L'interface de Keystatic est en partie en anglais (« Save », « Add ») : l'outil n'est pas encore entièrement traduit. Tous les libellés des champs sont en français.

---

## 3. Mettre en ligne sur Cloudflare (offre gratuite)

L'offre gratuite de Cloudflare Workers suffit largement pour un site vitrine :

- les pages et les images sont des fichiers statiques, **servis gratuitement et sans limite** ;
- seul le back-office (`/keystatic`) sollicite le serveur, dans la limite de 100 000 requêtes par jour, ce qui est très loin d'un usage réel.

### a. Mettre le projet sur GitHub

```bash
git init
git add .
git commit -m "Site initial"
git branch -M main
git remote add origin https://github.com/MON-COMPTE/MON-SITE.git
git push -u origin main
```

### b. Créer le Worker

1. Dans `wrangler.jsonc`, remplacer `"name": "astro-vitrine"` par un nom propre au client (ex. `atelier-dupont`), puis faire un commit et un push. Ce nom doit être **identique** à celui du Worker dans Cloudflare.
2. Sur [dash.cloudflare.com](https://dash.cloudflare.com) : **Workers & Pages → Créer → Importer un dépôt** (*Import a repository*), autoriser GitHub, puis choisir le dépôt.
3. Réglages de build :
   - Commande de build : `npm run build`
   - Commande de déploiement : `npx wrangler deploy`
4. **Variables de build** (*Build → Variables and secrets*) :
   | Nom | Valeur |
   |---|---|
   | `SITE_URL` | `https://www.domaine-du-client.fr` |
5. Lancer le déploiement. Le site est en ligne sur `https://atelier-dupont.MON-COMPTE.workers.dev`.

Rien d'autre à configurer : Cloudflare signale sa présence pendant le build (variable `WORKERS_CI`), et le projet choisit alors automatiquement l'adaptateur Cloudflare.

### c. Activer le back-office en ligne

1. **En local**, créer un fichier `.env` à partir de `.env.example` :
   ```
   PUBLIC_KEYSTATIC_STORAGE=github
   PUBLIC_KEYSTATIC_GITHUB_REPO=MON-COMPTE/MON-SITE
   ```
2. Lancer `npm run dev` et ouvrir http://127.0.0.1:4321/keystatic. Keystatic propose de **créer une application GitHub** : suivre l'assistant. Il remplit `.env` tout seul.
3. Dans les réglages de cette application GitHub (github.com → Settings → Developer settings → GitHub Apps), ajouter l'URL de rappel de production :
   `https://www.domaine-du-client.fr/api/keystatic/github/oauth/callback`
4. Dans Cloudflare, ajouter les valeurs de `.env` en deux endroits :
   - **Variables de build** (*Settings → Build → Variables and secrets*) : `PUBLIC_KEYSTATIC_STORAGE`, `PUBLIC_KEYSTATIC_GITHUB_REPO` et `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`. Elles sont lues au moment du build.
   - **Secrets du Worker** (*Settings → Variables and Secrets → Ajouter*, type **Secret**) : `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` et `KEYSTATIC_SECRET`. Elles sont lues à chaque connexion au back-office.
   > Choisir le type **Secret** et non *Text* : à chaque déploiement, `wrangler deploy` efface les variables de type Text ajoutées dans le tableau de bord, mais conserve les secrets.
5. Relancer un déploiement. Le client se connecte sur `https://www.domaine-du-client.fr/keystatic` avec son compte GitHub. Chaque enregistrement crée un commit, puis Cloudflare reconstruit et republie le site en une à deux minutes.

### d. Brancher le nom de domaine

Le domaine doit utiliser les **DNS de Cloudflare**, ce qui est possible avec l'offre gratuite :

1. **Ajouter le domaine** dans Cloudflare (*Add a domain*, offre Free). Cloudflare importe les enregistrements existants : vérifier que les **MX, SPF, DKIM et DMARC** de la messagerie sont bien présents.
2. Chez le registrar (OVH…), remplacer les serveurs DNS par les deux serveurs indiqués par Cloudflare. Le domaine reste enregistré chez OVH.
3. Une fois le domaine actif : Worker → **Settings → Domains & Routes → Add → Custom domain**, ajouter `www.domaine-du-client.fr`, puis `domaine-du-client.fr` avec une règle de redirection vers `www` (*Rules → Redirect Rules*).

Le certificat HTTPS est automatique.

### e. Formulaire de contact sur Cloudflare

Netlify Forms n'existe pas chez Cloudflare. Il faut donc renseigner un service dans *Coordonnées et réglages → Formulaire de contact* :

- **Web3Forms** (gratuit, recommandé) : créer une clé sur [web3forms.com](https://web3forms.com) avec l'adresse e-mail qui recevra les messages. Adresse d'envoi : `https://api.web3forms.com/submit`. Coller la clé dans *Clé d'accès Web3Forms*. Après l'envoi, le visiteur revient sur la page `/merci/` du site.
- **Formspree** : coller l'URL du formulaire (`https://formspree.io/f/…`) dans *Adresse d'envoi*.

Tant que rien n'est renseigné, le bloc Contact affiche un bouton « Nous écrire » (lien e-mail) à la place du formulaire. Le site ne publie donc jamais un formulaire qui ne mènerait nulle part, et le build affiche un avertissement `[contact]` pour le signaler.

---

## 4. Mettre en ligne sur Netlify (alternative)

### a. Mettre le projet sur GitHub

Même étape que 3a.

### b. Créer le site sur Netlify

1. Sur [app.netlify.com](https://app.netlify.com) : **Add new site → Import an existing project → GitHub**, puis choisir le dépôt.
2. Le fichier `netlify.toml` remplit la configuration tout seul (build `npm run build`, dossier `dist`, Node 22).
3. Dans **Site configuration → Environment variables**, ajouter `SITE_URL` = `https://www.domaine-du-client.fr`.
4. Lancer le déploiement.

### c. Activer le back-office en ligne (mode GitHub)

En ligne, Keystatic enregistre chaque modification sous forme de commit dans le dépôt GitHub. Netlify reconstruit alors le site, et la modification est en ligne au bout d'environ une minute.

1. **En local**, créer un fichier `.env` en copiant `.env.example` :
   ```
   PUBLIC_KEYSTATIC_STORAGE=github
   PUBLIC_KEYSTATIC_GITHUB_REPO=MON-COMPTE/MON-SITE
   ```
2. Lancer `npm run dev` et ouvrir http://127.0.0.1:4321/keystatic. Keystatic propose de **créer une application GitHub** : suivre l'assistant. Il remplit automatiquement `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` et `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` dans `.env`.
3. Dans les réglages de cette application GitHub (github.com → Settings → Developer settings → GitHub Apps), ajouter l'URL de rappel de production :
   `https://www.domaine-du-client.fr/api/keystatic/github/oauth/callback`
4. Copier **toutes** les variables du `.env` dans les variables d'environnement Netlify, puis redéployer.
5. Le client se connecte sur `https://www.domaine-du-client.fr/keystatic` avec **son compte GitHub**, qui doit avoir accès au dépôt (invitation en tant que collaborateur).

> Si le client ne doit pas créer de compte GitHub, il existe le mode **Keystatic Cloud** (connexion par e-mail) : `PUBLIC_KEYSTATIC_STORAGE=cloud` et `PUBLIC_KEYSTATIC_CLOUD_PROJECT=equipe/projet`, après création du projet sur [keystatic.cloud](https://keystatic.cloud).

### d. Brancher le nom de domaine

Dans Netlify : **Domain management → Add a domain**. Ensuite, chez le registrar (OVH…), il faut soit pointer les DNS vers Netlify, soit créer les enregistrements A/CNAME indiqués par Netlify. Le certificat HTTPS est automatique.

### e. Formulaire de contact sur Netlify

- **Par défaut**, Netlify Forms détecte le formulaire tout seul. Les messages arrivent dans **Netlify → Forms**, et on y active la notification par e-mail (*Form notifications*). L'offre gratuite inclut un quota mensuel de soumissions.
- **Autre option** : renseigner une URL Formspree, Web3Forms, etc. dans *Coordonnées et réglages → Formulaire de contact*.

---

## 5. Adapter le starter à un nouveau client

1. **Couleur** : *Coordonnées et réglages → Couleur principale*. Les teintes claires et foncées en sont dérivées automatiquement.
2. **Typographies et espacements** : les variables en tête de `src/styles/global.css`. Pour une police web, ajouter les fichiers `.woff2` dans `public/fonts/` avec une règle `@font-face` (en auto-hébergement, ce qui évite Google Fonts et le RGPD).
3. **Logo** et **favicon** : le logo s'envoie depuis le back-office. Le favicon se remplace dans `public/favicon.svg`.
4. **Contenu d'exemple** : remplacer ou supprimer les fiches depuis le back-office. Les images de démonstration sont des visuels flous générés, à remplacer.
5. **Mentions légales** : à compléter (éditeur, directeur de publication, hébergeur).

### Ajouter un type de bloc

1. Déclarer le bloc dans `keystatic.config.ts`, fonction `blocs()`.
2. Créer le composant dans `src/components/blocks/`.
3. L'ajouter au `switch` de `src/components/blocks/Blocs.astro`.

---

## 6. Arborescence

```
keystatic.config.ts        Schéma du back-office (champs, blocs, rubriques)
astro.config.mjs           Configuration Astro (URL du site, sitemap, choix de l'hébergeur)
wrangler.jsonc             Configuration Cloudflare Workers
netlify.toml               Configuration Netlify
public/_headers            En-têtes HTTP de sécurité (lus par Cloudflare et Netlify)
src/
  content/                 Contenu édité par le client (YAML / Markdoc)
  assets/images/           Images envoyées depuis le back-office (optimisées au build)
  components/blocks/       Un composant par type de bloc
  layouts/Base.astro       Gabarit commun : <head> SEO, en-tête, pied de page
  lib/                     Lecture du contenu, images, Markdoc, données structurées
  pages/                   Gabarits de pages et routes (robots.txt, 404, merci…)
  styles/global.css        Feuille de style unique
public/                    Fichiers servis tels quels (favicon, logo, images d'articles)
```

## 7. Héberger ailleurs

L'hébergeur est choisi par la variable `DEPLOY_TARGET` (`cloudflare` ou `netlify`). Sans cette variable, le projet utilise Cloudflare quand il est construit chez Cloudflare, et Netlify partout ailleurs.

Pour un autre hébergeur (Vercel, VPS…), il faut installer l'adaptateur correspondant (`@astrojs/vercel`, `@astrojs/node`) et l'ajouter dans `astro.config.mjs`.

Pour un mutualisé classique (OVH…), on peut aussi n'éditer qu'en local, lancer `npm run build`, puis envoyer le HTML généré par FTP : le dossier `dist/` avec la configuration Netlify par défaut, ou `dist/client/` en construisant avec `DEPLOY_TARGET=cloudflare`. Dans ce cas, le client n'a pas de back-office en ligne.
