/**
 * placeholders.js
 * Wbudowane zastępcze rysunki SVG dla wszystkich zwierząt.
 *
 * Wszystkie figury to własne, proste kształty geometryczne. Nie odwzorowują
 * żadnych chronionych postaci ani znaków towarowych. Rysunki są częścią kodu,
 * nie powodują więc dodatkowego zapytania sieciowego.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const OUTLINE = '#16233F';
const VIEWBOX = '0 0 200 200';

/** Tworzy okrągły wieniec grzywy lwa. */
function maneRing(color) {
  let markup = '';
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const cx = 100 + Math.cos(angle) * 50;
    const cy = 104 + Math.sin(angle) * 50;
    markup += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="18" fill="${color}" stroke="${OUTLINE}" stroke-width="5"/>`;
  }
  return markup;
}

function eyes(leftX, rightX, y, radius = 6) {
  return (
    `<circle cx="${leftX}" cy="${y}" r="${radius}" fill="${OUTLINE}"/>` +
    `<circle cx="${rightX}" cy="${y}" r="${radius}" fill="${OUTLINE}"/>`
  );
}

const SHAPES = {
  lion(p) {
    return (
      maneRing(p.secondary) +
      `<circle cx="100" cy="104" r="50" fill="${p.secondary}"/>` +
      `<circle cx="66" cy="72" r="15" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<circle cx="134" cy="72" r="15" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<circle cx="100" cy="104" r="42" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      eyes(86, 114, 96) +
      `<ellipse cx="100" cy="124" rx="24" ry="17" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<path d="M92 116 h16 l-8 9 z" fill="${OUTLINE}"/>` +
      `<path d="M100 125 v6 M100 131 q-7 8 -14 3 M100 131 q7 8 14 3" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`
    );
  },

  elephant(p) {
    return (
      `<ellipse cx="48" cy="104" rx="30" ry="40" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="152" cy="104" rx="30" ry="40" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="48" cy="106" rx="16" ry="24" fill="${p.accent}"/>` +
      `<ellipse cx="152" cy="106" rx="16" ry="24" fill="${p.accent}"/>` +
      `<path d="M100 122 q-3 32 -19 44 q-11 8 -2 16" fill="none" stroke="${OUTLINE}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M100 122 q-3 32 -19 44 q-11 8 -2 16" fill="none" stroke="${p.primary}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="100" cy="98" r="48" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      eyes(82, 118, 90) +
      `<path d="M86 116 q14 10 28 0" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`
    );
  },

  penguin(p) {
    return (
      `<ellipse cx="54" cy="118" rx="15" ry="36" transform="rotate(14 54 118)" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="146" cy="118" rx="15" ry="36" transform="rotate(-14 146 118)" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="78" cy="172" rx="18" ry="10" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="122" cy="172" rx="18" ry="10" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="100" cy="104" rx="48" ry="60" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="100" cy="124" rx="31" ry="38" fill="${p.secondary}"/>` +
      `<circle cx="85" cy="82" r="11" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="4"/>` +
      `<circle cx="115" cy="82" r="11" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="4"/>` +
      eyes(86, 114, 84, 5) +
      `<path d="M100 94 l-13 12 h26 z" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>`
    );
  },

  panda(p) {
    return (
      `<circle cx="62" cy="60" r="20" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<circle cx="138" cy="60" r="20" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<circle cx="100" cy="108" r="54" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="76" cy="100" rx="17" ry="21" transform="rotate(-18 76 100)" fill="${p.secondary}"/>` +
      `<ellipse cx="124" cy="100" rx="17" ry="21" transform="rotate(18 124 100)" fill="${p.secondary}"/>` +
      `<circle cx="78" cy="100" r="6" fill="${p.primary}"/>` +
      `<circle cx="122" cy="100" r="6" fill="${p.primary}"/>` +
      `<ellipse cx="100" cy="128" rx="11" ry="8" fill="${p.secondary}"/>` +
      `<path d="M100 136 v5 M100 141 q-8 8 -15 2 M100 141 q8 8 15 2" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`
    );
  },

  fox(p) {
    return (
      `<path d="M60 46 L46 100 L92 74 Z" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/>` +
      `<path d="M140 46 L154 100 L108 74 Z" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/>` +
      `<circle cx="100" cy="102" r="46" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<path d="M100 100 L68 140 Q100 156 132 140 Z" fill="${p.secondary}" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/>` +
      eyes(80, 120, 96) +
      `<ellipse cx="100" cy="132" rx="9" ry="7" fill="${OUTLINE}"/>` +
      `<path d="M100 139 q-8 7 -14 1 M100 139 q8 7 14 1" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`
    );
  },

  rabbit(p) {
    return (
      `<ellipse cx="78" cy="52" rx="15" ry="42" transform="rotate(-9 78 52)" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="122" cy="52" rx="15" ry="42" transform="rotate(9 122 52)" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="78" cy="54" rx="7" ry="28" transform="rotate(-9 78 54)" fill="${p.accent}"/>` +
      `<ellipse cx="122" cy="54" rx="7" ry="28" transform="rotate(9 122 54)" fill="${p.accent}"/>` +
      `<circle cx="100" cy="126" r="46" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      `<ellipse cx="72" cy="140" rx="14" ry="10" fill="${p.secondary}"/>` +
      `<ellipse cx="128" cy="140" rx="14" ry="10" fill="${p.secondary}"/>` +
      eyes(84, 116, 120) +
      `<path d="M92 134 h16 l-8 9 z" fill="${p.accent}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M100 143 v5 M100 148 q-7 7 -13 2 M100 148 q7 7 13 2" fill="none" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M56 128 h-18 M56 138 h-18 M144 128 h18 M144 138 h18" fill="none" stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round"/>`
    );
  },

  /** Figura awaryjna, gdy skonfigurowano nieznaną wartość shape. */
  generic(p) {
    return (
      `<circle cx="100" cy="104" r="52" fill="${p.primary}" stroke="${OUTLINE}" stroke-width="5"/>` +
      eyes(84, 116, 96) +
      `<path d="M80 124 q20 18 40 0" fill="none" stroke="${OUTLINE}" stroke-width="5" stroke-linecap="round"/>`
    );
  }
};

/** Zwraca SVG jako tekst (np. do adresów data: przy robieniu zdjęcia). */
export function animalSvgMarkup(animal) {
  const draw = SHAPES[animal.shape] || SHAPES.generic;
  return (
    `<svg xmlns="${SVG_NS}" viewBox="${VIEWBOX}" data-placeholder="true">` +
    `<g stroke-linecap="round">${draw(animal.palette)}</g>` +
    '</svg>'
  );
}

/**
 * Tworzy prawdziwy węzeł DOM z SVG (bez innerHTML, dzięki czemu aplikacja
 * działa również przy restrykcyjnej Content Security Policy).
 */
export function createAnimalSvgNode(animal) {
  const parsed = new DOMParser().parseFromString(animalSvgMarkup(animal), 'image/svg+xml');
  const node = document.importNode(parsed.documentElement, true);
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('focusable', 'false');
  node.classList.add('animal-art');
  return node;
}

/** SVG jako adres data:, użyteczny w <img> i przy rysowaniu na canvasie. */
export function animalSvgDataUrl(animal) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(animalSvgMarkup(animal))}`;
}
