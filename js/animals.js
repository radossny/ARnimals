/**
 * animals.js
 * Centralna konfiguracja aplikacji.
 *
 * Tutaj wpisuje się później prawdziwe pliki. Dopóki `preview`, `sprite`,
 * `glb` i `usdz` mają wartość null, aplikacja automatycznie używa wbudowanych
 * zastępczych rysunków SVG (patrz placeholders.js) oraz trybu kamery 2D.
 */

/** Ustawienia globalne (celowo małe i zmienialne bez kroku budowania). */
export const APP_SETTINGS = {
  /**
   * Tryb zdjęć. Domyślnie wyłączony (ochrona prywatności).
   * true = w widoku kamery pojawia się lokalny przycisk zdjęcia.
   * Nawet wtedy nic nie jest wysyłane ani trwale zapisywane.
   */
  photoMode: false,

  /**
   * Źródło <model-viewer>. Domyślnie: własny hosting w katalogu vendor/.
   * Gdy pliku brakuje, aplikacja po cichu wraca do trybu kamery 2D.
   * Alternatywa (wtedy trzeba dostosować CSP):
   * 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
   */
  modelViewerUrl: 'vendor/model-viewer.min.js',
  modelViewerTimeoutMs: 8000,

  /** Rozdzielczość kamery celowo ograniczona: oszczędza baterię, RAM i ciepło. */
  camera: {
    idealWidth: 1280,
    idealHeight: 720,
    maxFrameRate: 30
  },

  /** Granice przesuwania i skalowania zwierzątka w obrazie z kamery. */
  overlay: {
    startScale: 1,
    minScale: 0.45,
    maxScale: 2.6,
    stepFactor: 1.18,
    keyboardStepPx: 24,
    /** Tyle zwierzątka musi zawsze pozostać widoczne (w pikselach). */
    minVisiblePx: 40
  }
};

/**
 * Lista zwierząt.
 *
 * Pola każdego wpisu:
 *  id         unikalny klucz (tylko a-z)
 *  name       nazwa wyświetlana w interfejsie (po polsku)
 *  altText    tekst alternatywny dla czytnika ekranu
 *  color      kolor karty (pastelowe tło karty wyboru)
 *  palette    kolory zastępczego rysunku SVG
 *  shape      nazwa figury zastępczej w placeholders.js
 *  idle       animacja spoczynkowa: 'bob' | 'sway' | 'hop' | 'wobble'
 *  preview    adres obrazka podglądu (WebP/AVIF/PNG) albo null
 *  sprite     adres animowanego zasobu 2D (animowany WebP/APNG/SVG) albo null
 *  glb        adres modelu GLB (Android / WebXR / Scene Viewer) albo null
 *  usdz       adres modelu USDZ (iOS AR Quick Look) albo null
 *  modelScale rzeczywista wysokość zwierzęcia w metrach (tylko tryb AR)
 */
export const ANIMALS = [
  {
    id: 'lion',
    name: 'Lew',
    altText: 'Wesoły lew z dużą grzywą',
    color: '#FFE6BC',
    palette: { primary: '#FFD79A', secondary: '#F2A03F', accent: '#FFF6E6' },
    shape: 'lion',
    idle: 'bob',
    preview: null,
    sprite: null,
    // glb wymaga biblioteki w vendor/model-viewer.min.js.
    // Dopóki jej nie ma, zostaw null – inaczej AR w ogóle się nie uruchomi.
    glb: null,
    usdz: 'models/lew.usdz',
    modelScale: 1.1
  },
  {
    id: 'elephant',
    name: 'Słoń',
    altText: 'Sympatyczny słoń z wielkimi uszami',
    color: '#DDE7FA',
    palette: { primary: '#BFCFEA', secondary: '#9BB0D6', accent: '#F7C9D6' },
    shape: 'elephant',
    idle: 'sway',
    preview: null,
    sprite: null,
    glb: null,
    usdz: null,
    modelScale: 1.6
  },
  {
    id: 'penguin',
    name: 'Pingwin',
    altText: 'Wesoły pingwin',
    color: '#D6EEFB',
    palette: { primary: '#2E3A59', secondary: '#FFFFFF', accent: '#F2A03F' },
    shape: 'penguin',
    idle: 'hop',
    preview: null,
    sprite: null,
    glb: null,
    usdz: null,
    modelScale: 0.8
  },
  {
    id: 'panda',
    name: 'Panda',
    altText: 'Rozbawiona panda',
    color: '#E7F3E4',
    palette: { primary: '#FFFFFF', secondary: '#2A2F3D', accent: '#B9EBD5' },
    shape: 'panda',
    idle: 'wobble',
    preview: null,
    sprite: null,
    glb: null,
    usdz: null,
    modelScale: 1.0
  },
  {
    id: 'fox',
    name: 'Lis',
    altText: 'Ciekawski lis',
    color: '#FFE3D2',
    palette: { primary: '#F1874B', secondary: '#FFF1E2', accent: '#D9662F' },
    shape: 'fox',
    idle: 'bob',
    preview: null,
    sprite: null,
    glb: null,
    usdz: null,
    modelScale: 0.7
  },
  {
    id: 'deer',
    name: 'Sarna',
    altText: 'Sarna, która spokojnie się rozgląda',
    color: '#EFE2D2',
    palette: { primary: '#C08A5A', secondary: '#8A5E38', accent: '#FFF3E4' },
    shape: 'generic',
    idle: 'sway',
    preview: null,
    sprite: null,
    // glb wymaga biblioteki w vendor/model-viewer.min.js
    glb: null,
    usdz: 'models/sarna.usdz',
    modelScale: 1.0
  },
  {
    id: 'rabbit',
    name: 'Królik',
    altText: 'Królik z długimi uszami',
    color: '#EFE9FF',
    palette: { primary: '#F4F1FF', secondary: '#D9CDFA', accent: '#FFC6D3' },
    shape: 'rabbit',
    idle: 'hop',
    preview: null,
    sprite: null,
    glb: null,
    usdz: null,
    modelScale: 0.5
  }
];

/** Zwraca zwierzę o podanym id albo undefined. */
export function getAnimalById(id) {
  return ANIMALS.find((animal) => animal.id === id);
}

/** true, jeśli dla tego zwierzęcia w ogóle skonfigurowano model 3D. */
export function hasModel(animal) {
  return Boolean(animal && (animal.glb || animal.usdz));
}
