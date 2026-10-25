import type { Reglages, Blocs } from './content';

type JsonLd = Record<string, unknown>;

/** Entreprise : LocalBusiness (ou sous-type) avec adresse, zone, réseaux. */
export function schemaEntreprise(r: Reglages, site: URL, logo?: string): JsonLd {
  const avecAdresse = r.typeEntreprise !== 'Organization' && (r.adresse.ville || r.adresse.rue);
  const zones = (r.zone ?? '')
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean);

  return {
    '@type': r.typeEntreprise || 'LocalBusiness',
    '@id': new URL('/#entreprise', site).href,
    name: r.nom,
    url: site.href,
    ...(r.baseline && { description: r.baseline }),
    ...(logo && { logo, image: logo }),
    ...(r.telephone && { telephone: r.telephone.replace(/\s/g, '') }),
    ...(r.email && { email: r.email }),
    ...(avecAdresse && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: r.adresse.rue || undefined,
        postalCode: r.adresse.codePostal || undefined,
        addressLocality: r.adresse.ville || undefined,
        addressCountry: 'FR',
      },
    }),
    ...(zones.length && { areaServed: zones.map((name) => ({ '@type': 'Place', name })) }),
    ...(r.reseaux.length && { sameAs: r.reseaux.map((x) => x.url).filter(Boolean) }),
  };
}

export function schemaSiteWeb(r: Reglages, site: URL): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': new URL('/#site', site).href,
    url: site.href,
    name: r.nom,
    inLanguage: 'fr-FR',
    publisher: { '@id': new URL('/#entreprise', site).href },
  };
}

export function schemaFilAriane(items: { nom: string; url: string }[], site: URL): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nom,
      item: new URL(item.url, site).href,
    })),
  };
}

/** FAQPage générée automatiquement à partir des blocs FAQ de la page. */
export function schemaFaq(blocs: Blocs | undefined): JsonLd | undefined {
  const questions = (blocs ?? [])
    .filter((b) => b.discriminant === 'faq')
    .flatMap((b) => (b.discriminant === 'faq' ? b.value.questions : []))
    .filter((q) => q.question && q.reponse);
  if (!questions.length) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.reponse },
    })),
  };
}

export function schemaService(
  s: { nom: string; description?: string; url: string; image?: string },
  r: Reglages,
  site: URL,
): JsonLd {
  const zones = (r.zone ?? '').split('\n').map((z) => z.trim()).filter(Boolean);
  return {
    '@type': 'Service',
    name: s.nom,
    url: new URL(s.url, site).href,
    ...(s.description && { description: s.description }),
    ...(s.image && { image: s.image }),
    provider: { '@id': new URL('/#entreprise', site).href },
    ...(zones.length && { areaServed: zones.map((name) => ({ '@type': 'Place', name })) }),
  };
}

export function schemaArticle(
  a: { titre: string; description?: string; url: string; date?: string | null; image?: string },
  site: URL,
): JsonLd {
  return {
    '@type': 'BlogPosting',
    headline: a.titre,
    url: new URL(a.url, site).href,
    mainEntityOfPage: new URL(a.url, site).href,
    ...(a.description && { description: a.description }),
    ...(a.date && { datePublished: a.date, dateModified: a.date }),
    ...(a.image && { image: a.image }),
    inLanguage: 'fr-FR',
    author: { '@id': new URL('/#entreprise', site).href },
    publisher: { '@id': new URL('/#entreprise', site).href },
  };
}

/** Assemble tous les schémas d'une page dans un seul graphe JSON-LD. */
export function graphe(...schemas: (JsonLd | undefined)[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': schemas.filter(Boolean) }).replace(
    /</g,
    '\\u003c',
  );
}
