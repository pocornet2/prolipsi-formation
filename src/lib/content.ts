import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

/**
 * Lecteur Keystatic : lit le contenu directement dans les fichiers du projet
 * au moment du build. Aucune requête réseau, aucune base de données.
 */
export const reader = createReader(process.cwd(), keystaticConfig);

export type Reglages = NonNullable<Awaited<ReturnType<typeof reader.singletons.reglages.read>>>;
export type Navigation = NonNullable<Awaited<ReturnType<typeof reader.singletons.navigation.read>>>;
export type Accueil = NonNullable<Awaited<ReturnType<typeof reader.singletons.accueil.read>>>;
export type Blocs = Accueil['blocs'];
export type Bloc = Blocs[number];
export type Seo = Accueil['seo'];

const REGLAGES_PAR_DEFAUT = {
  nom: 'Mon entreprise',
  baseline: '',
  logoLigne1: '',
  logoLigne2: '',
  signature: '',
  logo: null,
  couleur: '#1f5f4a',
  telephone: '',
  email: '',
  adresse: { rue: '', codePostal: '', ville: '' },
  zone: '',
  horaires: '',
  typeEntreprise: 'LocalBusiness',
  reseaux: [],
  imagePartage: null,
  formulaire: { action: '', cle: '', merci: 'Merci, votre message est bien parti.' },
  analytics: '',
} satisfies Reglages;

export async function getReglages(): Promise<Reglages> {
  return (await reader.singletons.reglages.read()) ?? REGLAGES_PAR_DEFAUT;
}

export async function getNavigation(): Promise<Navigation> {
  return (
    (await reader.singletons.navigation.read()) ?? {
      liens: [],
      bouton: { libelle: '', url: '', style: 'principal', icone: '', fleche: false },
      piedDePage: [],
      liensLegaux: [],
    }
  );
}

export async function getServices() {
  const services = await reader.collections.services.all();
  return services.sort(
    (a, b) => (a.entry.ordre ?? 10) - (b.entry.ordre ?? 10) || a.entry.titre.localeCompare(b.entry.titre, 'fr'),
  );
}

/** Catalogue de formations, trié par ordre puis par nom. */
export async function getFormations(categorie?: string) {
  const formations = (await reader.collections.formations.all())
    .filter((f) => !categorie || f.entry.categorie === categorie)
    .sort(
      (a, b) => (a.entry.ordre ?? 10) - (b.entry.ordre ?? 10) || a.entry.titre.localeCompare(b.entry.titre, 'fr'),
    );
  return formations;
}

export const CATEGORIES_FORMATION: Record<string, string> = {
  secourisme: 'Secourisme',
  incendie: 'Incendie et évacuation',
  prevention: 'Prévention des risques professionnels',
};

/** Sessions à venir (la date du jour comprise), de la plus proche à la plus lointaine. */
export async function getSessions(nombre?: number) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const sessions = (await reader.collections.sessions.all())
    .filter((s) => s.entry.date && s.entry.date >= aujourdhui)
    .sort((a, b) => (a.entry.date ?? '').localeCompare(b.entry.date ?? ''));
  return nombre ? sessions.slice(0, nombre) : sessions;
}

export async function getActualites() {
  const articles = await reader.collections.actualites.all();
  return articles
    .filter((a) => !a.entry.brouillon)
    .sort((a, b) => (b.entry.date ?? '').localeCompare(a.entry.date ?? ''));
}

/** Formate une date ISO (2026-10-21) en « 21 octobre 2026 ». */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00`),
  );
}

/** Renvoie une URL propre, avec slash final pour les liens internes. */
export function lien(url: string | null | undefined): string {
  if (!url) return '#';
  if (/^(https?:|mailto:|tel:|#)/.test(url)) return url;
  const [chemin, ancre] = url.split('#');
  const avecSlash = chemin.endsWith('/') || /\.[a-z0-9]+$/i.test(chemin) ? chemin : `${chemin}/`;
  return ancre ? `${avecSlash}#${ancre}` : avecSlash;
}

/**
 * Typographie française : espace insécable fine avant ? ! ; : et dans les
 * guillemets, pour éviter qu'un « ? » se retrouve seul en début de ligne.
 */
export function typo(texte: string | null | undefined): string {
  if (!texte) return '';
  return texte
    .replace(/\s+([?!;:»])/g, '\u202f$1')
    .replace(/«\s+/g, '«\u202f');
}
