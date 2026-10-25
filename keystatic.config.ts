import { config, collection, singleton, fields } from '@keystatic/core';

/* -------------------------------------------------------------------------- */
/*  Stockage                                                                  */
/*  - en local (npm run dev) : le contenu est écrit directement dans les     */
/*    fichiers du projet ;                                                    */
/*  - en ligne : le contenu est enregistré dans le dépôt GitHub (chaque      */
/*    modification = un commit, qui relance le build du site).               */
/*  Réglé par la variable PUBLIC_KEYSTATIC_STORAGE (local | github | cloud). */
/* -------------------------------------------------------------------------- */

const storageKind = import.meta.env.PUBLIC_KEYSTATIC_STORAGE ?? 'local';
const githubRepo = import.meta.env.PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined;
const cloudProject = import.meta.env.PUBLIC_KEYSTATIC_CLOUD_PROJECT as `${string}/${string}` | undefined;

const storage =
  storageKind === 'github' && githubRepo
    ? ({ kind: 'github', repo: githubRepo } as const)
    : storageKind === 'cloud' && cloudProject
      ? ({ kind: 'cloud' } as const)
      : ({ kind: 'local' } as const);

/* -------------------------------------------------------------------------- */
/*  Champs réutilisables                                                      */
/* -------------------------------------------------------------------------- */

/** Image optimisée par Astro (stockée dans src/assets/images/<dossier>). */
const imageField = (dossier: string, label = 'Image', description?: string) =>
  fields.image({
    label,
    description,
    directory: `src/assets/images/${dossier}`,
    publicPath: `/src/assets/images/${dossier}/`,
  });

/** Texte riche court (titres H2-H3, gras, liens, listes) pour les blocs. */
const texteRiche = (label = 'Texte') =>
  fields.markdoc.inline({
    label,
    options: {
      heading: [2, 3],
      bold: true,
      italic: true,
      link: true,
      unorderedList: true,
      orderedList: true,
      blockquote: true,
      strikethrough: false,
      code: false,
      codeBlock: false,
      table: false,
      divider: true,
      image: false,
    },
  });

/** Pictogrammes proposés dans le back-office (voir src/components/Icone.astro). */
const icones = [
  { label: 'Aucun', value: '' },
  { label: 'Formation (toque)', value: 'formation' },
  { label: 'Accompagnement (personnes)', value: 'accompagnement' },
  { label: 'Matériel (panier)', value: 'materiel' },
  { label: 'Devis / document', value: 'devis' },
  { label: 'Conformité (document validé)', value: 'conformite' },
  { label: 'Certification (bouclier)', value: 'certification' },
  { label: 'Qualité (badge)', value: 'qualite' },
  { label: 'Avis (étoile)', value: 'avis' },
  { label: 'Localisation', value: 'localisation' },
  { label: 'Entreprise', value: 'entreprise' },
  { label: 'Établissement / ERP', value: 'etablissement' },
  { label: 'Calendrier', value: 'calendrier' },
  { label: 'Téléphone', value: 'telephone' },
  { label: 'E-mail', value: 'email' },
] as const;

const champIcone = (label = 'Pictogramme') =>
  fields.select({ label, options: icones, defaultValue: '' });

const lienBouton = fields.object(
  {
    libelle: fields.text({ label: 'Texte du bouton' }),
    url: fields.text({ label: 'Lien', description: 'Ex. /contact/ ou https://…' }),
    style: fields.select({
      label: 'Style',
      options: [
        { label: 'Principal (rouge)', value: 'principal' },
        { label: 'Secondaire (contour)', value: 'secondaire' },
        { label: 'Blanc', value: 'blanc' },
      ],
      defaultValue: 'principal',
    }),
    icone: champIcone('Pictogramme avant le texte'),
    fleche: fields.checkbox({ label: 'Flèche après le texte', defaultValue: false }),
  },
  { label: 'Bouton' },
);

const seo = fields.object(
  {
    titre: fields.text({
      label: 'Balise title',
      description: '50 à 60 caractères. Laisser vide pour reprendre le titre de la page.',
      validation: { length: { max: 70 } },
    }),
    description: fields.text({
      label: 'Meta description',
      description: '140 à 160 caractères. Le texte affiché sous le lien dans Google.',
      multiline: true,
      validation: { length: { max: 170 } },
    }),
    image: imageField('partage', 'Image de partage (réseaux sociaux)', '1200 × 630 px conseillé.'),
    noindex: fields.checkbox({
      label: 'Masquer cette page des moteurs de recherche (noindex)',
      defaultValue: false,
    }),
  },
  { label: 'Référencement (SEO)', layout: [12, 12, 12, 12] },
);

/** Blocs de mise en page disponibles pour toutes les pages. */
const blocs = (dossier: string) =>
  fields.blocks(
    {
      hero: {
        label: 'Bandeau d’en-tête',
        itemLabel: (p) => `Bandeau · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          surtitre: fields.text({ label: 'Surtitre (petit texte au-dessus du titre)' }),
          titre: fields.text({ label: 'Titre principal (H1 sur la page)' }),
          titreAccent: fields.text({
            label: 'Fin du titre en couleur (facultatif)',
            description: 'Affichée en rouge à la suite du titre. Ex. « à La Baule et Saint-Nazaire »',
          }),
          texte: fields.text({ label: 'Texte d’accroche', multiline: true }),
          annotation: fields.text({
            label: 'Phrase manuscrite sur la photo (facultatif)',
            multiline: true,
          }),
          disposition: fields.select({
            label: 'Disposition de l’image',
            options: [
              { label: 'Photo à droite, fondue dans le fond clair', value: 'droite' },
              { label: 'Photo en plein fond, texte blanc', value: 'fond' },
            ],
            defaultValue: 'droite',
          }),
          image: imageField(dossier, 'Image'),
          alt: fields.text({ label: 'Texte alternatif de l’image' }),
          boutons: fields.array(lienBouton, {
            label: 'Boutons',
            itemLabel: (p) => p.fields.libelle.value || 'Bouton',
            validation: { length: { max: 2 } },
          }),
        }),
      },
      texte: {
        label: 'Texte',
        itemLabel: (p) => `Texte · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          titre: fields.text({ label: 'Titre de la section (H2)' }),
          contenu: texteRiche('Contenu'),
          largeur: fields.select({
            label: 'Largeur',
            options: [
              { label: 'Lecture (étroite)', value: 'etroite' },
              { label: 'Large', value: 'large' },
            ],
            defaultValue: 'etroite',
          }),
        }),
      },
      texteImage: {
        label: 'Texte + image',
        itemLabel: (p) => `Texte + image · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          surtitre: fields.text({ label: 'Surtitre' }),
          titre: fields.text({ label: 'Titre (H2)' }),
          contenu: texteRiche('Contenu'),
          image: imageField(dossier),
          alt: fields.text({ label: 'Texte alternatif de l’image' }),
          position: fields.select({
            label: 'Position de l’image',
            options: [
              { label: 'À droite', value: 'droite' },
              { label: 'À gauche', value: 'gauche' },
            ],
            defaultValue: 'droite',
          }),
          bouton: lienBouton,
        }),
      },
      cartes: {
        label: 'Cartes (arguments, prestations…)',
        itemLabel: (p) => `Cartes · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          surtitre: fields.text({ label: 'Surtitre' }),
          titre: fields.text({ label: 'Titre (H2)' }),
          intro: fields.text({ label: 'Introduction', multiline: true }),
          alignement: fields.select({
            label: 'Alignement du titre',
            options: [
              { label: 'Centré', value: 'centre' },
              { label: 'À gauche', value: 'gauche' },
            ],
            defaultValue: 'centre',
          }),
          cartes: fields.array(
            fields.object({
              image: imageField(dossier, 'Photo (facultative)'),
              alt: fields.text({ label: 'Texte alternatif de la photo' }),
              icone: champIcone(),
              titre: fields.text({ label: 'Titre de la carte' }),
              texte: fields.text({ label: 'Texte', multiline: true }),
              lien: fields.text({ label: 'Lien (facultatif)' }),
              lienLibelle: fields.text({ label: 'Texte du lien', description: 'Ex. Découvrir nos formations' }),
            }),
            { label: 'Cartes', itemLabel: (p) => p.fields.titre.value || 'Carte' },
          ),
        }),
      },
      listeServices: {
        label: 'Liste des services (automatique)',
        itemLabel: (p) => `Services · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          surtitre: fields.text({ label: 'Surtitre' }),
          titre: fields.text({ label: 'Titre (H2)' }),
          intro: fields.text({ label: 'Introduction', multiline: true }),
        }),
      },
      chiffres: {
        label: 'Chiffres clés',
        itemLabel: () => 'Chiffres clés',
        schema: fields.object({
          titre: fields.text({ label: 'Titre (facultatif)' }),
          items: fields.array(
            fields.object({
              valeur: fields.text({ label: 'Valeur', description: 'Ex. 25 ans, 400+, 98 %' }),
              libelle: fields.text({ label: 'Libellé' }),
            }),
            {
              label: 'Chiffres',
              itemLabel: (p) => `${p.fields.valeur.value} ${p.fields.libelle.value}`,
              validation: { length: { max: 4 } },
            },
          ),
        }),
      },
      galerie: {
        label: 'Galerie photos',
        itemLabel: (p) => `Galerie · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)' }),
          images: fields.array(
            fields.object({
              image: imageField(dossier),
              alt: fields.text({ label: 'Texte alternatif' }),
              legende: fields.text({ label: 'Légende (facultative)' }),
            }),
            { label: 'Photos', itemLabel: (p) => p.fields.alt.value || 'Photo' },
          ),
        }),
      },
      temoignages: {
        label: 'Témoignages',
        itemLabel: () => 'Témoignages',
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)' }),
          items: fields.array(
            fields.object({
              citation: fields.text({ label: 'Avis', multiline: true }),
              auteur: fields.text({ label: 'Nom' }),
              contexte: fields.text({ label: 'Contexte (ville, type de projet…)' }),
            }),
            { label: 'Avis', itemLabel: (p) => p.fields.auteur.value || 'Avis' },
          ),
        }),
      },
      faq: {
        label: 'Questions fréquentes (FAQ)',
        itemLabel: (p) => `FAQ · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)', defaultValue: 'Questions fréquentes' }),
          intro: fields.text({ label: 'Texte sous le titre (facultatif)', multiline: true }),
          disposition: fields.select({
            label: 'Disposition',
            options: [
              { label: 'Titre à gauche, questions à droite', value: 'colonnes' },
              { label: 'Une seule colonne centrée', value: 'colonne' },
            ],
            defaultValue: 'colonnes',
          }),
          questions: fields.array(
            fields.object({
              question: fields.text({ label: 'Question' }),
              reponse: fields.text({ label: 'Réponse', multiline: true }),
            }),
            { label: 'Questions', itemLabel: (p) => p.fields.question.value || 'Question' },
          ),
        }),
      },
      appel: {
        label: 'Appel à l’action',
        itemLabel: (p) => `Appel à l’action · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          titre: fields.text({ label: 'Titre' }),
          texte: fields.text({ label: 'Texte', multiline: true }),
          style: fields.select({
            label: 'Style',
            options: [
              { label: 'Bandeau bleu marine pleine largeur', value: 'bandeau' },
              { label: 'Encadré de couleur', value: 'encadre' },
            ],
            defaultValue: 'bandeau',
          }),
          image: imageField(dossier, 'Photo à droite du bandeau (facultative)'),
          boutons: fields.array(lienBouton, {
            label: 'Boutons',
            itemLabel: (p) => p.fields.libelle.value || 'Bouton',
            validation: { length: { max: 3 } },
          }),
        }),
      },
      reassurance: {
        label: 'Bande de réassurance (labels, avis, zone…)',
        itemLabel: () => 'Bande de réassurance',
        schema: fields.object({
          items: fields.array(
            fields.object({
              logo: imageField(dossier, 'Logo (facultatif, sinon pictogramme)'),
              icone: champIcone('Pictogramme (si pas de logo)'),
              titre: fields.text({ label: 'Titre' }),
              texte: fields.text({ label: 'Texte', multiline: true }),
            }),
            {
              label: 'Éléments',
              itemLabel: (p) => p.fields.titre.value || 'Élément',
              validation: { length: { max: 4 } },
            },
          ),
        }),
      },
      miseEnAvant: {
        label: 'Mise en avant + produits',
        itemLabel: (p) => `Mise en avant · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          etiquette: fields.text({ label: 'Étiquette (ex. NOUVEAU)' }),
          titre: fields.text({ label: 'Titre (H2)' }),
          texte: fields.text({ label: 'Texte', multiline: true }),
          bouton: lienBouton,
          produits: fields.array(
            fields.object({
              image: imageField(dossier, 'Photo'),
              alt: fields.text({ label: 'Texte alternatif' }),
              titre: fields.text({ label: 'Nom' }),
              texte: fields.text({ label: 'Description courte', multiline: true }),
              lien: fields.text({ label: 'Lien (facultatif)' }),
            }),
            {
              label: 'Produits',
              itemLabel: (p) => p.fields.titre.value || 'Produit',
              validation: { length: { max: 4 } },
            },
          ),
        }),
      },
      avisSessions: {
        label: 'Avis clients + prochaines sessions',
        itemLabel: () => 'Avis clients + prochaines sessions',
        schema: fields.object({
          titreAvis: fields.text({ label: 'Titre de la colonne avis', defaultValue: 'Ils nous font confiance' }),
          note: fields.text({ label: 'Note Google (ex. 4,8)', description: 'Reprendre la note réelle de la fiche Google.' }),
          nombreAvis: fields.text({ label: 'Mention sous la note (ex. Plus de 60 avis sur Google)' }),
          lienAvis: fields.url({ label: 'Lien vers les avis Google' }),
          avis: fields.array(
            fields.object({
              citation: fields.text({ label: 'Avis (repris tel quel)', multiline: true }),
              auteur: fields.text({ label: 'Auteur ou type de client' }),
              icone: champIcone(),
            }),
            { label: 'Avis', itemLabel: (p) => p.fields.auteur.value || 'Avis' },
          ),
          titreSessions: fields.text({ label: 'Titre de la colonne sessions', defaultValue: 'Prochaines sessions de formation' }),
          nombreSessions: fields.integer({ label: 'Nombre de sessions affichées', defaultValue: 4 }),
          lienCalendrier: fields.object(
            {
              libelle: fields.text({ label: 'Texte du lien', defaultValue: 'Voir tout le calendrier' }),
              url: fields.text({ label: 'Lien (page ou PDF)' }),
            },
            { label: 'Lien vers le calendrier complet' },
          ),
        }),
      },
      logos: {
        label: 'Bandeau de logos (certifications, partenaires)',
        itemLabel: (p) => `Logos · ${p.fields.titre.value || 'sans titre'}`,
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)' }),
          texte: fields.text({ label: 'Texte', multiline: true }),
          logos: fields.array(
            fields.object({
              image: imageField(dossier, 'Logo (fichier officiel)'),
              nom: fields.text({ label: 'Nom (texte alternatif)' }),
              lien: fields.text({ label: 'Lien (facultatif)' }),
            }),
            { label: 'Logos', itemLabel: (p) => p.fields.nom.value || 'Logo' },
          ),
        }),
      },
      derniereActu: {
        label: 'Dernière actualité (automatique)',
        itemLabel: () => 'Dernière actualité',
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)', defaultValue: 'Nos actualités' }),
          texte: fields.text({ label: 'Texte sous le titre', multiline: true }),
        }),
      },
      contact: {
        label: 'Formulaire de contact',
        itemLabel: () => 'Formulaire de contact',
        schema: fields.object({
          titre: fields.text({ label: 'Titre (H2)', defaultValue: 'Parlons de votre projet' }),
          texte: fields.text({ label: 'Texte', multiline: true }),
        }),
      },
    },
    { label: 'Contenu de la page (blocs)' },
  );

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

export default config({
  storage,
  ...(storageKind === 'cloud' && cloudProject ? { cloud: { project: cloudProject } } : {}),
  locale: 'fr-FR',

  ui: {
    brand: { name: 'Espace de gestion' },
    navigation: {
      'Pages': ['accueil', 'pages', 'actualites'],
      'Formations': ['sessions'],
      'Réglages': ['reglages', 'navigation'],
    },
  },

  singletons: {
    reglages: singleton({
      label: 'Coordonnées et réglages',
      path: 'src/content/reglages/',
      format: { data: 'yaml' },
      schema: {
        nom: fields.text({ label: 'Nom de l’entreprise', validation: { length: { min: 1 } } }),
        baseline: fields.text({ label: 'Phrase d’accroche (pied de page et balise title de l’accueil)' }),
        logoLigne1: fields.text({ label: 'Logo : première ligne sous le nom (en rouge)' }),
        logoLigne2: fields.text({ label: 'Logo : seconde ligne sous le nom' }),
        signature: fields.text({ label: 'Signature en bas de page (ex. Des environnements de travail plus sûrs)' }),
        logo: fields.image({
          label: 'Logo',
          description: 'SVG ou PNG transparent. Laisser vide pour afficher le nom en texte.',
          directory: 'public/images/marque',
          publicPath: '/images/marque/',
        }),
        couleur: fields.text({
          label: 'Couleur principale',
          description: 'Code hexadécimal, ex. #1f5f4a',
          defaultValue: '#1f5f4a',
        }),
        telephone: fields.text({ label: 'Téléphone', description: 'Format affiché, ex. 02 40 00 00 00' }),
        email: fields.text({ label: 'E-mail' }),
        adresse: fields.object(
          {
            rue: fields.text({ label: 'Rue' }),
            codePostal: fields.text({ label: 'Code postal' }),
            ville: fields.text({ label: 'Ville' }),
          },
          { label: 'Adresse', layout: [12, 4, 8] },
        ),
        zone: fields.text({
          label: 'Zone d’intervention',
          description: 'Une ville ou un département par ligne. Utilisé dans les données structurées.',
          multiline: true,
        }),
        horaires: fields.text({ label: 'Horaires (affichés tels quels)', multiline: true }),
        typeEntreprise: fields.select({
          label: 'Type d’entreprise (données structurées Google)',
          options: [
            { label: 'Entreprise locale (générique)', value: 'LocalBusiness' },
            { label: 'Services professionnels', value: 'ProfessionalService' },
            { label: 'Artisan / bâtiment', value: 'HomeAndConstructionBusiness' },
            { label: 'Cabinet d’avocats', value: 'LegalService' },
            { label: 'Santé / bien-être', value: 'HealthAndBeautyBusiness' },
            { label: 'Commerce', value: 'Store' },
            { label: 'Organisation (sans adresse publique)', value: 'Organization' },
          ],
          defaultValue: 'LocalBusiness',
        }),
        reseaux: fields.array(
          fields.object({
            nom: fields.select({
              label: 'Réseau',
              options: [
                { label: 'Facebook', value: 'Facebook' },
                { label: 'Instagram', value: 'Instagram' },
                { label: 'LinkedIn', value: 'LinkedIn' },
                { label: 'YouTube', value: 'YouTube' },
                { label: 'Google Business Profile', value: 'Google' },
              ],
              defaultValue: 'Facebook',
            }),
            url: fields.url({ label: 'Adresse de la page' }),
          }),
          { label: 'Réseaux sociaux', itemLabel: (p) => p.fields.nom.value },
        ),
        imagePartage: imageField('partage', 'Image de partage par défaut', '1200 × 630 px. Utilisée quand une page n’a pas la sienne.'),
        formulaire: fields.object(
          {
            action: fields.text({
              label: 'Adresse d’envoi du formulaire',
              description:
                'Sur Netlify : laisser vide (Netlify Forms). Sur Cloudflare : https://api.web3forms.com/submit (Web3Forms) ou l’URL Formspree (https://formspree.io/f/…).',
            }),
            cle: fields.text({
              label: 'Clé d’accès Web3Forms (si Web3Forms)',
              description: 'Fournie gratuitement sur web3forms.com, envoyée à l’adresse qui recevra les messages.',
            }),
            merci: fields.text({
              label: 'Message affiché après envoi',
              defaultValue: 'Merci, votre message est bien parti. Nous vous répondons rapidement.',
            }),
          },
          { label: 'Formulaire de contact' },
        ),
        analytics: fields.text({
          label: 'Code de mesure d’audience (facultatif)',
          description:
            'Balise <script> fournie par Plausible, Umami, Matomo… Collez-la telle quelle. Évitez les outils à cookies si vous ne gérez pas de bandeau de consentement.',
          multiline: true,
        }),
      },
    }),

    navigation: singleton({
      label: 'Menu',
      path: 'src/content/navigation/',
      format: { data: 'yaml' },
      schema: {
        liens: fields.array(
          fields.object({
            libelle: fields.text({ label: 'Texte du lien' }),
            url: fields.text({ label: 'Lien', description: 'Ex. /services/' }),
          }),
          { label: 'Liens du menu', itemLabel: (p) => p.fields.libelle.value || 'Lien' },
        ),
        bouton: lienBouton,
        piedDePage: fields.array(
          fields.object({
            libelle: fields.text({ label: 'Texte du lien' }),
            url: fields.text({ label: 'Lien' }),
          }),
          { label: 'Liens du pied de page', itemLabel: (p) => p.fields.libelle.value || 'Lien' },
        ),
        liensLegaux: fields.array(
          fields.object({
            libelle: fields.text({ label: 'Texte du lien' }),
            url: fields.text({ label: 'Lien' }),
          }),
          { label: 'Liens légaux (bas de page)', itemLabel: (p) => p.fields.libelle.value || 'Lien' },
        ),
      },
    }),

    accueil: singleton({
      label: 'Page d’accueil',
      path: 'src/content/accueil/',
      format: { data: 'yaml' },
      schema: {
        seo,
        blocs: blocs('accueil'),
      },
    }),
  },

  collections: {
    pages: collection({
      label: 'Pages',
      slugField: 'titre',
      path: 'src/content/pages/*/',
      format: { data: 'yaml' },
      columns: ['titre'],
      schema: {
        titre: fields.slug({
          name: { label: 'Titre de la page' },
          slug: { label: 'Adresse (URL)', description: 'Ex. a-propos → /a-propos/' },
        }),
        seo,
        blocs: blocs('pages'),
      },
    }),

    services: collection({
      label: 'Services',
      slugField: 'titre',
      path: 'src/content/services/*/',
      format: { data: 'yaml' },
      columns: ['titre', 'ordre'],
      schema: {
        titre: fields.slug({
          name: { label: 'Nom du service' },
          slug: { label: 'Adresse (URL)', description: 'Ex. renovation → /services/renovation/' },
        }),
        ordre: fields.integer({ label: 'Ordre d’affichage', defaultValue: 10 }),
        resume: fields.text({
          label: 'Résumé',
          description: 'Une à deux phrases, affichées dans la liste des services.',
          multiline: true,
        }),
        image: imageField('services', 'Image de présentation'),
        alt: fields.text({ label: 'Texte alternatif de l’image' }),
        seo,
        blocs: blocs('services'),
      },
    }),

    sessions: collection({
      label: 'Sessions de formation',
      slugField: 'titre',
      path: 'src/content/sessions/*',
      format: { data: 'yaml' },
      columns: ['titre', 'date', 'lieu'],
      schema: {
        titre: fields.slug({ name: { label: 'Intitulé de la formation' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        lieu: fields.text({ label: 'Lieu', defaultValue: 'La Baule' }),
        places: fields.select({
          label: 'Disponibilité',
          options: [
            { label: 'Places disponibles', value: 'disponibles' },
            { label: 'Dernières places', value: 'dernieres' },
            { label: 'Complet', value: 'complet' },
          ],
          defaultValue: 'disponibles',
        }),
        lien: fields.text({ label: 'Lien vers la formation (facultatif)', description: 'Ex. /formations/sst/' }),
      },
    }),

    actualites: collection({
      label: 'Actualités',
      slugField: 'titre',
      path: 'src/content/actualites/*/',
      entryLayout: 'content',
      format: { contentField: 'contenu' },
      columns: ['titre', 'date'],
      schema: {
        titre: fields.slug({ name: { label: 'Titre' }, slug: { label: 'Adresse (URL)' } }),
        date: fields.date({ label: 'Date de publication', defaultValue: { kind: 'today' } }),
        extrait: fields.text({
          label: 'Extrait',
          description: 'Affiché dans la liste des actualités.',
          multiline: true,
        }),
        etiquette: fields.text({ label: 'Étiquette (ex. NOUVEAU, facultatif)' }),
        image: imageField('actualites', 'Image principale'),
        alt: fields.text({ label: 'Texte alternatif de l’image' }),
        brouillon: fields.checkbox({ label: 'Brouillon (non publié)', defaultValue: false }),
        seo,
        contenu: fields.markdoc({
          label: 'Article',
          options: {
            heading: [2, 3, 4],
            image: {
              directory: 'public/images/contenu',
              publicPath: '/images/contenu/',
            },
          },
        }),
      },
    }),
  },
});
