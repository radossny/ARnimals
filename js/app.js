/**
 * app.js
 * Sterowanie przebiegiem: wybór -> zgoda -> tryb AR albo tryb kamery.
 *
 * Kamera jest uruchamiana wyłącznie po prawdziwym kliknięciu przycisku
 * „Włącz kamerę” i niezawodnie zatrzymywana przy opuszczeniu widoku oraz
 * przy przejściu strony w tło.
 */

import { ANIMALS, APP_SETTINGS, getAnimalById, hasModel } from './animals.js';
import { createAnimalSvgNode } from './placeholders.js';
import { CameraStage, classifyCameraError } from './camera.js';
import { ArStage } from './ar.js';

const $ = (id) => document.getElementById(id);

const screens = {
  select: $('screen-select'),
  consent: $('screen-consent'),
  ar: $('screen-ar'),
  stage: $('screen-stage')
};

const liveRegion = $('live-region');
const animalGrid = $('animal-grid');
const consentAnimal = $('consent-animal');
const consentName = $('consent-animal-name');
const arHost = $('ar-host');
const arGuide = $('ar-guide');
const stageHint = $('stage-hint');
const stagePaused = $('stage-paused');
const animalHandle = $('animal-handle');
const animalArt = $('animal-art');

const errorDialog = $('dialog-error');
const errorText = $('error-text');
const errorParentHint = $('error-parent-hint');
const photoDialog = $('dialog-photo');

const cameraStage = new CameraStage({
  video: $('camera-video'),
  layer: $('animal-layer'),
  handle: animalHandle,
  art: animalArt
});

const arStage = new ArStage({
  host: arHost,
  onStatus: handleArStatus
});

let currentAnimal = null;
let currentScreen = 'select';

const CHILD_ERRORS = {
  denied: 'Kamera nie chce się teraz bawić. Poproś kogoś dorosłego.',
  notFound: 'Nie mogę tutaj znaleźć kamery. Poproś kogoś dorosłego.',
  busy: 'Kamera bawi się teraz z inną aplikacją. Poproś kogoś dorosłego.',
  offline: 'Połączenie robi sobie przerwę. Spróbuj jeszcze raz później.',
  unknown: 'Niestety nie udało się. Poproś kogoś dorosłego.'
};

const PARENT_HINTS = {
  denied:
    'Dla dorosłych: zezwól na dostęp do kamery w ustawieniach przeglądarki. W przeglądarkach wbudowanych w inne aplikacje (np. w komunikatorach) kamera bywa zablokowana – wtedy otwórz stronę w Safari lub Chrome.',
  notFound: 'Dla dorosłych: urządzenie nie zgłasza żadnej działającej kamery.',
  busy: 'Dla dorosłych: zamknij inne aplikacje, które właśnie używają kamery.',
  offline: 'Dla dorosłych: połączenie sieciowe zostało przerwane.',
  unknown: 'Dla dorosłych: odśwież stronę. Kamera wymaga połączenia HTTPS.'
};

/* ------------------------------------------------------------------ *
 * Zmiana ekranu
 * ------------------------------------------------------------------ */

function showScreen(name) {
  currentScreen = name;
  Object.entries(screens).forEach(([key, element]) => {
    element.hidden = key !== name;
  });
  document.body.dataset.screen = name;
  const heading = screens[name].querySelector('h1, h2');
  if (heading) heading.focus({ preventScroll: true });
}

function announce(message) {
  liveRegion.textContent = '';
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 60);
}

/* ------------------------------------------------------------------ *
 * Ekran wyboru
 * ------------------------------------------------------------------ */

/** Element graficzny z bezpiecznym powrotem do wbudowanego rysunku. */
function createAnimalVisual(animal, { animated }) {
  const source = animated ? animal.sprite || animal.preview : animal.preview;
  if (!source) return createAnimalSvgNode(animal);

  const wrapper = document.createElement('span');
  wrapper.className = 'animal-art';
  const image = document.createElement('img');
  image.src = source;
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    wrapper.replaceChildren(createAnimalSvgNode(animal));
  });
  wrapper.append(image);
  return wrapper;
}

function buildGrid() {
  const fragment = document.createDocumentFragment();

  ANIMALS.forEach((animal) => {
    const item = document.createElement('li');
    item.className = 'grid__item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card idle--${animal.idle}`;
    button.dataset.animalId = animal.id;
    button.style.setProperty('--card-color', animal.color);

    const art = document.createElement('span');
    art.className = 'card__art';
    art.append(createAnimalVisual(animal, { animated: false }));

    const label = document.createElement('span');
    label.className = 'card__name';
    label.textContent = animal.name;

    button.append(art, label);

    if (!animal.preview && !animal.sprite) {
      const badge = document.createElement('span');
      badge.className = 'card__badge';
      badge.textContent = 'Zastępczy';
      button.append(badge);
    }

    item.append(button);
    fragment.append(item);
  });

  animalGrid.replaceChildren(fragment);
}

animalGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-animal-id]');
  if (!button) return;
  const animal = getAnimalById(button.dataset.animalId);
  if (animal) openConsent(animal);
});

/* ------------------------------------------------------------------ *
 * Zgoda na kamerę
 * ------------------------------------------------------------------ */

function openConsent(animal) {
  currentAnimal = animal;
  consentAnimal.replaceChildren(createAnimalVisual(animal, { animated: false }));
  consentAnimal.className = `consent-animal idle--${animal.idle}`;
  consentAnimal.style.setProperty('--card-color', animal.color);
  consentName.textContent = animal.name;
  showScreen('consent');
  announce(`Wybrano: ${animal.name}. Czy zwierzątko może zobaczyć twój pokój?`);
}

$('btn-consent-back').addEventListener('click', () => {
  currentAnimal = null;
  showScreen('select');
});

$('btn-start-camera').addEventListener('click', async () => {
  if (!currentAnimal) return;
  const button = $('btn-start-camera');
  button.disabled = true;
  try {
    await startExperience(currentAnimal);
  } finally {
    button.disabled = false;
  }
});

/* ------------------------------------------------------------------ *
 * Wybór trybu: najpierw próba AR, w przeciwnym razie tryb kamery
 * ------------------------------------------------------------------ */

async function startExperience(animal) {
  const modelsUsable = hasModel(animal) && navigator.onLine !== false;

  if (modelsUsable) {
    let arReady = false;
    try {
      arReady = await arStage.prepare(animal);
    } catch (error) {
      console.warn('[app] Przygotowanie AR nie powiodło się', error);
      arReady = false;
    }
    if (arReady) {
      showScreen('ar');
      announce(`Wszystko gotowe: ${animal.name}. Powoli poruszaj telefonem na boki.`);
      return;
    }
  }

  await startCameraMode(animal);
}

async function startCameraMode(animal) {
  currentAnimal = animal;
  renderStageAnimal(animal);
  try {
    await cameraStage.start(animal);
  } catch (error) {
    console.warn('[camera] Uruchomienie nie powiodło się', error && error.name);
    showError(classifyCameraError(error));
    return;
  }
  showScreen('stage');
  stagePaused.hidden = true;
  stageHint.classList.remove('is-faded');
  // Dopiero teraz przeglądarka zna rozmiar sceny.
  requestAnimationFrame(() => cameraStage.resetPosition());
  announce(`Zwierzątko już jest: ${animal.name}. Przesuwaj je palcem.`);
  window.setTimeout(() => stageHint.classList.add('is-faded'), 5000);
}

function renderStageAnimal(animal) {
  animalArt.replaceChildren(createAnimalVisual(animal, { animated: true }));
  animalHandle.setAttribute('aria-label', `${animal.name}. Przesuwaj strzałkami, powiększaj i pomniejszaj klawiszami plus i minus.`);
  cameraStage.setAnimal(animal);
}

/* ------------------------------------------------------------------ *
 * Ekran AR
 * ------------------------------------------------------------------ */

$('btn-ar-place').addEventListener('click', async () => {
  const started = await arStage.activate();
  if (!started) {
    arStage.dispose();
    await startCameraMode(currentAnimal);
  }
});

$('btn-ar-back').addEventListener('click', () => {
  arStage.dispose();
  showScreen('select');
});

function handleArStatus(status) {
  if (status === 'session-started') {
    arGuide.hidden = false;
    announce('Powoli poruszaj telefonem, aż znajdziemy podłogę.');
  }
  if (status === 'object-placed') {
    arGuide.hidden = true;
    announce('Zwierzątko stoi już w pokoju.');
  }
  if (status === 'failed') {
    arGuide.hidden = true;
    arStage.dispose();
    startCameraMode(currentAnimal);
  }
}

/* ------------------------------------------------------------------ *
 * Widok kamery: obsługa
 * ------------------------------------------------------------------ */

function leaveStage(targetScreen) {
  cameraStage.stop();
  arStage.dispose();
  showScreen(targetScreen);
}

$('btn-stage-back').addEventListener('click', () => leaveStage('select'));
$('btn-stage-stop').addEventListener('click', () => {
  leaveStage('select');
  announce('Kamera jest wyłączona.');
});

$('btn-switch').addEventListener('click', () => {
  const index = ANIMALS.findIndex((animal) => animal.id === currentAnimal.id);
  const next = ANIMALS[(index + 1) % ANIMALS.length];
  currentAnimal = next;
  renderStageAnimal(next);
  announce(`Teraz jest tutaj: ${next.name}.`);
});

$('btn-reset').addEventListener('click', () => {
  cameraStage.resetPosition();
  announce('Zwierzątko wróciło na środek.');
});

$('btn-zoom-in').addEventListener('click', () => cameraStage.zoomBy(APP_SETTINGS.overlay.stepFactor));
$('btn-zoom-out').addEventListener('click', () => cameraStage.zoomBy(1 / APP_SETTINGS.overlay.stepFactor));

$('btn-resume').addEventListener('click', async () => {
  stagePaused.hidden = true;
  await startCameraMode(currentAnimal);
});

/* ------------------------------------------------------------------ *
 * Tryb zdjęć (opcjonalny, domyślnie wyłączony)
 * ------------------------------------------------------------------ */

const photoButton = $('btn-photo');
photoButton.hidden = !APP_SETTINGS.photoMode;

photoButton.addEventListener('click', () => openDialog(photoDialog));
$('btn-photo-cancel').addEventListener('click', () => closeDialog(photoDialog));

$('btn-photo-save').addEventListener('click', async () => {
  closeDialog(photoDialog);
  try {
    const blob = await cameraStage.capturePhoto();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zwierzak-${currentAnimal.id}.png`;
    link.click();
    // Bez trwałego zapisu: adres obiektu zwalniamy od razu.
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    announce('Zdjęcie trafiło do pobranych plików.');
  } catch (error) {
    console.warn('[photo] Zapis nie powiódł się', error);
    showError('unknown');
  }
});

/* ------------------------------------------------------------------ *
 * Okna dialogowe i błędy
 * ------------------------------------------------------------------ */

function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function closeDialog(dialog) {
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}

function showError(key) {
  const type = CHILD_ERRORS[key] ? key : 'unknown';
  errorText.textContent = CHILD_ERRORS[type];
  errorParentHint.textContent = PARENT_HINTS[type];
  openDialog(errorDialog);
  announce(CHILD_ERRORS[type]);
}

$('btn-error-close').addEventListener('click', () => {
  closeDialog(errorDialog);
  leaveStage('select');
});

/* ------------------------------------------------------------------ *
 * Cykl życia: niezawodne zatrzymanie strumienia
 * ------------------------------------------------------------------ */

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && cameraStage.isActive) {
    cameraStage.stop();
    if (currentScreen === 'stage') stagePaused.hidden = false;
  }
});

window.addEventListener('pagehide', () => {
  cameraStage.stop();
  arStage.dispose();
});

window.addEventListener('offline', () => {
  if (currentScreen === 'ar') {
    arStage.dispose();
    startCameraMode(currentAnimal);
  }
});

/* ------------------------------------------------------------------ *
 * Start
 * ------------------------------------------------------------------ */

buildGrid();
showScreen('select');
