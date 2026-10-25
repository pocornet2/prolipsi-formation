import { defineMiddleware } from 'astro:middleware';

/**
 * En ligne, le back-office ne peut pas fonctionner en mode « local » :
 * le serveur n'a pas accès aux fichiers du projet, et l'interface charge
 * alors sans fin. On affiche à la place une page qui explique quoi faire.
 */
const storage = import.meta.env.PUBLIC_KEYSTATIC_STORAGE ?? 'local';

export const onRequest = defineMiddleware((context, next) => {
  const chemin = context.url.pathname;
  const backOffice = chemin.startsWith('/keystatic') || chemin.startsWith('/api/keystatic');
  if (import.meta.env.PROD && storage === 'local' && backOffice) {
    if (chemin.startsWith('/api/')) {
      return new Response(JSON.stringify({ erreur: 'Back-office non configuré pour la production.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    return new Response(
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Back-office non activé</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:640px;margin:10vh auto;padding:0 1.5rem;color:#222}code{background:#f2f2f2;padding:.1em .35em;border-radius:4px}h1{font-size:1.5rem}</style></head>
<body><h1>Le back-office n’est pas encore activé en ligne</h1>
<p>Ce site a été construit avec le stockage <code>local</code>, qui ne fonctionne que sur l’ordinateur de développement.</p>
<p>Pour éditer le contenu en ligne, ajoutez les variables de build <code>PUBLIC_KEYSTATIC_STORAGE=github</code>, <code>PUBLIC_KEYSTATIC_GITHUB_REPO</code> et <code>PUBLIC_KEYSTATIC_GITHUB_APP_SLUG</code>, ainsi que les secrets de l’application GitHub, puis relancez un déploiement (voir le README, section « Activer le back-office en ligne »).</p></body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
    );
  }
  return next();
});
