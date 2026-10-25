import Markdoc, { type Node } from '@markdoc/markdoc';

/**
 * Transforme le texte riche saisi dans Keystatic en HTML.
 * Les liens externes s'ouvrent dans un nouvel onglet ; les images sont
 * chargées en différé.
 */
const config = {
  nodes: {
    link: {
      render: 'a',
      attributes: { href: { type: String }, title: { type: String } },
      transform(node: Node, cfg: object) {
        const attributes = node.transformAttributes(cfg);
        const href = String(attributes.href ?? '');
        const externe = /^https?:\/\//.test(href);
        return new Markdoc.Tag(
          'a',
          externe ? { ...attributes, target: '_blank', rel: 'noopener' } : attributes,
          node.transformChildren(cfg),
        );
      },
    },
    image: {
      render: 'img',
      attributes: { src: { type: String }, alt: { type: String }, title: { type: String } },
      transform(node: Node, cfg: object) {
        const attributes = node.transformAttributes(cfg);
        return new Markdoc.Tag('img', { ...attributes, loading: 'lazy', decoding: 'async' }, []);
      },
    },
  },
};

// `any` : le type Node exporté par Keystatic diffère légèrement de celui de Markdoc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderMarkdoc(contenu: any): string {
  if (!contenu) return '';
  const node: Node = 'node' in contenu && !('type' in contenu) ? contenu.node : contenu;
  const errors = Markdoc.validate(node, config);
  if (errors.some((e) => e.error.level === 'critical')) {
    console.warn('[markdoc]', errors.map((e) => e.error.message).join(' | '));
  }
  return Markdoc.renderers.html(Markdoc.transform(node, config));
}

/** Texte brut (pour les extraits et les données structurées). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function markdocTexte(contenu: any): string {
  if (!contenu) return '';
  return renderMarkdoc(contenu)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
