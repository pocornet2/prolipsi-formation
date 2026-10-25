// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

// URL publique du site (sans slash final). À définir dans les variables
// d'environnement de l'hébergeur : SITE_URL=https://www.mon-client.fr
const SITE_URL = process.env.SITE_URL || 'https://www.exemple.fr';

// Pages cochées « noindex » dans le back-office : exclues du sitemap.
function pagesNoindex() {
  const exclues = ['/merci/', '/404/'];
  const dossiers = { pages: '/', services: '/services/', actualites: '/actualites/' };
  for (const [dossier, prefixe] of Object.entries(dossiers)) {
    const racine = `./src/content/${dossier}`;
    if (!existsSync(racine)) continue;
    for (const slug of readdirSync(racine)) {
      const fichier = ['index.yaml', 'index.mdoc'].map((f) => `${racine}/${slug}/${f}`).find(existsSync);
      if (fichier && /^\s*noindex:\s*true/m.test(readFileSync(fichier, 'utf8'))) exclues.push(`${prefixe}${slug}/`);
    }
  }
  return exclues;
}
const NOINDEX = pagesNoindex();

// Hébergeur cible : 'cloudflare' ou 'netlify'.
// Détecté automatiquement sur Cloudflare (Workers Builds définit WORKERS_CI),
// sinon réglable avec la variable DEPLOY_TARGET.
const TARGET = process.env.DEPLOY_TARGET || (process.env.WORKERS_CI ? 'cloudflare' : 'netlify');

const adapter =
  TARGET === 'cloudflare'
    ? cloudflare({
        // Les pages sont générées avec Node pour pouvoir lire le contenu
        // (fichiers YAML) et optimiser les images (AVIF/WebP) au build.
        prerenderEnvironment: 'node',
        imageService: 'compile',
      })
    : // imageCDN: false → images optimisées au build, comme sur Cloudflare.
      // devFeatures: false → pas d'émulation Netlify en local (évite de dépendre de Deno).
      netlify({ imageCDN: false, devFeatures: false });

export default defineConfig({
  site: SITE_URL,
  // 'ignore' : indispensable pour le back-office Keystatic. Les pages du site
  // sont générées en dossiers (/a-propos/index.html), donc servies avec un slash final.
  trailingSlash: 'ignore',

  // Tout le site est généré en HTML statique au build.
  // Seules les routes du back-office (/keystatic et /api/keystatic)
  // tournent à la demande, grâce à l'adaptateur.
  output: 'static',
  adapter,
  // Pas de sessions côté serveur : évite de créer un stockage KV inutile.
  session: false,

  integrations: [
    react(),
    keystatic(),
    sitemap({
      filter: (page) =>
        !page.includes('/keystatic') &&
        !page.includes('/api/') &&
        !NOINDEX.some((chemin) => new URL(page).pathname === chemin),
    }),
  ],

  vite: {
    // Hébergeur cible, lisible dans les composants (formulaire de contact).
    define: { 'import.meta.env.DEPLOY_TARGET': JSON.stringify(TARGET) },
  },

  image: {
    // Formats modernes générés automatiquement par <Picture>
    responsiveStyles: true,
  },

  build: {
    // Le CSS des petites pages est injecté dans le HTML : une requête de moins.
    inlineStylesheets: 'auto',
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
