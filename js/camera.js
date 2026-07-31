/**
 * camera.js
 * Tryb A: uniwersalny tryb kamery.
 *
 * Pokazuje obraz na żywo z tylnej kamery jako pełnoekranowe tło i nakłada na
 * niego wybrane zwierzątko jako ruchomą warstwę. Strumień nigdy nie jest
 * wysyłany ani zapisywany.
 */

import { APP_SETTINGS } from './animals.js';
import { animalSvgDataUrl } from './placeholders.js';

const OVERLAY = APP_SETTINGS.overlay;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Zamienia błąd getUserMedia na wewnętrzny klucz. */
export function classifyCameraError(error) {
  if (!error) return 'unknown';
  const name = error.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'denied';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'notFound';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return 'busy';
  }
  return 'unknown';
}

export class CameraStage {
  /**
   * @param {object} options
   * @param {HTMLVideoElement} options.video
   * @param {HTMLElement} options.layer   obszar ograniczający ruch zwierzątka
   * @param {HTMLElement} options.handle  element przesuwany (zewnętrzny)
   * @param {HTMLElement} options.art     element animacji spoczynkowej (wewnętrzny)
   */
  constructor({ video, layer, handle, art }) {
    this.video = video;
    this.layer = layer;
    this.handle = handle;
    this.art = art;

    this.stream = null;
    this.animal = null;
    this.running = false;
    this.frameId = 0;

    this.x = 0;
    this.y = 0;
    this.scale = OVERLAY.startScale;

    this.pointers = new Map();
    this.pinch = null;

    this.lowPower = false;
    this.frameCount = 0;
    this.frameStart = 0;

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onResize = this.handleResize.bind(this);
    this.tick = this.tick.bind(this);

    this.handle.addEventListener('pointerdown', this.onPointerDown);
    this.handle.addEventListener('pointermove', this.onPointerMove);
    this.handle.addEventListener('pointerup', this.onPointerUp);
    this.handle.addEventListener('pointercancel', this.onPointerUp);
    this.handle.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
  }

  /** Uruchamia kamerę. Wolno wywołać tylko bezpośrednio z akcji użytkownika. */
  async start(animal) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error('getUserMedia niedostępne (czy jest HTTPS?)');
      error.name = 'NotSupportedError';
      throw error;
    }

    this.setAnimal(animal);

    const base = {
      width: { ideal: APP_SETTINGS.camera.idealWidth },
      height: { ideal: APP_SETTINGS.camera.idealHeight },
      frameRate: { max: APP_SETTINGS.camera.maxFrameRate }
    };

    // Najpierw ściśle tylna kamera, potem jako preferencja. Bez mikrofonu.
    const attempts = [
      { video: { ...base, facingMode: { exact: 'environment' } }, audio: false },
      { video: { ...base, facingMode: { ideal: 'environment' } }, audio: false }
    ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (classifyCameraError(error) === 'denied') break;
      }
    }
    if (!this.stream) throw lastError || new Error('Nie udało się uruchomić kamery');

    this.video.srcObject = this.stream;
    try {
      await this.video.play();
    } catch (error) {
      // Automatyczne odtwarzanie rzadko bywa odrzucane; obraz pojawi się,
      // gdy przeglądarka będzie gotowa. Dla dziecka to nie jest błąd.
      console.warn('[camera] play() odrzucone', error && error.name);
    }

    this.resetPosition();
    this.startLoop();
  }

  /** Całkowicie kończy strumień i animacje. */
  stop() {
    this.stopLoop();
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.pause();
    this.video.srcObject = null;
    this.pointers.clear();
    this.pinch = null;
  }

  get isActive() {
    return Boolean(this.stream);
  }

  setAnimal(animal) {
    this.animal = animal;
    this.idle = animal.idle || 'bob';
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.frameCount = 0;
    this.frameStart = 0;
    this.frameId = requestAnimationFrame(this.tick);
  }

  stopLoop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  tick(now) {
    if (!this.running) return;
    this.frameId = requestAnimationFrame(this.tick);

    if (!this.frameStart) this.frameStart = now;
    this.frameCount += 1;
    if (this.frameCount === 60) {
      const fps = 60000 / (now - this.frameStart);
      // Na słabszych urządzeniach ograniczamy ruch zamiast pokazywać zacinanie.
      this.lowPower = fps < 40;
    }
    if (this.lowPower && this.frameCount % 2 === 0) return;

    if (reducedMotionQuery.matches) {
      this.applyIdle(0, 0, 1);
      return;
    }

    const t = now / 1000;
    const damp = this.lowPower ? 0.5 : 1;
    let offsetY = 0;
    let rotation = 0;
    let squash = 1;

    switch (this.idle) {
      case 'sway':
        rotation = Math.sin(t * 1.2) * 3 * damp;
        offsetY = Math.sin(t * 2.4) * 2 * damp;
        break;
      case 'hop':
        offsetY = -Math.abs(Math.sin(t * 1.8)) * 12 * damp;
        squash = 1 + Math.sin(t * 3.6) * 0.03 * damp;
        break;
      case 'wobble':
        rotation = Math.sin(t * 1.4) * 4 * damp;
        offsetY = Math.cos(t * 1.4) * 3 * damp;
        break;
      default:
        offsetY = Math.sin(t * 1.5) * 6 * damp;
        squash = 1 + Math.sin(t * 3) * 0.02 * damp;
    }

    this.applyIdle(offsetY, rotation, squash);
  }

  applyIdle(offsetY, rotation, squash) {
    this.art.style.setProperty('--idle-y', `${offsetY.toFixed(2)}px`);
    this.art.style.setProperty('--idle-rot', `${rotation.toFixed(2)}deg`);
    this.art.style.setProperty('--idle-squash', squash.toFixed(3));
  }

  bounds() {
    const rect = this.layer.getBoundingClientRect();
    return { width: rect.width, height: rect.height, left: rect.left, top: rect.top };
  }

  resetPosition() {
    const { width, height } = this.bounds();
    this.x = width / 2;
    this.y = height * 0.62;
    this.scale = OVERLAY.startScale;
    this.applyTransform();
  }

  applyTransform() {
    const { width, height } = this.bounds();
    const margin = OVERLAY.minVisiblePx;
    this.x = clamp(this.x, margin, Math.max(margin, width - margin));
    this.y = clamp(this.y, margin, Math.max(margin, height - margin));
    this.handle.style.setProperty('--pos-x', `${this.x.toFixed(1)}px`);
    this.handle.style.setProperty('--pos-y', `${this.y.toFixed(1)}px`);
    this.handle.style.setProperty('--pos-scale', this.scale.toFixed(3));
  }

  moveBy(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.applyTransform();
  }

  zoomBy(factor) {
    this.scale = clamp(this.scale * factor, OVERLAY.minScale, OVERLAY.maxScale);
    this.applyTransform();
  }

  handlePointerDown(event) {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.handle.setPointerCapture) this.handle.setPointerCapture(event.pointerId);
    this.handle.classList.add('is-grabbed');
    if (this.pointers.size === 2) this.beginPinch();
    event.preventDefault();
  }

  beginPinch() {
    const [a, b] = [...this.pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    this.pinch = {
      distance,
      scale: this.scale,
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  }

  handlePointerMove(event) {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    this.pointers.set(event.pointerId, current);

    if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      if (!this.pinch) this.beginPinch();
      this.scale = clamp(
        (this.pinch.scale * distance) / this.pinch.distance,
        OVERLAY.minScale,
        OVERLAY.maxScale
      );
      this.x += midX - this.pinch.midX;
      this.y += midY - this.pinch.midY;
      this.pinch.midX = midX;
      this.pinch.midY = midY;
    } else {
      this.x += current.x - previous.x;
      this.y += current.y - previous.y;
    }

    this.applyTransform();
    event.preventDefault();
  }

  handlePointerUp(event) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.pointers.size === 0) this.handle.classList.remove('is-grabbed');
  }

  handleKeyDown(event) {
    const step = OVERLAY.keyboardStepPx;
    switch (event.key) {
      case 'ArrowLeft': this.moveBy(-step, 0); break;
      case 'ArrowRight': this.moveBy(step, 0); break;
      case 'ArrowUp': this.moveBy(0, -step); break;
      case 'ArrowDown': this.moveBy(0, step); break;
      case '+': case 'Add': this.zoomBy(OVERLAY.stepFactor); break;
      case '-': case 'Subtract': this.zoomBy(1 / OVERLAY.stepFactor); break;
      case 'Home': this.resetPosition(); break;
      default: return;
    }
    event.preventDefault();
  }

  handleResize() {
    if (this.isActive) this.applyTransform();
  }

  /**
   * Tworzy obraz z kadru kamery i zwierzątka. Wyłącznie lokalnie, bez sieci.
   * @returns {Promise<Blob>}
   */
  async capturePhoto() {
    const { width, height } = this.bounds();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    if (vw && vh) {
      const cover = Math.max(width / vw, height / vh);
      const drawWidth = vw * cover;
      const drawHeight = vh * cover;
      ctx.drawImage(this.video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }

    const source = this.animal.sprite || this.animal.preview || animalSvgDataUrl(this.animal);
    const image = await loadImage(source).catch(() => null);
    if (image) {
      const size = (this.handle.offsetWidth || 160) * this.scale;
      ctx.drawImage(image, this.x - size / 2, this.y - size / 2, size, size);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas bez danych obrazu'))), 'image/png');
    });
  }

  /** Usuwa wszystkie nasłuchy. Zapobiega wyciekom pamięci przy długim użyciu. */
  destroy() {
    this.stop();
    this.handle.removeEventListener('pointerdown', this.onPointerDown);
    this.handle.removeEventListener('pointermove', this.onPointerMove);
    this.handle.removeEventListener('pointerup', this.onPointerUp);
    this.handle.removeEventListener('pointercancel', this.onPointerUp);
    this.handle.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nie udało się wczytać obrazu'));
    image.src = source;
  });
}
