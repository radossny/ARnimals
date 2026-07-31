/**
 * ar.js
 * Tryb B: rozszerzony tryb AR.
 *
 * Całe użycie <model-viewer> jest zamknięte w tym pliku. Przy późniejszej
 * wymianie biblioteki wystarczy zmienić tylko ten plik. Każdy błąd powoduje
 * ciche przejście do trybu kamery 2D – dziecko nigdy nie zobaczy komunikatu
 * technicznego.
 */

import { APP_SETTINGS, hasModel } from './animals.js';

let libraryPromise = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: przekroczono czas oczekiwania`)), ms))
  ]);
}

/** Ładuje <model-viewer> dokładnie raz i tylko w razie potrzeby. */
function loadLibrary() {
  if (libraryPromise) return libraryPromise;
  const url = new URL(APP_SETTINGS.modelViewerUrl, document.baseURI).href;
  libraryPromise = withTimeout(
    import(/* @vite-ignore */ url).then(() => customElements.whenDefined('model-viewer')),
    APP_SETTINGS.modelViewerTimeoutMs,
    'model-viewer'
  ).catch((error) => {
    libraryPromise = null;
    throw error;
  });
  return libraryPromise;
}

/** Szybkie wykrywanie możliwości bez analizy User-Agenta. */
export async function detectArCapabilities() {
  const anchor = document.createElement('a');
  const quickLook = Boolean(anchor.relList && anchor.relList.supports && anchor.relList.supports('ar'));
  let webxr = false;
  try {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      webxr = await navigator.xr.isSessionSupported('immersive-ar');
    }
  } catch (error) {
    webxr = false;
  }
  return { webxr, quickLook };
}

export class ArStage {
  /**
   * @param {object} options
   * @param {HTMLElement} options.host      kontener elementu 3D
   * @param {function} options.onStatus     wywołanie zwrotne przy zmianie statusu
   */
  constructor({ host, onStatus = () => {} }) {
    this.host = host;
    this.onStatus = onStatus;
    this.viewer = null;
    this.quickLookAnchor = null;
    this.mode = null;
  }

  /**
   * Przygotowuje tryb AR.
   * @returns {Promise<boolean>} false, jeśli należy użyć trybu 2D.
   */
  async prepare(animal) {
    this.dispose();
    if (!hasModel(animal)) return false;

    const capabilities = await detectArCapabilities();

    // Tylko USDZ i dostępny Quick Look: prosta droga na skróty.
    if (!animal.glb && animal.usdz && capabilities.quickLook) {
      this.mode = 'quick-look';
      this.quickLookAnchor = document.createElement('a');
      this.quickLookAnchor.rel = 'ar';
      this.quickLookAnchor.href = animal.usdz;
      const preview = document.createElement('img');
      preview.alt = animal.altText;
      preview.src = animal.preview || '';
      this.quickLookAnchor.append(preview);
      this.quickLookAnchor.hidden = true;
      this.host.append(this.quickLookAnchor);
      return true;
    }

    if (!animal.glb) return false;

    try {
      await loadLibrary();
    } catch (error) {
      console.warn('[ar] Biblioteka niedostępna, używam trybu 2D', error.message);
      return false;
    }

    const viewer = document.createElement('model-viewer');
    viewer.setAttribute('src', animal.glb);
    if (animal.usdz) viewer.setAttribute('ios-src', animal.usdz);
    viewer.setAttribute('alt', animal.altText);
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    viewer.setAttribute('ar-placement', 'floor');
    viewer.setAttribute('ar-scale', 'auto');
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('touch-action', 'pan-y');
    viewer.setAttribute('shadow-intensity', '1');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('loading', 'eager');
    viewer.className = 'model-viewer';
    this.viewer = viewer;
    this.host.append(viewer);

    try {
      await withTimeout(
        new Promise((resolve, reject) => {
          viewer.addEventListener('load', resolve, { once: true });
          viewer.addEventListener('error', () => reject(new Error('Nie udało się wczytać modelu')), { once: true });
        }),
        APP_SETTINGS.modelViewerTimeoutMs,
        'Model'
      );
    } catch (error) {
      console.warn('[ar] Nie można wczytać modelu, używam trybu 2D', error.message);
      this.dispose();
      return false;
    }

    if (!viewer.canActivateAR) {
      console.info('[ar] Urządzenie nie zgłasza obsługi AR, używam trybu 2D');
      this.dispose();
      return false;
    }

    viewer.addEventListener('ar-status', (event) => {
      this.onStatus(event.detail.status);
    });

    this.mode = capabilities.webxr ? 'webxr' : 'scene-viewer-or-quick-look';
    return true;
  }

  /**
   * Uruchamia sesję AR. Musi zostać wywołane synchronicznie z obsługi
   * kliknięcia, inaczej przeglądarki odmówią aktywacji.
   * @returns {Promise<boolean>} false oznacza: użyj trybu 2D.
   */
  async activate() {
    try {
      if (this.mode === 'quick-look' && this.quickLookAnchor) {
        this.quickLookAnchor.click();
        return true;
      }
      if (this.viewer && this.viewer.canActivateAR) {
        await this.viewer.activateAR();
        return true;
      }
    } catch (error) {
      console.warn('[ar] Nie udało się rozpocząć sesji', error.message);
    }
    return false;
  }

  dispose() {
    if (this.viewer) {
      this.viewer.remove();
      this.viewer = null;
    }
    if (this.quickLookAnchor) {
      this.quickLookAnchor.remove();
      this.quickLookAnchor = null;
    }
    this.mode = null;
  }
}
