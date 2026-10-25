import type { ImageMetadata } from 'astro';

/**
 * Keystatic enregistre les images dans src/assets/images/… et renvoie leur
 * chemin sous forme de texte. On les retrouve ici pour qu'Astro puisse les
 * optimiser (redimensionnement, AVIF/WebP, dimensions fixes = pas de CLS).
 */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,gif,tiff}',
  { eager: true },
);

export function resolveImage(chemin: string | null | undefined): ImageMetadata | undefined {
  if (!chemin) return undefined;
  const cle = chemin.startsWith('/') ? chemin : `/${chemin}`;
  return images[cle]?.default;
}
